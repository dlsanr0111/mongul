export const config = { runtime: 'edge' };

import { kv } from '../_lib/kv.js';
import { hashPassword } from '../_lib/password.js';
import { createSession, sessionCookieHeader } from '../_lib/session.js';
import { json, jsonError } from '../_lib/respond.js';

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
  const name = String(body.name || '').trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonError(400, '올바른 이메일을 입력해주세요.');
  }
  if (password.length < 6) {
    return jsonError(400, '비밀번호는 6자 이상이어야 해요.');
  }

  const teacherId = crypto.randomUUID();
  const claimed = await kv.set(`teacher:email:${email}`, teacherId, { nx: true });
  if (!claimed) {
    return jsonError(409, '이미 등록된 이메일입니다.');
  }

  const passwordHash = await hashPassword(password);
  const teacher = { id: teacherId, email, passwordHash, name, createdAt: Date.now() };
  await kv.set(`teacher:${teacherId}`, teacher);

  const token = await createSession(teacherId);

  return json(
    200,
    { ok: true, teacher: { id: teacher.id, email: teacher.email, name: teacher.name } },
    { 'set-cookie': sessionCookieHeader(token) }
  );
}
