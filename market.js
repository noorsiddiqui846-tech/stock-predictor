// Made-up market: turns a company's personality into made-up daily prices and news.

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const HISTORY_DAYS = 30; // 6 weeks of Mon-Fri

// How each personality moves.
// drift = average move per day (0.004 = +0.4%); only Growing and Struggling have one.
// vol = how big a normal day's wiggle is,
// goodNews = chance that a news event is good rather than bad.
const PERSONALITY_SETTINGS = {
  calm:       { drift:  0,      vol: 0.008, goodNews: 0.5 },
  wild:       { drift:  0,      vol: 0.035, goodNews: 0.5 },
  growing:    { drift:  0.004,  vol: 0.015, goodNews: 0.65 },
  struggling: { drift: -0.004,  vol: 0.015, goodNews: 0.35 },
  random:     { drift:  0,      vol: 0.02,  goodNews: 0.5 }
};

const NEWS_CHANCE = 0.15; // about 1 news day in 7

// Made-up headlines. {name} is replaced with the company name.
const HEADLINES = {
  General: {
    good: ["{name} wins a big new customer", "{name} sales beat expectations",
           "Experts praise a new product from {name}", "{name} cuts costs and saves money"],
    bad:  ["{name} sales are slower than expected", "A top manager leaves {name}",
           "{name} loses a big customer", "Customers complain about a {name} product"]
  },
  Food: {
    good: ["A new recipe from {name} goes viral", "{name} opens 10 new shops",
           "Food critics love the new {name} menu"],
    bad:  ["Ingredient prices jump, hurting {name}", "Inspectors find problems in a {name} kitchen",
           "{name} recalls a batch of snacks"]
  },
  Tech: {
    good: ["{name} launches a hit new app", "{name} signs a deal with a big school network",
           "A new {name} gadget sells out"],
    bad:  ["The {name} app crashes for a whole day", "{name} delays its new gadget",
           "A security bug is found in {name} software"]
  },
  Cars: {
    good: ["The new {name} model sells out", "{name} cars win a safety award",
           "{name} opens a new factory"],
    bad:  ["{name} recalls cars over a brake problem", "A parts shortage slows {name} factories",
           "Reviewers dislike the new {name} model"]
  },
  Energy: {
    good: ["{name} opens a big new solar farm", "{name} signs a long power deal with a city",
           "A cheaper battery from {name} works in tests"],
    bad:  ["A storm damages a {name} power plant", "{name} project runs over budget",
           "New rules raise costs for {name}"]
  },
  Fashion: {
    good: ["A famous designer joins {name}", "The new {name} collection is a hit",
           "{name} opens a flagship store"],
    bad:  ["The new {name} collection gets bad reviews", "{name} has too much unsold stock",
           "Shipping delays leave {name} shelves empty"]
  },
  Healthcare: {
    good: ["A {name} medicine passes a key test", "Hospitals sign up for {name} equipment",
           "{name} gets approval for a new treatment"],
    bad:  ["A {name} medicine trial is delayed", "{name} recalls a medical device",
           "A {name} treatment fails a test"]
  }
};

// ---------- Seeded randomness ----------
// The same seed always gives the same "random" numbers, so a company's
// history can be rebuilt exactly (useful later for replay codes).
function makeRandom(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A bell-curve random number: usually near 0, sometimes bigger.
function randomNormal(rand) {
  let u = 0;
  while (u === 0) u = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

function newSeed() {
  return Math.floor(Math.random() * 4294967296);
}

// 1234.5 -> "$1,234.50"
function money(x) {
  return "$" + x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function roundMoney(x) {
  return Math.max(0.01, Math.round(x * 100) / 100);
}

function pick(list, rand) {
  return list[Math.floor(rand() * list.length)];
}

// ---------- Days ----------
function dayLabel(index) {
  return "Week " + (Math.floor(index / 5) + 1) + " · " + WEEKDAYS[index % 5];
}

function makeDay(index, prevClose, company, rand) {
  const s = PERSONALITY_SETTINGS[company.personality];

  // Price can jump a little overnight before the day starts.
  // Day 1 opens at exactly the starting price the user chose.
  const gap = randomNormal(rand) * s.vol * 0.25;
  const open = index === 0 ? prevClose : prevClose * (1 + gap);

  // Sometimes there is made-up news, which moves the price 2-4x a normal day.
  let news = null;
  let shock = 0;
  if (rand() < NEWS_CHANCE) {
    const good = rand() < s.goodNews;
    const set = HEADLINES[company.industry] || HEADLINES.General;
    const list = rand() < 0.5 ? set[good ? "good" : "bad"] : HEADLINES.General[good ? "good" : "bad"];
    news = { text: pick(list, rand).replace("{name}", company.name), good: good };
    shock = (good ? 1 : -1) * s.vol * (2 + rand() * 2);
  }

  const change = s.drift + s.vol * randomNormal(rand) + shock;
  const close = open * Math.exp(change);
  const high = Math.max(open, close) * (1 + Math.abs(randomNormal(rand)) * s.vol * 0.4);
  const low = Math.min(open, close) * (1 - Math.abs(randomNormal(rand)) * s.vol * 0.4);

  return {
    index: index,
    open: roundMoney(open),
    high: roundMoney(high),
    low: roundMoney(low),
    close: roundMoney(close),
    news: news
  };
}

// Make the company's last 30 made-up trading days.
function generateHistory(company) {
  const rand = makeRandom(company.seed);
  const days = [];
  let prev = company.startPrice;
  for (let i = 0; i < HISTORY_DAYS; i++) {
    const day = makeDay(i, prev, company, rand);
    days.push(day);
    prev = day.close;
  }
  return days;
}

// ---------- New days ----------
// Each new day has its own seed (company seed + day number), so a saved day
// can never be re-rolled by reloading the page.
function makeNextDay(company) {
  const days = company.days;
  const index = days.length;
  const rand = makeRandom((company.seed ^ Math.imul(index + 1, 2654435761)) >>> 0);
  return makeDay(index, days[index - 1].close, company, rand);
}

// Day i's change from the previous close, as a fraction (0.012 = +1.2%).
// Day 1 compares with its own open (the starting price).
function dayChange(days, i) {
  const prev = i > 0 ? days[i - 1].close : days[i].open;
  return (days[i].close - prev) / prev;
}

// The latest 30 days (what the main chart and the forecast use).
function recentDays(days) {
  return days.slice(-HISTORY_DAYS);
}
