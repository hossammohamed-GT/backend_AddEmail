const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'method_not_allowed' });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ success: false, message: 'missing_database_url' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }

  const email = (body && body.email ? String(body.email) : '').trim();
  const website = (body && body.website ? String(body.website) : '').trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'invalid_email' });
  }

  if (!website || website.length > 100 || !/^[a-zA-Z0-9._-]+$/.test(website)) {
    return res.status(400).json({ success: false, message: 'invalid_website' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`INSERT INTO newsletter_subscribers (email, website) VALUES (${email}, ${website})`;
    return res.status(200).json({ success: true, message: 'subscribed' });
  } catch (err) {
    if (err && err.code === '23505') {
      return res.status(200).json({ success: true, message: 'already_subscribed' });
    }
    return res.status(500).json({
      success: false,
      message: 'insert_failed',
      debug: String(err && err.message ? err.message : err),
    });
  }
};
