export const config = { runtime: 'edge' };

import { kv } from '../_lib/kv.js';
import { normalizeCode } from '../_lib/code.js';
import { json, jsonError } from '../_lib/respond.js';

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export default async function handler(req) {
  if (req.method !== 'POST') return jsonError(405, '허용되지 않은 요청 방식입니다.');

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, '잘못된 요청 본문입니다.');
  }

  const code = normalizeCode(body.code);
  if (!code) return jsonError(400, '코드를 입력해주세요.');

  const record = await kv.get(`code:${code}`);
  if (!record) return jsonError(404, '코드를 찾을 수 없어요.');
  if (record.status !== 'unused') return jsonError(409, '이미 사용된 코드예요.');

  // 동시에 같은 코드를 쓰려는 요청이 있어도 한 번만 성공하도록 원자적으로 선점
  const claimed = await kv.set(`code:${code}:claimed`, 1, { nx: true });
  if (!claimed) return jsonError(409, '이미 사용된 코드예요.');

  const studentToken = randomToken();
  const updated = { ...record, status: 'used', usedAt: Date.now(), studentToken };
  await kv.set(`code:${code}`, updated);

  return json(200, { ok: true, code, studentToken });
}
