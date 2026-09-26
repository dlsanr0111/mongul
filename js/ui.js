import { CONFIG } from './config.js';
import { COMPETENCIES } from './competencies.js';
import { getTagColor } from './jobs.js';

// ==================== VIEW TRANSITIONS ====================

export function switchToChat() {
  const landing = document.getElementById('view-landing');
  const chat    = document.getElementById('view-chat');

  landing.classList.add('fade-out');
  setTimeout(() => {
    landing.classList.add('hidden');
    chat.classList.remove('hidden');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        chat.classList.add('active');
      });
    });
  }, 380);
}

// ==================== STAGE DOTS ====================

export function updateStageDots(currentStage) {
  document.querySelectorAll('.stage-dot').forEach(dot => {
    const s = parseInt(dot.dataset.stage);
    dot.classList.remove('active', 'done');
    if (s < currentStage)  dot.classList.add('done');
    if (s === currentStage) dot.classList.add('active');
  });

  const stageInfo = CONFIG.STAGES[currentStage - 1];
  const total = CONFIG.STAGES.length;
  const status = document.getElementById('header-status');
  if (status && stageInfo) status.textContent = stageInfo.name;

  const tag = document.getElementById('header-survey-tag');
  if (tag) tag.textContent = `이야기 중 · ${currentStage}/${total}`;
}

// ==================== STAGE TRANSITION OVERLAY ====================

export function showStageTransition(stageNum) {
  return new Promise(resolve => {
    const stageInfo = CONFIG.STAGES[stageNum - 1];
    if (!stageInfo) { resolve(); return; }

    const total = CONFIG.STAGES.length;
    const overlay = document.getElementById('stage-overlay');
    document.getElementById('stage-overlay-icon').textContent = `${stageNum}/${total}단계`;
    document.getElementById('stage-overlay-name').textContent = stageInfo.name;
    document.getElementById('stage-overlay-desc').textContent = stageInfo.desc;

    overlay.classList.remove('hidden');
    setTimeout(() => {
      overlay.classList.add('hidden');
      resolve();
    }, 1700);
  });
}

// ==================== CHAT MESSAGES ====================

function getMessagesEl() {
  return document.getElementById('chat-messages');
}

export function appendUserMessage(text) {
  const el = getMessagesEl();
  const row = document.createElement('div');
  row.className = 'msg-row user-row';
  row.innerHTML = `
    <div class="msg-bubble user-bubble">
      <span class="msg-text">${escapeHtml(text)}</span>
    </div>
  `;
  el.appendChild(row);
  scrollToBottom();
}

export function createBotMessage() {
  const el = getMessagesEl();
  const row = document.createElement('div');
  row.className = 'msg-row bot-row';
  row.innerHTML = `
    <img src="character.png" alt="${CONFIG.MASCOT_NAME}" class="msg-avatar">
    <div class="msg-bubble bot-bubble">
      <span class="msg-text"></span>
    </div>
  `;
  el.appendChild(row);
  scrollToBottom();
  return row;
}

export function updateMessageContent(rowEl, text) {
  const span = rowEl.querySelector('.msg-text');
  if (span) {
    span.textContent = text;
    scrollToBottom();
  }
}

export function getLastBotMessageText() {
  const spans = document.querySelectorAll('.bot-bubble .msg-text');
  return spans[spans.length - 1]?.textContent?.trim() || '';
}

export function appendErrorMessage(text) {
  const el = getMessagesEl();
  const div = document.createElement('div');
  div.className = 'error-msg';
  div.textContent = text;
  el.appendChild(div);
  scrollToBottom();
}

// ==================== TYPING INDICATOR ====================

export function showTypingIndicator() {
  document.getElementById('typing-indicator').classList.remove('hidden');
  scrollToBottom();
}

export function hideTypingIndicator() {
  document.getElementById('typing-indicator').classList.add('hidden');
}

// ==================== QUICK REPLIES ====================

export function isMobile() {
  return window.matchMedia('(max-width: 768px)').matches;
}

// 모바일에서는 직업 체험이 전체 화면이라 채팅창이 가려지므로 선택지를 체험 화면 안에 표시
function getChoiceContainer() {
  const simActive = !document.getElementById('simulation-panel').classList.contains('hidden');
  return isMobile() && simActive
    ? document.getElementById('sim-choices')
    : document.getElementById('quick-replies');
}

export function showQuickReplies(options, onSelect) {
  const container = getChoiceContainer();
  container.innerHTML = '';
  container.classList.remove('hidden');

  options.forEach(({ label, value }) => {
    const btn = document.createElement('button');
    btn.className = 'quick-reply-chip';
    btn.textContent = label;
    btn.addEventListener('click', () => {
      hideQuickReplies();
      onSelect(value ?? label);
    });
    container.appendChild(btn);
  });
}

export function hideQuickReplies() {
  const container = document.getElementById('quick-replies');
  container.classList.add('hidden');
  container.innerHTML = '';
  document.getElementById('sim-choices').innerHTML = '';
}

// ==================== INPUT CONTROL ====================

export function setInputDisabled(disabled) {
  const input = document.getElementById('chat-input');
  const btn   = document.getElementById('btn-send');
  input.disabled = disabled;
  btn.disabled   = disabled;
}

// ==================== SIDEBAR ====================

export function openSidebar() {
  document.getElementById('view-chat').classList.add('sidebar-open');
}

// ==================== COMPETENCY SUMMARY ====================

export function renderCompetencySummary(scores) {
  const el = document.getElementById('competency-summary');
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const top2 = sorted.slice(0, 2);

  el.innerHTML = `
    <p class="summary-label">강점 역량</p>
    <div class="strength-badges">
      ${top2.map(([key]) => {
        const c = COMPETENCIES[key];
        return `<span class="strength-badge" style="background:${c.color}18;color:${c.color}">${c.icon} ${c.label}</span>`;
      }).join('')}
    </div>
  `;
  el.classList.remove('hidden');
}

// ==================== JOB CARDS ====================

const JOBS_INITIAL_COUNT = 6;
const JOBS_PER_MORE = 6;

function createJobCard(job, onSelect) {
  const card = document.createElement('div');
  card.className = 'job-card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.innerHTML = `
    <div class="job-card-header">
      <span class="job-emoji">${job.emoji}</span>
      <span class="job-name">${job.name}</span>
      <span class="job-match">${job.matchScore}점</span>
    </div>
    <div class="job-badges">
      ${job.rare ? '<span class="job-badge job-badge-rare">✨ 몰랐던 직업</span>' : ''}
      <span class="job-badge">${job.categoryLabel}</span>
    </div>
    <p class="job-desc">${job.desc}</p>
    <div class="job-tags">
      ${job.tags.map(t => {
        const c = COMPETENCIES[t];
        return `<span class="job-tag" style="background:${getTagColor(t)}">${c?.icon || ''} ${c?.label || t}</span>`;
      }).join('')}
    </div>
    <span class="job-card-btn">체험해보기</span>
  `;

  card.addEventListener('click', () => onSelect(job));
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(job);
    }
  });
  return card;
}

export function renderJobCards(jobs, onSelect) {
  const container = document.getElementById('job-cards');
  const moreWrap = document.getElementById('job-more-wrap');
  const moreBtn = document.getElementById('btn-more-jobs');
  container.innerHTML = '';

  let shown = 0;
  const showNext = count => {
    jobs.slice(shown, shown + count).forEach(job => container.appendChild(createJobCard(job, onSelect)));
    shown = Math.min(shown + count, jobs.length);

    const remaining = jobs.length - shown;
    moreWrap.classList.toggle('hidden', remaining <= 0);
    moreBtn.textContent = `더 보기 (${remaining}개)`;
  };

  moreBtn.onclick = () => showNext(JOBS_PER_MORE);
  showNext(JOBS_INITIAL_COUNT);

  document.getElementById('job-section').classList.remove('hidden');
}

// ==================== SIMULATION PANEL ====================

export function showSimulationPanel(job) {
  document.getElementById('job-section').classList.add('hidden');
  document.getElementById('simulation-panel').classList.remove('hidden');
  document.getElementById('simulation-job-title').textContent = `${job.emoji} ${job.name}`;
  document.getElementById('simulation-content').textContent = '';
  document.getElementById('sim-choices').innerHTML = '';
  document.getElementById('sidebar').classList.add('sim-mode');
  document.getElementById('sidebar-title').textContent = '직업 체험';
  document.getElementById('sidebar').scrollTop = 0;
}

export function hideSimulationPanel() {
  document.getElementById('simulation-panel').classList.add('hidden');
  document.getElementById('job-section').classList.remove('hidden');
  document.getElementById('sim-choices').innerHTML = '';
  document.getElementById('sidebar').classList.remove('sim-mode');
  document.getElementById('sidebar-title').textContent = '내 강점과 어울리는 직업';
  document.getElementById('sidebar').scrollTop = 0;
}

export function updateSimulationContent(text) {
  document.getElementById('simulation-content').textContent = text;
}

export function getSimulationText() {
  return document.getElementById('simulation-content').textContent.trim();
}

// ==================== HELPERS ====================

function scrollToBottom() {
  const el = getMessagesEl();
  el.scrollTop = el.scrollHeight;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
