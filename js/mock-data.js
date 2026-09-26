/**
 * Canned Gemini-style responses for local testing without burning API tokens.
 * Shape mirrors real model output exactly (same <score>/<stage_complete/>/
 * <final_scores>/<choice> tags) so js/api.js's parsing logic doesn't change.
 */

const STAGE1 = [
  `안녕! 나는 몽글이야 🌿 너의 진로를 같이 탐색해줄 친구야. 요즘 시간 가는 줄 모르고 푹 빠져서 하는 거 있어?`,
  `오 그거 진짜 재밌겠다! 그거 할 때 어떤 부분이 제일 좋아?
<score competency="창의력" delta="+8"/>
<score competency="비판적사고" delta="+5"/>`,
  `그렇구나, 왜 그런지 알 것 같아. 그나저나 요즘 학교생활은 어때? 힘든 건 없어?
<score competency="창의력" delta="+6"/>
<score competency="비판적사고" delta="+9"/>
<stage_complete/>`,
];

const STAGE2 = [
  `그랬구나, 알려줘서 고마워. 요즘 친구 관계는 어때? 편하게 얘기하는 편이야?`,
  `그럴 수 있어, 충분히 그런 마음 들 수 있어. 스트레스 받을 때는 보통 어떻게 풀어?
<score competency="사회정서" delta="+7"/>
<score competency="의사소통" delta="+6"/>`,
  `오 좋은 방법이네! 그런데 너 나중에 어떤 사람이 되고 싶어?
<score competency="사회정서" delta="+8"/>
<score competency="의사소통" delta="+7"/>
<stage_complete/>`,
];

const STAGE3 = [
  `오 멋진 꿈이다! 좋아하는 과목 있어? 왜 좋아하는지도 궁금해.`,
  `그렇구나! 컴퓨터나 스마트폰으로 뭔가 만들거나 찾아본 적 있어?
<score competency="진로개발" delta="+7"/>
<score competency="디지털리터러시" delta="+6"/>`,
  `지금까지 이야기 들으면서 네 강점이 보인다. 결과 보여줄게!
<score competency="협업" delta="+6"/>
<score competency="의사소통" delta="+5"/>
<stage_complete/>`,
];

const STAGE4 = `<final_scores>
{
  "비판적사고": 78,
  "의사소통": 72,
  "협업": 65,
  "창의력": 88,
  "사회정서": 70,
  "진로개발": 68,
  "디지털리터러시": 74
}
</final_scores>
얘기 나누면서 보니까 너는 창의력이랑 비판적사고가 진짜 돋보여! 새로운 걸 만들어내는 힘도 있고, 문제를 깊게 파고드는 힘도 있더라고.
곧 나오는 화면에서 네 강점 그래프를 확인해봐!
이제 너한테 어울릴 것 같은 직업을 몇 개 골라봤어. 하나 골라서 직접 체험해볼까?`;

const STAGE5 = [
  jobName => `좋아, ${jobName}이 되어보자! 오늘은 네가 ${jobName} 신입으로 첫 출근하는 날이야. 문을 열자마자 선배가 급한 업무를 하나 맡겼어. 어떻게 할까?
<choice label="A">일단 선배에게 자세히 물어본다</choice>
<choice label="B">일단 부딪혀보면서 배운다</choice>`,
  jobName => `오, 그렇게 했구나! 덕분에 무사히 첫 업무를 마쳤어. 점심시간엔 팀 회의에서 새로운 아이디어를 내달라는 요청을 받았어. 어떻게 할까?
<choice label="A">평소에 관심있던 아이디어를 제안한다</choice>
<choice label="B">팀원들 의견을 먼저 들어본다</choice>`,
  jobName => `멋진 선택이야! 오후엔 예상치 못한 문제가 생겼어. 마감은 다가오는데 계획대로 안 풀리고 있어. 어떻게 할까?
<choice label="A">차분히 우선순위를 다시 정리한다</choice>
<choice label="B">동료에게 바로 도움을 요청한다</choice>`,
  jobName => `결국 하루를 무사히 마쳤어! 오늘 너는 진짜 ${jobName}처럼 문제를 풀어나갔어. 이 경험이 재밌었다면, 앞으로도 이 길을 계속 그려나가도 좋을 것 같아 😊`,
];

/**
 * @param {object} opts
 * @param {number} opts.stage
 * @param {number} opts.exchangeIndex - 1-based count of user turns within the current stage
 * @param {string} [opts.jobName]
 */
export function getMockResponse({ stage, exchangeIndex, jobName }) {
  const idx = Math.max(1, exchangeIndex || 1) - 1;

  if (stage === 1) return STAGE1[Math.min(idx, STAGE1.length - 1)];
  if (stage === 2) return STAGE2[Math.min(idx, STAGE2.length - 1)];
  if (stage === 3) return STAGE3[Math.min(idx, STAGE3.length - 1)];
  if (stage === 4) return STAGE4;
  if (stage === 5) {
    const name = jobName || '이 직업';
    return STAGE5[Math.min(idx, STAGE5.length - 1)](name);
  }

  return `(목업 데이터 없음: stage=${stage})`;
}
