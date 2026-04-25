import { CONFIG } from './config.js';

/**
 * Stream Claude API response.
 *
 * @param {object} opts
 * @param {string}   opts.systemPrompt
 * @param {Array}    opts.messages        - Anthropic message format [{role, content}]
 * @param {Function} opts.onUpdate        - called with full cleaned text each chunk
 * @param {Function} opts.onComplete      - called with { scores, stageComplete, finalScores, choices }
 */
export async function streamClaude({ systemPrompt, messages, onUpdate, onComplete }) {
  if (!CONFIG.API_KEY) {
    throw new Error('config.js 에 API 키를 설정해주세요.');
  }

  const response = await fetch(CONFIG.API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CONFIG.API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: CONFIG.MODEL,
      max_tokens: CONFIG.MAX_TOKENS,
      system: systemPrompt,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    let errMsg = `오류가 발생했습니다. (${response.status})`;
    try {
      const errData = await response.json();
      errMsg = errData.error?.message || errMsg;
    } catch (_) {}
    throw new Error(errMsg);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let sseBuffer = '';
  let rawText = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      sseBuffer += decoder.decode(value, { stream: true });
      const lines = sseBuffer.split('\n');
      sseBuffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') continue;

        let parsed;
        try { parsed = JSON.parse(payload); } catch { continue; }

        if (
          parsed.type === 'content_block_delta' &&
          parsed.delta?.type === 'text_delta'
        ) {
          rawText += parsed.delta.text;
          onUpdate?.(stripForDisplay(rawText));
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  const result = parseSpecialTags(rawText);
  onComplete?.(result);
  return result;
}

function stripForDisplay(text) {
  return text
    .replace(/<score[^>]*?\/>/g, '')
    .replace(/<stage_complete\/>/g, '')
    .replace(/<final_scores>[\s\S]*?<\/final_scores>/g, '')
    .replace(/<choice[^>]*?>[\s\S]*?<\/choice>/g, '')
    .replace(/<(?:score|stage_complete|final_scores|choice)[^>]*$/, '')
    .trim();
}

function parseSpecialTags(text) {
  const scores = [];

  const scoreRe = /<score\s+competency="([^"]+)"\s+delta="([+-]?\d+)"\/>/g;
  let m;
  while ((m = scoreRe.exec(text)) !== null) {
    const delta = parseInt(m[2], 10);
    if (delta !== 0) scores.push({ competency: m[1], delta });
  }

  const stageComplete = /<stage_complete\/>/.test(text);

  let finalScores = null;
  const fsMatch = /<final_scores>([\s\S]*?)<\/final_scores>/.exec(text);
  if (fsMatch) {
    try { finalScores = JSON.parse(fsMatch[1].trim()); } catch (_) {}
  }

  const choices = [];
  const choiceRe = /<choice\s+label="([^"]+)">([\s\S]*?)<\/choice>/g;
  while ((m = choiceRe.exec(text)) !== null) {
    choices.push({ label: m[1], text: m[2].trim() });
  }

  return { scores, stageComplete, finalScores, choices };
}
