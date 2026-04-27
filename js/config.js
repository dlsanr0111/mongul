export const CONFIG = {
  MODEL: 'gemini-2.5-flash-lite',
  MAX_TOKENS: 600,
  MASCOT_NAME: '몽글이',

  SURVEY_TITLE: '청소년 진로 적성 검사',
  SURVEY_VERSION: 'v1.0 (2026)',
  SURVEY_SUBJECT: '중·고등학생',
  SURVEY_DURATION: '약 15~20분',

  STAGES: [
    { num: 1, name: '관심사 탐색',  icon: '🌿', desc: '좋아하는 것들을 이야기해봐' },
    { num: 2, name: '마음 들여다보기', icon: '💭', desc: '요즘 마음은 어때?' },
    { num: 3, name: '진로 탐색',    icon: '🧭', desc: '꿈과 미래를 이야기해봐' },
    { num: 4, name: '결과 분석',    icon: '📊', desc: '너의 강점이 보여!' },
    { num: 5, name: '직업 체험',    icon: '✨', desc: '직접 해볼까?' },
  ],
};
