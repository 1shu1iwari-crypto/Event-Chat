import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { staff } from './seed';
const localKey = randomBytes(32).toString('hex');
function key() { return process.env.SESSION_SECRET || localKey; }
function signature(value: string) { return createHmac('sha256', key()).update(value).digest('base64url'); }
export function constantEqual(a: string, b: string) { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); }
export async function session() {
  const value = (await cookies()).get('eventops-session')?.value;
  if (!value) return null;
  const [uid, expires, sig] = value.split('.');
  if (!uid || !expires || !sig || Number(expires) < Date.now() || !constantEqual(signature(`${uid}.${expires}`), sig)) return null;
  return staff.find(s => s.uid === uid) || null;
}
export async function signIn(uid: string, secure: boolean) {
  const body = `${uid}.${Date.now() + 8 * 60 * 60 * 1000}`;
  (await cookies()).set('eventops-session', `${body}.${signature(body)}`, { httpOnly: true, secure, sameSite: 'strict', path: '/', maxAge: 8 * 60 * 60 });
}
export async function signOut() { (await cookies()).delete('eventops-session'); }
export async function requireSession(lead = false) {
  const viewer = await session();
  if (!viewer) throw new HttpError(401, 'Sign in to the event first.');
  if (lead && viewer.team !== 'operations') throw new HttpError(403, 'Only the Operations Lead can approve actions or run event controls.');
  return viewer;
}
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export function assertOrigin(req: Request) {
  const origin = req.headers.get('origin');
  const url = new URL(req.url);
  // Next may normalize the URL hostname to its bind address (for example 0.0.0.0).
  // The browser's Host header retains the actual public origin and local dev port.
  const hostOrigin = req.headers.get('host') ? `${url.protocol}//${req.headers.get('host')}` : url.origin;
  if (origin && origin !== hostOrigin && origin !== process.env.APP_ORIGIN) throw new HttpError(403, 'Request origin is not allowed.');
}
