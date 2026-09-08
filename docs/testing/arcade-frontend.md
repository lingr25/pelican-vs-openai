# Arcade frontend verification

Source: user requested review and redesign of the merged frontend, replacing the blue palette with a classic bullet-hell presentation.

The page now separates markup (`index.html`), presentation (`style.css`), and game code (`game.js`). `npm run build` embeds all three plus existing local media into `portable.html`.

## Regression evidence

`npm test` runs six Chromium browser tests through Node's test runner. Install development dependencies with `npm ci`; install the test browser with `npx playwright install chromium` if it is not already available.

| User-visible guarantee | Before | After |
| --- | --- | --- |
| Combat buttons only appear during combat; retry works | Buttons visible over menu | PASS |
| Space activates a focused character button without starting combat | Started combat | PASS |
| Dash respects cooldown and pause | Two calls produced two effects | PASS |
| Short phone screens can reach both menu top and start button | Baseline passed; retained after redesign | PASS |
| Portable version supports clear-screen, victory, and restart | Baseline passed; retained after extraction | PASS |
| HUD updates time and quota without a forced refresh | Timer stayed at 0:00 | PASS |

RED checkpoints: `a9f4a22` (three interaction failures), `6c6bb86` (stalled HUD reproducer). Final `npm test`: 6 passed, 0 failed. `node --check game.js` and `git diff --check` also passed.

## Visual and offline checks

Headless Chromium screenshots were inspected at 1440×1000, 390×844, 320×568, and 844×390. The menu scrolls on short screens; HUD components remain inside the viewport. Victory, defeat, return to character selection, and warm battle effects were checked. Local QA artifacts are ignored under `test-results/`.

Opening `portable.html` via `file://` reached gameplay with zero HTTP requests. The extended scenario exercised Fable, DeepSeek, dash, clear-screen, pause/resume, results, and return to menu with zero page errors.

V8 executed-character coverage for the seven edited named functions (`resize`, `selectCharacter`, `updateCharUI`, `triggerDash`, `show`, `updateMenuBest`, `updateHUD`) was 97.1% in the extended scenario. This is scoped function coverage, not whole-game line or branch coverage. Random combat patterns, every historical mechanic, Safari, and physical touch hardware were not exhaustively tested.

Visual references consulted: [CAVE's DoDonPachi site](https://www.cave.co.jp/gameonline/saidaioujou/story/) and [TAITO's Ray series](https://www.taito.co.jp/rayzarcadechronology/title). The title illustration is original inline vector artwork; game assets remain local.
