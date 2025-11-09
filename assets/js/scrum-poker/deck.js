const DECKS = [
  {
    id: "fibonacci",
    label: "Fibonacci",
    description: "Classic planning poker deck with Fibonacci progression.",
    values: ["0", "0.5", "1", "2", "3", "5", "8", "13", "20", "40", "100", "?", "☕"],
    tags: ["default", "points"],
  },
  {
    id: "tshirt",
    label: "T-Shirt Sizes",
    description: "Relative sizing deck useful for non-numeric estimates.",
    values: ["XS", "S", "M", "L", "XL", "?", "☕"],
    tags: ["relative"],
  },
  {
    id: "powers-of-two",
    label: "Powers of Two",
    description: "Binary growth deck for engineering capacity conversations.",
    values: ["0", "1", "2", "4", "8", "16", "32", "64", "?"],
    tags: ["engineering"],
  },
  {
    id: "modified-fib",
    label: "Modified Fibonacci",
    description: "Adds intermediate values for finer-grain estimation discussions.",
    values: ["0", "1", "2", "3", "5", "8", "13", "21", "34", "55", "89", "?", "∞"],
    tags: ["points"],
  },
];

export const DEFAULT_DECK_ID = "fibonacci";

export function getDecks() {
  return [...DECKS];
}

export function getDeck(deckId) {
  return DECKS.find((deck) => deck.id === deckId) ?? DECKS[0];
}
