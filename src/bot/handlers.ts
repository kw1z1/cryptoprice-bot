import TelegramBot from 'node-telegram-bot-api';
import { CoinGeckoAPI } from '../api/coingecko';
import { Cache } from '../cache/cache';
import { CurrencyKeyboard, ActionKeyboard, CoinGeckoIds, FiatCurrencies } from './keyboard';

const coingecko = CoinGeckoAPI.getInstance();
const cache = new Cache(60000); // 60 seconds cache

function getCoinGeckoId(currency: string): string {
  return CoinGeckoIds[currency] || currency;
}

function formatPrice(price: number, fiatCurrency: string = 'usd'): string {
  if (price >= 1000) {
    return price.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  } else if (price >= 1) {
    return price.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 4 
    });
  } else {
    return price.toLocaleString('en-US', { 
      minimumFractionDigits: 4, 
      maximumFractionDigits: 6 
    });
  }
}

function getCurrencySymbol(fiatCurrency: string): string {
  return fiatCurrency === 'usd' ? '$' : fiatCurrency === 'eur' ? '€' : '₽';
}

export function setupHandlers(bot: TelegramBot): void {
  bot.on('callback_query', async (callbackQuery) => {
    const message = callbackQuery.message;
    if (!message) return;

    const chatId = message.chat.id;
    const messageId = message.message_id;
    const data = callbackQuery.data;

    try {
      await bot.answerCallbackQuery(callbackQuery.id);

      if (data === 'back_to_menu') {
        await bot.editMessageText('Выберите валюту, чтобы узнать текущую цену:', {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: { inline_keyboard: CurrencyKeyboard }
        });
        return;
      }


      if (data?.startsWith('currency_')) {
        const currency = data.replace('currency_', '');
        const coinGeckoId = getCoinGeckoId(currency);
        const fiatCurrency = 'usd';
        
        console.log(`Requested currency: ${currency}, CoinGecko ID: ${coinGeckoId}`);
        
        await bot.editMessageText('Получаем актуальный курс...', {
          chat_id: chatId,
          message_id: messageId
        });

        const cacheKey = `single_${coinGeckoId}_${fiatCurrency}`;
        let priceData = cache.get(cacheKey);

        if (!priceData) {
          console.log(`Making API request for: ${coinGeckoId}`);
          priceData = await coingecko.getPrices([coinGeckoId], fiatCurrency);
          console.log(`API response:`, priceData);
          if (priceData.success) {
            cache.set(cacheKey, priceData);
          }
        }

        if (!priceData.success || !priceData.data || priceData.data.length === 0) {
          console.log(`Failed to get data for ${coinGeckoId}:`, priceData.error);
          await bot.editMessageText(`Не удалось получить данные для ${currency.toUpperCase()}`, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: { inline_keyboard: ActionKeyboard(currency, fiatCurrency) }
          });
          return;
        }

        const coin = priceData.data[0];
        const price = formatPrice(coin.current_price, fiatCurrency);
        const symbol = getCurrencySymbol(fiatCurrency);

        const response = `${coin.symbol.toUpperCase()}: ${symbol}${price}\n\nОбновлено: только что`;

        await bot.editMessageText(response, {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: { inline_keyboard: ActionKeyboard(currency, fiatCurrency) }
        });
      }


      if (data?.startsWith('refresh_')) {
        const parts = data.replace('refresh_', '').split('_');
        const currency = parts[0];
        const fiatCurrency = parts[1] || 'usd';
        const coinGeckoId = getCoinGeckoId(currency);
        
        console.log(`Refreshing currency: ${currency}, CoinGecko ID: ${coinGeckoId}, Fiat: ${fiatCurrency}`);

        cache.set(`single_${coinGeckoId}_${fiatCurrency}`, null);

        await bot.editMessageText('Обновляем курс...', {
          chat_id: chatId,
          message_id: messageId
        });

        const priceData = await coingecko.getPrices([coinGeckoId], fiatCurrency);

        if (!priceData.success || !priceData.data || priceData.data.length === 0) {
          await bot.editMessageText(`Не удалось обновить данные для ${currency.toUpperCase()}`, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: { inline_keyboard: ActionKeyboard(currency, fiatCurrency) }
          });
          return;
        }

        const coin = priceData.data[0];
        const price = formatPrice(coin.current_price, fiatCurrency);
        const symbol = getCurrencySymbol(fiatCurrency);

        const now = new Date();
        const timeString = now.toLocaleTimeString('ru-RU');

        const response = `${coin.symbol.toUpperCase()}: ${symbol}${price}\n\nОбновлено: ${timeString}`;

        await bot.editMessageText(response, {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: { inline_keyboard: ActionKeyboard(currency, fiatCurrency) }
        });
      }


      if (data?.startsWith('fiat_') && (data.includes('_usd') || data.includes('_eur') || data.includes('_rub'))) {
        const parts = data.replace('fiat_', '').split('_');
        const currency = parts[0];
        const fiatCurrency = parts[1];
        const coinGeckoId = getCoinGeckoId(currency);
        
        console.log(`Changing fiat currency: ${currency} to ${fiatCurrency}`);

        await bot.editMessageText('Меняем валюту...', {
          chat_id: chatId,
          message_id: messageId
        });

        const cacheKey = `single_${coinGeckoId}_${fiatCurrency}`;
        let priceData = cache.get(cacheKey);

        if (!priceData) {
          priceData = await coingecko.getPrices([coinGeckoId], fiatCurrency);
          if (priceData.success) {
            cache.set(cacheKey, priceData);
          }
        }

        if (!priceData.success || !priceData.data || priceData.data.length === 0) {
          await bot.editMessageText(`Не удалось получить данные для ${currency.toUpperCase()} в ${fiatCurrency.toUpperCase()}`, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: { inline_keyboard: ActionKeyboard(currency, fiatCurrency) }
          });
          return;
        }

        const coin = priceData.data[0];
        const price = formatPrice(coin.current_price, fiatCurrency);
        const symbol = getCurrencySymbol(fiatCurrency);

        const response = `${coin.symbol.toUpperCase()}: ${symbol}${price}\n\nОбновлено: только что`;

        await bot.editMessageText(response, {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: { inline_keyboard: ActionKeyboard(currency, fiatCurrency) }
        });
      }

    } catch (error) {
      console.error('Error in callback handler:', error);
      try {
        await bot.editMessageText('Произошла ошибка при обработке запроса', {
          chat_id: chatId,
          message_id: messageId
        });
      } catch (editError) {
        bot.sendMessage(chatId, 'Произошла ошибка при обработке запроса');
      }
    }
  });

  bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
  });
}