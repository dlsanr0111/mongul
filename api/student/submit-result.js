export const config = { runtime: 'edge' };

import { kv } from '../_lib/kv.js';
import { normalizeCode } from '../_lib/code.js';
import { json, jsonError } from '../_lib/respond.js';
import { COMPETENCY_KEYS } from '../../js/competencies.js';

function isValidScores(scores) {
  if (!scores || typeof scores !== 'object') return false;
  return Object.entries(scores).every(
    ([key, value]) => COMPETENCY_KEYS.includes(key) && typeof value === 'number' && value >= 0 && value <= 100
  );
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
  const studentToken = String(body.studentToken || '');
  if (!code || !studentToken) return jsonError(400, '잘못된 요청입니다.');

  const record = await kv.get(`code:${code}`);
  if (!record || record.status !== 'used' || record.studentToken !== studentToken) {
    return jsonError(403, '유효하지 않은 요청이에요.');
  }

  const finalScores = body.finalScores;
  if (finalScores !== undefined && !isValidScores(finalScores)) {
    return jsonError(400, '결과 데이터 형식이 올바르지 않아요.');
  }

  const exploredJobs = Array.isArray(body.exploredJobs)
    ? body.exploredJobs.map(j => String(j)).slice(0, 20)
    : record.exploredJobs || [];

  const updated = {
    ...record,
    finalScores: finalScores ?? record.finalScores,
    exploredJobs,
    completedAt: record.completedAt ?? Date.now(),
    resultUpdatedAt: Date.now(),
  };
  await kv.set(`code:${code}`, updated);

  return json(200, { ok: true });
}
