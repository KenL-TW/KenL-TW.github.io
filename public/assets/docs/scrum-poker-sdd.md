# Scrum Poker Software Design Description (SDD)

## 1. Introduction

### 1.1 Purpose
This Software Design Description (SDD) outlines the architecture and implementation details for the Scrum Poker facilitator embedded in the static KenL-TW.github.io site. It provides a lightweight planning poker experience for Scrum teams to estimate user stories during refinement sessions.

### 1.2 Scope
The solution targets single-screen facilitation for colocated or remote teams that share a display. It allows the facilitator to manage participants, capture individual estimations with Planning Poker decks, and reveal results while maintaining a history log for multiple refinement rounds.

### 1.3 Definitions, Acronyms, and Abbreviations
- **Scrum Poker / Planning Poker**: An agile estimation technique where participants independently select story points before revealing choices collectively.
- **Round**: A single estimation exercise for one product backlog item.
- **Deck**: The set of available estimation cards (e.g., Fibonacci sequence, T-shirt sizes).

## 2. System Overview
The Scrum Poker tool is a browser-based single-page application backed by the existing static hosting infrastructure. It is implemented entirely in HTML, CSS, and JavaScript and requires no backend service. State is persisted with `localStorage` to provide continuity between browser sessions.

## 3. Architecture Design

### 3.1 Architectural Pattern
The client application follows a modular MVCS (Model–View–Controller–Storage) pattern:
- **Model** (`state.js`): Owns the authoritative state tree, enforces domain rules, and emits events when changes occur.
- **View** (`ui.js`): Renders the UI, exposes event bindings, and remains stateless.
- **Controller** (`controller.js`): Coordinates interactions between the model and view, manages domain workflows, and orchestrates persistence.
- **Storage Adapter** (`storage.js`): Abstracts persistence so the model can be serialized to `localStorage` or alternative stores.
- **Deck Registry** (`deck.js`): Centralized list of supported estimation decks with metadata used by the UI.

### 3.2 Component Diagram
```
+-----------------+        +-----------------+        +-----------------+
|                 |        |                 |        |                 |
|  deck.js        +------->+  controller.js  +------->+  ui.js          |
|  storage.js     |        |                 |        |                 |
|                 |        +--------+--------+        +--------+--------+
+--------+--------+                 |                          ^
         ^                          |                          |
         |                          v                          |
         |                +-----------------+        +---------+---------+
         +----------------+  state.js       +<-------+  DOM / User       |
                          |                 |        |  Interactions     |
                          +-----------------+        +-------------------+
```

### 3.3 Data Flow
1. User interactions trigger UI events captured in `controller.js`.
2. The controller invokes domain mutations on the model (`state.js`).
3. The model updates internal state, persists via `storage.js`, and emits structured events.
4. The controller listens to model events and instructs `ui.js` to refresh the DOM.
5. Derived metrics (average, consensus) are computed by the model and passed to the view for display.

## 4. Data Design

### 4.1 State Schema
```
interface ScrumPokerStateTree {
  storyTitle: string;
  deckId: string;
  revealVotes: boolean;
  participants: Array<{
    id: string;
    name: string;
    vote: string | null;
    updatedAt: string;
  }>;
  history: Array<{
    id: string;
    storyTitle: string;
    votes: Record<string, string | null>;
    summary: {
      numericAverage: number | null;
      highestVote: string | null;
      lowestVote: string | null;
      consensusAchieved: boolean;
    };
    createdAt: string;
  }>;
}
```

### 4.2 Deck Metadata
Decks are declared in `deck.js` with shape:
```
interface DeckDefinition {
  id: string;
  label: string;
  description: string;
  values: string[];
  tags?: string[];
}
```

## 5. Component Design

### 5.1 Model (`state.js`)
Responsibilities include state initialization, validation, mutation, event emission, and providing derived metrics. Public API:
- `constructor(storageAdapter)`
- `subscribe(event, handler)` / `unsubscribe(event, handler)`
- `getState()`
- `setStoryTitle(title)`
- `setDeck(deckId)`
- `addParticipant(name)`
- `updateParticipant(id, updates)`
- `removeParticipant(id)`
- `setParticipantVote(id, value)`
- `clearVotes({archiveRound: boolean})`
- `toggleReveal(flag)`
- `archiveRound()`
- `deriveInsights()`

### 5.2 View (`ui.js`)
The view renders sections for:
- Session controls (story title, deck selection, facilitator actions)
- Participant management (list, voting controls)
- Team insights (average, consensus, missing votes)
- Round history (past estimations)

It provides binding helpers such as `bindAddParticipant`, `bindVote`, `bindReveal`, etc., and render methods `renderParticipants`, `renderInsights`, `renderHistory`, `setSessionDetails`.

### 5.3 Controller (`controller.js`)
Defines orchestration logic:
- Bootstraps the model and view.
- Wires event handlers to UI interactions.
- Responds to model event emissions by updating UI.
- Handles round lifecycle operations (reveal, reset, archive).
- Applies guard rails (prevent reveal until everyone voted when consensus mode is enabled).

### 5.4 Storage Adapter (`storage.js`)
Wraps `localStorage` with JSON serialization, versioning, and error resilience. No-ops if storage is unavailable (e.g., private browsing).

### 5.5 Deck Registry (`deck.js`)
Exports available decks and helper functions:
- `getDecks()`
- `getDeck(deckId)`
- `DEFAULT_DECK_ID`

## 6. User Interface Design

### 6.1 Layout Summary
- **Left column**: Session configuration, deck selection, facilitator controls.
- **Right column**: Participant list, vote cards, insights, and history.
- Responsive fallback collapses into single column on narrow viewports.

### 6.2 States
- **Voting**: Votes hidden; participants show placeholder cards.
- **Reveal**: Votes displayed with numeric insights and highlight of consensus.
- **Empty history**: Encourages facilitator to archive rounds.

## 7. Requirements Traceability
- RQ-1 Manage participants ➜ `addParticipant`, `removeParticipant`, UI add form.
- RQ-2 Collect votes ➜ Vote cards, `setParticipantVote`.
- RQ-3 Reveal votes simultaneously ➜ `toggleReveal`, UI reveal button.
- RQ-4 Persist rounds ➜ `archiveRound`, history section.
- RQ-5 Display insights ➜ `deriveInsights`, insights view.

## 8. Nonfunctional Considerations
- **Performance**: In-memory state and DOM diffing limited to dozens of participants.
- **Reliability**: Storage adapter catches serialization errors, preventing hard failures.
- **Usability**: Keyboard accessible controls, responsive layout, descriptive labels.
- **Maintainability**: Modular MVCS structure enables isolated changes per responsibility.

## 9. Appendices
- **A**. Future enhancements: multi-device syncing, timers, Jira integration, and export options.
- **B**. Acceptance criteria checklist embedded in `controller.js` comments for quick verification.
