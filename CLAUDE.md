# Market School (stock-predictor)

## What this is
A learning game about how stock prices move and how to think in probabilities. All companies, prices and news are completely made up (simulated). It is for learning and practice only, not real investing. Knowledge first, fun second.

## Hard rules
- No crypto anywhere: no crypto examples, charts, menus, or suggestions.
- No real company names. If the user types a real company name (like Apple or Tesla), ask them to choose an invented name instead.
- Every screen shows a clear banner: "Everything here is made up. These companies, prices and news are not real. For learning and practice only, not financial advice."
- Every chart shows a faint "SIMULATED" watermark.
- Never present predictions as certain. Always use probabilities and ranges.

## The core focus
1. Show the company's past days of made-up prices on a chart.
2. Show the future as probabilities:
   - Next day: chance up vs down (e.g. "58% up, 42% down") and a likely price range.
   - Next week (5 trading days): chance it ends higher or lower, a wider likely range, and a fan chart that widens over the 5 days.
   - Work these out by simulating 1,000 possible futures from the company's recent behaviour, and explain it simply ("in 580 of 1,000 imagined futures, it went up").
3. A "Next day" button reveals what happened and checks the forecast honestly, including comparison with a 50% coin flip.

## Companies
The user creates their own imaginary company:
- Name, emoji logo, industry (Food, Tech, Cars, Energy, Fashion, Healthcare), starting price
- Personality: Calm (small moves), Wild (big moves), Growing (tends to rise), Struggling (tends to fall), Random (no pattern)
- Prices are generated with randomness shaped by the personality, plus occasional made-up news events that move the price.
- The user's company is the star and follows them through the levels.

## Levels (Version 1 = Levels 1-4)
1. Meet your company: create the company, generate its last 30 days, learn to read the chart, then answer questions about it (highest day, ended higher or lower, biggest drop and its news).
2. Up or down?: forecast the next day as a % chance, then reveal.
3. The coin flip: set the company to Random and see that no method can beat about 50%. Explain why.
4. Calm vs wild: compare calm and wild versions; guess likely ranges; learn volatility.

Later levels (not in V1): trends, news, next-week fan chart reading, spreading risk, overconfidence, then a graduation sandbox.

## End-of-day report (after each "Next day")
- Mood emoji: 🚀 big gain, 😊 small gain, 😐 stable, 😟 small loss, 💥 big loss. What counts as "big" depends on the company's personality (2% is big for Calm, normal for Wild).
- Open and close price, change in $ and % (green for gains, red for losses), day high and low.
- Mini chart of the day plus where it sits on the 30-day chart.
- Today's made-up news, if any.
- Forecast check: what the user predicted vs what happened, with an explanation that a 60% forecast is still expected to miss 40% of the time.
- One short learning tip.

## End-of-week report (every 5 days)
- One emoji per day (e.g. Mon 😊 Tue 😐 Wed 💥 Thu 😟 Fri 🚀), total weekly change, best and worst day, and how the forecasts did.

## Scoring (knowledge over luck)
- Calibration: do "70%" forecasts happen about 70% of the time?
- Range accuracy: how often the real price landed inside the guessed range.
- Beat the coin flip.
- Do not score by pretend profit in V1.

## Learning features
- Short explanation (2-3 sentences) before each level.
- "Why?" feedback after every answer, even correct ones.
- Glossary: tap terms like volatility, range, calibration for simple definitions.
- Optional reasoning box: the user writes why they made a guess.
- Small rewards only: level complete tick and a progress bar.

## Technical
- A website: HTML, CSS and JavaScript, no frameworks needed for V1.
- No API keys, no backend, no real data in V1.
- Save progress in the browser (localStorage) so it survives a reload.
- Must work well on phones (Android Chrome included) and support light and dark mode.
- Will be published with GitHub and Vercel.

## Decisions (agreed 2026-10-06)
- Real-name check: use a built-in list of a few hundred well-known brands. It is a friendly reminder, not strict security.
- Levels 3 and 4 use temporary copies of the user's company, so the user's own company never changes. Label them clearly, e.g. "Noor's Bakery (Random twin)".
- Days use weekday names Mon to Fri and skip weekends. Briefly explain that markets don't trade on weekends.
- Starting price is limited to $1 to $1,000.
- Charts are drawn by hand (canvas/SVG), with no chart library.
- Git is set up locally. The user publishes to GitHub themselves from VS Code.

## Roadmap
- V1: Levels 1-4, forecast panel, day and week reports, banner and watermark.
- V2: candlestick charts, pretend-money profit/loss game, replay codes to share a market, "Reveal the truth" button, more levels.
- Later: optional private real-data version using Alpha Vantage (US stocks only).

## How to work with me
- I'm a beginner. Explain things in simple words.
- Work in small steps and tell me what to test after each step.
- Ask before big changes.
