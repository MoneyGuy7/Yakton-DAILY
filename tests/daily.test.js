import test from "node:test";
import assert from "node:assert/strict";
import { dailySeed, seededRandom, utcDate, nextUtcReset } from "../public/js/daily.js";
import { createPuzzle } from "../public/js/games.js";
import { blankProgress, completeDaily } from "../public/js/progress.js";

test("daily seed is deterministic and mode-specific", () => {
  assert.equal(dailySeed("2026-10-11","number-logic"), dailySeed("2026-10-11","number-logic"));
  assert.notEqual(dailySeed("2026-10-11","number-logic"), dailySeed("2026-10-12","number-logic"));
  assert.notEqual(dailySeed("2026-10-11","number-logic"), dailySeed("2026-10-11","word-logic"));
});
test("seeded random is reproducible", () => {
  const a=seededRandom(42), b=seededRandom(42);
  assert.deepEqual([a(),a(),a()],[b(),b(),b()]);
});
test("daily puzzles are stable for the same date", () => {
  assert.deepEqual(createPuzzle("number-logic","2026-10-11"),createPuzzle("number-logic","2026-10-11"));
});
test("UTC date and next reset behave at a date boundary", () => {
  const now=new Date("2026-10-11T23:59:59.000Z");
  assert.equal(utcDate(now),"2026-10-11");
  assert.equal(nextUtcReset(now).toISOString(),"2026-10-12T00:00:00.000Z");
});
test("daily streak increments only on consecutive dates and duplicate completion is ignored", () => {
  let p=blankProgress();
  p=completeDaily(p,"2026-10-10",{});
  p=completeDaily(p,"2026-10-11",{});
  assert.equal(p.currentStreak,2);
  p=completeDaily(p,"2026-10-11",{});
  assert.equal(p.currentStreak,2);
  p=completeDaily(p,"2026-10-13",{});
  assert.equal(p.currentStreak,1);
  assert.equal(p.bestStreak,2);
});
