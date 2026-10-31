// Minimal Telegram Bot API client. No webhook or polling loop: we read pending
// updates only when a broker clicks "Verify", which suits a free host that sleeps.
import { httpError } from './errors.js';

export const telegramEnabled = () => Boolean(process.env.TELEGRAM_BOT_TOKEN);

async function call(method, body = {}) {
  if (!telegramEnabled()) throw httpError(503, 'Telegram alerts are not set up on this server');
  const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) throw new Error(`Telegram ${method} failed: ${data.description ?? res.status}`);
  return data.result;
}

let botUsername;
export async function getBotUsername() {
  botUsername ??= (await call('getMe')).username;
  return botUsername;
}

export const escapeHtml = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const sendMessage = (chatId, html) =>
  call('sendMessage', { chat_id: chatId, text: html, parse_mode: 'HTML', link_preview_options: { is_disabled: true } });

// Finds the private chat that sent "/start <code>" to the bot, or null.
export async function findChatForStartCode(code) {
  const updates = await call('getUpdates', { allowed_updates: ['message'], timeout: 0 });
  const match = updates.find((u) => u.message?.chat?.type === 'private' && u.message.text?.trim() === `/start ${code}`);
  if (!match) return null;
  // Confirm updates up to this one so Telegram stops resending them.
  await call('getUpdates', { offset: match.update_id + 1, timeout: 0 });
  return { chatId: String(match.message.chat.id), firstName: match.message.from?.first_name };
}
