// Market School: banner, light/dark mode, create-your-company form, and the 30-day chart.

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
const createScreen = document.getElementById("create-screen");
const companyScreen = document.getElementById("company-screen");
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

function showCreateScreen() {
  companyScreen.hidden = true;
  createScreen.hidden = false;
  const c = state.company;
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
  window.scrollTo(0, 0);
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
  down.textContent = downWord + " " + chanceText(step.down, total) + " ▼";
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

// Show the report for the latest day (and the week report on Fridays),
// but only for days you forecast with the "Next day" button.
function fillReport(c) {
  const box = document.getElementById("report");
  box.innerHTML = "";
  const i = c.days.length - 1;
  if (!c.forecasts[i]) return;
  renderDayReport(box, c, i);
  if (i % 5 === 4) renderWeekReport(box, c, i);
}

function showCompanyScreen(scrollToReport) {
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
  fillReport(c);

  createScreen.hidden = true;
  companyScreen.hidden = false; // must be visible before drawing, so the chart knows its width
  drawPriceChart(document.getElementById("chart"), c.days, currentForecast);
  const report = document.getElementById("report");
  if (scrollToReport && report.firstChild) report.scrollIntoView();
  else window.scrollTo(0, 0);
}

// ---------- Your guess and the "Next day" button ----------
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
  const range = readRange();
  if (typeof range === "string") {
    document.getElementById("g-range-box").open = true;
    showError(gLow, gRangeError, range);
    gHigh.classList.add("invalid");
    gLow.focus();
    return;
  }

  // Lock in both forecasts BEFORE the day is made.
  const i = c.days.length;
  const step = currentForecast.steps[0];
  c.forecasts[i] = {
    yourUp: setGuess(gUpNum.value) / 100,
    yourLow: range ? range.low : null,
    yourHigh: range ? range.high : null,
    reason: gReason.value.trim().slice(0, 200),
    appUp: step.up,
    appTotal: currentForecast.total,
    appLow: Math.round(step.p10 * 100) / 100,
    appHigh: Math.round(step.p90 * 100) / 100
  };
  c.days.push(makeNextDay(c));
  saveState(state);
  resetGuess();
  showCompanyScreen(true);
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

  // Changing the company starts over, so check first if there are forecasts to lose.
  const old = state.company;
  const forecastCount = old && old.forecasts ? Object.keys(old.forecasts).length : 0;
  if (forecastCount > 0 && !window.confirm("This makes a new price history and clears your " +
      forecastCount + " forecast" + (forecastCount === 1 ? "" : "s") + ". Continue?")) {
    return;
  }

  const company = {
    name: nameInput.value.trim(),
    emoji: form.emoji.value,
    industry: industry,
    startPrice: Math.round(Number(priceInput.value) * 100) / 100,
    personality: form.personality.value,
    seed: newSeed(),
    createdAt: new Date().toISOString()
  };
  company.days = generateHistory(company);
  company.forecasts = {}; // day number -> your forecast and the app's, locked in before the day
  state.company = company;
  saveState(state);
  showCompanyScreen();
});

document.getElementById("edit-btn").addEventListener("click", showCreateScreen);

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
  showCompanyScreen();
} else {
  state.company = null;
  showCreateScreen();
}
