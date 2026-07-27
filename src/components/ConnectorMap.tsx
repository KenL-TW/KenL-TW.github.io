import { useState } from "react";
import {
  BriefcaseBusiness,
  Boxes,
  Code2,
  MessageSquareText,
  Rocket,
  TrendingUp
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { connectorNodes, type ConnectorNode } from "../data/portfolio";

const icons = {
  business: BriefcaseBusiness,
  product: Boxes,
  technology: Code2,
  delivery: Rocket,
  growth: TrendingUp,
  ask: MessageSquareText
};

const lineEnds: Record<ConnectorNode["id"], { x: number; y: number }> = {
  business: { x: 50, y: 18 },
  product: { x: 24, y: 39 },
  technology: { x: 76, y: 39 },
  delivery: { x: 31, y: 70 },
  growth: { x: 69, y: 70 },
  ask: { x: 50, y: 82 }
};

function openChatbot() {
  const chatbot = (
    window as Window & {
      DTZ_CHATBOT?: { open?: () => void };
    }
  ).DTZ_CHATBOT;

  chatbot?.open?.();
}

export default function ConnectorMap() {
  const [selectedId, setSelectedId] =
    useState<ConnectorNode["id"]>("product");
  const shouldReduceMotion = useReducedMotion();
  const selected =
    connectorNodes.find((node) => node.id === selectedId) ?? connectorNodes[1];

  const selectNode = (node: ConnectorNode) => {
    setSelectedId(node.id);
    if (node.id === "ask") {
      openChatbot();
    }
  };

  return (
    <section className="connector-map" aria-label="Ken 的跨域能力關係圖">
      <div className="connector-canvas">
        <svg
          className="connector-lines"
          viewBox="0 0 100 100"
          aria-hidden="true"
          focusable="false"
        >
          <circle className="connector-orbit" cx="50" cy="50" r="34" />
          {connectorNodes.map((node) => (
            <line
              className={node.id === selectedId ? "is-selected" : ""}
              key={node.id}
              x1="50"
              y1="50"
              x2={lineEnds[node.id].x}
              y2={lineEnds[node.id].y}
            />
          ))}
        </svg>

        <motion.div
          className="connector-hub"
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.42, ease: "easeOut" }}
        >
          <img
            src="/assets/img/profile-img.png"
            alt="Ken Liao"
            width="420"
            height="420"
            fetchPriority="high"
          />
          <span>Ken Liao</span>
        </motion.div>

        {connectorNodes.map((node, index) => {
          const Icon = icons[node.id];
          const isSelected = node.id === selectedId;

          return (
            <motion.button
              type="button"
              className={`connector-node ${isSelected ? "is-selected" : ""}`}
              style={
                {
                  "--node-x": `${node.position.x}%`,
                  "--node-y": `${node.position.y}%`
                } as React.CSSProperties
              }
              key={node.id}
              aria-pressed={isSelected}
              aria-controls="connector-detail"
              onClick={() => selectNode(node)}
              initial={
                shouldReduceMotion
                  ? false
                  : { opacity: 0, transform: "translate(-50%, -42%)" }
              }
              animate={{
                opacity: 1,
                transform: "translate(-50%, -50%)"
              }}
              transition={{
                duration: 0.36,
                delay: shouldReduceMotion ? 0 : index * 0.045,
                ease: "easeOut"
              }}
            >
              <Icon aria-hidden="true" size={22} strokeWidth={1.5} />
              <span>{node.label}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="connector-detail" id="connector-detail" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={selected.id}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <span>{selected.label}</span>
            <p>{selected.description}</p>
            <a href={selected.target} onClick={selected.id === "ask" ? openChatbot : undefined}>
              Follow this connection
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M4 10h11M11 6l4 4-4 4" />
              </svg>
            </a>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
