# Yakton Daily

A modular, lightweight daily puzzle platform designed for Cloudflare Workers and the custom domain `daily.yakton.net`.

## Included

- Crawlable, separate HTML pages for the home page, game directory, six puzzle experiences, how-to-play, about, and privacy.
- Number Logic, Memory Grid, Pattern Finder, Quick Math, Word Logic, and a combined Daily Challenge.
- Deterministic, versioned UTC daily puzzle selection.
- Local streaks, best streak, completion history, and personal records.
- Shareable text results with clipboard and Web Share API support where available.
- Sitemap, robots.txt, canonical URLs, Open Graph metadata, breadcrumbs, and responsive styling.
- A Cloudflare Worker endpoint for server UTC date and health checks.
- Node built-in tests for deterministic generation and streak rules.

## Requirements

- Node.js 20 or newer
- A Cloudflare account for deployment
- A GitHub repository if you want source control and GitHub-triggered deployment

## Local development

```bash
npm install
npm run check
npm test
npm run dev
```

Wrangler starts a local development server. Open the URL it prints.

## Deploy to Cloudflare Workers

1. Create a GitHub repository and upload these files.
2. In a terminal in the project directory, run `npm install`.
3. Authenticate with Cloudflare: `npx wrangler login`.
4. Run `npm run deploy`.
5. In Cloudflare, open the Worker named `yakton-daily`, add the custom domain `daily.yakton.net`, and follow the DNS/TLS prompts. If the domain is managed in another account, make sure its zone is available to the same Cloudflare account.
6. Visit `https://daily.yakton.net/robots.txt` and `https://daily.yakton.net/sitemap.xml`.
7. In Google Search Console, add the domain property, verify ownership using the method Google provides, and submit `https://daily.yakton.net/sitemap.xml`.

For GitHub-based deployment, configure a GitHub Actions workflow with Cloudflare API credentials stored as repository secrets; never commit tokens. The simplest initial deployment is via Wrangler CLI. This project does not claim that a deployment has already happened.

## Architecture

- `public/`: static, crawlable pages and assets.
- `public/games/`: separate HTML pages for each puzzle.
- `public/js/`: browser-side modules.
- `src/worker.js`: small Worker API and static asset fallback.
- `tests/`: deterministic logic and streak tests.

## Daily puzzle integrity

Daily seeds use UTC dates and a versioned hash. All players get the same puzzle inputs for a given UTC date and algorithm version. Since this is a static client-side puzzle platform, puzzle answers are not suitable for high-stakes competitions: client-side puzzle logic can be inspected. The optional Worker API exposes the current UTC date, but this starter does not implement a leaderboard or claim anti-cheat security.

## Data and privacy

Progress is stored in the visitor's browser via localStorage. It does not synchronize between devices and can be erased by clearing browser data. No account is required. No analytics or third-party advertising scripts are included.

## Test status

Run `npm run check` and `npm test` locally. Tests cover deterministic seed generation and streak calculations. Browser automation, Lighthouse, live Cloudflare deployment, Google indexing, and cross-device testing have not been run by this project-generation step.
