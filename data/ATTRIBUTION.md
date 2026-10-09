# Community trivia attribution

`community.json` is a transformed subset of **OpenTriviaQA**, collected and maintained by **uberspot and OpenTriviaQA contributors**.

- Original project: https://github.com/uberspot/OpenTriviaQA
- Source revision: `dcc1cdf36c2985ed5c849d1f2265c5041ffcdfb9`
- Original files: https://github.com/uberspot/OpenTriviaQA/tree/dcc1cdf36c2985ed5c849d1f2265c5041ffcdfb9/categories
- License: **Creative Commons Attribution-ShareAlike 4.0 International**, https://creativecommons.org/licenses/by-sa/4.0/
- Full license: `../licenses/OpenTriviaQA-CC-BY-SA-4.0.md`

The community JSON and adaptations to that dataset are distributed under the same CC BY-SA 4.0 license. Changes: converted question blocks into JSON; decoded HTML entities; normalized whitespace; filtered out unsuitable records; deduplicated prompts and excluded conflicting answers; added stable IDs, categories, metadata, and source URLs; corrected the spelling “Proxima Centuori” to “Proxima Centauri”. Incorrect multiple-choice answers are used as bot/house bluffs. Reproduce these changes using `scripts/import-open-trivia.py`; filtering statistics appear in `community-manifest.json`.

No endorsement by the original authors is implied. Community answers have not all been independently verified. Keep this attribution, source links, change notice, and license with any redistributed version of this data.

`trivia.js` contains separately authored starter questions with per-entry references. `funny.js` and `remixes.js` contain original creative prompts and building blocks; they were not imported from OpenTriviaQA. This notice concerns the community dataset, not unrelated application code.
