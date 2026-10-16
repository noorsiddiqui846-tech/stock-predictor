// End-of-day and end-of-week reports.

// ---------- Mood ----------
const MOODS = {
  bigGain:   { emoji: "🚀", label: "Big gain" },
  smallGain: { emoji: "😊", label: "Small gain" },
  stable:    { emoji: "😐", label: "Stable" },
  smallLoss: { emoji: "😟", label: "Small loss" },
  bigLoss:   { emoji: "💥", label: "Big loss" }
};

// What counts as "big" depends on the personality. A move 1.5x the company's
// normal daily wiggle is big; under 0.3x is stable. So 2% is big for Calm
// but an ordinary day for Wild.
const BIG_MOVE = 1.5;
const STABLE_MOVE = 0.3;

function moodOf(company, i) {
  const vol = PERSONALITY_SETTINGS[company.personality].vol;
  const r = dayChange(company.days, i);
  if (Math.abs(r) < STABLE_MOVE * vol) return MOODS.stable;
  if (r >= BIG_MOVE * vol) return MOODS.bigGain;
  if (r > 0) return MOODS.smallGain;
  if (r <= -BIG_MOVE * vol) return MOODS.bigLoss;
  return MOODS.smallLoss;
}

// 0.0123 -> "1.2%", 0.0024 -> "0.24%"
function pctText(fraction) {
  const p = Math.abs(fraction * 100);
  return (p < 1 ? p.toFixed(2) : p.toFixed(1)) + "%";
}

// ---------- Scoring ----------
// Miss score = (gap between your chance and what happened)², times 100.
// Lower is better. A 50% coin flip always scores 25. Squaring means a very
// confident miss costs a lot (90% and wrong = 81), so luck can't hide overconfidence.
const COIN_SCORE = 25;

function wentUp(company, i) {
  return company.days[i].close > company.days[i - 1].close;
}

function missScore(chance, up) {
  return Math.pow((up ? 1 : 0) - chance, 2) * 100;
}

function inRange(price, low, high) {
  return price >= low && price <= high;
}

// Did a chance lean the right way? null if it was exactly 50/50.
function leanedRight(chance, up) {
  return chance === 0.5 ? null : (chance > 0.5) === up;
}

// Totals over the forecast days given (all days if `indices` is left out).
// The app predicts every day; your guess is optional (yourUp is null when skipped).
function forecastStats(company, indices) {
  const all = Object.keys(company.forecasts || {}).map(Number).sort((a, b) => a - b);
  const list = (indices || all).filter(i => company.forecasts[i] && company.days[i]);
  const s = { n: list.length, days: list,
              app: 0, appLeaned: 0, appRight: 0, appSure: 0, appHits: 0,
              yourN: 0, you: 0, yourLeaned: 0, yourRight: 0, yourRanges: 0, yourHits: 0 };
  list.forEach(i => {
    const f = company.forecasts[i];
    const up = wentUp(company, i);
    const close = company.days[i].close;
    const appChance = f.appUp / f.appTotal;
    s.app += missScore(appChance, up);
    const appLean = leanedRight(appChance, up);
    if (appLean !== null) {
      s.appLeaned++;
      s.appSure += Math.max(appChance, 1 - appChance);
      if (appLean) s.appRight++;
    }
    if (inRange(close, f.appLow, f.appHigh)) s.appHits++;

    if (f.yourUp != null) {
      s.yourN++;
      s.you += missScore(f.yourUp, up);
      const yourLean = leanedRight(f.yourUp, up);
      if (yourLean !== null) {
        s.yourLeaned++;
        if (yourLean) s.yourRight++;
      }
      if (f.yourLow != null) {
        s.yourRanges++;
        if (inRange(close, f.yourLow, f.yourHigh)) s.yourHits++;
      }
    }
  });
  if (s.n) s.app /= s.n;
  if (s.yourN) s.you /= s.yourN;
  if (s.appLeaned) s.appSure /= s.appLeaned; // how sure the app was, on average
  return s;
}

// ---------- Small helpers ----------
function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text != null) e.textContent = text;
  return e;
}

function changeEl(from, to) {
  const span = el("span", to >= from ? "gain" : "loss");
  const diff = to - from;
  span.textContent = (diff >= 0 ? "▲ +" : "▼ −") + money(Math.abs(diff)) +
    " (" + (diff >= 0 ? "+" : "−") + pctText(diff / from) + ")";
  return span;
}

function chanceLabel(fraction) {
  return chanceText(Math.round(fraction * 1000), 1000);
}

// ---------- Mini charts ----------
function addMiniWatermark(svg, w, h) {
  const t = svgEl("text", { x: w / 2, y: h / 2, class: "chart-watermark mini-watermark",
    "text-anchor": "middle", "dominant-baseline": "middle", "aria-hidden": "true" }, svg);
  t.textContent = "SIMULATED";
}

// Rough shape of one day, made from its open, high, low and close.
function miniDayChart(d) {
  const w = 150, h = 80, pad = 8;
  const up = d.close >= d.open;
  const path = up ? [d.open, d.low, d.high, d.close] : [d.open, d.high, d.low, d.close];
  const span = Math.max(d.high - d.low, 0.01);
  const y = v => pad + (1 - (v - d.low) / span) * (h - 2 * pad);
  const svg = svgEl("svg", { width: w, height: h, viewBox: "0 0 " + w + " " + h, class: "mini-chart",
    role: "img", "aria-label": "Rough shape of the day: opened at " + money(d.open) + ", went between " +
      money(d.low) + " and " + money(d.high) + ", closed at " + money(d.close) + "." });
  addMiniWatermark(svg, w, h);
  svgEl("line", { x1: 0, x2: w, y1: y(d.high), y2: y(d.high), class: "chart-grid" }, svg);
  svgEl("line", { x1: 0, x2: w, y1: y(d.low), y2: y(d.low), class: "chart-grid" }, svg);
  const pts = path.map((v, k) => (pad + k * (w - 2 * pad) / 3).toFixed(1) + "," + y(v).toFixed(1));
  svgEl("path", { d: "M" + pts.join(" L"), class: "mini-line " + (up ? "mini-gain" : "mini-loss") }, svg);
  svgEl("circle", { cx: pad, cy: y(d.open), r: 4, class: "chart-news" }, svg);
  svgEl("circle", { cx: w - pad, cy: y(d.close), r: 4, class: "chart-dot" }, svg);
  return svg;
}

// The last 30 closes, with day i highlighted.
function miniSparkline(days, i) {
  const w = 150, h = 80, pad = 8;
  const from = Math.max(0, i - HISTORY_DAYS + 1);
  const slice = days.slice(from, i + 1);
  const closes = slice.map(d => d.close);
  const lo = Math.min(...closes), hi = Math.max(...closes);
  const span = Math.max(hi - lo, 0.01);
  const x = k => pad + (k / Math.max(1, slice.length - 1)) * (w - 2 * pad);
  const y = v => pad + (1 - (v - lo) / span) * (h - 2 * pad);
  const svg = svgEl("svg", { width: w, height: h, viewBox: "0 0 " + w + " " + h, class: "mini-chart",
    role: "img", "aria-label": "Last " + slice.length + " days, lowest " + money(lo) + ", highest " +
      money(hi) + ". Today's close: " + money(days[i].close) + "." });
  addMiniWatermark(svg, w, h);
  svgEl("path", { d: "M" + closes.map((v, k) => x(k).toFixed(1) + "," + y(v).toFixed(1)).join(" L"),
    class: "mini-line" }, svg);
  svgEl("circle", { cx: x(slice.length - 1), cy: y(days[i].close), r: 5, class: "chart-dot" }, svg);
  return svg;
}

// ---------- Learning tip ----------
const GENERAL_TIPS = [
  "One day tells you very little. Judge a prediction over many days, not one.",
  "A coin flip scores 25 every single day. Beating it over many days is harder than it sounds.",
  "Saying 90% and being wrong costs 81 points. A prediction should only be very sure when there's a really good reason.",
  "A good \"8 in 10\" range should miss about 2 times in 10. Missing sometimes is part of being honest.",
  "Past moves can help predict how BIG the next move might be, but often not which WAY it will go.",
  "The app's prediction copies the last 30 days. If those days were unusual, the prediction will be too."
];

function pickTip(company, i, f) {
  const d = company.days[i];
  const mood = moodOf(company, i);
  const p = PERSONALITIES.find(x => x.id === company.personality);
  const up = wentUp(company, i);
  if (f && f.yourUp != null && leanedRight(f.yourUp, up) === false && Math.abs(f.yourUp - 0.5) >= 0.3) {
    return "You were very sure and it went the other way. Very sure forecasts should be right most of the time, so watch whether yours are.";
  }
  if (d.news) {
    return "News can move a price a lot in one day, and nobody knows it's coming. That's why good forecasts leave room for surprises.";
  }
  if (mood === MOODS.bigGain || mood === MOODS.bigLoss) {
    return "For a " + p.label + " company, a " + pctText(dayChange(company.days, i)) +
      " day is big. What counts as \"big\" depends on how much a company usually moves (its volatility).";
  }
  if (f && f.yourLow != null && !inRange(d.close, f.yourLow, f.yourHigh)) {
    return "Your range missed today. If your ranges miss more than about 2 times in 10, try making them wider.";
  }
  if (i % 5 === 0) {
    return "Markets are closed at weekends, so Monday carries on from Friday's close.";
  }
  return GENERAL_TIPS[i % GENERAL_TIPS.length];
}

// ---------- End-of-day report ----------
// opts.noHead leaves out the mood header (the result screen shows its own).
function renderDayReport(box, company, i, opts) {
  opts = opts || {};
  const days = company.days;
  const d = days[i];
  const prev = days[i - 1];
  const f = company.forecasts[i];
  const mood = moodOf(company, i);
  const up = wentUp(company, i);
  const p = PERSONALITIES.find(x => x.id === company.personality);
  const vol = PERSONALITY_SETTINGS[company.personality].vol;

  const card = el("section", "card report");
  card.setAttribute("aria-label", "End of day report");

  // Header with the mood.
  const head = el("div", "report-head");
  head.append(el("div", "report-emoji", mood.emoji));
  const titles = el("div");
  titles.append(el("div", "report-kicker", "End of day · " + dayLabel(i)));
  titles.append(el("h3", "report-title", mood.label + " for " + company.name));
  head.append(titles);
  if (!opts.noHead) card.append(head);
  card.append(el("p", "muted small",
    "For a " + p.label + " company, " + pctText(BIG_MOVE * vol) + " or more counts as a big move, and under " +
    pctText(STABLE_MOVE * vol) + " counts as stable."));
  if (i % 5 === 0) {
    card.append(el("p", "note", "📅 Saturday and Sunday were skipped: markets don't trade at weekends."));
  }

  // The day's numbers.
  const facts = el("dl", "facts");
  const addFact = (label, value) => {
    const row = el("div");
    row.append(el("dt", null, label));
    const dd = el("dd");
    if (typeof value === "string") dd.textContent = value; else dd.append(value);
    row.append(dd);
    facts.append(row);
  };
  addFact("Open", money(d.open));
  addFact("Close", money(d.close));
  addFact("Change", changeEl(prev.close, d.close));
  addFact("High", money(d.high));
  addFact("Low", money(d.low));
  card.append(facts);

  // News.
  card.append(el("p", "report-news", d.news
    ? "📰 Today's made-up news: " + d.news.text
    : "📰 No news today. The price just moved with its ordinary ups and downs."));

  // Mini charts.
  const minis = el("div", "minis");
  const fig1 = el("figure");
  fig1.append(miniDayChart(d), el("figcaption", null, "Rough shape of the day (from open, low, high and close)"));
  const fig2 = el("figure");
  fig2.append(miniSparkline(days, i), el("figcaption", null, "Where today sits in the last 30 days"));
  minis.append(fig1, fig2);
  card.append(minis);

  // Prediction check: the app first, then the coin flip, then your guess if you made one.
  if (f) {
    const check = el("div", "fc-check");
    check.append(el("h4", null, "Prediction check"));
    const flat = d.close === prev.close;
    check.append(flat
      ? el("p", "fc-result", "■ It closed exactly the same, which counts as \"not up\".")
      : el("p", "fc-result " + (up ? "gain" : "loss"), up ? "▲ It went UP." : "▼ It went DOWN."));

    const table = el("table", "score-table");
    const thead = el("thead");
    const hr = el("tr");
    ["", "Said \"up\"", "Miss score"].forEach(t => hr.append(el("th", null, t)));
    thead.append(hr);
    const tbody = el("tbody");
    const rows = [
      ["App", f.appUp / f.appTotal, missScore(f.appUp / f.appTotal, up)],
      ["Coin flip", 0.5, COIN_SCORE]
    ];
    if (f.yourUp != null) rows.push(["You", f.yourUp, missScore(f.yourUp, up)]);
    const best = Math.min(...rows.map(r => r[2]));
    rows.forEach(([who, chance, score]) => {
      const tr = el("tr", score === best ? "best" : null);
      tr.append(el("td", null, who));
      tr.append(el("td", null, who === "App" ? chanceText(f.appUp, f.appTotal) : chanceLabel(chance)));
      tr.append(el("td", null, Math.round(score) + (score === best ? " ✓" : "")));
      tbody.append(tr);
    });
    table.append(thead, tbody);
    check.append(table);
    check.append(el("p", "muted small",
      "Miss score = the gap between the chance and what happened, squared. Lower is better. A coin flip always scores 25."));

    // Ranges.
    const ranges = el("ul", "range-list");
    const appHit = inRange(d.close, f.appLow, f.appHigh);
    ranges.append(el("li", null, (appHit ? "✅ " : "❌ ") + "App's 8-in-10 range " + money(f.appLow) + " to " +
      money(f.appHigh) + (appHit ? " caught the close." : " missed the close (expected about 2 times in 10).")));
    if (f.yourLow != null) {
      const hit = inRange(d.close, f.yourLow, f.yourHigh);
      ranges.append(el("li", null, (hit ? "✅ " : "❌ ") + "Your range " + money(f.yourLow) + " to " +
        money(f.yourHigh) + (hit ? " caught the close." : " missed the close.")));
    }
    check.append(ranges);

    check.append(el("p", null, "One day says very little about a prediction, right or wrong. " +
      "The track record shows how the app does over many days."));
    if (f.reason) check.append(el("p", "reason", "Your reason: “" + f.reason + "”"));
    card.append(check);
  }

  card.append(el("p", "tip", "💡 " + pickTip(company, i, f)));
  box.append(card);
}

// ---------- Prediction track record ----------
// How often the app's next-day predictions came true so far, next to a coin flip
// (and your own guesses, if you made any).
const TRACK_ROW_DAYS = 10;

function renderTrackRecord(box, company) {
  const s = forecastStats(company);
  const card = el("section", "card track");
  card.setAttribute("aria-label", "Prediction track record");
  card.append(el("h3", "card-title", "📊 Prediction track record"));

  if (!s.n) {
    card.append(el("p", "muted", "Nothing checked yet. Press Next day and each prediction gets checked " +
      "against what really happened, then added up here."));
    box.append(card);
    return;
  }

  // The latest days, oldest first: did the app lean the right way?
  const recent = s.days.slice(-TRACK_ROW_DAYS);
  const row = el("ol", "track-row");
  recent.forEach(i => {
    const f = company.forecasts[i];
    const right = leanedRight(f.appUp / f.appTotal, wentUp(company, i));
    const mark = right === null ? "➖" : right ? "✅" : "❌";
    const li = el("li", null, mark);
    li.title = dayLabel(i) + ": " + (right === null ? "50/50" : right ? "right way" : "wrong way");
    row.append(li);
  });
  row.setAttribute("aria-label", "Last " + recent.length + " days: the app leaned the right way on " +
    recent.filter(i => leanedRight(company.forecasts[i].appUp / company.forecasts[i].appTotal, wentUp(company, i))).length +
    " of them.");
  card.append(el("p", "muted small", "Last " + recent.length + " day" + (recent.length === 1 ? "" : "s") +
    ", oldest first. ✅ = the app leaned the right way, ❌ = it didn't."));
  card.append(row);

  // App vs coin flip (vs you).
  const table = el("table", "score-table");
  const thead = el("thead");
  const hr = el("tr");
  ["", "Right way", "Avg miss score"].forEach(t => hr.append(el("th", null, t)));
  thead.append(hr);
  const tbody = el("tbody");
  const rows = [
    ["App", s.appRight + " of " + s.appLeaned, s.app],
    ["Coin flip", "about half", COIN_SCORE]
  ];
  if (s.yourN) rows.push(["You", s.yourLeaned ? s.yourRight + " of " + s.yourLeaned : "-", s.you]);
  const best = Math.min(...rows.map(r => r[2]));
  rows.forEach(([who, right, score]) => {
    const tr = el("tr", score === best ? "best" : null);
    tr.append(el("td", null, who));
    tr.append(el("td", null, right));
    tr.append(el("td", null, score.toFixed(1) + (score === best ? " ✓" : "")));
    tbody.append(tr);
  });
  table.append(thead, tbody);
  card.append(table);
  card.append(el("p", "muted small", "Lower miss score is better. A coin flip always scores 25."));

  const list = el("ul", "range-list");
  list.append(el("li", null, "🎯 The likely range caught the real price on " + s.appHits + " of " + s.n +
    " days. An honest 8-in-10 range should catch about " + Math.round(s.n * 0.8) + "."));
  if (s.appLeaned) {
    list.append(el("li", null, "⚖️ On average the app was " + Math.round(s.appSure * 100) +
      "% sure, and it was right " + Math.round((s.appRight / s.appLeaned) * 100) +
      "% of the time. For an honest prediction, these two numbers end up close after many days."));
  }
  card.append(list);

  let verdict = s.app < COIN_SCORE
    ? "So far the app is beating the coin flip."
    : "So far the coin flip is doing as well or better.";
  if (s.n < 20) verdict += " But after only " + s.n + " day" + (s.n === 1 ? "" : "s") +
    ", luck plays a big part. The record means more after 20 days or so.";
  card.append(el("p", null, verdict));
  box.append(card);
}

// ---------- End-of-week report ----------
function renderWeekReport(box, company, fri) {
  const days = company.days;
  const mon = fri - 4;
  const indices = [mon, mon + 1, mon + 2, mon + 3, mon + 4];
  const weekNo = Math.floor(mon / 5) + 1;

  const card = el("section", "card report week-report");
  card.setAttribute("aria-label", "End of week report");
  card.append(el("div", "report-kicker", "End of week"));
  card.append(el("h3", "report-title", "Week " + weekNo + " for " + company.name));

  const row = el("ol", "week-row");
  indices.forEach(i => {
    const mood = moodOf(company, i);
    const li = el("li");
    li.append(el("span", "week-emoji", mood.emoji));
    li.append(el("span", "week-day", WEEKDAYS[i % 5]));
    const r = dayChange(days, i);
    li.append(el("span", r >= 0 ? "gain small" : "loss small", (r >= 0 ? "+" : "−") + pctText(r)));
    li.setAttribute("aria-label", WEEKDAYS[i % 5] + ": " + mood.label + ", " + (r >= 0 ? "up " : "down ") + pctText(r));
    row.append(li);
  });
  card.append(row);

  const facts = el("dl", "facts");
  const addFact = (label, value) => {
    const r = el("div");
    r.append(el("dt", null, label));
    const dd = el("dd");
    if (typeof value === "string") dd.textContent = value; else dd.append(value);
    r.append(dd);
    facts.append(r);
  };
  addFact("Week's change", changeEl(days[mon - 1].close, days[fri].close));
  const changes = indices.map(i => ({ i: i, r: dayChange(days, i) }));
  const best = changes.reduce((a, b) => (b.r > a.r ? b : a));
  const worst = changes.reduce((a, b) => (b.r < a.r ? b : a));
  addFact("Best day", WEEKDAYS[best.i % 5] + " (" + (best.r >= 0 ? "+" : "−") + pctText(best.r) + ")");
  addFact("Worst day", WEEKDAYS[worst.i % 5] + " (" + (worst.r >= 0 ? "+" : "−") + pctText(worst.r) + ")");
  card.append(facts);

  const s = forecastStats(company, indices);
  if (s.n) {
    const check = el("div", "fc-check");
    check.append(el("h4", null, "How the predictions did this week"));
    const list = el("ul", "range-list");
    if (s.appLeaned) list.append(el("li", null, "The app leaned the right way on " + s.appRight + " of " + s.appLeaned + " days."));
    list.append(el("li", null, "App's ranges caught " + s.appHits + " of " + s.n + "."));
    list.append(el("li", null, "Average miss score: app " + s.app.toFixed(1) + " · coin flip 25" +
      (s.yourN ? " · you " + s.you.toFixed(1) : "") + "."));
    if (s.yourLeaned) list.append(el("li", null, "You leaned the right way on " + s.yourRight + " of " + s.yourLeaned + " days."));
    if (s.yourRanges) list.append(el("li", null, "Your ranges caught " + s.yourHits + " of " + s.yourRanges + "."));
    check.append(list);
    check.append(el("p", null, s.app < COIN_SCORE
      ? "The app beat the coin flip this week. Over only " + s.n + " days luck plays a big part, so keep watching."
      : "The coin flip did as well or better this week. Over only " + s.n + " days that's very common, even for good predictions."));
    card.append(check);
  }
  box.append(card);
}
