const STORAGE_KEY = 'mongle_code';

function getStored() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStored(code, studentToken) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ code, studentToken }));
  } catch {
    // sessionStorage 사용 불가(프라이빗 모드 등) — 이번 세션은 매번 코드 입력하게 됨
  }
}

/** 이미 이번 세션에 코드를 인증했다면 { code, studentToken }, 아니면 null */
export function getVerifiedAccess() {
  return getStored();
}

export function initCodeGate({ onUnlocked }) {
  const form = document.getElementById('code-gate-form');
  const input = document.getElementById('code-gate-input');
  const errorEl = document.getElementById('code-gate-error');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const code = input.value.trim();
    if (!code) return;

    errorEl.classList.add('hidden');
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      const res = await fetch('/api/student/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (!res.ok) {
        errorEl.textContent = data?.error?.message || '코드를 확인할 수 없어요.';
        errorEl.classList.remove('hidden');
        return;
      }

      setStored(data.code, data.studentToken);
      onUnlocked(data.code, data.studentToken);
    } catch {
      errorEl.textContent = '네트워크 오류가 발생했어요. 다시 시도해줘.';
      errorEl.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
    }
  });
}

/** 결과를 선생님 대시보드용으로 저장 (실패해도 학생 화면 흐름을 막지 않음) */
export async function submitResult({ finalScores, exploredJobs } = {}) {
  const access = getStored();
  if (!access) return;

  try {
    await fetch('/api/student/submit-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: access.code,
        studentToken: access.studentToken,
        finalScores,
        exploredJobs,
      }),
    });
  } catch (err) {
    console.warn('결과 저장 실패:', err);
  }
}
