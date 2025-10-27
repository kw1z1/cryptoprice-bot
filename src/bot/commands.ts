import TelegramBot from 'node-telegram-bot-api';
import { CoinGeckoAPI } from '../api/coingecko';
import { Cache } from '../cache/cache';
import { CoinGeckoIds, CurrencyKeyboard } from './keyboard';

const coingecko = CoinGeckoAPI.getInstance();
const cache = new Cache(60000); // 60 seconds cache

export function setupCommands(bot: TelegramBot): void {

  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Выберите валюту, чтобы узнать текущую цену:', {
      reply_markup: {
        inline_keyboard: CurrencyKeyboard
      }
    });
  });

  bot.onText(/\/price(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const coinsInput = match?.[1];

    if (!coinsInput) {
      bot.sendMessage(chatId, 'Пожалуйста, укажите криптовалюты через пробел.\nПример: /price bitcoin ethereum tron');
      return;
    }

    const coinIds = coinsInput.toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map(coin => CoinGeckoIds[coin] || coin);
    
    if (coinIds.length === 0) {
      bot.sendMessage(chatId, 'Пожалуйста, укажите хотя бы одну криптовалюту.');
      return;
    }

    if (coinIds.length > 10) {
      bot.sendMessage(chatId, 'Можно запросить не более 10 криптовалют за раз.');
      return;
    }

    try {
      const loadingMsg = await bot.sendMessage(chatId, 'Получаем актуальные курсы...');

      const cacheKey = `price_${coinIds.join('_')}`;
      let prices = cache.get(cacheKey);

      if (!prices) {
        prices = await coingecko.getPrices(coinIds);
        if (prices.success) {
          cache.set(cacheKey, prices);
        }
      }

      if (loadingMsg) {
        await bot.deleteMessage(chatId, loadingMsg.message_id);
      }

      if (!prices.success) {
        bot.sendMessage(chatId, `Ошибка: ${prices.error}`);
        return;
      }

      if (!prices.data || prices.data.length === 0) {
        bot.sendMessage(chatId, 'Не удалось найти данные по указанным криптовалютам. Проверьте правильность написания.');
        return;
      }

      let response = 'Текущие цены\n\n';
      prices.data.forEach((coin: any) => {
        const price = coin.current_price.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: coin.current_price < 1 ? 6 : 2
        });
        response += `${coin.symbol.toUpperCase()}: $${price}\n`;
      });

      response += `\nОбновлено: только что`;

      bot.sendMessage(chatId, response);

    } catch (error) {
      console.error('Error in /price command:', error);
      bot.sendMessage(chatId, 'Произошла ошибка при получении данных. Пожалуйста, попробуйте позже.');
    }
  });


  bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const helpText = `
Crypto Price Bot

Команды:
/start - показать меню выбора валют
/price [криптовалюты] - получить цены указанных криптовалют
/help - показать эту справку

Примеры:
/price bitcoin ethereum
/price btc eth trx doge

Поддерживаемые валюты: BTC, ETH, TRX, DOGE
    `;

    bot.sendMessage(chatId, helpText);
  });
}