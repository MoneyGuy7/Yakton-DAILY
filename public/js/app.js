import { utcDate, nextUtcReset } from "./daily.js";
import { loadProgress, saveProgress, completeDaily } from "./progress.js";
import { GAMES, createPuzzle, checkAnswer, dailySet, applyPress } from "./games.js";

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const date = utcDate(), mode = document.body.dataset.game, set = dailySet(date);
let progress = loadProgress();
const isDone = m => !!progress.history[`${date}:${m}`]?.solved;
const say = (msg, err = false) => { const f = $("#feedback"); if (f) { f.textContent = msg; f.classList.toggle("error", err); } };

function updateStats() {
  const put = (id, v) => { const n = $(id); if (n) n.textContent = v; };
  put("#current-streak", progress.currentStreak); put("#best-streak", progress.bestStreak);
  put("#completed-count", progress.completedDates.length); put("#today-label", date);
  $$("[data-card]").forEach(c => { c.classList.toggle("done", isDone(c.dataset.card)); c.classList.toggle("today", set.includes(c.dataset.card)); });
  const strip = $("#today-strip");
  if (strip) {
    strip.innerHTML = set.map(m => `<a class="chip ${isDone(m) ? "done" : ""}" style="--hue:${GAMES[m].hue}" href="/games/${m}/"><span>${GAMES[m].icon}</span>${GAMES[m].title}<b>${isDone(m) ? "✓" : "→"}</b></a>`).join("");
    const n = set.filter(isDone).length; put("#today-progress", `${n}/4 done`);
    const b = $("#play-next"); if (b && n === 4) b.textContent = "✓ Done for today — play more";
  }
}
(function countdown() {
  const target = nextUtcReset(), tick = () => {
    const ms = Math.max(0, target - Date.now()), p = x => String(x).padStart(2, "0");
    $$("#countdown").forEach(n => n.textContent = `${p(Math.floor(ms / 36e5))}:${p(Math.floor(ms % 36e5 / 6e4))}:${p(Math.floor(ms % 6e4 / 1e3))}`);
    if (utcDate() !== date) location.reload();
  };
  tick(); setInterval(tick, 1000);
})();
$("#search-games")?.addEventListener("input", e => { const q = e.target.value.toLowerCase(); $$(".card[data-search]").forEach(c => c.classList.toggle("hide", !c.dataset.search.includes(q))); });

async function share(text) {
  if (navigator.share) { try { await navigator.share({ title: "Yakton Daily", text }); return; } catch (e) { if (e.name === "AbortError") return; } }
  try { await navigator.clipboard.writeText(text); say("Result copied. Paste it to a friend!"); } catch { say(text); }
}
const shareText = lines => `Yakton Daily — ${date}\n${lines.join("\n")}\n🔥 Streak: ${progress.currentStreak}\nhttps://daily.yakton.net/`;

// ---- games: each takes (el, puzzle, finish) and calls finish({score, line}) once ----
const G = {
  "number-logic"(el, p, finish) {
    let tries = 0;
    el.innerHTML = `<p>What number comes next?</p><div class="sequence">${p.values.join(" · ")} · <span class="q">?</span></div><div class="answer-row"><input id="answer" inputmode="numeric" autocomplete="off" aria-label="Your answer" placeholder="Next number"><button id="go">Check</button></div><button class="secondary" id="hint" style="margin-top:10px">💡 Hint</button>`;
    const ans = $("#answer"); ans.focus();
    $("#hint").onclick = () => say(p.hint);
    const go = () => { tries++; if (checkAnswer("number-logic", p, ans.value)) { say(`Correct! ${p.explain}`); finish({ score: 1, line: `Number Logic ✅ ${tries} ${tries === 1 ? "try" : "tries"}` }); } else say("Not quite. Try again or use the hint.", true); };
    $("#go").onclick = go; ans.onkeydown = e => e.key === "Enter" && go();
  },
  "pattern-finder"(el, p, finish) {
    let tries = 0;
    el.innerHTML = `<p>Which symbol completes the pattern?</p><div class="sequence big-seq">${p.values.map(v => `<span class="${v === "?" ? "q" : ""}">${v}</span>`).join("")}</div><div class="options">${p.options.map(o => `<button class="secondary opt" data-o="${o}">${o}</button>`).join("")}</div>`;
    $$(".opt").forEach(b => b.onclick = () => { tries++; if (checkAnswer("pattern-finder", p, b.dataset.o)) { b.classList.add("right"); say(`Correct! ${p.explain}`); finish({ score: 1, line: `Pattern Finder ✅ ${tries} ${tries === 1 ? "try" : "tries"}` }); } else { b.disabled = true; say("Not that one. Try another.", true); } });
  },
  "quick-math"(el, p, finish) {
    let i = 0, score = 0, miss = "";
    const show = () => {
      el.innerHTML = `<div class="pill">Question ${i + 1} of 5</div><div class="sequence">${p.questions[i].q} = ?</div><div class="answer-row"><input id="answer" inputmode="numeric" autocomplete="off" aria-label="Answer" placeholder="Answer"><button id="go">Next →</button></div>`;
      const a = $("#answer"); a.focus();
      const go = () => { const ok = Number(a.value) === p.questions[i].answer && a.value.trim() !== ""; if (ok) score++; miss += ok ? "🟩" : "🟥"; i++; if (i < 5) { say(ok ? "✓ Correct" : `✗ It was ${p.questions[i - 1].answer}`, !ok); show(); } else { say(`You scored ${score}/5. ${score === 5 ? "Perfect round!" : "Nice effort!"}`); finish({ score, line: `Quick Math ${miss} ${score}/5` }); } };
      $("#go").onclick = go; a.onkeydown = e => e.key === "Enter" && go();
    };
    show();
  },
  "word-logic"(el, p, finish) {
    let tries = 0;
    el.innerHTML = `<p>Category: <strong>${p.category}</strong></p><div class="tiles">${p.scrambled.split("").map(c => `<span class="tile">${c}</span>`).join("")}</div><div class="answer-row"><input id="answer" autocomplete="off" autocapitalize="characters" maxlength="${p.answer.length}" aria-label="Unscrambled word" placeholder="${p.answer.length} letters"><button id="go">Check</button></div><button class="secondary" id="hint" style="margin-top:10px">💡 Hint</button>`;
    const a = $("#answer"); a.focus(); $("#hint").onclick = () => say(p.hint);
    const go = () => { tries++; if (checkAnswer("word-logic", p, a.value)) { say(`Correct! The word is ${p.answer}.`); finish({ score: 1, line: `Word Logic ✅ ${tries} ${tries === 1 ? "try" : "tries"}` }); } else say("Not quite. Rearrange the letters and try again.", true); };
    $("#go").onclick = go; a.onkeydown = e => e.key === "Enter" && go();
  },
  "memory-grid"(el, p, finish) {
    let tries = 0, shown = false;
    el.innerHTML = `<p>Memorise the lit squares (${p.cells.length} of them), then tap them from memory.</p><div class="memory-grid" style="--cols:${p.size}">${Array.from({ length: p.size ** 2 }, (_, i) => `<button class="memory-cell" data-cell="${i}" aria-label="Cell ${i + 1}"></button>`).join("")}</div><div class="actions"><button id="show">👁 Show pattern</button><button class="secondary" id="check">Check</button></div>`;
    const cells = $$(".memory-cell");
    $("#show").onclick = () => { if (shown) return; shown = true; cells.forEach(c => c.classList.remove("selected")); cells.forEach((c, i) => c.classList.toggle("on", p.cells.includes(i))); setTimeout(() => { cells.forEach(c => c.classList.remove("on")); shown = false; say("Now tap the squares you remember."); }, 1800 + p.cells.length * 150); };
    cells.forEach(c => c.onclick = () => { if (!shown) c.classList.toggle("selected"); });
    $("#check").onclick = () => { tries++; const sel = cells.filter(c => c.classList.contains("selected")).map(c => +c.dataset.cell).sort((a, b) => a - b); if (sel.join() === [...p.cells].sort((a, b) => a - b).join()) { say("Perfect memory!"); finish({ score: 1, line: `Memory Grid ✅ ${tries} ${tries === 1 ? "try" : "tries"}` }); } else say("Not quite. Press Show pattern to peek again.", true); };
  },
  "odd-tile"(el, p, finish) {
    let r = 0, score = 0, marks = "";
    const show = () => {
      const o = p.rounds[r];
      el.innerHTML = `<div class="pill">Round ${r + 1} of 5</div><div class="odd-grid" style="--cols:${o.n}">${Array.from({ length: o.n * o.n }, (_, i) => `<button class="odd" aria-label="Tile ${i + 1}" data-i="${i}" style="background:hsl(${o.h} 65% ${i === o.odd ? 50 + o.diff : 50}%)"></button>`).join("")}</div>`;
      $$(".odd").forEach(b => b.onclick = () => { const ok = +b.dataset.i === o.odd; if (ok) score++; marks += ok ? "🟩" : "🟥"; r++; if (r < 5) { say(ok ? "✓ Sharp eyes!" : "✗ Missed that one", !ok); show(); } else { say(`You found ${score}/5.`); finish({ score, line: `Odd Tile ${marks} ${score}/5` }); } });
    };
    show();
  },
  "lights-out"(el, p, finish) {
    let state = p.state, moves = 0;
    const draw = () => { el.innerHTML = `<p>Turn every light off. Par: <strong>${p.par}</strong> taps · Taps: <strong>${moves}</strong></p><div class="lights" style="--cols:${p.size}">${state.map((v, i) => `<button class="light ${v ? "on" : ""}" data-i="${i}" aria-label="Light ${i + 1} ${v ? "on" : "off"}"></button>`).join("")}</div><div class="actions"><button class="secondary" id="reset">↺ Restart</button></div>`;
      $$(".light").forEach(b => b.onclick = () => { state = applyPress(state, p.size, +b.dataset.i); moves++; if (!state.some(Boolean)) { draw(); $$(".light").forEach(x => x.disabled = true); say(`Solved in ${moves} taps!`); finish({ score: 1, line: `Lights Out ✅ ${moves} taps (par ${p.par})` }); } else draw(); });
      $("#reset").onclick = () => { state = p.state; moves = 0; draw(); }; };
    draw();
  }
};

function mount(m, el, onDone) {
  let done = false;
  el.innerHTML = "";
  G[m](el, createPuzzle(m, date), res => {
    if (done) return; done = true;
    progress.history[`${date}:${m}`] = { solved: true, score: res.score, line: res.line };
    progress.records[m] = Math.max(progress.records[m] || 0, res.score);
    if (set.every(isDone) && !progress.completedDates.includes(date)) progress = completeDaily(progress, date, { perfect: false });
    saveProgress(progress); updateStats(); onDone(res);
  });
}
const nextFor = m => set.find(x => x !== m && !isDone(x));

if (mode && mode !== "daily-challenge" && G[mode]) {
  const box = $("#result");
  const showResult = res => {
    const nx = nextFor(mode), left = set.filter(x => !isDone(x)).length;
    box.classList.remove("hide");
    box.innerHTML = `<h3>🎉 Solved!</h3><p>${set.includes(mode) ? (left ? `${left} more in today's challenge.` : "Daily challenge complete — streak updated! 🔥") : "Bonus puzzle done."}</p><div class="actions"><button id="share">Share result</button>${nx ? `<a class="button secondary" href="/games/${nx}/">Next: ${GAMES[nx].title} →</a>` : `<a class="button secondary" href="/games/">More games →</a>`}</div>`;
    $("#share").onclick = () => share(shareText([res.line]));
  };
  if (isDone(mode)) { $("#game-content").innerHTML = `<p>You've already solved today's ${GAMES[mode].title}. 🎉 Come back after the reset for a new one.</p>`; showResult(progress.history[`${date}:${mode}`]); }
  else mount(mode, $("#game-content"), showResult);
}
if (mode === "daily-challenge") {
  const box = $("#result"), area = $("#game-content");
  const draw = cur => { $("#stepper").innerHTML = set.map((m, i) => `<span class="step ${isDone(m) ? "done" : ""} ${i === cur ? "current" : ""}" style="--hue:${GAMES[m].hue}">${isDone(m) ? "✓" : GAMES[m].icon} ${GAMES[m].title}</span>`).join(""); };
  const finishAll = () => {
    draw(-1); area.innerHTML = `<h2>🎉 Challenge complete!</h2><p>Streak: <strong>${progress.currentStreak}</strong> 🔥 · Best: ${progress.bestStreak}. New puzzles in <span class="countdown" id="countdown">--:--:--</span>.</p>`;
    box.classList.remove("hide"); box.innerHTML = `<div class="actions"><button id="share">Share results</button><a class="button secondary" href="/games/">Play bonus games →</a></div>`;
    $("#share").onclick = () => share(shareText(set.map(m => progress.history[`${date}:${m}`]?.line || GAMES[m].title)));
  };
  const step = () => {
    const m = set.find(x => !isDone(x)); box.classList.add("hide");
    if (!m) return finishAll();
    draw(set.indexOf(m)); say(`Round ${set.indexOf(m) + 1} of 4: ${GAMES[m].title}. ${GAMES[m].blurb}`);
    mount(m, area, () => { draw(-1); box.classList.remove("hide"); box.innerHTML = `<div class="actions"><button id="nxt">${set.every(isDone) ? "Finish 🎉" : "Next puzzle →"}</button></div>`; $("#nxt").onclick = step; $("#nxt").focus(); });
  };
  step();
}
updateStats();
