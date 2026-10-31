// Which language to reply in. Devanagari script means Hindi; otherwise English, unless the
// message clearly uses common Hindi words written in Latin letters (Hinglish).
const HINGLISH = /\b(hai|hain|mein|ka|ki|ke|ko|chahiye|kya|kitna|kaun|nahi|bhi|aur|yaar|bhai|mera|meri|mujhe|kar|karo|dekh|wala|wali|sasta|mehenga|accha|theek|kal|ghar|kiraya)\b/i;

export const languageOf = (text) => (/[ऀ-ॿ]/.test(text) ? 'Hindi' : HINGLISH.test(text) ? 'Hinglish' : 'English');
