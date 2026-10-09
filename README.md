# Bluff with friends — GitHub + Render
# Check out my app at - https://bluff-game-25ac.onrender.com

An independent four-mode bluffing party game for 2–10 players, with avatars, scores, table chat, phase timers, and practice bots. No account, API key, paid AI service, or database is needed.

## What is in the question bank?

| Pack | Count | Contents |
| --- | ---: | --- |
| Community trivia | 20,129 | Filtered OpenTriviaQA questions across 18 subjects |
| Odd facts | 20 | Individually sourced animal and space questions |
| Strange words | 24 | Dictionary-based meanings |
| Original funny prompts | 300 | Fully written prompts, including ones about players |
| Funny scenario remixes | 2,000 | 100 fictional settings × 20 writing tasks |
| About your friends | 500 | Original questions about the human players at the table |
| Search history | 500 | Individually written fictional situations across ten themes |
| Total playable entries | 23,473 | Includes the separately counted remix combinations |

Version 1.4 adds Search History as a fourth mode and expands About Your Friends to 500 prompts. There are **20,173 trivia questions**; this is not a claim of 100,000 researched facts. Trivia subjects rotate to give small categories a fair turn. Funny mode mixes written prompts and scenario remixes, avoiding settings used in the last 20 rounds and formats used in the last six when alternatives are available. The host can select originals only or remixes only.

Community trivia comes from **OpenTriviaQA by uberspot and contributors**, licensed CC BY-SA 4.0. The imported pack was deduplicated, reformatted, and automatically filtered for standalone bluffing play. Filters remove true/false items, many option-dependent questions, changing-fact wording, malformed records, and conflicting duplicate answers. It is a community-supplied bank, **not 20,129 independently fact-checked answers**. Some errors, dated facts, or obscure references may remain. Its reveal links show the dataset source rather than a separately researched reference. See `data/ATTRIBUTION.md`, the included license, and `data/community-manifest.json` for provenance and filtering counts.

The 44 starter questions retain individual reference links. Player-name substitutions do not increase the count. Remixes are original combinations of settings and tasks, not factual questions.

### Repeat avoidance

Tables exclude previously used IDs until the selected pack is exhausted, then prefer the oldest 10% with an activity notice. Playing again retains table history. Each seated browser remembers up to 30,000 played question IDs locally and sends that history when opening or joining a table. The host's history seeds a new table; joining players add theirs. This survives server restarts in the same browser. It is not an account-based cross-device history: clearing site data, private browsing, blocked storage, or changing browsers can lose it. A round already underway is not replaced by a newly supplied history.

### Updating an existing deployment

Replace the project files with this version and remove `data/puzzles.jsonl.gz`, `data/puzzles-manifest.json`, and `scripts/build-bank.js` from the old repository. Commit the changes and redeploy the existing Render service. Its build and start commands stay the same. Active tables reset when the server restarts.

## Upload to GitHub and deploy on Render

1. Extract the downloaded ZIP.
2. Create a new GitHub repository, for example `Bluff-Game`.
3. Upload **everything inside the extracted `Bluff-Game` folder** to the repository root. `package.json`, `server.js`, `render.yaml`, and `index.html` must be at the root. Include the complete `src`, `data`, `scripts`, `licenses`, and `test` folders. The bundled community JSON is about 11 MB and works offline; no download is needed at runtime.
4. In Render, create a **Web Service**, connect this repository, and use:

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Root Directory | Leave blank |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/healthz` |
| Node version | 22 or newer |

You can also create a Render Blueprint from the repository; `render.yaml` contains the settings. Do not upload `node_modules` or the ZIP itself. The frontend build creates `dist` automatically. Running only `npm install` will not build the page.

## Play

Choose a name and avatar, open a table, and copy the invite link to friends. Add practice bots to try it alone. The host starts the game after at least two seats are occupied.

### Trivia bluffing — Find the truth

Everyone receives the same question and writes a convincing fake answer. Answers are locked when submitted. At voting time, the real answer is mixed with players’ anonymous bluffs. Pick the answer you think is true.

- Correct vote: **200 points**.
- Each opponent fooled by your bluff: **100 points**.
- Entering the real answer during writing: **200 points**, with no vote allowed in that round.
- You cannot vote for your own bluff.
- If needed, house decoys ensure at least three trivia choices. Voting for a house decoy earns nobody points.

### Funny prompts — Make them laugh

Everyone writes an answer to the same funny prompt. Vote for your favourite. There is no correct answer.

- Each vote gives its author **100 points**.
- You cannot vote for your own answer.
- A prompt naming a player chooses someone currently at the table.

Both modes merge identical normalized answers. When a merged answer receives an eligible vote, every co-author receives the full 100 points. Co-authors cannot vote for that answer. Authors, votes, and the real trivia answer are revealed after voting ends. Scores are updated once per round.

### About your friends — Put someone in the spotlight

Each round names an actual human player at your table. Examples include “What would Chad accidentally become famous for?” and “What would Chad’s personal warning label say?” The 500 prompts focus on personalities, habits, and playful observations; they are original prompts, not copied from Psych.

Everyone writes an answer, **including the featured player**. Everyone can then vote for someone else’s funniest or most fitting answer. Each vote gives its author **100 points**. There is no official correct answer or truth bonus. Authors remain hidden until the reveal, and duplicate answers merge as in Funny mode.

The featured player’s name and avatar appear in a spotlight panel. The server rotates among human players, favouring those featured least and avoiding consecutive turns for the same person when possible. Joining/leaving players are accounted for at the next round. Bots can write scripted practice answers and vote, but never become the featured friend. With one human and bots, that human is featured each time; the bots do not know personal facts about them. Spotlight counts last for the table’s lifetime and are tracked independently for Friends and Search History. Question IDs use the existing browser repeat history; changing the name does not inflate the prompt count.

Choose **About your friends** to play only this mode, **Trivia + funny** for the original two-mode rotation, or **Trivia + funny + friends** for the three-mode rotation, or **All four modes** to rotate trivia → funny → friends → search history. The default for new tables is all four. Trivia and Funny pack selectors are disabled when they do not apply.

### Search history — Invent their next query

A fictional situation names one of the human players: for example, “Chad accidentally makes enough pasta for twenty people. What would they search?” Everyone, including Chad, invents a funny search query. Answers appear anonymously; vote for the funniest or most fitting one. Each vote gives its author **100 points**, and nobody can vote for their own query. There is no official answer or truth bonus.

This is an imagination game. **It never reads, retrieves, or reveals real browser search history.** The only browser history stored by the app is the separate list of played question IDs used to avoid repeated game prompts.

The 500 situations cover ten themes, with 50 individually written situations in each: Kitchen chaos, Workday mysteries, Travel trouble, Domestic experiments, Digital dilemmas, Social situations, Shopping and hobbies, Games and exercise, Animals and outdoors, and Ridiculous what-ifs. These are distinct setups rather than a Cartesian product of interchangeable names or numbers. Player substitutions do not inflate the count.

Human players rotate independently within Friends and Search History, so everyone gets turns in both. The app also favours a different person from the last spotlight when fairness allows. Bots provide scripted fictional queries and random legal votes, and never become the featured player. Solo practice with bots features the one human each time.

Select **Search history** for this mode alone or **All four modes** to include it in the rotation. The earlier two- and three-mode rotations remain available. Existing chat, avatars, timers, scoring, duplicate merging, and browser-based repeat avoidance still apply.

### Rounds, timers, and chat

The host chooses an individual mode, the two- or three-mode mix, or all four; 5, 8, 10, 15, or 20 rounds; and 30, 60, 90, or 120 seconds per phase (or Off). The default is all four modes, eight rounds, and 60 seconds each for writing and voting.

All players write simultaneously and then vote simultaneously. A phase advances as soon as everyone eligible has submitted, or at the deadline. The server skips missing answers/votes at timeout, even when a browser disconnects. The host can also close a phase early. Chatting, refreshing, and changing avatars do not restart the timer. Settings and seats can be changed between rounds. A player arriving during a round must wait for the reveal to join.

Table chat is visible only to seated players. It keeps the last 100 messages, allows 300 characters per message, and limits each player to 20 messages per minute. Enter sends; Shift+Enter adds a newline.

### Practice bots

Bots provide scripted funny lines or supplied question-specific decoys and choose randomly among answers they are allowed to vote for. Community entries generally have three decoys, so larger bot groups can share an answer; identical bluffs merge and score using the existing co-author rules. They are practice seat-fillers, not language models or sophisticated trivia opponents. Their votes do not inspect the hidden truth flag. Bots are clearly labelled in the player list.

## Run on your computer

Install Node.js 22 or newer. Open a terminal in the extracted folder:

```sh
npm ci
npm run build
npm start
```

Open `http://localhost:3000`. Use a separate browser profile or private window for each human player on one computer. Each browser remembers its own random player token.

For frontend development, leave `npm start` running and run `npm run dev` in another terminal. Vite proxies API calls to port 3000.

## Validation and question editing

```sh
npm test
npm run bank:check
```

Tests cover scoring, secrecy, duplicates, known-answer handling, all four modes, simultaneous players, deadlines, late actions, bots, and table chat. The bank checker verifies unique IDs and prompt text, source URLs, and valid bot answers for all trivia entries. Tests cover full tables, exhaustion, remix variety, source secrecy, browser-history ingestion, both funny packs, featured-player rotation, friends/search scoring, separate spotlight rotation, and two-/three-/four-mode sequencing. These are code/data-structure checks, not independent factual verification.

Edit `data/trivia.js`, `data/funny.js`, `data/friends.js`, or `data/search.js` to extend the bank. A trivia entry needs a unique ID and question, `pack` (`words` or `facts`), category, answer, explanation, HTTPS source URL, and at least three distinct incorrect decoys (nine is better for large bot tables). Optional `aliases` list accepted answers. Check each fact and avoid ambiguous questions. Run the checker after changes; displayed counts are calculated from the files.

Correct-answer bonuses match normalized spelling and listed aliases, not arbitrary synonymous definitions. Bots use only the authored decoys; their votes remain random and do not inspect the correct-answer flag. No external AI is used.

To reproduce the community import, obtain the OpenTriviaQA commit recorded in `data/community-manifest.json`, then run `python3 scripts/import-open-trivia.py /path/to/OpenTriviaQA`. Python is only needed for rebuilding that bank, not for hosting or playing. Keep the attribution and license with redistributed data.

## Hosting behavior

Use a single Render instance. Tables, answers, scores, and chat live in server memory and disappear on restart or redeployment. Browser-stored question history remains available when creating or joining a new table. Free hosting may sleep when inactive; allow the service to wake before inviting friends. The server checks phase deadlines when it is running and upon the next table request. Tables expire after 24 hours without requests.

The Render URL has no sign-in wall. Anyone with the app URL can open a table, and an invite lets friends join it. There are no accounts or permanent cross-table leaderboards.

## Source layout

- `server.js`: multiplayer API, table chat, server timers, and static frontend serving
- `game.js`: phases, rules, scoring, and player-safe views
- `questions.js`: bank loading, selection, and answer normalization
- `bots.js`: practice bot answers and voting
- `avatars.js`: avatar choices
- `data/`: question banks with per-question source links
- `src/`: React interface and responsive styles
- `scripts/`: question-bank validation
- `test/`: game and API tests
- `render.yaml`: Render deployment settings

Play for fun. No purchases, wagers, or prizes.
