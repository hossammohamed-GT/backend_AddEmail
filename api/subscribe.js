import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'method_not_allowed' });
  }

  const email = (req.body && req.body.email ? String(req.body.email) : '').trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'invalid_email' });
  }

  try {
    await sql`INSERT INTO newsletter_subscribers (email, website) VALUES (${email}, 'lufly')`;
    return res.status(200).json({ success: true, message: 'subscribed' });
  } catch (err) {
    if (err && err.code === '23505') {
      return res.status(200).json({ success: true, message: 'already_subscribed' });
    }
    return res.status(500).json({ success: false, message: 'insert_failed', debug: String(err && err.message) });
  }
}