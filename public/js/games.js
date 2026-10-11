import { dailySeed, seededRandom } from "./daily.js";

const sequences = [
  { values: [3, 6, 9, 12], answer: 15, hint: "The same amount is added each time.", explain: "Add 3 each time." },
  { values: [2, 4, 8, 16], answer: 32, hint: "Each term is multiplied by the same number.", explain: "Double each term." },
  { values: [1, 4, 9, 16], answer: 25, hint: "Think of square numbers.", explain: "These are 1², 2², 3², 4², then 5²." },
  { values: [2, 5, 4, 7, 6], answer: 9, hint: "Two patterns alternate.", explain: "Add 3, then subtract 1, repeating." },
  { values: [1, 1, 2, 3, 5], answer: 8, hint: "Use the two previous numbers.", explain: "Each number is the sum of the previous two." }
];
const patterns = [
  { values: ["▲","●","▲","●","▲","●","▲","?"], answer: "●", explain: "Triangle and circle alternate." },
  { values: ["2","4","8","16","?","64"], answer: "32", explain: "Each number doubles." },
  { values: ["A","C","E","G","?","K"], answer: "I", explain: "Skip one letter each time." },
  { values: ["1","4","9","16","?","36"], answer: "25", explain: "Square numbers: 1² through 6²." }
];
const words = [
  { scrambled: "LPEPA", answer: "APPLE", clue: "A fruit that can be red or green." },
  { scrambled: "NRAI", answer: "RAIN", clue: "Water falling from clouds." },
  { scrambled: "NOLME", answer: "LEMON", clue: "A yellow citrus fruit." },
  { scrambled: "RTAES", answer: "STARE", clue: "To look fixedly at something." },
  { scrambled: "HCTWA", answer: "WATCH", clue: "A small timepiece worn on your wrist." }
];
export function createPuzzle(mode, date = new Date().toISOString().slice(0,10)) {
  const rand = seededRandom(dailySeed(date, mode));
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  if (mode === "number-logic") return pick(sequences);
  if (mode === "pattern-finder") return pick(patterns);
  if (mode === "word-logic") return pick(words);
  if (mode === "memory-grid") {
    const cells = Array.from({length:16}, (_,i)=>i).sort(()=>rand()-.5).slice(0,5);
    return { cells, size: 4, hint: "Remember the highlighted squares." };
  }
  if (mode === "quick-math") {
    const questions = [];
    for (let i=0;i<5;i++) {
      const a = 3 + Math.floor(rand()*18), b = 2 + Math.floor(rand()*12);
      const op = rand() > .5 ? "+" : "×";
      questions.push({ q: `${a} ${op} ${b}`, answer: op === "+" ? a+b : a*b });
    }
    return { questions };
  }
  if (mode === "daily-challenge") return {
    number: 1 + Math.floor(new Date(`${date}T00:00:00Z`).getTime()/86400000),
    modes: ["number-logic","memory-grid","pattern-finder","word-logic"]
  };
  return null;
}
export function checkAnswer(mode, puzzle, answer) {
  const normalized = String(answer).trim().toUpperCase();
  if (mode === "number-logic") return normalized === String(puzzle.answer);
  if (mode === "pattern-finder") return normalized === String(puzzle.answer).toUpperCase();
  if (mode === "word-logic") return normalized === puzzle.answer.toUpperCase();
  return false;
}
export function sequencePuzzles() { return sequences; }
