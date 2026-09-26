import { ConversationState } from './state.js';
import { streamGemini } from './api.js';
import { renderRadarChart } from './chart.js';
import { recommendJobs, JOB_CATALOG } from './jobs.js';
import { getSystemPrompt } from './stages.js';
import * as UI from './ui.js';

// ==================== APP STATE ====================
const state = new ConversationState();

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-start').addEventListener('click', startChat);
  document.getElementById('btn-send').addEventListener('click', handleSend);
  document.getElementById('chat-input').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });
  document.getElementById('chat-input').addEventListener('input', autoResizeTextarea);
  document.getElementById('btn-back-jobs').addEventListener('click', () => {
    UI.hideSimulationPanel();
  });
});

// ==================== START FLOW ====================
async function startChat() {
  UI.switchToChat();
  UI.updateStageDots(1);

  await delay(600);

  state.addMessage('user', '안녕!');
  await sendAIMessage();
}

// ==================== SEND MESSAGE ====================
async function handleSend() {
  const inputEl = document.getElementById('chat-input');
  const text = inputEl.value.trim();
  if (!text || state.isLoading) return;

  inputEl.value = '';
  autoResizeTextarea({ target: inputEl });
  UI.hideQuickReplies();

  const stageJump = /^\/stage\s*([1-5])$/i.exec(text);
  if (stageJump) {
    await jumpToStage(parseInt(stageJump[1], 10));
    return;
  }

  state.addMessage('user', text);
  UI.appendUserMessage(text);

  await sendAIMessage();
}

// ==================== DEV: /stage N 명령으로 특정 단계로 바로 이동 ====================
async function jumpToStage(targetStage) {
  state.stage = targetStage;
  state.stageExchanges[targetStage] = 0;
  UI.updateStageDots(targetStage);

  if (targetStage === 5) {
    const job = state.activeSimJob || JOB_CATALOG[0];
    state.activeSimJob = job;
    UI.showSimulationPanel(job);
    state.addMessage('user', `${job.name}으로 일하는 하루를 체험하고 싶어!`);
    await sendAIMessage({ jobName: job.simPrompt });
    return;
  }

  const kickoff = targetStage === 1 ? '안녕!'
    : targetStage === 4 ? '분석해줘!'
    : '다음 얘기로 넘어가보자!';
  state.addMessage('user', kickoff);
  await sendAIMessage();
}

// ==================== AI MESSAGE ====================
async function sendAIMessage({ jobName = '' } = {}) {
  if (state.isLoading) return;
  state.isLoading = true;

  UI.showTypingIndicator();
  UI.setInputDisabled(true);

  let botRowEl = null;
  let typingHidden = false;

  try {
    const activeJobName = jobName || state.activeSimJob?.simPrompt || '';
    const systemPrompt = getSystemPrompt(state.stage, activeJobName);
    const messages     = state.getApiMessages();

    await streamGemini({
      systemPrompt,
      messages,
      stage: state.stage,
      exchangeIndex: state.stageExchanges[state.stage],
      jobName: activeJobName,
      onUpdate: text => {
        if (state.stage === 5) {
          if (!typingHidden) {
            UI.hideTypingIndicator();
            typingHidden = true;
          }
          UI.updateSimulationContent(text);
        } else {
          if (!botRowEl) {
            UI.hideTypingIndicator();
            typingHidden = true;
            botRowEl = UI.createBotMessage();
          }
          UI.updateMessageContent(botRowEl, text);
        }
      },
      onComplete: async ({ scores, stageComplete, finalScores, choices, truncated }) => {
        // Save AI response text to state
        const responseText = state.stage === 5
          ? UI.getSimulationText()
          : UI.getLastBotMessageText();
        if (responseText) state.addMessage('assistant', responseText);

        if (truncated) {
          UI.appendErrorMessage('답변이 길어져서 일부가 잘렸을 수 있어! 이상하면 다시 물어봐줘 🙏');
        }

        // Apply competency score deltas
        for (const { competency, delta } of scores) {
          state.updateScore(competency, delta);
        }

        // Stage 4: show radar chart
        if (finalScores) {
          state.setFinalScores(finalScores);
          await handleStage4Result(finalScores);
          return;
        }

        // Stage 5: show A/B choice chips
        if (choices.length > 0 && state.stage === 5) {
          UI.showQuickReplies(
            choices.map(c => ({ label: `${c.label}. ${c.text}`, value: c.text })),
            text => {
              state.addMessage('user', text);
              UI.appendUserMessage(text);
              sendAIMessage();
            }
          );
        }

        // Stage transition
        if (stageComplete && state.stage < 4) {
          await triggerStageTransition();
        }
      },
    });

  } catch (err) {
    console.error('Error:', err);
    UI.hideTypingIndicator();
    UI.appendErrorMessage(err.message || '잠시 후 다시 시도해봐!');
  } finally {
    state.isLoading = false;
    UI.hideTypingIndicator();
    UI.setInputDisabled(false);
    document.getElementById('chat-input').focus();
  }
}

// ==================== STAGE TRANSITIONS ====================
async function triggerStageTransition() {
  const nextStage = state.stage + 1;

  await UI.showStageTransition(nextStage);
  state.advanceStage();
  UI.updateStageDots(state.stage);

  if (state.stage === 4) {
    await delay(400);
    state.addMessage('user', '분석해줘!');
    await sendAIMessage();
  }
}

async function handleStage4Result(finalScores) {
  UI.openSidebar();

  await delay(300);
  renderRadarChart('radar-chart', finalScores);
  UI.renderCompetencySummary(finalScores);

  await delay(1400);
  const jobs = recommendJobs(finalScores, 3);
  state.topJobs = jobs;
  UI.renderJobCards(jobs, handleJobSelect);
}

async function handleJobSelect(job) {
  state.activeSimJob = job;

  UI.showSimulationPanel(job);
  await UI.showStageTransition(5);

  state.advanceStage();
  UI.updateStageDots(5);

  state.addMessage('user', `${job.name}으로 일하는 하루를 체험하고 싶어!`);
  UI.appendUserMessage(`${job.name}으로 일하는 하루를 체험하고 싶어! ✨`);

  await sendAIMessage({ jobName: job.simPrompt });
}

// ==================== UTILITIES ====================
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function autoResizeTextarea(e) {
  const el = e.target || e;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}
