import { COMPETENCIES } from './competencies.js';

document.addEventListener('DOMContentLoaded', init);

async function init() {
  wireAuthTabs();
  wireAuthForms();
  document.getElementById('btn-logout').addEventListener('click', handleLogout);
  document.getElementById('issue-form').addEventListener('submit', handleIssueCode);
  document.getElementById('btn-refresh').addEventListener('click', loadCodes);

  const res = await fetch('/api/teacher/me');
  if (res.ok) {
    const { teacher } = await res.json();
    showDashboard(teacher);
  }
}

// ==================== AUTH VIEW ====================
function wireAuthTabs() {
  const tabs = document.querySelectorAll('.auth-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('login-form').classList.toggle('hidden', tab.dataset.tab !== 'login');
      document.getElementById('signup-form').classList.toggle('hidden', tab.dataset.tab !== 'signup');
    });
  });
}

function wireAuthForms() {
  document.getElementById('login-form').addEventListener('submit', e => submitAuthForm(e, '/api/teacher/login'));
  document.getElementById('signup-form').addEventListener('submit', e => submitAuthForm(e, '/api/teacher/signup'));
}

async function submitAuthForm(e, url) {
  e.preventDefault();
  const form = e.target;
  const errorEl = form.querySelector('.auth-error');
  errorEl.classList.add('hidden');

  const body = Object.fromEntries(new FormData(form).entries());
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data?.error?.message || '오류가 발생했습니다.';
      errorEl.classList.remove('hidden');
      return;
    }

    showDashboard(data.teacher);
  } catch {
    errorEl.textContent = '네트워크 오류가 발생했습니다.';
    errorEl.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
  }
}

async function handleLogout() {
  await fetch('/api/teacher/logout', { method: 'POST' });
  document.getElementById('view-dashboard').classList.add('hidden');
  document.getElementById('view-auth').classList.remove('hidden');
  document.getElementById('login-form').reset();
  document.getElementById('signup-form').reset();
}

// ==================== DASHBOARD ====================
function showDashboard(teacher) {
  document.getElementById('view-auth').classList.add('hidden');
  document.getElementById('view-dashboard').classList.remove('hidden');
  document.getElementById('dashboard-teacher-email').textContent = teacher.name
    ? `${teacher.name} (${teacher.email})`
    : teacher.email;
  loadCodes();
}

async function handleIssueCode(e) {
  e.preventDefault();
  const input = document.getElementById('issue-label-input');
  const studentLabel = input.value.trim();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    const res = await fetch('/api/teacher/codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentLabel }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data?.error?.message || '코드 발급에 실패했어요.');
      return;
    }

    input.value = '';
    const resultEl = document.getElementById('issue-result');
    resultEl.innerHTML = `새 코드: <strong>${data.code}</strong>${studentLabel ? ` (${studentLabel})` : ''} — 학생에게 전달해주세요.`;
    resultEl.classList.remove('hidden');

    loadCodes();
  } finally {
    submitBtn.disabled = false;
  }
}

async function loadCodes() {
  const res = await fetch('/api/teacher/codes');
  if (!res.ok) return;
  const { codes } = await res.json();

  const tbody = document.getElementById('codes-tbody');
  const empty = document.getElementById('codes-empty');
  const tableWrap = document.getElementById('codes-table-wrap');

  if (!codes.length) {
    empty.classList.remove('hidden');
    tableWrap.classList.add('hidden');
    return;
  }
  empty.classList.add('hidden');
  tableWrap.classList.remove('hidden');

  tbody.innerHTML = codes.map(rowHtml).join('');
}

function rowHtml(row) {
  const status = row.finalScores
    ? { label: '완료', className: 'status-done' }
    : row.status === 'used'
      ? { label: '진행중', className: 'status-progress' }
      : { label: '미사용', className: 'status-unused' };

  const strengths = row.finalScores
    ? Object.entries(row.finalScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([key]) => COMPETENCIES[key]?.label || key)
        .join(', ')
    : '-';

  const jobs = row.exploredJobs?.length ? row.exploredJobs.join(', ') : '-';

  return `
    <tr>
      <td class="cell-code">${row.code}</td>
      <td>${escapeHtml(row.studentLabel) || '-'}</td>
      <td><span class="status-badge ${status.className}">${status.label}</span></td>
      <td>${escapeHtml(strengths)}</td>
      <td>${escapeHtml(jobs)}</td>
    </tr>
  `;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
