// Generates the crawlable HTML pages from the game registry: node scripts/build.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { GAMES } from "../public/js/games.js";
const root = new URL("../public/", import.meta.url).pathname, SITE = "https://daily.yakton.net";
const ids = Object.keys(GAMES);
const write = (p, html) => { mkdirSync(root + p.replace(/[^/]*$/, ""), { recursive: true }); writeFileSync(root + p, html); };
const head = (title, desc, path, game = "") => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><meta name="description" content="${desc}"><link rel="canonical" href="${SITE}${path}">
<meta property="og:type" content="website"><meta property="og:title" content="${title}"><meta property="og:description" content="${desc}"><meta property="og:url" content="${SITE}${path}"><meta name="theme-color" content="#0b0d0c">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"Yakton Daily","url":"${SITE}/"}</script>
<link rel="stylesheet" href="/css/site.css"><script type="module" src="/js/app.js"></script></head>
<body${game ? ` data-game="${game}"` : ""}><header><a class="brand" href="/" aria-label="Yakton Daily home"><span class="brand-mark">Y</span>akton Daily</a><nav aria-label="Main navigation"><a href="/daily-challenge/">Daily Challenge</a><a href="/games/">All Games</a><a href="/how-to-play/">How to Play</a><a href="/about/">About</a></nav></header><main class="wrap">`;
const foot = `</main><footer><span>© 2026 Yakton Daily · Fresh puzzles at 00:00 UTC</span><nav aria-label="Footer navigation"><a href="/games/">Games</a><a href="/privacy/">Privacy</a><a href="/about/">About</a></nav></footer></body></html>`;
const card = id => { const g = GAMES[id]; return `<a class="card" data-card="${id}" style="--hue:${g.hue}" data-search="${g.title.toLowerCase()} ${g.blurb.toLowerCase()}" href="/games/${id}/"><span class="icon" aria-hidden="true">${g.icon}</span><h3>${g.title}</h3><p>${g.blurb}</p><span class="arrow">Play →</span></a>`; };
const crumb = t => `<div class="breadcrumb"><a href="/">Home</a> / <a href="/games/">Games</a> / ${t}</div>`;

write("index.html", head("Yakton Daily — A New Puzzle Every Day", "Play original daily brain games, build a streak, and challenge your friends.", "/") +
`<section class="hero"><div class="eyebrow">Your daily brain break · <span id="today-label"></span></div><h1>A fresh puzzle.<br><span class="brand-mark">Every day.</span></h1><p>${ids.length} original mini-games, a different mix every day. No account, no ads. Play in seconds and keep your streak.</p><div class="actions"><a class="button big" id="play-next" href="/daily-challenge/">▶ Play today's challenge</a><a class="button secondary big" href="/games/">All games</a></div><p class="muted">New puzzles in <span id="countdown" class="countdown">--:--:--</span></p></section>
<div class="stats"><div class="stat"><strong id="current-streak">0</strong><span>🔥 Current streak</span></div><div class="stat"><strong id="best-streak">0</strong><span>Best streak</span></div><div class="stat"><strong id="completed-count">0</strong><span>Days completed</span></div></div>
<div class="section-head"><h2>Today's challenge</h2><span class="muted" id="today-progress"></span></div><div class="today-strip" id="today-strip"></div>
<div class="section-head"><h2>Every daily puzzle</h2><a href="/games/" class="muted">Directory →</a></div><div class="grid">${ids.map(card).join("")}</div>
<section class="prose"><h2>How Yakton Daily works</h2><p>Everyone gets the same puzzles on a given UTC date. Each day four games are picked for the Daily Challenge; finish them all to extend your streak. Progress is stored in this browser only.</p></section>` + foot);

write("games/index.html", head("All Games | Yakton Daily", "Explore daily number, memory, pattern, math, word, colour and logic puzzles.", "/games/") +
`${crumb("All Games")}<section class="hero"><div class="eyebrow">Puzzle directory</div><h1>Find your next <span class="brand-mark">challenge.</span></h1><p>Every game has a new puzzle each day.</p><div class="answer-row"><input id="search-games" placeholder="Search games…" aria-label="Search games"></div></section><div class="grid">${ids.map(card).join("")}</div>` + foot);

ids.forEach(id => { const g = GAMES[id]; write(`games/${id}/index.html`, head(`${g.title} — Daily Puzzle | Yakton Daily`, g.blurb, `/games/${id}/`, id) +
`${crumb(g.title)}<section class="hero compact" style="--hue:${g.hue}"><div class="eyebrow">Daily puzzle</div><h1><span class="hero-icon" aria-hidden="true">${g.icon}</span> ${g.title}</h1><p>${g.blurb}</p></section>
<section class="game-layout"><div class="game-panel" style="--hue:${g.hue}"><div id="game-content" class="game-area"><p>Loading today's puzzle…</p></div><div id="feedback" class="feedback" role="status" aria-live="polite">Ready when you are.</div><div id="result" class="result hide"></div></div>
<aside class="game-panel"><h2>How to play</h2><p>${g.how}</p><p class="muted">New puzzle in <span id="countdown" class="countdown">--:--:--</span>. Progress is saved in this browser.</p><h3>More games</h3><ul class="related">${ids.filter(x => x !== id).slice(0, 4).map(x => `<li><a href="/games/${x}/">${GAMES[x].icon} ${GAMES[x].title}</a></li>`).join("")}</ul></aside></section>` + foot); });

write("daily-challenge/index.html", head("Daily Challenge | Yakton Daily", "Today's four puzzles in one run. Finish them all to extend your streak.", "/daily-challenge/", "daily-challenge") +
`${crumb("Daily Challenge")}<section class="hero compact"><div class="eyebrow">Daily Challenge <span id="today-label"></span></div><h1>Four puzzles. <span class="brand-mark">One streak.</span></h1><p>Play them back to back right here. A different mix every day.</p></section>
<div class="stepper" id="stepper"></div><section class="game-layout single"><div class="game-panel"><div id="game-content" class="game-area"></div><div id="feedback" class="feedback" role="status" aria-live="polite">Ready when you are.</div><div id="result" class="result hide"></div></div></section>` + foot);

write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${["/", "/games/", ...ids.map(i => `/games/${i}/`), "/daily-challenge/", "/how-to-play/", "/about/", "/privacy/"].map(p => `  <url><loc>${SITE}${p}</loc></url>`).join("\n")}\n</urlset>\n`);
console.log("built", ids.length, "games");
