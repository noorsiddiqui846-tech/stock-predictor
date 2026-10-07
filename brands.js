// Well-known real company names. Used only for a friendly reminder to pick
// an invented name. It is not strict security and will never be complete.

// Distinctive names: flagged if they appear anywhere in the name as a word.
const DISTINCT_BRANDS = [
  // Tech
  "google", "alphabet", "microsoft", "facebook", "meta platforms", "instagram",
  "whatsapp", "youtube", "netflix", "nvidia", "intel", "amd", "qualcomm", "samsung",
  "huawei", "xiaomi", "oppo", "vivo", "oneplus", "lenovo", "dell", "hewlett packard",
  "ibm", "cisco", "adobe", "salesforce", "spotify", "lyft", "airbnb", "tiktok",
  "bytedance", "snapchat", "pinterest", "linkedin", "paypal", "ebay",
  "alibaba", "tencent", "baidu", "sony", "nintendo", "playstation", "xbox", "logitech",
  "asus", "acer", "toshiba", "panasonic", "philips", "siemens", "bosch", "hitachi",
  "fujitsu", "broadcom", "texas instruments", "micron", "tsmc", "openai", "anthropic",
  "zoom video", "dropbox", "shopify", "stripe", "palantir", "snowflake", "oracle corp",
  "accenture", "infosys", "wipro", "tata", "reliance", "jio", "careem",
  "foodpanda", "daraz", "telenor", "zong", "ufone", "vodafone", "verizon",
  "t mobile", "comcast", "disney", "warner bros", "paramount", "twitch", "reddit",
  "wikipedia", "yahoo", "motorola", "nokia", "ericsson", "blackberry", "canon", "nikon",
  "gopro", "fitbit", "garmin",
  // Cars
  "tesla", "toyota", "honda", "nissan", "hyundai", "kia", "volkswagen", "bmw",
  "mercedes", "mercedes benz", "audi", "porsche", "ferrari", "lamborghini", "maserati",
  "bentley", "rolls royce", "chevrolet", "chevy", "general motors", "chrysler", "jeep",
  "suzuki", "mitsubishi", "mazda", "subaru", "volvo", "peugeot", "renault",
  "citroen", "fiat", "skoda", "lexus", "infiniti", "land rover", "harley davidson",
  "yamaha", "kawasaki", "ducati", "byd", "rivian", "lucid motors", "geely", "chery",
  "haval", "changan", "mahindra", "bridgestone", "michelin", "goodyear",
  // Energy
  "exxon", "exxonmobil", "chevron", "bp", "totalenergies", "conocophillips", "aramco",
  "saudi aramco", "gazprom", "petronas", "petrobras", "sinopec", "petrochina", "lukoil",
  "halliburton", "schlumberger", "duke energy", "nextera", "k electric", "pso",
  "pakistan state oil", "engro", "ogdcl", "attock",
  // Food and drink
  "coca cola", "pepsi", "pepsico", "nestle", "mcdonalds", "kfc", "burger king",
  "starbucks", "dominos", "pizza hut", "taco bell", "wendys", "dunkin",
  "kraft", "heinz", "unilever", "danone", "kelloggs", "hershey", "cadbury",
  "mondelez", "ferrero", "nutella", "doritos", "red bull", "monster energy",
  "tyson", "kitkat", "oreo", "sprite", "fanta", "nescafe", "lipton", "tapal",
  "national foods", "olpers", "nurpur", "haleeb", "peek freans", "english biscuit",
  "hardees", "papa johns", "chipotle", "costa coffee", "tim hortons", "krispy kreme",
  "baskin robbins", "ben jerrys", "budweiser", "heineken",
  // Fashion and retail
  "nike", "adidas", "reebok", "under armour", "new balance",
  "gucci", "prada", "louis vuitton", "chanel", "dior", "versace", "armani",
  "burberry", "balenciaga", "rolex", "cartier", "zara", "h and m",
  "hennes", "uniqlo", "levis", "ralph lauren", "tommy hilfiger", "calvin klein",
  "lacoste", "skechers", "crocs", "khaadi", "gul ahmed", "alkaram",
  "nishat", "junaid jamshed", "bata",
  "walmart", "costco", "ikea", "aldi", "lidl", "tesco", "carrefour", "sephora",
  "loreal", "maybelline", "nivea", "gillette", "colgate", "procter and gamble",
  "p and g", "johnson and johnson", "shein", "temu", "primark", "gap inc", "best buy",
  // Healthcare
  "pfizer", "moderna", "astrazeneca", "novartis", "roche", "merck", "sanofi",
  "glaxosmithkline", "gsk", "bayer", "abbott", "eli lilly", "bristol myers",
  "novo nordisk", "medtronic", "cvs", "walgreens", "unitedhealth",
  "getz pharma", "searle", "ferozsons", "biontech", "gilead", "amgen", "regeneron",
  // Banks and finance
  "jpmorgan", "jp morgan", "goldman sachs", "morgan stanley", "citibank", "citigroup",
  "wells fargo", "bank of america", "hsbc", "barclays", "standard chartered",
  "deutsche bank", "credit suisse", "mastercard", "american express", "amex",
  "blackrock", "berkshire hathaway", "visa inc",
  "hbl", "habib bank", "ubl", "meezan", "allied bank", "bank alfalah",
  "easypaisa", "jazzcash",
  // Other big names
  "boeing", "airbus", "lockheed martin", "general electric", "caterpillar",
  "fedex", "dhl", "emirates", "qatar airways", "lucky cement",
  "hilton", "marriott", "lego", "hasbro", "mattel"
];

// Brands that are also everyday words (Apple, Shell, Jazz...). These are only
// flagged when the whole name is that brand, e.g. "Apple" or "Shell Inc",
// so "Apple Pie Bakery" or "Jazz Cafe" is still allowed.
const COMMON_WORD_BRANDS = [
  "apple", "shell", "target", "gap", "visa", "oracle", "meta", "ford", "dove", "mars",
  "total", "orange", "amazon", "subway", "monster", "puma", "jaguar", "corona",
  "zoom", "square", "block", "slack", "uber", "galaxy", "pixel", "kindle", "sapphire",
  "outfitters", "next", "mango", "boots", "ups", "lucky", "united", "delta", "x",
  "twitter", "jazz", "shan", "walls", "magnum", "lilly", "vans", "omega", "lays",
  "bonanza", "servis", "sap", "tiffany", "hermes", "fidelity", "vanguard", "converse",
  "dodge", "proton", "coke", "pia", "mcb", "ubs", "agp", "dawn", "tide", "surf",
  "lux", "ariel", "sunsilk", "safeguard", "lipton", "dalda"
];

// Words ignored when comparing whole names ("Apple Inc" -> "apple").
const COMPANY_SUFFIXES = [
  "inc", "incorporated", "corp", "corporation", "co", "company", "ltd", "limited",
  "llc", "plc", "group", "holdings", "motors", "industries", "the"
];

// Crypto words (the app has no crypto anywhere).
const CRYPTO_WORDS = [
  "crypto", "bitcoin", "btc", "ethereum", "eth", "dogecoin", "doge", "solana",
  "blockchain", "nft", "token", "altcoin", "binance", "coinbase", "litecoin",
  "ripple", "xrp", "tether", "usdt", "shiba", "memecoin", "defi", "web3"
];
