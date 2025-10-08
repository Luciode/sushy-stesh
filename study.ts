import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Cute Study App — paste notes ➜ practice as Flashcards or MCQs
 * Styling: Tailwind (pastels, glass, rounded-2xl)
 * No backend required.
 */

// ---------- Helpers ----------
function normalizeText(s) {
  return s.replace(/\r/g, "").trim();
}

function splitNotes(raw) {
  // Split into logical blocks: blank lines separate topics
  const text = normalizeText(raw);
  const blocks = text
    .split(/\n\s*\n/) // paragraphs
    .map((b) => b.trim())
    .filter(Boolean);
  return blocks;
}

function parsePairs(raw) {
  // Try to parse "Term: Definition" or "Term - Definition" pairs per line.
  const lines = normalizeText(raw)
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const items = [];
  for (const line of lines) {
    const m = line.match(/^(.*?)[\s]*[:\-\u2013\u2014][\s]*(.+)$/); // term : def
    if (m) items.push({ term: m[1].trim(), definition: m[2].trim() });
  }
  return items;
}

function smartParse(raw) {
  // If no clear pairs, use a paragraph's first sentence as the prompt
  const blocks = splitNotes(raw);
  const items = blocks.map((b) => {
    const sentences = b.split(/(?<=[.!?])\s+/).filter(Boolean);
    const term = sentences.shift() || b.slice(0, 80);
    const definition = [term, ...sentences].join(" ");
    return { term: term.trim(), definition: definition.trim() };
  });
  return items;
}

function makeCards(raw) {
  const pairs = parsePairs(raw);
  if (pairs.length >= 2) return pairs;
  return smartParse(raw);
}

function uniqueSample(arr, count) {
  const copy = [...arr];
  const out = [];
  while (copy.length && out.length < count) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function makeMCQs(items) {
  // For each item, create 4 choices: correct + 3 distractors from other definitions
  return items.map((it, i) => {
    const others = items.filter((_, j) => j !== i).map((x) => x.definition);
    const distractors = uniqueSample(others, 3);
    const choices = [...distractors, it.definition].sort(() => Math.random() - 0.5);
    const correctIndex = choices.indexOf(it.definition);
    return {
      stem: it.term,
      choices,
      correctIndex,
      explanation: it.definition,
    };
  });
}

// ---------- UI Components ----------
const Glass = ({ className = "", children }) => (
  <div
    className={
      `backdrop-blur-lg bg-white/60 dark:bg-slate-900/40 border border-white/40 dark:border-white/10 shadow-xl rounded-2xl ${className}`
    }
  >
    {children}
  </div>
);

const Header = () => (
  <div className="w-full flex items-center justify-center gap-3 mb-6">
    <motion.div initial={{ scale: 0.9, rotate: -8 }} animate={{ scale: 1, rotate: -2 }}
      className="text-3xl md:text-4xl font-extrabold">
      <span className="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-sky-400 bg-clip-text text-transparent">Study Buddy</span>
    </motion.div>
    <motion.span initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
      className="text-xs md:text-sm px-2 py-1 rounded-full bg-pink-100/70 dark:bg-pink-300/20 border border-pink-200/60 dark:border-pink-300/20">
      cute • modern • for two 💚
    </motion.span>
  </div>
);

function ModeToggle({ mode, setMode }) {
  const Tab = ({ v, label }) => (
    <button
      onClick={() => setMode(v)}
      className={`px-4 py-2 rounded-xl transition-all border text-sm md:text-base shadow-sm ${
        mode === v
          ? "bg-fuchsia-500 text-white border-fuchsia-500"
          : "bg-white/70 dark:bg-slate-800/60 hover:bg-white border-slate-200 dark:border-slate-700"
      }`}
    >
      {label}
    </button>
  );
  return (
    <div className="flex gap-2">
      <Tab v="flash" label="Flashcards" />
      <Tab v="mcq" label="Multiple Choice" />
    </div>
  );
}

function TextArea({ value, setValue }) {
  return (
    <textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={
        "Paste notes here. Examples:\n\nPhotosynthesis: Process plants use to convert light to chemical energy.\nChlorophyll - Pigment that captures light.\nCalvin Cycle: Stage that synthesizes sugars."}
      className="w-full h-48 md:h-56 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/60 focus:outline-none focus:ring-4 focus:ring-sky-300/40 dark:focus:ring-sky-600/30 shadow-inner"
    />
  );
}

function Stats({ total, done, score = null }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span className="px-3 py-1 rounded-full bg-sky-100/70 dark:bg-sky-300/20 border border-sky-200/60 dark:border-sky-300/20">{done}/{total} done</span>
      {score !== null && (
        <span className="px-3 py-1 rounded-full bg-emerald-100/70 dark:bg-emerald-300/20 border border-emerald-200/60 dark:border-emerald-300/20">score {score}%</span>
      )}
    </div>
  );
}

function Flashcards({ items }) {
  const [idx, setIdx] = useState(0);
  const [show, setShow] = useState(false);
  const total = items.length;
  const next = () => { setShow(false); setIdx((i) => (i + 1) % total); };

  if (!items.length) return <EmptyState />;

  const it = items[idx];
  return (
    <div className="w-full">
      <Stats total={total} done={idx} />
      <div className="h-4" />
      <motion.div layout className="flex flex-col items-center gap-4">
        <Glass className="w-full max-w-3xl p-6">
          <div className="text-center">
            <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Prompt</div>
            <div className="text-xl md:text-2xl font-semibold">{it.term}</div>
          </div>
          <motion.div
            initial={{ rotateX: 90, opacity: 0 }}
            animate={{ rotateX: show ? 0 : 90, opacity: show ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 120 }}
            className="mt-6"
          >
            {show && (
              <div className="text-base md:text-lg leading-relaxed text-center">
                {it.definition}
              </div>
            )}
          </motion.div>
          <div className="mt-6 flex justify-center gap-2">
            <button onClick={() => setShow((s) => !s)} className="px-4 py-2 rounded-xl bg-fuchsia-500 text-white shadow">{show ? "Hide" : "Reveal"}</button>
            <button onClick={next} className="px-4 py-2 rounded-xl bg-sky-500 text-white shadow">Next</button>
          </div>
        </Glass>
      </motion.div>
    </div>
  );
}

function MCQ({ questions }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const total = questions.length;

  if (!questions.length) return <EmptyState />;

  const q = questions[idx];

  const choose = (i) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.correctIndex) setScore((s) => s + 1);
  };

  const next = () => {
    setPicked(null);
    setIdx((i) => Math.min(i + 1, total - 1));
  };

  const done = idx;
  const percent = Math.round((score / total) * 100);

  return (
    <div className="w-full">
      <Stats total={total} done={done} score={percent} />
      <div className="h-4" />
      <Glass className="w-full max-w-3xl p-6">
        <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Question</div>
        <div className="text-xl md:text-2xl font-semibold mb-4">{q.stem}</div>
        <div className="grid gap-3">
          {q.choices.map((c, i) => {
            const isCorrect = i === q.correctIndex;
            const isPicked = picked === i;
            const state = picked === null ? "idle" : isCorrect ? "correct" : isPicked ? "wrong" : "dim";
            const cls = {
              idle: "bg-white/80 dark:bg-slate-800/60 hover:bg-white border-slate-200 dark:border-slate-700",
              correct: "bg-emerald-500 text-white border-emerald-500",
              wrong: "bg-rose-500 text-white border-rose-500",
              dim: "bg-white/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-70",
            }[state];
            return (
              <button key={i} onClick={() => choose(i)}
                className={`text-left px-4 py-3 rounded-xl border transition-all shadow-sm ${cls}`}
              >
                {c}
              </button>
            );
          })}
        </div>
        <AnimatePresence>
          {picked !== null && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4">
              <div className="text-sm md:text-base leading-relaxed p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-300/10 border border-emerald-200/60 dark:border-emerald-300/20">
                <span className="font-semibold">Explanation: </span>
                {q.explanation}
              </div>
              <div className="mt-3 flex justify-end">
                <button onClick={next} className="px-4 py-2 rounded-xl bg-sky-500 text-white shadow">{idx === total - 1 ? "Finish" : "Next"}</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Glass>
    </div>
  );
}

const EmptyState = () => (
  <div className="text-center text-slate-500 dark:text-slate-400">
    Paste some notes above to begin ✨
  </div>
);

// ---------- Main App ----------
export default function App() {
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState("flash"); // 'flash' | 'mcq'

  const cards = useMemo(() => makeCards(notes), [notes]);
  const mcqs = useMemo(() => makeMCQs(cards), [cards]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-fuchsia-50 to-emerald-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <Header />

        <Glass className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <div className="text-lg md:text-xl font-semibold">Paste your notes</div>
              <div className="text-slate-500 dark:text-slate-400 text-sm">Use “Term: Definition” lines for best MCQs. Blank lines separate topics.</div>
            </div>
            <ModeToggle mode={mode} setMode={setMode} />
          </div>
          <div className="mt-4">
            <TextArea value={notes} setValue={setNotes} />
          </div>
        </Glass>

        <div className="h-6" />

        {mode === "flash" ? (
          <Flashcards items={cards} />
        ) : (
          <MCQ questions={mcqs} />
        )}

        <footer className="mt-10 text-center text-xs text-slate-500 dark:text-slate-500">
          Pro-tip: Format like “Term: Definition” for crisp questions. 💡
        </footer>
      </div>
    </div>
  );
}
