import { ScrumPokerState, STATE_EVENTS } from "./state.js";
import { LocalStorageAdapter } from "./storage.js";
import { ScrumPokerUI } from "./ui.js";
import { getDeck } from "./deck.js";

export class ScrumPokerController {
  constructor(root) {
    this.model = new ScrumPokerState(new LocalStorageAdapter());
    this.view = new ScrumPokerUI(root);

    this.#bindModelEvents();
    this.#bindViewEvents();
    this.#initialRender();
  }

  #bindModelEvents() {
    this.model.subscribe(STATE_EVENTS.STATE_CHANGED, () => this.#render());
    this.model.subscribe(STATE_EVENTS.HISTORY_CHANGED, () => this.#renderHistory());
    this.model.subscribe(STATE_EVENTS.ROUND_REVEALED, () => this.#handleRoundRevealed());
  }

  #bindViewEvents() {
    this.view.bindStoryTitle((value) => this.model.setStoryTitle(value));
    this.view.bindDeckSelection((deckId) => this.model.setDeck(deckId));
    this.view.bindAddParticipant((name) => this.model.addParticipant(name));
    this.view.bindReveal(() => this.#handleRevealRequest());
    this.view.bindReset(() => this.model.clearVotes({ archiveRound: false }));
    this.view.bindArchive(() => this.#handleArchiveRequest());
    this.view.bindParticipantActions({
      onVote: (participantId, value) => this.model.setParticipantVote(participantId, value),
      onRemove: (participantId) => this.model.removeParticipant(participantId),
    });
  }

  #initialRender() {
    this.#render();
    this.#renderHistory();
  }

  #render() {
    const state = this.model.getState();
    const deck = getDeck(state.deckId);
    this.view.setSessionDetails({
      storyTitle: state.storyTitle,
      deckId: deck.id,
      deckDescription: deck.description,
      deckTags: deck.tags,
    });

    this.view.renderParticipants({
      participants: state.participants,
      deckValues: deck.values,
      revealVotes: state.revealVotes,
    });

    const insights = this.model.deriveInsights();
    this.view.renderInsights(insights, { revealVotes: state.revealVotes });

    const allVoted = insights.totalVotes === insights.participantCount && insights.participantCount > 0;
    this.view.setRevealState({ revealVotes: state.revealVotes, allVoted });
  }

  #renderHistory() {
    const state = this.model.getState();
    this.view.renderHistory(state.history);
  }

  #handleRevealRequest() {
    const insights = this.model.deriveInsights();
    const everyoneVoted = insights.totalVotes === insights.participantCount && insights.participantCount > 0;
    if (!everyoneVoted) {
      if (!this._revealOverrideRequested) {
        alert("仍有成員尚未投票，請確認後再揭示。\n如需強制揭示，請再次按下揭示按鈕。");
        this._revealOverrideRequested = true;
        setTimeout(() => (this._revealOverrideRequested = false), 5000);
        return;
      }
    }

    this.model.toggleReveal(true);
    this._revealOverrideRequested = false;
  }

  #handleArchiveRequest() {
    this.model.archiveRound();
    this.model.clearVotes({ archiveRound: false });
  }

  #handleRoundRevealed() {
    // After revealing, automatically archive snapshot to history.
    this.model.archiveRound();
  }
}

export function bootstrapScrumPoker() {
  const root = document.querySelector("[data-scrum-poker-root]");
  if (!root) {
    return;
  }

  new ScrumPokerController(root);
}

document.addEventListener("DOMContentLoaded", () => {
  bootstrapScrumPoker();
});
