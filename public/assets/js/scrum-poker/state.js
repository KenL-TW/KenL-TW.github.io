import { DEFAULT_DECK_ID, getDeck } from "./deck.js";

const EVENTS = {
  STATE_CHANGED: "state:changed",
  HISTORY_CHANGED: "history:changed",
  ROUND_REVEALED: "round:revealed",
};

function generateId(prefix = "sp") {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function clone(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

const NUMERIC_VALUES = new Set([
  "0",
  "0.5",
  "1",
  "2",
  "3",
  "4",
  "5",
  "8",
  "13",
  "16",
  "20",
  "21",
  "32",
  "34",
  "40",
  "55",
  "64",
  "89",
  "100",
]);

export class ScrumPokerState {
  constructor(storageAdapter) {
    this.storage = storageAdapter;
    this.listeners = new Map();
    this.state = this.#createInitialState();

    const persisted = this.storage?.load?.();
    if (persisted) {
      this.state = { ...this.state, ...persisted };
      this.state.participants = persisted.participants ?? [];
      this.state.history = persisted.history ?? [];
      this.state.revealVotes = Boolean(persisted.revealVotes);
    }
  }

  #createInitialState() {
    return {
      storyTitle: "",
      deckId: DEFAULT_DECK_ID,
      revealVotes: false,
      participants: [],
      history: [],
    };
  }

  subscribe(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event).add(handler);
    return () => this.unsubscribe(event, handler);
  }

  unsubscribe(event, handler) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  #emit(event, payload) {
    const handlers = this.listeners.get(event);
    if (!handlers) {
      return;
    }

    handlers.forEach((handler) => {
      try {
        handler(payload, clone(this.state));
      } catch (error) {
        console.error("Scrum Poker: listener failed", error);
      }
    });
  }

  #persist() {
    this.storage?.save?.(this.state);
  }

  getState() {
    return clone(this.state);
  }

  getCurrentDeck() {
    return getDeck(this.state.deckId);
  }

  setStoryTitle(title) {
    this.state.storyTitle = title.trim();
    this.#persist();
    this.#emit(EVENTS.STATE_CHANGED, this.getState());
  }

  setDeck(deckId) {
    const deck = getDeck(deckId);
    this.state.deckId = deck.id;
    // reset current votes when deck changes for clarity
    this.state.participants = this.state.participants.map((participant) => ({
      ...participant,
      vote: null,
    }));
    this.state.revealVotes = false;
    this.#persist();
    this.#emit(EVENTS.STATE_CHANGED, this.getState());
  }

  addParticipant(name) {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    const participant = {
      id: generateId("participant"),
      name: trimmed,
      vote: null,
      updatedAt: nowIso(),
    };
    this.state.participants.push(participant);
    this.#persist();
    this.#emit(EVENTS.STATE_CHANGED, this.getState());
  }

  updateParticipant(id, updates) {
    const participant = this.state.participants.find((item) => item.id === id);
    if (!participant) {
      return;
    }

    Object.assign(participant, updates, { updatedAt: nowIso() });
    this.#persist();
    this.#emit(EVENTS.STATE_CHANGED, this.getState());
  }

  removeParticipant(id) {
    this.state.participants = this.state.participants.filter((participant) => participant.id !== id);
    this.#persist();
    this.#emit(EVENTS.STATE_CHANGED, this.getState());
  }

  setParticipantVote(id, vote) {
    const participant = this.state.participants.find((item) => item.id === id);
    if (!participant) {
      return;
    }

    participant.vote = vote;
    participant.updatedAt = nowIso();
    this.state.revealVotes = false;
    this.#persist();
    this.#emit(EVENTS.STATE_CHANGED, this.getState());
  }

  clearVotes({ archiveRound = false } = {}) {
    if (archiveRound) {
      this.archiveRound();
    }

    this.state.participants = this.state.participants.map((participant) => ({
      ...participant,
      vote: null,
    }));
    this.state.revealVotes = false;
    this.#persist();
    this.#emit(EVENTS.STATE_CHANGED, this.getState());
  }

  toggleReveal(flag) {
    this.state.revealVotes = flag;
    this.#persist();
    this.#emit(EVENTS.STATE_CHANGED, this.getState());
    if (flag) {
      this.#emit(EVENTS.ROUND_REVEALED, this.getState());
    }
  }

  archiveRound() {
    if (!this.state.participants.length) {
      return;
    }

    const snapshot = {
      id: generateId("round"),
      storyTitle: this.state.storyTitle || "未命名需求",
      votes: Object.fromEntries(
        this.state.participants.map((participant) => [participant.name, participant.vote])
      ),
      summary: this.deriveInsights(),
      createdAt: nowIso(),
    };
    this.state.history = [snapshot, ...this.state.history].slice(0, 25);
    this.#persist();
    this.#emit(EVENTS.HISTORY_CHANGED, this.getState());
  }

  deriveInsights() {
    const votes = this.state.participants
      .map((participant) => participant.vote)
      .filter((vote) => vote !== null);
    const numericVotes = votes
      .map((vote) => (NUMERIC_VALUES.has(vote) ? Number(vote) : null))
      .filter((value) => value !== null && !Number.isNaN(value));

    const consensusAchieved = votes.length > 0 && votes.every((vote) => vote === votes[0]);
    const numericAverage = numericVotes.length
      ? Math.round((numericVotes.reduce((total, current) => total + current, 0) / numericVotes.length) * 100) / 100
      : null;
    const highestVote = votes.length ? votes.reduce((acc, value) => selectVote(acc, value, Math.max)) : null;
    const lowestVote = votes.length ? votes.reduce((acc, value) => selectVote(acc, value, Math.min)) : null;
    const missingVotes = this.state.participants.filter((participant) => participant.vote === null).map((p) => p.name);

    return {
      numericAverage,
      highestVote,
      lowestVote,
      consensusAchieved,
      missingVotes,
      totalVotes: votes.length,
      participantCount: this.state.participants.length,
    };
  }
}

export { EVENTS as STATE_EVENTS };

function selectVote(current, candidate, reducer) {
  if (current === undefined || current === null) {
    return candidate;
  }

  const currentNumeric = NUMERIC_VALUES.has(current) ? Number(current) : null;
  const candidateNumeric = NUMERIC_VALUES.has(candidate) ? Number(candidate) : null;

  if (currentNumeric !== null && candidateNumeric !== null) {
    return reducer(currentNumeric, candidateNumeric) === currentNumeric ? current : candidate;
  }

  if (candidateNumeric !== null) {
    return candidate;
  }

  if (currentNumeric !== null) {
    return current;
  }

  const comparison = current.localeCompare(candidate, "zh-Hant", { numeric: true, sensitivity: "base" });
  if (reducer === Math.max) {
    return comparison >= 0 ? current : candidate;
  }
  return comparison <= 0 ? current : candidate;
}
