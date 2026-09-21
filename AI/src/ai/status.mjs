// src/ai/status.mjs
// Single source of truth for AI system state: Service, Task, Execution, Cognitive

// ---------- ENUMS ----------

export const SERVICE_STATE = Object.freeze({
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  ERROR: 'ERROR',
  TIMEOUT: 'TIMEOUT',
});

export const TASK_STATE = Object.freeze({
  CREATED: 'CREATED',
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  WAITING: 'WAITING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  TIMEOUT: 'TIMEOUT',
});

export const EXECUTION_STATE = Object.freeze({
  IDLE: 'IDLE',
  THINKING: 'THINKING',
  TOOL_CALL: 'TOOL_CALL',
  RETRIEVING: 'RETRIEVING',
  LEARNING: 'LEARNING',
  RESPONDING: 'RESPONDING',
});

export const COGNITIVE_STATE = Object.freeze({
  UNDERSTANDING: 'UNDERSTANDING',
  PLANNING: 'PLANNING',
  REASONING: 'REASONING',
  VERIFYING: 'VERIFYING',
  ANSWERING: 'ANSWERING',
});

// Legal task transitions — prevents e.g. COMPLETED -> RUNNING by mistake
const TASK_TRANSITIONS = {
  CREATED: ['QUEUED', 'CANCELLED'],
  QUEUED: ['RUNNING', 'CANCELLED', 'TIMEOUT'],
  RUNNING: ['WAITING', 'COMPLETED', 'FAILED', 'CANCELLED', 'TIMEOUT'],
  WAITING: ['RUNNING', 'TIMEOUT', 'CANCELLED'],
  COMPLETED: [],
  FAILED: [],
  CANCELLED: [],
  TIMEOUT: [],
};

const MAX_HISTORY = 100;

function createInitialState() {
  return {
    service: SERVICE_STATE.ONLINE,
    task: TASK_STATE.CREATED,
    execution: EXECUTION_STATE.IDLE,
    cognitive: null,
    taskId: null,
    updatedAt: new Date().toISOString(),
    history: [], // event trace for debug/audit — not shown to end user
  };
}

// ---------- STATE MACHINE ----------

class AIStatus {
  constructor() {
    this.state = createInitialState();
    this.listeners = new Set();
  }

  getState() {
    return { ...this.state };
  }

  getTrace() {
    return [...this.state.history];
  }

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  _emit(eventName, patch) {
    this.state = {
      ...this.state,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    this.state.history.push({ event: eventName, at: this.state.updatedAt });
    if (this.state.history.length > MAX_HISTORY) this.state.history.shift();
    for (const fn of this.listeners) fn(this.getState());
  }

  // ---- Service ----
  setServiceState(next) {
    if (!Object.values(SERVICE_STATE).includes(next)) {
      throw new Error(`Invalid SERVICE_STATE: ${next}`);
    }
    this._emit(`SERVICE_${next}`, { service: next });
  }

  // ---- Task ----
  startTask(taskId) {
    this.state.taskId = taskId;
    this._emit('TASK_CREATED', { task: TASK_STATE.CREATED, taskId });
  }

  setTaskState(next) {
    if (!Object.values(TASK_STATE).includes(next)) {
      throw new Error(`Invalid TASK_STATE: ${next}`);
    }
    const allowed = TASK_TRANSITIONS[this.state.task] || [];
    if (this.state.task !== next && allowed.length && !allowed.includes(next)) {
      throw new Error(`Illegal task transition: ${this.state.task} -> ${next}`);
    }
    this._emit(`TASK_${next}`, { task: next });
  }

  // ---- Execution ----
  setExecutionState(next) {
    if (!Object.values(EXECUTION_STATE).includes(next)) {
      throw new Error(`Invalid EXECUTION_STATE: ${next}`);
    }
    this._emit(`EXEC_${next}`, { execution: next });
  }

  // ---- Cognitive ----
  setCognitiveState(next) {
    if (next !== null && !Object.values(COGNITIVE_STATE).includes(next)) {
      throw new Error(`Invalid COGNITIVE_STATE: ${next}`);
    }
    this._emit(next ? `COGNITIVE_${next}` : 'COGNITIVE_CLEARED', { cognitive: next });
  }

  reset() {
    this.state = createInitialState();
  }
}

export const aiStatus = new AIStatus();
export default aiStatus;
