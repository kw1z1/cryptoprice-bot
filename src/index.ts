import * as dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import { setupCommands } from './bot/commands';
import { setupHandlers } from './bot/handlers';
import { CoinGeckoAPI } from './api/coingecko';


dotenv.config();


const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN environment variable is required');
  console.error('Create .env file with TELEGRAM_BOT_TOKEN=your_token_here');
  process.exit(1);
}


const bot = new TelegramBot(token, { polling: true });

console.log('Crypto Price Bot started...');
console.log('Bot token loaded successfully');


setupCommands(bot);
setupHandlers(bot);


process.once('SIGINT', () => {
  console.log('Shutting down bot...');
  bot.stopPolling();
  process.exit(0);
});

process.once('SIGTERM', () => {
  console.log('Shutting down bot...');
  bot.stopPolling();
  process.exit(0);
});


setInterval(() => {
  const stats = CoinGeckoAPI.getInstance().getStats();
  console.log(`Bot stats - Requests: ${stats.requestCount}, Last update: ${stats.lastUpdate}`);
}, 300000); 