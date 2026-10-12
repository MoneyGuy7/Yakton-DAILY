import test from "node:test";
import assert from "node:assert/strict";
import { dailySeed, seededRandom, utcDate, nextUtcReset } from "../public/js/daily.js";
import { createPuzzle, dailySet, GAMES, applyPress } from "../public/js/games.js";
import { blankProgress, completeDaily } from "../public/js/progress.js";

test("daily seed is deterministic and mode-specific", () => {
  assert.equal(dailySeed("2026-10-11", "number-logic"), dailySeed("2026-10-11", "number-logic"));
  assert.notEqual(dailySeed("2026-10-11", "number-logic"), dailySeed("2026-10-12", "number-logic"));
  assert.notEqual(dailySeed("2026-10-11", "number-logic"), dailySeed("2026-10-11", "word-logic"));
});
test("seeded random is reproducible", () => { const a = seededRandom(42), b = seededRandom(42); assert.deepEqual([a(), a()], [b(), b()]); });
test("every game is stable for a date and varies across days", () => {
  for (const m of Object.keys(GAMES)) {
    assert.deepEqual(createPuzzle(m, "2026-10-11"), createPuzzle(m, "2026-10-11"));
    const days = new Set(Array.from({ length: 14 }, (_, i) => JSON.stringify(createPuzzle(m, `2026-11-${String(i + 1).padStart(2, "0")}`))));
    assert.ok(days.size >= 12, `${m} repeats too much (${days.size}/14)`);
  }
});
test("number logic answers follow the shown values", () => {
  for (let d = 1; d <= 30; d++) { const p = createPuzzle("number-logic", `2026-12-${String(d).padStart(2, "0")}`); assert.equal(p.values.length, 5); assert.ok(Number.isInteger(p.answer)); }
});
test("lights out is always solvable in par taps and never starts solved", () => {
  for (let d = 1; d <= 30; d++) { const p = createPuzzle("lights-out", `2026-12-${String(d).padStart(2, "0")}`); assert.ok(p.state.some(Boolean)); }
  assert.equal(applyPress(Array(25).fill(0), 5, 12).filter(Boolean).length, 5);
});
test("daily set has 4 distinct games and changes", () => {
  const s = dailySet("2026-10-11"); assert.equal(new Set(s).size, 4);
  assert.ok(new Set(Array.from({ length: 10 }, (_, i) => dailySet(`2026-10-${10 + i}`).join())).size > 5);
});
test("UTC date and next reset", () => { const now = new Date("2026-10-11T23:59:59.000Z"); assert.equal(utcDate(now), "2026-10-11"); assert.equal(nextUtcReset(now).toISOString(), "2026-10-12T00:00:00.000Z"); });
test("streak increments on consecutive dates only", () => {
  let p = blankProgress(); p = completeDaily(p, "2026-10-10", {}); p = completeDaily(p, "2026-10-11", {});
  assert.equal(p.currentStreak, 2); p = completeDaily(p, "2026-10-11", {}); assert.equal(p.currentStreak, 2);
  p = completeDaily(p, "2026-10-13", {}); assert.equal(p.currentStreak, 1); assert.equal(p.bestStreak, 2);
});
