# J.A.R.V.I.S Mobile Edition — Gemini 3.5 Flash-Lite Fixed

GitHub Pages-ready frontend.

- Gemini model: `gemini-3.5-flash-lite`
- Uses Gemini Interactions API
- LocalStorage memory
- Camera/image understanding
- Microphone input
- Telugu / English / Roman Telugu language control
- API key popup
- Cache-busting script version

Upload the files in this folder to the root of the GitHub Pages repository.


## EP06 — Tool System Added
The original EP01–EP05 files remain in place. EP06 is isolated in `ep06.js` and its UI styles are appended to `style.css`.

15 browser tools:
1. Weather
2. Timer
3. Stopwatch
4. Calculator
5. Date & Time
6. Date
7. Crypto
8. Currency
9. News
10. Web Search
11. Songs
12. Maps
13. Wikipedia
14. Random Number
15. Unit Converter

Examples:
- `weather in Hyderabad`
- `timer 10 minutes`
- `calculate 25*4`
- `bitcoin`
- `USD to INR`
- `news AI`
- `search Android 15`
- `play Telugu songs`
- `maps Hyderabad`
- `wiki Telangana`
- `random 1 to 100`
- `convert 10 km to mi`

Live-data tools use public web APIs. External searches open their corresponding web page. Browser/network availability and API limits can affect live tools.


## EP06 Fixes in this build
- More tolerant weather location lookup, including Tempalli/Vijayawada aliases.
- Visible timer countdown and completion event.
- More tolerant currency parsing with a second public-rate endpoint fallback.
- Improved unit aliases and clearer distinction between verified live tools and tools that only open a search page.
- No changes to EP01–EP05 logic.
