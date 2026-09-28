export const config = { runtime: 'edge' };

import { getSessionTeacher, destroySession, clearSessionCookieHeader } from '../_lib/session.js';
import { json, jsonError } from '../_lib/respond.js';

export default async function handler(req) {
  if (req.method !== 'POST') return jsonError(405, '허용되지 않은 요청 방식입니다.');

  const session = await getSessionTeacher(req);
  if (session) await destroySession(session.token);

  return json(200, { ok: true }, { 'set-cookie': clearSessionCookieHeader() });
}
