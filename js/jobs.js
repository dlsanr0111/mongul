import { COMPETENCIES } from './competencies.js';

export const JOB_CATALOG = [
  {
    id: 'data_analyst',
    name: '데이터 분석가',
    emoji: '📊',
    desc: '숫자와 데이터 속에서 의미있는 이야기를 찾아내는 탐정이야.',
    weights: { 비판적사고: 0.40, 디지털리터러시: 0.40, 진로개발: 0.20 },
    tags: ['비판적사고', '디지털리터러시'],
    simPrompt: '데이터 분석가',
  },
  {
    id: 'developer',
    name: '소프트웨어 개발자',
    emoji: '💻',
    desc: '아이디어를 코드로 현실로 만들어내는 현대의 마법사야.',
    weights: { 디지털리터러시: 0.45, 비판적사고: 0.30, 창의력: 0.25 },
    tags: ['디지털리터러시', '창의력'],
    simPrompt: '소프트웨어 개발자',
  },
  {
    id: 'counselor',
    name: '상담사',
    emoji: '💙',
    desc: '사람들의 마음을 이해하고 함께 해결책을 찾아주는 사람이야.',
    weights: { 사회정서: 0.45, 의사소통: 0.40, 협업: 0.15 },
    tags: ['사회정서', '의사소통'],
    simPrompt: '심리 상담사',
  },
  {
    id: 'teacher',
    name: '교사',
    emoji: '📚',
    desc: '지식을 전달하는 것을 넘어, 학생의 성장을 함께하는 안내자야.',
    weights: { 의사소통: 0.35, 사회정서: 0.35, 진로개발: 0.30 },
    tags: ['의사소통', '사회정서'],
    simPrompt: '중학교 교사',
  },
  {
    id: 'marketer',
    name: '마케터',
    emoji: '📣',
    desc: '사람들의 마음을 움직이는 이야기와 전략을 만드는 사람이야.',
    weights: { 의사소통: 0.35, 창의력: 0.35, 디지털리터러시: 0.30 },
    tags: ['의사소통', '창의력'],
    simPrompt: '디지털 마케터',
  },
  {
    id: 'designer',
    name: '디자이너',
    emoji: '🎨',
    desc: '아름다움과 기능성을 조화롭게 만들어내는 시각적 이야기꾼이야.',
    weights: { 창의력: 0.45, 디지털리터러시: 0.35, 의사소통: 0.20 },
    tags: ['창의력', '디지털리터러시'],
    simPrompt: 'UI/UX 디자이너',
  },
  {
    id: 'content_creator',
    name: '콘텐츠 크리에이터',
    emoji: '🎬',
    desc: '자신만의 세계관으로 사람들을 즐겁게 하고 영감을 주는 사람이야.',
    weights: { 창의력: 0.40, 디지털리터러시: 0.35, 사회정서: 0.25 },
    tags: ['창의력', '디지털리터러시'],
    simPrompt: '유튜브 크리에이터',
  },
  {
    id: 'social_worker',
    name: '사회복지사',
    emoji: '🌱',
    desc: '도움이 필요한 사람들 곁에서 함께하고 세상을 더 따뜻하게 만드는 사람이야.',
    weights: { 사회정서: 0.40, 협업: 0.40, 의사소통: 0.20 },
    tags: ['사회정서', '협업'],
    simPrompt: '사회복지사',
  },
  {
    id: 'project_manager',
    name: '프로젝트 기획자',
    emoji: '📋',
    desc: '여러 사람의 힘을 모아 큰 목표를 이뤄내는 오케스트라 지휘자야.',
    weights: { 협업: 0.40, 의사소통: 0.30, 진로개발: 0.30 },
    tags: ['협업', '진로개발'],
    simPrompt: '프로젝트 매니저',
  },
  {
    id: 'entrepreneur',
    name: '창업가',
    emoji: '🚀',
    desc: '세상에 없던 것을 만들어내고 새로운 길을 여는 도전자야.',
    weights: { 진로개발: 0.40, 창의력: 0.35, 비판적사고: 0.25 },
    tags: ['진로개발', '창의력'],
    simPrompt: '스타트업 창업가',
  },
  {
    id: 'strategist',
    name: '전략기획자',
    emoji: '♟️',
    desc: '큰 그림을 그리고 조직이 나아갈 방향을 설계하는 나침반이야.',
    weights: { 진로개발: 0.40, 비판적사고: 0.35, 협업: 0.25 },
    tags: ['진로개발', '비판적사고'],
    simPrompt: '기업 전략기획자',
  },
  {
    id: 'researcher',
    name: '연구원',
    emoji: '🔬',
    desc: '아무도 몰랐던 진실을 파헤치고 세상을 이해하는 데 기여하는 탐험가야.',
    weights: { 비판적사고: 0.45, 디지털리터러시: 0.30, 진로개발: 0.25 },
    tags: ['비판적사고', '진로개발'],
    simPrompt: '과학 연구원',
  },
];

/**
 * Returns top N jobs sorted by weighted competency score match.
 * @param {Object} scores - { 비판적사고: 72, ... }
 * @param {number} topN
 */
export function recommendJobs(scores, topN = 3) {
  const scored = JOB_CATALOG.map(job => {
    const matchScore = Object.entries(job.weights).reduce((sum, [comp, w]) => {
      return sum + (scores[comp] ?? 50) * w;
    }, 0);
    return { ...job, matchScore: Math.round(matchScore) };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore);
  return scored.slice(0, topN);
}

/**
 * Get tag color from competency definition.
 */
export function getTagColor(competencyKey) {
  return COMPETENCIES[competencyKey]?.color || '#999';
}
