// GET /bff/session → { authed } so the SPA can restore the operator session on load.
import { isAuthed } from './_session.js';

export default function handler(req, res) {
  return res.status(200).json({ authed: isAuthed(req) });
}
