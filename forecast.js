// Forecast: imagine 1,000 possible futures from the company's recent behaviour.
//
// How one imagined future is made: start at today's close, then for each of
// the next 5 trading days pick one of the last 30 days at random and repeat
// its move (e.g. "+1.2%"). The same day can be picked more than once.
// Then we count how the 1,000 futures turned out.

const FUTURES = 1000;
const FORECAST_DAYS = 5;

// Value at a given share of the way through a sorted list (0.1 = 10th percentile).
function percentile(sorted, q) {
  return sorted[Math.round(q * (sorted.length - 1))];
}

// How much to stretch each past move away from the average move.
// 30 days is a short history and rarely includes the biggest surprise days,
// so unstretched futures are a little too narrow. This value was picked by
// testing (see CLAUDE.md) so "8 in 10" ranges really catch about 8 in 10
// and "5 in 10" ranges about 5 in 10. Without it they caught only about 76%.
const FORECAST_SPREAD = 1.1;

function simulateFutures(company, spread = FORECAST_SPREAD) {
  const days = recentDays(company.days); // the latest 30 days only
  const last = days[days.length - 1].close;

  // The 30 recent daily moves, as growth factors (1.012 = +1.2%),
  // each stretched away from the average move by `spread`.
  const logMoves = days.map(d => Math.log(1 + dayChange(company.days, d.index)));
  const avgMove = logMoves.reduce((sum, m) => sum + m, 0) / logMoves.length;
  const moves = logMoves.map(m => Math.exp(avgMove + spread * (m - avgMove)));

  // Seeded, so the forecast is the same every time you reload the page.
  const rand = makeRandom(((company.seed ^ 0x9E3779B9) + company.days.length) >>> 0);

  const futures = [];
  for (let k = 0; k < FUTURES; k++) {
    let price = last;
    const path = [];
    for (let s = 0; s < FORECAST_DAYS; s++) {
      price *= moves[Math.floor(rand() * moves.length)];
      path.push(price);
    }
    futures.push(path);
  }

  // For each future day: how many futures were higher than today, and the spread.
  const steps = [];
  for (let s = 0; s < FORECAST_DAYS; s++) {
    const prices = futures.map(f => f[s]).sort((a, b) => a - b);
    steps.push({
      up: prices.filter(p => p > last).length,
      down: prices.filter(p => p < last).length,
      p10: percentile(prices, 0.1),
      p25: percentile(prices, 0.25),
      p50: percentile(prices, 0.5),
      p75: percentile(prices, 0.75),
      p90: percentile(prices, 0.9)
    });
  }

  return { last: last, total: FUTURES, steps: steps };
}

// "58%", but never "0%" or "100%": a forecast is never certain.
function chanceText(count, total) {
  if (count === 0) return "<1%";
  if (count === total) return ">99%";
  const pct = Math.round((count / total) * 100);
  return Math.min(99, Math.max(1, pct)) + "%";
}
