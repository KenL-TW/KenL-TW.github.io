import { getDecks } from "./deck.js";

const SELECTORS = {
  storyTitle: "[data-story-title]",
  deckSelect: "[data-deck-select]",
  addParticipantForm: "[data-add-participant-form]",
  addParticipantInput: "[data-add-participant-input]",
  participantList: "[data-participant-list]",
  revealButton: "[data-reveal-button]",
  resetButton: "[data-reset-button]",
  archiveButton: "[data-archive-button]",
  insightsContainer: "[data-insights]",
  historyList: "[data-history-list]",
  historyEmptyState: "[data-history-empty]",
  deckMetadata: "[data-deck-metadata]",
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}

export class ScrumPokerUI {
  constructor(root) {
    this.root = root;
    this.elements = this.#cacheElements();
    this.#populateDeckSelect();
  }

  #cacheElements() {
    const entries = Object.entries(SELECTORS).map(([key, selector]) => [key, this.root.querySelector(selector)]);
    return Object.fromEntries(entries);
  }

  #populateDeckSelect() {
    const select = this.elements.deckSelect;
    if (!select) {
      return;
    }

    getDecks().forEach((deck) => {
      const option = document.createElement("option");
      option.value = deck.id;
      option.textContent = deck.label;
      option.dataset.description = deck.description;
      select.appendChild(option);
    });
  }

  bindStoryTitle(handler) {
    this.elements.storyTitle?.addEventListener("input", (event) => handler(event.target.value));
  }

  bindDeckSelection(handler) {
    this.elements.deckSelect?.addEventListener("change", (event) => handler(event.target.value));
  }

  bindAddParticipant(handler) {
    const form = this.elements.addParticipantForm;
    if (!form) {
      return;
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = this.elements.addParticipantInput;
      const name = input?.value ?? "";
      handler(name);
      if (input) {
        input.value = "";
        input.focus();
      }
    });
  }

  bindReveal(handler) {
    this.elements.revealButton?.addEventListener("click", handler);
  }

  bindReset(handler) {
    this.elements.resetButton?.addEventListener("click", handler);
  }

  bindArchive(handler) {
    this.elements.archiveButton?.addEventListener("click", handler);
  }

  bindParticipantActions({ onVote, onRemove }) {
    this.elements.participantList?.addEventListener("click", (event) => {
      const target = event.target.closest("[data-action]");
      if (!target) {
        return;
      }

      const { participantId, value, action } = target.dataset;
      if (action === "vote" && onVote) {
        onVote(participantId, value);
      }

      if (action === "remove" && onRemove) {
        onRemove(participantId);
      }
    });
  }

  setSessionDetails({ storyTitle, deckId, deckDescription, deckTags }) {
    if (this.elements.storyTitle) {
      this.elements.storyTitle.value = storyTitle ?? "";
    }
    if (this.elements.deckSelect) {
      this.elements.deckSelect.value = deckId;
    }
    if (this.elements.deckMetadata) {
      this.elements.deckMetadata.innerHTML = `
        <p class="sp-muted-text">${deckDescription}</p>
        <div class="sp-deck-pill-group">
          ${(deckTags ?? []).map((tag) => `<span class="sp-deck-pill">${tag}</span>`).join("")}
        </div>
      `;
    }
  }

  renderParticipants({ participants, deckValues, revealVotes }) {
    const container = this.elements.participantList;
    if (!container) {
      return;
    }

    if (!participants.length) {
      container.innerHTML = `<div class="sp-empty-state">目前沒有成員，請新增參與者。</div>`;
      return;
    }

    container.innerHTML = participants
      .map((participant) => this.#renderParticipant(participant, deckValues, revealVotes))
      .join("");
  }

  #renderParticipant(participant, deckValues, revealVotes) {
    const { id, name, vote } = participant;
    const status = vote !== null ? "voted" : "pending";
    const safeName = escapeHtml(name);
    return `
      <article class="sp-participant" data-status="${status}" aria-live="polite">
        <header class="sp-participant-header">
          <h4>${safeName}</h4>
          <div class="sp-inline-actions">
            <span class="sp-badge">${vote === null ? "尚未投票" : "已投"}</span>
            <button class="sp-button secondary" data-action="remove" data-participant-id="${id}">移除</button>
          </div>
        </header>
        <div class="sp-vote-grid" role="group" aria-label="${name} 的投票卡片">
          ${deckValues
            .map((value) => {
              const isSelected = vote === value;
              const classes = ["sp-vote-card"];
              if (isSelected) {
                classes.push("selected");
              }
              if (revealVotes && isSelected) {
                classes.push("revealed");
              }
              const ariaLabel = `選擇 ${value} 點`;
              const title = isSelected ? "已選擇" : `選擇 ${value} 點`;
              return `<button type="button" class="${classes.join(" ")}" data-action="vote" data-participant-id="${id}" data-value="${value}" aria-label="${ariaLabel}" title="${title}">${value}</button>`;
            })
            .join("")}
        </div>
        ${revealVotes && vote !== null ? `<p class="sp-muted-text">最終估點：<strong>${vote}</strong></p>` : ""}
      </article>
    `;
  }

  renderInsights(insights, { revealVotes }) {
    const container = this.elements.insightsContainer;
    if (!container) {
      return;
    }

    const missingList = insights.missingVotes?.length
      ? `<p class="sp-alert">等待成員：${insights.missingVotes.map(escapeHtml).join("、")}</p>`
      : "";

    container.innerHTML = `
      <div class="sp-insights">
        <div class="sp-insight-row">
          <span>投票狀態</span>
          <strong>${insights.totalVotes}/${insights.participantCount}</strong>
        </div>
        <div class="sp-insight-row">
          <span>平均點數</span>
          <strong>${insights.numericAverage ?? "—"}</strong>
        </div>
        <div class="sp-grid two">
          <div>
            <span class="sp-muted-text">最高票</span>
            <div>${insights.highestVote ?? "—"}</div>
          </div>
          <div>
            <span class="sp-muted-text">最低票</span>
            <div>${insights.lowestVote ?? "—"}</div>
          </div>
        </div>
        <div class="sp-divider"></div>
        <div>
          <span class="sp-muted-text">是否共識</span>
          <div>${revealVotes ? (insights.consensusAchieved ? "✅ 已達成" : "⚠️ 尚未一致") : "投票尚未揭示"}</div>
        </div>
        ${missingList}
      </div>
    `;
  }

  renderHistory(history) {
    const list = this.elements.historyList;
    const empty = this.elements.historyEmptyState;
    if (!list || !empty) {
      return;
    }

    if (!history.length) {
      list.innerHTML = "";
      empty.hidden = false;
      return;
    }

    empty.hidden = true;
    list.innerHTML = history
      .map((item) => {
        const votesTableRows = Object.entries(item.votes)
          .map(([memberName, memberVote]) => {
            const safeMember = escapeHtml(memberName);
            const safeVote = memberVote === null ? "未投" : escapeHtml(memberVote);
            return `<tr><td>${safeMember}</td><td>${safeVote}</td></tr>`;
          })
          .join("");
        return `
          <article class="sp-history-item">
            <h4>${escapeHtml(item.storyTitle)}</h4>
            <div class="sp-history-meta">
              <span class="sp-tag">平均：${item.summary.numericAverage ?? "—"}</span>
              <span class="sp-tag">共識：${item.summary.consensusAchieved ? "是" : "否"}</span>
              <span class="sp-timestamp">${new Date(item.createdAt).toLocaleString()}</span>
            </div>
            <table class="sp-table">${votesTableRows}</table>
          </article>
        `;
      })
      .join("");
  }

  setRevealState({ revealVotes, allVoted }) {
    if (this.elements.revealButton) {
      this.elements.revealButton.disabled = revealVotes;
      this.elements.revealButton.textContent = revealVotes ? "已揭示" : "揭示投票";
      this.elements.revealButton.title = allVoted
        ? "揭示所有成員的選擇"
        : "仍有成員尚未投票，若需要強制揭示請連續點擊兩次";
    }
    if (this.elements.resetButton) {
      this.elements.resetButton.textContent = revealVotes ? "清除並開新一輪" : "清除選擇";
    }
    if (this.elements.archiveButton) {
      this.elements.archiveButton.disabled = revealVotes;
      this.elements.archiveButton.title = revealVotes ? "回合已保存，請清除或重新開啟新一輪" : "保存目前回合並加入歷史紀錄";
    }
  }
}
