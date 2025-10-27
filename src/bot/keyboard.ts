import { InlineKeyboardButton } from 'node-telegram-bot-api';


export const CurrencyKeyboard: InlineKeyboardButton[][] = [
  [
    { text: 'BTC', callback_data: 'currency_bitcoin' },
    { text: 'ETH', callback_data: 'currency_ethereum' },
    { text: 'TRX', callback_data: 'currency_tron' }
  ],
  [
    { text: 'DOGE', callback_data: 'currency_dogecoin' }
  ]
];

export const ActionKeyboard = (currency: string, fiatCurrency: string = 'usd'): InlineKeyboardButton[][] => [
  [
    { text: 'Обновить', callback_data: `refresh_${currency}_${fiatCurrency}` },
    { text: 'Выбрать валюту', callback_data: 'back_to_menu' }
  ],
  [
    { text: `USD ${fiatCurrency === 'usd' ? '(текущая)' : ''}`, callback_data: `fiat_${currency}_usd` },
    { text: `EUR ${fiatCurrency === 'eur' ? '(текущая)' : ''}`, callback_data: `fiat_${currency}_eur` },
    { text: `RUB ${fiatCurrency === 'rub' ? '(текущая)' : ''}`, callback_data: `fiat_${currency}_rub` }
  ]
];

export const CoinGeckoIds: { [key: string]: string } = {
  'bitcoin': 'bitcoin',
  'btc': 'bitcoin',
  'ethereum': 'ethereum', 
  'eth': 'ethereum',
  'tron': 'tron',
  'trx': 'tron',
  'dogecoin': 'dogecoin',
  'doge': 'dogecoin'
};

export const FiatCurrencies: { [key: string]: string } = {
  'usd': 'USD',
  'eur': 'EUR', 
  'rub': 'RUB'
};