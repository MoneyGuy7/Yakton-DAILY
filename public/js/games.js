import { dailySeed, seededRandom } from "./daily.js";

export const GAMES = {
  "number-logic": { title: "Number Logic", icon: "🧩", hue: 140, blurb: "Find the rule and predict the next number.", how: "Work out the rule behind the numbers and type the next one. A different kind of rule shows up each day." },
  "pattern-finder": { title: "Pattern Finder", icon: "◈", hue: 200, blurb: "Tap the symbol that completes the pattern.", how: "A pattern of symbols repeats. Tap the one that belongs in the missing spot." },
  "quick-math": { title: "Quick Math", icon: "＋", hue: 40, blurb: "Five mental-maths questions, one at a time.", how: "Answer five questions. Press Enter to submit and jump to the next. Difficulty changes daily." },
  "word-logic": { title: "Word Logic", icon: "Aa", hue: 290, blurb: "Unscramble the word from its category.", how: "Rearrange the letters to spell a word from the category shown. Use the hint to reveal the first letter." },
  "memory-grid": { title: "Memory Grid", icon: "▦", hue: 170, blurb: "Remember the lit squares, then rebuild them.", how: "Press Show pattern, memorise the lit squares, then tap them from memory. Grid size changes daily." },
  "odd-tile": { title: "Odd Tile", icon: "◐", hue: 340, blurb: "Spot the tile with a slightly different shade.", how: "Five rounds. Each grid has one tile with a slightly different shade. Tap it. Rounds get trickier." },
  "lights-out": { title: "Lights Out", icon: "💡", hue: 55, blurb: "Tap to toggle a light and its neighbours. Turn all off.", how: "Tapping a light flips it and its four neighbours. Switch every light off, using as few taps as you can." }
};
export const dayNumber = d => Math.floor(Date.parse(d + "T00:00:00Z") / 864e5);

export function dailySet(date) {
  const r = seededRandom(dailySeed(date, "set")), ids = Object.keys(GAMES);
  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  return ids.slice(0, 4);
}
const WORDS = "APPLE:Fruit,LEMON:Fruit,MANGO:Fruit,GRAPE:Fruit,PEACH:Fruit,TIGER:Animal,ZEBRA:Animal,HORSE:Animal,EAGLE:Animal,PANDA:Animal,SHARK:Animal,RIVER:Nature,OCEAN:Nature,CLOUD:Nature,STORM:Nature,BEACH:Nature,FOREST:Nature,PIZZA:Food,BREAD:Food,PASTA:Food,SALAD:Food,HONEY:Food,CANDY:Food,CHAIR:Home,TABLE:Home,LAMP:Home,WINDOW:Home,BLANKET:Home,GUITAR:Music,PIANO:Music,DRUMS:Music,VIOLIN:Music,ROBOT:Tech,MOUSE:Tech,CLOCK:Tech,PHONE:Tech,SOCCER:Sport,TENNIS:Sport,HOCKEY:Sport,GOLF:Sport,PLANET:Space,COMET:Space,ORBIT:Space,ROCKET:Space,SUNSET:Sky,WINTER:Season,SUMMER:Season,AUTUMN:Season".split(",").map(s => s.split(":"));

export function applyPress(state, size, i) {
  const s = [...state], x = i % size, y = Math.floor(i / size);
  [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
    const nx = x + dx, ny = y + dy;
    if (nx >= 0 && nx < size && ny >= 0 && ny < size) s[ny * size + nx] ^= 1;
  });
  return s;
}
export function createPuzzle(mode, date = new Date().toISOString().slice(0, 10)) {
  const rand = seededRandom(dailySeed(date, mode)), n = dayNumber(date);
  const int = (a, b) => a + Math.floor(rand() * (b - a + 1));
  const pick = a => a[Math.floor(rand() * a.length)];
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  if (mode === "number-logic") {
    const k = n % 6, i6 = [0, 1, 2, 3, 4, 5]; let v, hint, explain;
    if (k === 0) { const a = int(2, 20), d = int(2, 9); v = i6.map(i => a + d * i); hint = "The same amount is added each time."; explain = `Add ${d} each time.`; }
    else if (k === 1) { const a = int(1, 5), r = int(2, 3); v = i6.map(i => a * r ** i); hint = "Each term is multiplied by the same number."; explain = `Multiply by ${r} each time.`; }
    else if (k === 2) { const s = int(1, 6), c = int(0, 4); v = i6.map(i => (i + s) ** 2 + c); hint = "Think of square numbers, shifted."; explain = `Square numbers (${s}², ${s + 1}², …)${c ? " plus " + c : ""}.`; }
    else if (k === 3) { const a = int(3, 8), b = int(1, 2), s = int(3, 12); v = [s]; for (let i = 1; i < 6; i++) v.push(v[i - 1] + (i % 2 ? a : -b)); hint = "Two different steps alternate."; explain = `Add ${a}, then subtract ${b}, repeating.`; }
    else if (k === 4) { v = [int(1, 6), int(1, 6)]; for (let i = 2; i < 6; i++) v.push(v[i - 1] + v[i - 2]); hint = "Use the two previous numbers."; explain = "Each number is the sum of the previous two."; }
    else { const a = int(1, 9), d = int(1, 3), s = int(1, 2); v = [a]; for (let i = 1; i < 6; i++) v.push(v[i - 1] + d + s * (i - 1)); hint = "Look at the differences between numbers."; explain = `The gap grows by ${s} each step.`; }
    return { values: v.slice(0, 5), answer: v[5], hint, explain };
  }
  if (mode === "pattern-finder") {
    const shapes = ["▲", "●", "■", "◆", "★", "♥"], cyc = 2 + n % 3, base = shuffle(shapes).slice(0, cyc);
    const seq = Array.from({ length: 8 }, (_, i) => base[i % cyc]), answer = seq[7];
    return { values: [...seq.slice(0, 7), "?"], answer, options: shuffle([answer, ...shuffle(shapes.filter(s => s !== answer)).slice(0, 3)]), explain: `The pattern repeats every ${cyc} symbols.` };
  }
  if (mode === "quick-math") {
    const lvl = n % 3, questions = [];
    for (let i = 0; i < 5; i++) {
      const op = pick(["+", "−", "×"]); let a, b, answer;
      if (op === "×") { a = int(3, 9 + lvl * 3); b = int(3, 9 + lvl * 2); answer = a * b; }
      else if (op === "+") { a = int(12, 60 + lvl * 40); b = int(8, 50 + lvl * 30); answer = a + b; }
      else { a = int(30, 90 + lvl * 60); b = int(5, a - 5); answer = a - b; }
      questions.push({ q: `${a} ${op} ${b}`, answer });
    }
    return { questions };
  }
  if (mode === "word-logic") {
    const [answer, category] = WORDS[n % WORDS.length]; let s = answer;
    for (let t = 0; t < 12 && s === answer; t++) s = shuffle(answer.split("")).join("");
    return { scrambled: s, answer, category, hint: `Starts with ${answer[0]}.` };
  }
  if (mode === "memory-grid") {
    const size = 4 + n % 2, count = 4 + n % 4;
    return { size, cells: shuffle(Array.from({ length: size * size }, (_, i) => i)).slice(0, count) };
  }
  if (mode === "odd-tile") {
    const dims = [2, 3, 3, 4, 5], diffs = [28, 20, 14, 10, 7];
    return { rounds: dims.map((d, r) => ({ n: d, odd: int(0, d * d - 1), h: int(0, 359), diff: diffs[r] * (rand() > .5 ? 1 : -1) })) };
  }
  if (mode === "lights-out") {
    const size = 5, par = 4 + n % 4; let state = Array(25).fill(0);
    shuffle(Array.from({ length: 25 }, (_, i) => i)).slice(0, par).forEach(i => state = applyPress(state, size, i));
    if (!state.some(Boolean)) state = applyPress(state, size, 12);
    return { size, state, par };
  }
  if (mode === "daily-challenge") return { number: n - 20000, modes: dailySet(date) };
  return null;
}
export function checkAnswer(mode, puzzle, answer) {
  const a = String(answer).trim().toUpperCase();
  if (mode === "number-logic") return a === String(puzzle.answer);
  if (mode === "pattern-finder" || mode === "word-logic") return a === String(puzzle.answer).toUpperCase();
  return false;
}
