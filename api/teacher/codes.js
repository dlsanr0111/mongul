export const config = { runtime: 'edge' };

import { kv } from '../_lib/kv.js';
import { getSessionTeacher } from '../_lib/session.js';
import { generateCode, formatCode } from '../_lib/code.js';
import { json, jsonError } from '../_lib/respond.js';

const MAX_GENERATE_ATTEMPTS = 5;

export default async function handler(req) {
  const session = await getSessionTeacher(req);
  if (!session) return jsonError(401, '로그인이 필요합니다.');

  if (req.method === 'GET') return listCodes(session.teacherId);
  if (req.method === 'POST') return issueCode(req, session.teacherId);
  return jsonError(405, '허용되지 않은 요청 방식입니다.');
}

async function listCodes(teacherId) {
  const codes = await kv.zrange(`teacher:${teacherId}:codes`, 0, -1, { rev: true });
  if (!codes.length) return json(200, { codes: [] });

  const records = await kv.mget(...codes.map(c => `code:${c}`));
  const result = records
    .filter(Boolean)
    .map(r => ({
      code: formatCode(r.code),
      studentLabel: r.studentLabel || '',
      status: r.status,
      issuedAt: r.issuedAt,
      usedAt: r.usedAt,
      finalScores: r.finalScores,
      exploredJobs: r.exploredJobs || [],
      completedAt: r.completedAt,
    }));

  return json(200, { codes: result });
}

async function issueCode(req, teacherId) {
  let body = {};
  try {
    body = await req.json();
  } catch {
    // 본문 없이 발급하는 것도 허용
  }
  const studentLabel = String(body.studentLabel || '').trim().slice(0, 40);

  for (let attempt = 0; attempt < MAX_GENERATE_ATTEMPTS; attempt++) {
    const code = generateCode();
    const record = {
      code,
      teacherId,
      studentLabel,
      status: 'unused',
      studentToken: null,
      issuedAt: Date.now(),
      usedAt: null,
      finalScores: null,
      exploredJobs: [],
      completedAt: null,
      resultUpdatedAt: null,
    };

    const claimed = await kv.set(`code:${code}`, record, { nx: true });
    if (!claimed) continue; // 극히 드문 충돌 — 재시도

    await kv.zadd(`teacher:${teacherId}:codes`, { score: record.issuedAt, member: code });
    return json(200, { code: formatCode(code), studentLabel, issuedAt: record.issuedAt });
  }

  return jsonError(500, '코드 발급에 실패했어요. 다시 시도해주세요.');
}
