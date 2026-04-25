export class ConversationState {
  constructor() {
    this.stage = 1;
    this.messages = []; // { role: 'user'|'assistant', content: string }
    this.rawScores = {
      비판적사고: 0,
      의사소통: 0,
      협업: 0,
      창의력: 0,
      사회정서: 0,
      진로개발: 0,
      디지털리터러시: 0,
    };
    this.finalScores = null; // set by Stage 4 Claude response
    this.stageExchanges = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    this.isLoading = false;
    this.topJobs = [];
    this.activeSimJob = null;
  }

  addMessage(role, content) {
    this.messages.push({ role, content });
    if (role === 'user' && this.stage <= 5) {
      this.stageExchanges[this.stage] = (this.stageExchanges[this.stage] || 0) + 1;
    }
  }

  updateScore(competency, delta) {
    if (Object.prototype.hasOwnProperty.call(this.rawScores, competency)) {
      this.rawScores[competency] = Math.max(0, this.rawScores[competency] + delta);
    }
  }

  setFinalScores(scores) {
    this.finalScores = { ...scores };
  }

  // Normalize raw scores to 0–100
  getNormalizedScores() {
    const maxPossible = {
      비판적사고:    6  * 12,
      의사소통:      9  * 12,
      협업:          8  * 12,
      창의력:        6  * 12,
      사회정서:     13  * 12,
      진로개발:     13  * 12,
      디지털리터러시: 21 * 12,
    };
    const result = {};
    for (const [key, raw] of Object.entries(this.rawScores)) {
      result[key] = Math.min(100, Math.round((raw / maxPossible[key]) * 100));
    }
    return result;
  }

  advanceStage() {
    if (this.stage < 5) {
      this.stage++;
      this.stageExchanges[this.stage] = 0;
    }
  }

  // Returns Anthropic API-compatible messages array
  getApiMessages() {
    // Anthropic requires alternating user/assistant, starting with user
    const msgs = this.messages.filter(m => m.content.trim());
    // Ensure first message is from user
    const firstUser = msgs.findIndex(m => m.role === 'user');
    return firstUser >= 0 ? msgs.slice(firstUser) : msgs;
  }
}
