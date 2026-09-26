import { COMPETENCIES } from './competencies.js';
import { JOB_CATEGORIES } from './jobs/index.js';

const TILT = 0.2;
const MAX_PER_CATEGORY = 2;
const MIN_RARE_IN_FIRST_GROUP = 2;

function hashCode(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h;
}

// 직업군 기본 프로필에 직업별 미세 변동(0.85~1.15배)과 강조 역량(+0.2)을 얹고 합이 1이 되도록 정규화
function buildWeights(base, tilts, seed) {
  const w = {};
  for (const [key, value] of Object.entries(base)) {
    w[key] = value * (0.85 + (hashCode(seed + key) % 31) / 100);
  }
  for (const key of tilts) w[key] = (w[key] || 0) + TILT;

  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  for (const key of Object.keys(w)) w[key] /= sum;
  return w;
}

function expandJob(category, [name, emoji, desc, flags = '']) {
  const tokens = flags.split(/\s+/).filter(Boolean);
  const rare = tokens.includes('r');
  const tilts = tokens.filter(t => COMPETENCIES[t]);
  const weights = buildWeights(category.base, tilts, `${category.id}:${name}`);
  const tags = Object.entries(weights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([key]) => key);

  return {
    id: `${category.id}:${name}`,
    name,
    emoji,
    desc,
    weights,
    tags,
    simPrompt: name,
    category: category.id,
    categoryLabel: category.label,
    rare,
  };
}

export const JOB_CATALOG = JOB_CATEGORIES.flatMap(category =>
  category.jobs.map(job => expandJob(category, job))
);

function pickGroup(sorted, size, minRare, used, categoryCount) {
  const group = [];
  const canTake = job =>
    !used.has(job.id) && (categoryCount[job.category] || 0) < MAX_PER_CATEGORY;
  const take = job => {
    group.push(job);
    used.add(job.id);
    categoryCount[job.category] = (categoryCount[job.category] || 0) + 1;
  };

  for (const job of sorted) {
    if (group.length >= minRare) break;
    if (job.rare && canTake(job)) take(job);
  }
  for (const job of sorted) {
    if (group.length >= size) break;
    if (canTake(job)) take(job);
  }
  return group.sort((a, b) => b.rawScore - a.rawScore);
}

/**
 * 역량 점수와 잘 맞는 직업 topN개를 반환.
 * 한 직업군에서 최대 2개, 처음 6개 안에는 잘 알려지지 않은(rare) 직업이 2개 이상 포함됨.
 * @param {Object} scores - { 비판적사고: 72, ... }
 * @param {number} topN
 */
export function recommendJobs(scores, topN = 12) {
  const scored = JOB_CATALOG.map(job => {
    const rawScore = Object.entries(job.weights).reduce(
      (sum, [comp, w]) => sum + (scores[comp] ?? 50) * w,
      0
    );
    return { ...job, rawScore, matchScore: Math.round(rawScore) };
  });
  scored.sort((a, b) => b.rawScore - a.rawScore);

  const used = new Set();
  const categoryCount = {};
  const firstSize = Math.min(6, topN);
  const first = pickGroup(scored, firstSize, MIN_RARE_IN_FIRST_GROUP, used, categoryCount);
  const rest = topN > firstSize
    ? pickGroup(scored, topN - firstSize, 0, used, categoryCount)
    : [];
  return [...first, ...rest];
}

/**
 * 카탈로그에 없는 직업도 시뮬레이션할 수 있도록 사용자가 입력한 이름으로 직업 객체를 만든다.
 */
export function makeCustomJob(name) {
  const trimmed = name.trim();
  return {
    id: `custom:${trimmed}`,
    name: trimmed,
    emoji: '🔎',
    desc: '몽글이가 찾아서 하루를 체험시켜줄게!',
    weights: {},
    tags: [],
    simPrompt: trimmed,
    category: 'custom',
    categoryLabel: '직접 찾은 직업',
    rare: true,
    matchScore: null,
  };
}

/**
 * Get tag color from competency definition.
 */
export function getTagColor(competencyKey) {
  return COMPETENCIES[competencyKey]?.color || '#999';
}
