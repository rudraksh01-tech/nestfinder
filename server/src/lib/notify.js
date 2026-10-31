// Tells a broker about a new lead on every channel they have connected.
import { Broker } from '../models/Broker.js';
import { pushToBroker } from './push.js';
import { escapeHtml, sendMessage, telegramEnabled } from './telegram.js';

// The demo login is shared, so real visitors' numbers are masked for it: 9876543210 -> 98XXXXXX10.
export const maskPhone = (phone) => `${phone.slice(0, 2)}XXXXXX${phone.slice(-2)}`;
export const phoneForBroker = (broker, lead) => (broker.isDemo && !lead.isDemo ? maskPhone(lead.phone) : lead.phone);

const formatVisit = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });

export async function notifyNewLead(listing, lead) {
  const broker = await Broker.findById(listing.broker, 'isDemo telegramChatId');
  if (!broker) return;
  const kind = lead.visitDate ? 'visit booking' : 'lead';
  const flat = `${listing.bhk}BHK ${listing.locality} · ₹${listing.rent.toLocaleString('en-IN')}`;
  const phone = phoneForBroker(broker, lead);

  const tasks = [
    pushToBroker(
      broker._id,
      {
        title: `New ${kind}: ${lead.name}`,
        body: [`${listing.code} · ${flat}`, lead.visitDate && `Visit on ${formatVisit(lead.visitDate)}`, `📞 ${phone}`].filter(Boolean).join('\n'),
        url: '/broker',
        tag: `lead-${lead._id}`,
      },
      // Demo subscriptions only live for a day, so the shared account does not ping old devices forever.
      broker.isDemo ? { createdAt: { $gte: new Date(Date.now() - 24 * 3600 * 1000) } } : {},
    ),
  ];

  if (telegramEnabled() && broker.telegramChatId) {
    const lines = [
      `🏠 <b>New ${kind}</b> for ${listing.code}`,
      escapeHtml(flat),
      '',
      `👤 ${escapeHtml(lead.name)}`,
      `📞 +91 ${phone}`,
      lead.visitDate ? `📅 Visit: ${formatVisit(lead.visitDate)}` : null,
      lead.message ? `💬 ${escapeHtml(lead.message)}` : null,
    ];
    if (process.env.CLIENT_ORIGIN) lines.push('', `<a href="${process.env.CLIENT_ORIGIN}/broker">Open dashboard</a>`);
    tasks.push(sendMessage(broker.telegramChatId, lines.filter((l) => l !== null).join('\n')));
  }

  const results = await Promise.allSettled(tasks);
  for (const r of results) if (r.status === 'rejected') console.error('Lead alert failed:', r.reason?.message);
}
