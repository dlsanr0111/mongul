export const config = { runtime: 'edge' };

import { kv } from '../_lib/kv.js';
import { getSessionTeacher } from '../_lib/session.js';
import { json, jsonError } from '../_lib/respond.js';

export default async function handler(req) {
  if (req.method !== 'GET') return jsonError(405, '허용되지 않은 요청 방식입니다.');

  const session = await getSessionTeacher(req);
  if (!session) return jsonError(401, '로그인이 필요합니다.');

  const teacher = await kv.get(`teacher:${session.teacherId}`);
  if (!teacher) return jsonError(401, '로그인이 필요합니다.');

  return json(200, { teacher: { id: teacher.id, email: teacher.email, name: teacher.name } });
}
