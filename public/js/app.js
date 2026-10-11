import { utcDate, nextUtcReset } from "./daily.js";
import { loadProgress, saveProgress, completeDaily } from "./progress.js";
import { createPuzzle, checkAnswer } from "./games.js";

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const date = utcDate();
let progress = loadProgress();
const mode = document.body.dataset.game;
const feedback = $("#feedback");
function say(message, error=false) {
  if (!feedback) return;
  feedback.textContent = message;
  feedback.classList.toggle("error", error);
}
function updateStats() {
  $("#current-streak") && ($("#current-streak").textContent = progress.currentStreak);
  $("#best-streak") && ($("#best-streak").textContent = progress.bestStreak);
  $("#completed-count") && ($("#completed-count").textContent = progress.completedDates.length);
  $("#today-label") && ($("#today-label").textContent = date);
}
function countdown() {
  const target = nextUtcReset();
  const tick = () => {
    const ms = Math.max(0,target-Date.now());
    const h = String(Math.floor(ms/3600000)).padStart(2,"0");
    const m = String(Math.floor(ms%3600000/60000)).padStart(2,"0");
    const s = String(Math.floor(ms%60000/1000)).padStart(2,"0");
    const node = $("#countdown");
    if (node) node.textContent = `${h}:${m}:${s}`;
    if (utcDate() !== date) location.reload();
  };
  tick(); setInterval(tick,1000);
}
function shareText(title, detail="Completed") {
  return `Yakton Daily — ${date}\n${title}: ${detail}\nCan you beat today's challenge? https://daily.yakton.net/`;
}
async function share(text) {
  if (navigator.share) { try { await navigator.share({title:"Yakton Daily",text}); return; } catch(e) { if(e.name==="AbortError") return; } }
  try { await navigator.clipboard.writeText(text); say("Result copied. Share it with a friend!"); }
  catch { say(text); }
}
$("#share-button")?.addEventListener("click", () => share(shareText("Daily Challenge", "Try it yourself")));
$("#search-games")?.addEventListener("input", e => {
  const q=e.target.value.toLowerCase();
  $$(".card[data-search]").forEach(card => card.classList.toggle("hide",!card.dataset.search.includes(q)));
});
countdown(); updateStats();

const puzzle = mode ? createPuzzle(mode,date) : null;
let solved = false;
function markModeComplete(score=1) {
  const key = `${date}:${mode}`;
  progress.history[key] = { solved:true, score };
  progress.records[mode] = Math.max(progress.records[mode] || 0, score);
  saveProgress(progress);
}
function renderNumber() {
  $("#game-content").innerHTML = `<p>Find the next number in the sequence.</p><div class="sequence">${puzzle.values.join(" · ")} · ?</div><p class="muted">Enter a number. You can use a hint if you get stuck.</p><div class="answer-row"><input id="answer" inputmode="numeric" aria-label="Your answer" placeholder="Next number"><button id="submit-answer">Check</button></div><button class="secondary" id="hint-button" style="margin-top:10px">Hint</button>`;
  $("#hint-button").onclick=()=>say(puzzle.hint);
  $("#submit-answer").onclick=()=>{if(checkAnswer(mode,puzzle,$("#answer").value)){solved=true;say(`Correct! ${puzzle.explain}`);markModeComplete(1);$("#submit-answer").disabled=true;}else say("Not quite — try again or use a hint.",true);};
}
function renderPattern() {
  $("#game-content").innerHTML = `<p>Which item belongs in the missing spot?</p><div class="symbol-grid">${puzzle.values.map(v=>`<div class="symbol ${v==="?"?"missing":""}">${v}</div>`).join("")}</div><div class="answer-row"><input id="answer" aria-label="Missing item" placeholder="Your answer"><button id="submit-answer">Check</button></div>`;
  $("#submit-answer").onclick=()=>{if(checkAnswer(mode,puzzle,$("#answer").value)){solved=true;say(`Correct! ${puzzle.explain}`);markModeComplete(1);}else say("Try again.",true);};
}
function renderWord() {
  $("#game-content").innerHTML = `<p>Unscramble the letters and match the clue.</p><div class="sequence">${puzzle.scrambled.split("").join(" ")}</div><p class="muted">${puzzle.clue}</p><div class="answer-row"><input id="answer" aria-label="Unscrambled word" placeholder="Your word"><button id="submit-answer">Check</button></div>`;
  $("#submit-answer").onclick=()=>{if(checkAnswer(mode,puzzle,$("#answer").value)){solved=true;say(`Correct! The word is ${puzzle.answer}.`);markModeComplete(1);}else say("Not quite — rearrange the letters and try again.",true);};
}
function renderMemory() {
  $("#game-content").innerHTML = `<p>Memorize the green squares, then select them after they disappear.</p><div class="memory-grid" id="memory-grid">${Array.from({length:16},(_,i)=>`<button class="memory-cell" data-cell="${i}" aria-label="Grid cell ${i+1}"></button>`).join("")}</div><button id="start-memory">Show pattern</button> <button class="secondary" id="check-memory">Check pattern</button>`;
  const cells=$$(".memory-cell");
  let shown=false;
  const show=()=>{shown=true;cells.forEach((c,i)=>c.classList.toggle("on",puzzle.cells.includes(i)));setTimeout(()=>{cells.forEach(c=>c.classList.remove("on"));shown=false;say("Now select the remembered squares.");},1400);};
  $("#start-memory").onclick=show;
  cells.forEach(c=>c.onclick=()=>{if(!shown)c.classList.toggle("selected");});
  $("#check-memory").onclick=()=>{const selected=cells.filter(c=>c.classList.contains("selected")).map(c=>Number(c.dataset.cell)).sort((a,b)=>a-b);const target=[...puzzle.cells].sort((a,b)=>a-b);if(selected.join(",")===target.join(",")){say("Perfect memory! You found every square.");markModeComplete(1);}else say("Not quite. Press Show pattern to try again.",true);};
}
function renderMath() {
  $("#game-content").innerHTML = `<p>Solve all five questions. Your score is the number correct.</p><div id="math-questions"></div><button id="submit-math">Check answers</button>`;
  $("#math-questions").innerHTML=puzzle.questions.map((q,i)=>`<div class="answer-row"><label style="min-width:100px" for="math-${i}">${i+1}. ${q.q} =</label><input id="math-${i}" inputmode="numeric" aria-label="Answer ${i+1}" placeholder="?"></div>`).join("");
  $("#submit-math").onclick=()=>{const score=puzzle.questions.filter((q,i)=>Number($(`#math-${i}`).value)===q.answer).length;say(`You scored ${score}/5. ${score===5?"Perfect round!":"Practice makes progress."}`);markModeComplete(score);};
}
if (mode && $("#game-content")) {
  if (mode==="number-logic") renderNumber();
  else if(mode==="pattern-finder") renderPattern();
  else if(mode==="word-logic") renderWord();
  else if(mode==="memory-grid") renderMemory();
  else if(mode==="quick-math") renderMath();
  else if(mode==="daily-challenge") {
    $("#game-content").innerHTML=`<p>Complete four short rounds to finish today's challenge.</p><ol>${puzzle.modes.map(m=>`<li><a href="/games/${m}/">${m.replaceAll("-"," ")}</a></li>`).join("")}</ol><p>Open each round, then return here to mark your daily challenge complete.</p><button id="complete-daily">Mark daily challenge complete</button>`;
    $("#complete-daily").onclick=()=>{
      const done=puzzle.modes.every(m=>progress.history[`${date}:${m}`]?.solved);
      if(!done){say("Finish each of the four linked puzzle modes first.",true);return;}
      progress=completeDaily(progress,date,{perfect:true});
      saveProgress(progress);updateStats();say("Daily challenge complete! Your streak has been updated.");
      $("#complete-daily").disabled=true;
      $("#share-button")?.classList.remove("hide");
    };
  }
}
