export const config = { runtime: 'edge' };

import { kv } from '../_lib/kv.js';
import { verifyPassword } from '../_lib/password.js';
import { createSession, sessionCookieHeader } from '../_lib/session.js';
import { json, jsonError } from '../_lib/respond.js';

const WRONG_CREDENTIALS = '이메일 또는 비밀번호가 올바르지 않습니다.';

export default async function handler(req) {
  if (req.method !== 'POST') return jsonError(405, '허용되지 않은 요청 방식입니다.');

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, '잘못된 요청 본문입니다.');
  }

  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  const teacherId = await kv.get(`teacher:email:${email}`);
  if (!teacherId) return jsonError(401, WRONG_CREDENTIALS);

  const teacher = await kv.get(`teacher:${teacherId}`);
  if (!teacher) return jsonError(401, WRONG_CREDENTIALS);

  const valid = await verifyPassword(password, teacher.passwordHash);
  if (!valid) return jsonError(401, WRONG_CREDENTIALS);

  const token = await createSession(teacherId);

  return json(
    200,
    { ok: true, teacher: { id: teacher.id, email: teacher.email, name: teacher.name } },
    { 'set-cookie': sessionCookieHeader(token) }
  );
}
