import { kv } from './kv.js';

const COOKIE_NAME = 'mongle_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14일

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function createSession(teacherId) {
  const token = randomToken();
  await kv.set(`session:${token}`, { teacherId, createdAt: Date.now() }, { ex: SESSION_TTL_SECONDS });
  return token;
}

export async function destroySession(token) {
  if (token) await kv.del(`session:${token}`);
}

function readCookie(req, name) {
  const header = req.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

/** 요청의 세션 쿠키로 로그인된 teacherId를 반환. 없으면 null. */
export async function getSessionTeacher(req) {
  const token = readCookie(req, COOKIE_NAME);
  if (!token) return null;
  const session = await kv.get(`session:${token}`);
  if (!session) return null;
  return { teacherId: session.teacherId, token };
}

export function sessionCookieHeader(token) {
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookieHeader() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}
