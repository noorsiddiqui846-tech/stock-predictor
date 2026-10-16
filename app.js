// Market School: screens, light/dark mode, company picker and form, the app's
// prediction, the optional guess and the "Next day" button.

// ---------- Saving in the browser ----------
// localStorage can fail (private windows, blocked storage), so every read and
// write is wrapped in try/catch and the app still works without it.
const STORE_KEY = "marketSchool.v1";
const THEME_KEY = "marketSchool.theme";

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (e) {
    // Progress won't survive a reload, but the app keeps working.
  }
}

let state = loadState();

// ---------- Light / dark mode ----------
const themeBtn = document.getElementById("theme-toggle");

function currentTheme() {
  const set = document.documentElement.dataset.theme;
  if (set) return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function updateThemeButton() {
  // Show the mode you'll switch TO.
  themeBtn.textContent = currentTheme() === "dark" ? "☀️" : "🌙";
}

themeBtn.addEventListener("click", () => {
  const next = currentTheme() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  updateThemeButton();
});

updateThemeButton();
// If the user hasn't picked a mode, follow the device when it switches.
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", updateThemeButton);

// ---------- Form choices ----------
const EMOJIS = [
  "🍞", "🥐", "🍕", "☕", "🍩", "🍎",
  "💻", "📱", "🤖", "🔬",
  "🚗", "🚙", "🛵", "🚚",
  "⚡", "☀️", "💡", "🔋",
  "👗", "👟", "👜", "🧵",
  "💊", "🩺", "🧬", "🏥",
  "🌟", "🦊", "🐢", "🌈"
];

const PERSONALITIES = [
  { id: "calm",       label: "Calm",       desc: "Small, gentle moves most days." },
  { id: "wild",       label: "Wild",       desc: "Big jumps up and down." },
  { id: "growing",    label: "Growing",    desc: "Tends to rise over time (but not every day)." },
  { id: "struggling", label: "Struggling", desc: "Tends to fall over time (but not every day)." },
  { id: "random",     label: "Random",     desc: "No pattern at all, like a coin flip." }
];

const BUILT_IN_INDUSTRIES = ["Food", "Tech", "Cars", "Energy", "Fashion", "Healthcare"];

// Ready-made pretend companies for the "Pick a company" screen.
const STARTER_COMPANIES = [
  { name: "Crumbly Bakery",  emoji: "🥐", industry: "Food",    personality: "calm",       startPrice: 40 },
  { name: "Zippy Scooters",  emoji: "🛵", industry: "Cars",    personality: "wild",       startPrice: 25 },
  { name: "Sunpatch Energy", emoji: "☀️", industry: "Energy",  personality: "growing",    startPrice: 80 },
  { name: "Puddle Boots",    emoji: "👟", industry: "Fashion", personality: "struggling", startPrice: 60 }
];

function buildEmojiGrid() {
  const grid = document.getElementById("emoji-grid");
  EMOJIS.forEach((emoji, i) => {
    const id = "emoji-" + i;
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "emoji";
    input.id = id;
    input.value = emoji;
    if (i === 0) input.checked = true;
    const label = document.createElement("label");
    label.htmlFor = id;
    label.textContent = emoji;
    grid.append(input, label);
  });
}

function buildPersonalityList() {
  const list = document.getElementById("personality-list");
  PERSONALITIES.forEach((p, i) => {
    const id = "personality-" + p.id;
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "personality";
    input.id = id;
    input.value = p.id;
    if (i === 0) input.checked = true;
    const label = document.createElement("label");
    label.htmlFor = id;
    const strong = document.createElement("strong");
    strong.textContent = p.label;
    const span = document.createElement("span");
    span.textContent = p.desc;
    label.append(strong, span);
    list.append(input, label);
  });
}

// ---------- Name checks ----------
// Turn "McDonald's Co." into "mcdonalds co" so names compare fairly.
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function hasWord(normName, phrase) {
  return (" " + normName + " ").includes(" " + phrase + " ");
}

// Short crypto words must be a whole word; long ones also count inside words ("MegaBitcoin").
function containsCrypto(normText) {
  const words = normText.split(" ");
  const compact = normText.replace(/ /g, "");
  return CRYPTO_WORDS.some(w => words.includes(w) || (w.length >= 6 && compact.includes(w)));
}

// Returns a friendly message if the name looks real or crypto, otherwise "".
function checkName(rawName) {
  const name = normalize(rawName);
  if (name.length < 2) return "Please type a name with at least 2 letters.";

  if (containsCrypto(name)) {
    return "Market School doesn't use crypto. Please pick a different name.";
  }

  const compact = name.replace(/ /g, "");
  const distinct = DISTINCT_BRANDS.find(b =>
    hasWord(name, b) || (b.includes(" ") && compact.includes(b.replace(/ /g, "")))
  );
  if (distinct) {
    return "That looks like a real company. Please invent your own name instead, so everything stays made up.";
  }

  const core = name.split(" ").filter(w => !COMPANY_SUFFIXES.includes(w)).join(" ");
  if (COMMON_WORD_BRANDS.includes(core)) {
    return "That looks like a real company. Try adding your own twist, like \"" +
      rawName.trim() + " Bakery\" or a totally new name.";
  }
  return "";
}

// ---------- Screens ----------
const SCREENS = ["welcome-screen", "pick-screen", "create-screen", "company-screen", "result-screen"];

function showScreen(id) {
  SCREENS.forEach(s => { document.getElementById(s).hidden = s !== id; });
  window.scrollTo(0, 0);
}

const form = document.getElementById("company-form");
const nameInput = document.getElementById("name");
const priceInput = document.getElementById("price");
const industrySelect = document.getElementById("industry");
const customBox = document.getElementById("custom-industry-box");
const customInput = document.getElementById("custom-industry");
const nameError = document.getElementById("name-error");
const priceError = document.getElementById("price-error");
const industryError = document.getElementById("industry-error");

// Show the "type your own" box only when "Something else" is chosen.
function updateCustomBox() {
  customBox.hidden = industrySelect.value !== "custom";
  if (customBox.hidden) showError(customInput, industryError, "");
}
industrySelect.addEventListener("change", () => {
  updateCustomBox();
  if (!customBox.hidden) customInput.focus();
});

// ---------- Welcome and "Pick a company" ----------
document.getElementById("start-btn").addEventListener("click", showPickScreen);

function showPickScreen() {
  const grid = document.getElementById("pick-grid");
  grid.innerHTML = "";
  STARTER_COMPANIES.forEach(t => {
    const p = PERSONALITIES.find(x => x.id === t.personality);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "pick-card";
    const logo = document.createElement("span");
    logo.className = "pick-emoji";
    logo.setAttribute("aria-hidden", "true");
    logo.textContent = t.emoji;
    const name = document.createElement("strong");
    name.className = "pick-name";
    name.textContent = t.name;
    const kind = document.createElement("span");
    kind.className = "pick-kind";
    kind.textContent = t.industry + " · " + p.label;
    const desc = document.createElement("span");
    desc.className = "pick-desc";
    desc.textContent = p.desc;
    card.append(logo, name, kind, desc);
    card.addEventListener("click", () => startCompany(t));
    grid.append(card);
  });
  document.getElementById("pick-back-btn").hidden = !state.company;
  showScreen("pick-screen");
}

document.getElementById("create-own-btn").addEventListener("click", showCreateScreen);
document.getElementById("pick-back-btn").addEventListener("click", () => showCompanyScreen());
document.getElementById("create-back-btn").addEventListener("click", showPickScreen);

// Make a fresh company (with a new made-up history) and show its prediction.
// Returns false if the player decided not to lose the track record.
function startCompany(details) {
  const old = state.company;
  const forecastCount = old && old.forecasts ? Object.keys(old.forecasts).length : 0;
  if (forecastCount > 0 && !window.confirm("This makes a new price history and clears the track record of " +
      forecastCount + " prediction" + (forecastCount === 1 ? "" : "s") + ". Continue?")) {
    return false;
  }
  const company = {
    name: details.name,
    emoji: details.emoji,
    industry: details.industry,
    startPrice: details.startPrice,
    personality: details.personality,
    seed: newSeed(),
    createdAt: new Date().toISOString()
  };
  company.days = generateHistory(company);
  company.forecasts = {}; // day number -> the app's prediction (and your guess), locked in before the day
  state.company = company;
  state.showResult = false;
  saveState(state);
  showCompanyScreen();
  return true;
}

// ---------- Create your own ----------
function showCreateScreen() {
  // Fill the form only for a company you made yourself, not a ready-made one.
  const own = state.company;
  const c = own && !STARTER_COMPANIES.some(t => t.name === own.name) ? own : null;
  if (c) {
    // Fill the form with the current company so it can be changed.
    nameInput.value = c.name;
    if (BUILT_IN_INDUSTRIES.includes(c.industry)) {
      industrySelect.value = c.industry;
      customInput.value = "";
    } else {
      industrySelect.value = "custom";
      customInput.value = c.industry;
    }
    priceInput.value = c.startPrice;
    const emoji = form.querySelector('input[name="emoji"][value="' + c.emoji + '"]');
    if (emoji) emoji.checked = true;
    form.personality.value = c.personality;
  }
  document.getElementById("edit-hint").hidden = !c;
  document.getElementById("submit-btn").textContent = c ? "Save changes" : "Create my company";
  updateCustomBox();
  showScreen("create-screen");
}

// "▲ 3.2%" in green or "▼ 1.5%" in red. The arrow means it's not shown by colour alone.
function changeSpan(from, to) {
  const pct = ((to - from) / from) * 100;
  const span = document.createElement("span");
  span.className = to >= from ? "gain" : "loss";
  span.textContent = (to >= from ? "▲ " : "▼ ") + Math.abs(pct).toFixed(1) + "%";
  return span;
}

// Table of the latest 30 days, each with its mood emoji.
function fillTable(c) {
  const body = document.getElementById("days-table");
  body.innerHTML = "";
  recentDays(c.days).forEach(d => {
    const i = d.index;
    const prev = i > 0 ? c.days[i - 1].close : d.open;
    const row = document.createElement("tr");
    const cells = [moodOf(c, i).emoji + " " + dayLabel(i), money(d.open), money(d.close), null,
      d.news ? d.news.text : ""];
    cells.forEach(text => {
      const td = document.createElement("td");
      if (text === null) td.append(changeSpan(prev, d.close));
      else td.textContent = text;
      row.append(td);
    });
    body.append(row);
  });
}

// ---------- Forecast panel ----------
// "▲ Up 58%   Down 42% ▼" with a bar underneath. Arrows and words mean it's
// not shown by colour alone.
function fillSplit(box, step, total, upWord, downWord) {
  const flat = total - step.up - step.down;
  box.innerHTML = "";
  const labels = document.createElement("div");
  labels.className = "split-labels";
  const up = document.createElement("span");
  up.className = "gain";
  up.textContent = "▲ " + upWord + " " + chanceText(step.up, total);
  const down = document.createElement("span");
  down.className = "loss";
  // Round once, so the two sides always add up to 100% (31.5% and 68.5% would
  // otherwise both round up, to 32% and 69%). Only when no future ended flat.
  let downText = chanceText(step.down, total);
  const upPct = parseInt(chanceText(step.up, total), 10);
  if (flat === 0 && !isNaN(upPct)) downText = (100 - upPct) + "%";
  down.textContent = downWord + " " + downText + " ▼";
  labels.append(up, down);

  const bar = document.createElement("div");
  bar.className = "split-bar";
  bar.setAttribute("aria-hidden", "true");
  [["up", step.up], ["flat", flat], ["down", step.down]].forEach(([cls, count]) => {
    if (count === 0) return;
    const part = document.createElement("span");
    part.className = cls;
    part.style.flexGrow = count;
    bar.append(part);
  });
  box.append(labels, bar);
}

function countText(step, total, upPhrase) {
  let text = "In " + step.up.toLocaleString("en-US") + " of " + total.toLocaleString("en-US") +
    " imagined futures, it " + upPhrase + ".";
  const flat = total - step.up - step.down;
  if (flat > 0) text += " (" + flat + " ended exactly the same.)";
  return text;
}

function rangeText(step, total) {
  return money(step.p10) + " to " + money(step.p90) +
    " (8 in 10 imagined futures landed here)";
}

function fillForecast(c, f) {
  const n = c.days.length;
  const day = f.steps[0];
  const week = f.steps[f.steps.length - 1];
  document.getElementById("fc-day-label").textContent = "(" + dayLabel(n) + ")";
  document.getElementById("fc-week-label").textContent =
    "(5 trading days, " + dayLabel(n) + " to " + WEEKDAYS[(n + f.steps.length - 1) % 5] + ")";

  fillSplit(document.getElementById("fc-day-split"), day, f.total, "Up", "Down");
  document.getElementById("fc-day-count").textContent = countText(day, f.total, "went up");
  document.getElementById("fc-day-range").textContent = rangeText(day, f.total);

  fillSplit(document.getElementById("fc-week-split"), week, f.total, "Higher", "Lower");
  document.getElementById("fc-week-count").textContent =
    countText(week, f.total, "ended the week higher than today's " + money(f.last));
  document.getElementById("fc-week-range").textContent = rangeText(week, f.total);

  document.querySelectorAll(".fc-name").forEach(el => { el.textContent = c.name; });
}

// The app's forecast for the next day, kept so "Next day" can record it.
let currentForecast = null;

function showCompanyScreen() {
  const c = state.company;
  const p = PERSONALITIES.find(x => x.id === c.personality);
  const start = Math.max(0, c.days.length - HISTORY_DAYS);
  const base = start > 0 ? c.days[start - 1].close : c.days[0].open; // price 30 days ago
  const last = c.days[c.days.length - 1];
  document.getElementById("c-logo").textContent = c.emoji;
  document.getElementById("c-name").textContent = c.name;
  document.getElementById("c-meta").textContent = c.industry + " · " + p.label + " personality";
  document.getElementById("c-personality").textContent = p.label + ": " + p.desc;
  document.getElementById("s-start").textContent = money(base);
  document.getElementById("s-last").textContent = money(last.close);
  const change = document.getElementById("s-change");
  change.innerHTML = "";
  change.append(changeSpan(base, last.close));
  fillTable(c);
  currentForecast = simulateFutures(c);
  fillForecast(c, currentForecast);
  document.getElementById("g-day").textContent = dayLabel(c.days.length);
  guessBox.open = !!state.guessOpen;
  const record = document.getElementById("track-record");
  record.innerHTML = "";
  renderTrackRecord(record, c);

  showScreen("company-screen"); // must be visible before drawing, so the chart knows its width
  drawPriceChart(document.getElementById("chart"), c.days, currentForecast);
}

// "62% up" or "70% down": the side a chance leans to.
function sideText(chance) {
  const pct = Math.min(99, Math.max(1, Math.round(chance * 100)));
  return pct >= 50 ? pct + "% up" : (100 - pct) + "% down";
}

// One line of the prediction check, e.g. "✅ The app said 62% up, and it went up."
function directionCheck(who, chance, up, flat) {
  const pct = Math.round(chance * 100);
  const sure = Math.max(pct, 100 - pct);
  const moved = flat ? "it closed exactly the same (that counts as not up)" : "it went " + (up ? "up" : "down");
  if (pct === 50) return "➖ " + who + " said 50/50, like a coin flip, and " + moved + ".";
  if ((chance > 0.5) === up) return "✅ " + who + " said " + sideText(chance) + ", and " + moved + ".";
  return "❌ " + who + " said " + sideText(chance) + ", but " + moved + ". A " + sure +
    "% prediction should miss about " + (100 - sure) + " times in 100, so this is expected sometimes.";
}

// ---------- Result of the day ----------
function showResultScreen() {
  const c = state.company;
  const i = c.days.length - 1;
  const f = c.forecasts[i];
  const d = c.days[i];
  const prev = c.days[i - 1].close;
  const mood = moodOf(c, i);
  const up = wentUp(c, i);
  const flat = d.close === prev;

  document.getElementById("r-emoji").textContent = mood.emoji;
  document.getElementById("r-kicker").textContent = dayLabel(i);
  document.getElementById("r-title").textContent = mood.label;

  const text = document.getElementById("r-text");
  text.innerHTML = "";
  if (flat) {
    text.append(c.name + " closed exactly the same as the day before, at " + money(d.close) + ".");
  } else {
    const change = el("span", up ? "gain" : "loss", (up ? "up " : "down ") + pctText(dayChange(c.days, i)));
    text.append(c.name + " went ", change, " to " + money(d.close) + ".");
  }

  // How the prediction did (and your guess, if you made one).
  const check = document.getElementById("r-check");
  check.innerHTML = "";
  check.append(el("li", null, directionCheck("The app", f.appUp / f.appTotal, up, flat)));
  const hit = inRange(d.close, f.appLow, f.appHigh);
  check.append(el("li", null, (hit ? "✅ It landed inside" : "❌ It landed outside") + " the likely range " +
    money(f.appLow) + " to " + money(f.appHigh) + (hit ? "." : " (expected about 2 times in 10).")));
  if (f.yourUp != null) check.append(el("li", null, directionCheck("You", f.yourUp, up, flat)));

  // Details (numbers, mini charts, scoring) stay folded until asked for.
  const details = document.getElementById("r-details");
  details.innerHTML = "";
  details.hidden = true;
  renderDayReport(details, c, i, { noHead: true });
  const detailsBtn = document.getElementById("r-details-btn");
  detailsBtn.textContent = "Show details ▾";
  detailsBtn.setAttribute("aria-expanded", "false");

  const week = document.getElementById("r-week");
  week.innerHTML = "";
  if (i % 5 === 4) renderWeekReport(week, c, i);

  const record = document.getElementById("r-record");
  record.innerHTML = "";
  renderTrackRecord(record, c);

  showScreen("result-screen");
}

document.getElementById("r-details-btn").addEventListener("click", () => {
  const details = document.getElementById("r-details");
  const btn = document.getElementById("r-details-btn");
  details.hidden = !details.hidden;
  btn.textContent = details.hidden ? "Show details ▾" : "Hide details ▴";
  btn.setAttribute("aria-expanded", details.hidden ? "false" : "true");
});

document.getElementById("r-next-btn").addEventListener("click", () => {
  state.showResult = false;
  saveState(state);
  showCompanyScreen();
});

// ---------- Your own guess (optional) and the "Next day" button ----------
// The guess only counts if its box is open. Remember open/closed between visits.
const guessBox = document.getElementById("guess-box");
guessBox.addEventListener("toggle", () => {
  state.guessOpen = guessBox.open;
  saveState(state);
});

const gUp = document.getElementById("g-up");
const gUpNum = document.getElementById("g-up-num");
const gLow = document.getElementById("g-low");
const gHigh = document.getElementById("g-high");
const gReason = document.getElementById("g-reason");
const gRangeError = document.getElementById("g-range-error");

function setGuess(value) {
  const v = Math.min(99, Math.max(1, Math.round(Number(value) || 50)));
  gUp.value = v;
  gUp.setAttribute("aria-valuetext", v + "% up, " + (100 - v) + "% down");
  document.getElementById("g-up-val").textContent = v + "%";
  document.getElementById("g-down-val").textContent = (100 - v) + "%";
  return v;
}
gUp.addEventListener("input", () => { gUpNum.value = setGuess(gUp.value); });
gUpNum.addEventListener("input", () => {
  if (gUpNum.value !== "") setGuess(gUpNum.value);
});
gUpNum.addEventListener("change", () => { gUpNum.value = setGuess(gUpNum.value); });

// Returns {low, high}, or null for no range, or a string with an error.
function readRange() {
  const lowText = gLow.value.trim();
  const highText = gHigh.value.trim();
  if (lowText === "" && highText === "") return null;
  if (lowText === "" || highText === "") return "Please fill in both prices, or leave both empty.";
  const low = Number(lowText);
  const high = Number(highText);
  if (!(low > 0) || !(high > 0)) return "Prices must be more than $0.";
  if (low >= high) return "The first price must be lower than the second.";
  return { low: Math.round(low * 100) / 100, high: Math.round(high * 100) / 100 };
}

function resetGuess() {
  gUpNum.value = setGuess(50);
  gLow.value = "";
  gHigh.value = "";
  gReason.value = "";
  showError(gLow, gRangeError, "");
  gHigh.classList.remove("invalid");
}

document.getElementById("next-day-btn").addEventListener("click", () => {
  const c = state.company;
  const guessing = guessBox.open;
  const range = guessing ? readRange() : null;
  if (typeof range === "string") {
    document.getElementById("g-range-box").open = true;
    showError(gLow, gRangeError, range);
    gHigh.classList.add("invalid");
    gLow.focus();
    return;
  }

  // Lock in the app's prediction (and your guess) BEFORE the day is made.
  // yourUp is null when you didn't add a guess.
  const i = c.days.length;
  const step = currentForecast.steps[0];
  c.forecasts[i] = {
    yourUp: guessing ? setGuess(gUpNum.value) / 100 : null,
    yourLow: range ? range.low : null,
    yourHigh: range ? range.high : null,
    reason: guessing ? gReason.value.trim().slice(0, 200) : "",
    appUp: step.up,
    appTotal: currentForecast.total,
    appLow: Math.round(step.p10 * 100) / 100,
    appHigh: Math.round(step.p90 * 100) / 100
  };
  c.days.push(makeNextDay(c));
  state.showResult = true;
  saveState(state);
  resetGuess();
  showResultScreen();
});

function checkPrice() {
  const value = Number(priceInput.value);
  if (priceInput.value.trim() === "" || !Number.isFinite(value)) {
    return "Please type a starting price.";
  }
  if (value < 1 || value > 1000) {
    return "The starting price must be between $1 and $1,000.";
  }
  return "";
}

function checkIndustry() {
  if (industrySelect.value !== "custom") return "";
  const text = normalize(customInput.value);
  if (text.length < 2) return "Please type your industry (at least 2 letters).";
  if (containsCrypto(text)) return "Market School doesn't use crypto. Please pick a different industry.";
  return "";
}

function showError(input, box, message) {
  box.textContent = message;
  input.classList.toggle("invalid", message !== "");
  input.setAttribute("aria-invalid", message !== "" ? "true" : "false");
}

// Clear an error as soon as the user fixes it.
nameInput.addEventListener("input", () => {
  if (nameError.textContent) showError(nameInput, nameError, checkName(nameInput.value));
});
priceInput.addEventListener("input", () => {
  if (priceError.textContent) showError(priceInput, priceError, checkPrice());
});
customInput.addEventListener("input", () => {
  if (industryError.textContent) showError(customInput, industryError, checkIndustry());
});

form.addEventListener("submit", event => {
  event.preventDefault();
  const nameMsg = checkName(nameInput.value);
  const industryMsg = checkIndustry();
  const priceMsg = checkPrice();
  showError(nameInput, nameError, nameMsg);
  showError(customInput, industryError, industryMsg);
  showError(priceInput, priceError, priceMsg);
  if (nameMsg) { nameInput.focus(); return; }
  if (industryMsg) { customInput.focus(); return; }
  if (priceMsg) { priceInput.focus(); return; }

  const industry = industrySelect.value === "custom"
    ? customInput.value.trim().replace(/\s+/g, " ")
    : industrySelect.value;

  // Changing the company starts over (startCompany asks first if there are forecasts to lose).
  startCompany({
    name: nameInput.value.trim(),
    emoji: form.emoji.value,
    industry: industry,
    startPrice: Math.round(Number(priceInput.value) * 100) / 100,
    personality: form.personality.value
  });
});

document.getElementById("edit-btn").addEventListener("click", showPickScreen);

// ---------- Start ----------
buildEmojiGrid();
buildPersonalityList();
const saved = state.company;
const savedIsValid = saved && typeof saved.name === "string" &&
  typeof saved.startPrice === "number" && PERSONALITIES.some(p => p.id === saved.personality);
if (savedIsValid) {
  // Companies saved before charts existed don't have a price history yet.
  if (!Array.isArray(saved.days) || saved.days.length < HISTORY_DAYS) {
    saved.seed = newSeed();
    saved.days = generateHistory(saved);
    saved.forecasts = {};
    saveState(state);
  }
  if (!saved.forecasts) saved.forecasts = {};
  const lastDay = saved.days.length - 1;
  if (state.showResult && saved.forecasts[lastDay]) showResultScreen();
  else showCompanyScreen();
} else {
  state.company = null;
  showScreen("welcome-screen");
}
