// POST /bff/login { password } → sets the signed session cookie on success.
import { makeToken, setSessionCookie, safeEqual, readBody } from './_session.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.ADMIN_PANEL_PASSWORD || !process.env.SESSION_SECRET) {
    return res.status(503).json({ error: 'Admin login is not configured on the server.' });
  }

  const { password } = await readBody(req);
  if (!password || !safeEqual(password, process.env.ADMIN_PANEL_PASSWORD)) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  setSessionCookie(res, makeToken());
  return res.status(200).json({ ok: true });
}
