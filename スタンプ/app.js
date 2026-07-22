const STORAGE_KEY = "hounyan-stamp-ledger-v1";
const BACKUP_STORAGE_KEY = `${STORAGE_KEY}-broken-backup`;
const AUTO_BACKUP_STORAGE_KEY = `${STORAGE_KEY}-auto-backups`;
const AUTO_BACKUP_LIMIT = 6;
const AUTO_BACKUP_BUCKET_MS = 3 * 60 * 1000;
const SHEET_SIZE = 20;
const STAMP_BATCH_MAX = SHEET_SIZE;
const STAMP_SET_MAX_MEMBERS = 12;
const TEST_STUDENT_NAME = "テスト児童";
const TEST_AVAILABLE_SHEETS = Number.MAX_SAFE_INTEGER;
const WEEKDAYS = ["月", "火", "水", "木", "金"];
const DEFAULT_PERIOD_COUNT = 6;
const CalendarDate = window.HounyanCalendar;
const defaultSubjects = [
  "国語", "算数", "理科", "社会", "生活", "音楽", "図工", "体育", "道徳",
  "外国語", "外国語活動", "総合", "学級活動", "自立活動", "交流", "行事", "その他",
].map((name, index) => ({ id: `subject-${index + 1}`, name, sortOrder: index, enabled: true }));
const calendarEventTypes = [
  ["school-event", "学校行事"], ["grade-event", "学年行事"], ["group-event", "組の予定"],
  ["holiday", "休業日"], ["substitute-holiday", "振替休日"], ["school-closure", "臨時休校"],
  ["long-vacation", "長期休業"], ["saturday-school", "土曜授業"], ["shortened", "短縮授業"],
  ["timetable-change", "時間割変更"], ["deadline", "締切"], ["other", "その他"],
];
const TIMER_DEFAULT_SECONDS = 5 * 60;
const TIMER_MAX_SECONDS = 99 * 60 + 59;
const TIMER_FINISH_SOUNDS = {
  study: "assets/timer-sounds/study-finish.wav",
  play: "assets/timer-sounds/play-finish.wav",
};
const TIMER_FINISH_MESSAGES = {
  study:
    '<ruby>時間<rt>じかん</rt></ruby>だよ、<ruby>勉強<rt>べんきょう</rt></ruby><ruby>お疲れ様<rt>おつかれさま</rt></ruby>。がんばったね！',
  play:
    '<ruby>時間<rt>じかん</rt></ruby>だよ、<ruby>席<rt>せき</rt></ruby>に<ruby>戻<rt>もど</rt></ruby>って<ruby>勉強<rt>べんきょう</rt></ruby>を<ruby>頑張ろう<rt>がんばろう</rt></ruby>！',
};
const REMOVED_PURCHASABLE_STAMP_IDS = new Set([
  "shop-hanamaru",
  "shop-sugoi",
  "shop-nice",
  "shop-fight",
  "shop-dekita",
  "shop-challenge",
  "shop-teinei",
  "shop-hirameki",
  "shop-shuchu",
  "shop-yasashii",
  "shop-special-rainbow",
  "shop-special-legend",
  "shop-special-gorgeous",
]);

const defaultStampAssets = [
  {
    id: "sonochoshi",
    name: "そのちょうし",
    reading: "そのちょうし",
    src: "assets/stamp-sonochoshi.png",
    unlockAt: 0,
  },
  {
    id: "yokudekimashita",
    name: "よくできました",
    reading: "よくできました",
    src: "assets/stamp-yokudekimashita.png",
    unlockAt: 20,
  },
  {
    id: "sasuga",
    name: "さすが",
    reading: "さすが",
    src: "assets/stamp-sasuga.png",
    unlockAt: 40,
  },
  {
    id: "ganbattane",
    name: "がんばったね",
    reading: "がんばったね",
    src: "assets/stamp-ganbattane.png",
    unlockAt: 60,
  },
  {
    id: "hounyan-nice",
    name: "ナイス",
    reading: "ないす",
    src: "assets/hounyan-stamps/hounyan-stamp-03.png",
    unlockAt: 80,
  },
  {
    id: "hounyan-yattane",
    name: "やったね",
    reading: "やったね",
    src: "assets/hounyan-stamps/hounyan-stamp-04.png",
    unlockAt: 100,
  },
  {
    id: "hounyan-sutekidane",
    name: "すてきだね",
    reading: "すてきだね",
    src: "assets/hounyan-stamps/hounyan-stamp-07.png",
    unlockAt: 120,
  },
  {
    id: "hounyan-eraine",
    name: "えらいね",
    reading: "えらいね",
    src: "assets/hounyan-stamps/hounyan-stamp-08.png",
    unlockAt: 140,
  },
  {
    id: "hounyan-bacchiri",
    name: "ばっちり",
    reading: "ばっちり",
    src: "assets/hounyan-stamps/hounyan-stamp-09.png",
    unlockAt: 160,
  },
  {
    id: "hounyan-saikou",
    name: "さいこう",
    reading: "さいこう",
    src: "assets/hounyan-stamps/hounyan-stamp-10.png",
    unlockAt: 180,
  },
  {
    id: "hounyan-petit-special-bronze",
    name: "プチスペシャル",
    reading: "ぷちすぺしゃる",
    src: "assets/hounyan-stamps/hounyan-stamp-01.png",
    unlockAt: 200,
    rarity: "special",
  },
  {
    id: "hounyan-petit-special-silver",
    name: "プチスペシャル銀",
    reading: "ぷちすぺしゃるぎん",
    src: "assets/hounyan-stamps/hounyan-stamp-02.png",
    unlockAt: 220,
    rarity: "special",
  },
  {
    id: "hounyan-special",
    name: "スペシャル",
    reading: "すぺしゃる",
    src: "assets/hounyan-stamps/hounyan-stamp-06.png",
    unlockAt: 240,
    rarity: "special",
  },
  {
    id: "hounyan-super-special",
    name: "スーパースペシャル",
    reading: "すーぱーすぺしゃる",
    src: "assets/hounyan-stamps/hounyan-stamp-05.png",
    unlockAt: 260,
    rarity: "special",
  },
  {
    id: "shop-medal",
    name: "きんメダル",
    reading: "きんメダル",
    src: "assets/shop-stamps/stamp-shop-medal.png",
    unlockAt: 0,
    purchaseOnly: true,
    shopPriceSheets: 1,
    rarity: "normal",
  },
  {
    id: "shop-ticket",
    name: "ごほうびきっぷ",
    reading: "ごほうびきっぷ",
    src: "assets/shop-stamps/stamp-shop-ticket.png",
    unlockAt: 0,
    purchaseOnly: true,
    shopPriceSheets: 1,
    rarity: "normal",
  },
  {
    id: "shop-ribbon",
    name: "ごほうびリボン",
    reading: "ごほうびリボン",
    src: "assets/shop-stamps/stamp-shop-ribbon.png",
    unlockAt: 0,
    purchaseOnly: true,
    shopPriceSheets: 2,
    rarity: "normal",
  },
  {
    id: "shop-bell",
    name: "しゅっぱつベル",
    reading: "しゅっぱつベル",
    src: "assets/shop-stamps/stamp-shop-bell.png",
    unlockAt: 0,
    purchaseOnly: true,
    shopPriceSheets: 2,
    rarity: "normal",
  },
  {
    id: "shop-trophy",
    name: "トロフィー",
    reading: "トロフィー",
    src: "assets/shop-stamps/stamp-shop-trophy.png",
    unlockAt: 0,
    purchaseOnly: true,
    shopPriceSheets: 3,
    rarity: "special",
  },
  {
    id: "shop-rainbow-train",
    name: "にじいろでんしゃ",
    reading: "にじいろでんしゃ",
    src: "assets/shop-stamps/stamp-shop-rainbow-train.png",
    unlockAt: 0,
    purchaseOnly: true,
    shopPriceSheets: 3,
    rarity: "special",
  },
];

const builtInStampSetDefinitions = [
  {
    id: "built-in-animals",
    name: "どうぶつセット",
    slug: "animals",
    seriesId: "animal-friends",
    seriesName: "どうぶつのなかま",
    tier: 1,
    members: [
      ["cat", "ねこ"], ["dog", "いぬ"], ["rabbit", "うさぎ"],
      ["elephant", "ぞう"], ["giraffe", "きりん"], ["penguin", "ペンギン"],
    ],
  },
  {
    id: "built-in-animals-special",
    name: "とくべつどうぶつセット",
    slug: "animals-special",
    priceSheets: 1,
    requiresSetId: "built-in-animals",
    seriesId: "animal-friends",
    seriesName: "どうぶつのなかま",
    tier: 2,
    members: [
      ["red-panda", "レッサーパンダ"], ["lion", "ライオン"], ["koala", "コアラ"],
      ["alpaca", "アルパカ"], ["dolphin", "イルカ"], ["owl", "フクロウ"],
    ],
  },
  {
    id: "built-in-animals-dream",
    name: "ゆめのどうぶつセット",
    slug: "animals-dream",
    priceSheets: 2,
    requiresSetId: "built-in-animals-special",
    seriesId: "animal-friends",
    seriesName: "どうぶつのなかま",
    tier: 3,
    members: [
      ["snow-leopard", "ゆきひょう"], ["swan", "はくちょう"], ["golden-fox", "きんいろきつね"],
      ["peacock", "くじゃく"], ["manta", "まんた"], ["polar-bear", "しろくま"],
    ],
  },
  {
    id: "built-in-vehicles",
    name: "のりものセット",
    slug: "vehicles",
    seriesId: "vehicle-adventure",
    seriesName: "のりもののたび",
    tier: 1,
    members: [
      ["car", "くるま"], ["bus", "バス"], ["fire-engine", "しょうぼうしゃ"],
      ["ambulance", "きゅうきゅうしゃ"], ["airplane", "ひこうき"], ["ship", "ふね"],
    ],
  },
  {
    id: "built-in-vehicles-special",
    name: "とくべつのりものセット",
    slug: "vehicles-special",
    priceSheets: 1,
    requiresSetId: "built-in-vehicles",
    seriesId: "vehicle-adventure",
    seriesName: "のりもののたび",
    tier: 2,
    members: [
      ["sports-car", "スポーツカー"], ["crane-truck", "クレーントラック"], ["mixer-truck", "ミキサートラック"],
      ["ferry", "フェリー"], ["helicopter", "ヘリコプター"], ["rocket", "ロケット"],
    ],
  },
  {
    id: "built-in-vehicles-dream",
    name: "ゆめののりものセット",
    slug: "vehicles-dream",
    priceSheets: 2,
    requiresSetId: "built-in-vehicles-special",
    seriesId: "vehicle-adventure",
    seriesName: "のりもののたび",
    tier: 3,
    members: [
      ["gold-car", "きんのスポーツカー"], ["future-bus", "みらいバス"], ["rescue-ship", "きゅうじょせん"],
      ["shuttle", "スペースシャトル"], ["expedition-truck", "ぼうけんトラック"], ["airship", "ひこうせん"],
    ],
  },
  {
    id: "built-in-trains",
    name: "でんしゃセット",
    slug: "trains",
    seriesId: "train-journey",
    seriesName: "でんしゃのたび",
    tier: 1,
    members: [
      ["local", "ローカルでんしゃ"], ["express", "とっきゅう"], ["bullet", "しんかんせん"],
      ["electric-locomotive", "でんききかんしゃ"], ["monorail", "モノレール"], ["steam", "エスエル"],
    ],
  },
  {
    id: "built-in-trains-special",
    name: "とくべつでんしゃセット",
    slug: "trains-special",
    priceSheets: 1,
    requiresSetId: "built-in-trains",
    seriesId: "train-journey",
    seriesName: "でんしゃのたび",
    tier: 2,
    members: [
      ["red-express", "あかいとっきゅう"], ["blue-sleeper", "ブルートレイン"], ["observation", "ながめでんしゃ"],
      ["mountain", "やまでんしゃ"], ["coast", "うみでんしゃ"], ["gold-express", "きんいろでんしゃ"],
    ],
  },
  {
    id: "built-in-trains-dream",
    name: "ゆめのでんしゃセット",
    slug: "trains-dream",
    priceSheets: 2,
    requiresSetId: "built-in-trains-special",
    seriesId: "train-journey",
    seriesName: "でんしゃのたび",
    tier: 3,
    members: [
      ["starry", "ほしぞらでんしゃ"], ["rainbow", "にじでんしゃ"], ["jewel", "ほうせきでんしゃ"],
      ["golden", "おうごんでんしゃ"], ["snow", "ゆきでんしゃ"], ["moon", "つきよでんしゃ"],
    ],
  },
  {
    id: "built-in-train-items",
    name: "でんしゃどうぐセット",
    slug: "train-items",
    seriesId: "station-adventure",
    seriesName: "えきのぼうけん",
    tier: 1,
    members: [
      ["ticket", "きっぷ"], ["station", "えき"], ["crossing", "ふみきり"],
      ["signal", "しんごう"], ["platform", "ホーム"], ["conductor-cap", "しゃしょうぼう"],
    ],
  },
  {
    id: "built-in-train-items-special",
    name: "とくべつでんしゃどうぐセット",
    slug: "train-items-special",
    priceSheets: 1,
    requiresSetId: "built-in-train-items",
    seriesId: "station-adventure",
    seriesName: "えきのぼうけん",
    tier: 2,
    members: [
      ["bento", "えきべん"], ["suitcase", "スーツケース"], ["lantern", "ランタン"],
      ["ticket-scissors", "きっぷばさみ"], ["whistle", "ふえ"], ["station-clock", "えきどけい"],
    ],
  },
  {
    id: "built-in-train-items-dream",
    name: "ゆめのでんしゃどうぐセット",
    slug: "train-items-dream",
    priceSheets: 2,
    requiresSetId: "built-in-train-items-special",
    seriesId: "station-adventure",
    seriesName: "えきのぼうけん",
    tier: 3,
    members: [
      ["gold-ticket", "きんのきっぷ"], ["jewel-lantern", "ほうせきランタン"], ["pocket-watch", "ぎんのどけい"],
      ["conductor-cap", "しゃしょうぼう"], ["bell", "きんのベル"], ["royal-trunk", "おうさまのトランク"],
    ],
  },
  {
    id: "built-in-sweets",
    name: "おかしセット",
    slug: "sweets",
    seriesId: "sweet-kingdom",
    seriesName: "おかしのくに",
    tier: 1,
    members: [
      ["cake", "ケーキ"], ["donut", "ドーナツ"], ["pudding", "プリン"],
      ["candy", "あめ"], ["chocolate", "チョコレート"], ["cookie", "クッキー"],
    ],
  },
  {
    id: "built-in-sweets-special",
    name: "とくべつおかしセット",
    slug: "sweets-special",
    priceSheets: 1,
    requiresSetId: "built-in-sweets",
    seriesId: "sweet-kingdom",
    seriesName: "おかしのくに",
    tier: 2,
    members: [
      ["parfait", "パフェ"], ["fruit-tart", "フルーツタルト"], ["macarons", "マカロン"],
      ["chocolate-fountain", "チョコレートファウンテン"], ["sundae", "アイスパフェ"], ["cream-puff", "シュークリーム"],
    ],
  },
  {
    id: "built-in-sweets-dream",
    name: "ゆめのおかしセット",
    slug: "sweets-dream",
    priceSheets: 2,
    requiresSetId: "built-in-sweets-special",
    seriesId: "sweet-kingdom",
    seriesName: "おかしのくに",
    tier: 3,
    members: [
      ["rainbow-cake", "にじいろケーキ"], ["crown-pudding", "おうかんプリン"], ["jewel-candy", "ほうせきあめ"],
      ["moon-macaron", "つきマカロン"], ["golden-cookie", "きんのクッキー"], ["star-chocolate", "ほしチョコレート"],
    ],
  },
  {
    id: "built-in-gems",
    name: "ほうせきセット",
    slug: "gems",
    rarity: "special",
    seriesId: "gem-world",
    seriesName: "ほうせきのせかい",
    tier: 1,
    members: [
      ["ruby", "ルビー"], ["sapphire", "サファイア"], ["emerald", "エメラルド"],
      ["diamond", "ダイヤ"], ["amethyst", "アメジスト"], ["pearl", "パール"],
    ],
  },
  {
    id: "built-in-gems-special",
    name: "とくべつほうせきセット",
    slug: "gems-special",
    priceSheets: 1,
    requiresSetId: "built-in-gems",
    seriesId: "gem-world",
    seriesName: "ほうせきのせかい",
    tier: 2,
    rarity: "special",
    members: [
      ["opal", "オパール"], ["aquamarine", "アクアマリン"], ["citrine", "シトリン"],
      ["garnet", "ガーネット"], ["topaz", "トパーズ"], ["tourmaline", "トルマリン"],
    ],
  },
  {
    id: "built-in-gems-dream",
    name: "ゆめのほうせきセット",
    slug: "gems-dream",
    priceSheets: 2,
    requiresSetId: "built-in-gems-special",
    seriesId: "gem-world",
    seriesName: "ほうせきのせかい",
    tier: 3,
    rarity: "special",
    members: [
      ["star-diamond", "ほしダイヤ"], ["rainbow-opal", "にじオパール"], ["golden-crystal", "きんのクリスタル"],
      ["heart-ruby", "ハートルビー"], ["moon-sapphire", "つきサファイア"], ["crown-jewel", "おうかんほうせき"],
    ],
  },
  {
    id: "built-in-osaka-foods",
    name: "大阪グルメセット",
    slug: "osaka-foods",
    priceSheets: 2,
    seriesId: "osaka-foods",
    seriesName: "大阪グルメ",
    tier: 1,
    rarity: "special",
    members: [
      ["takoyaki", "たこやき"], ["okonomiyaki", "おこのみやき"], ["kushikatsu", "くしかつ"],
      ["butaman", "ぶたまん"], ["kitsune-udon", "きつねうどん"], ["mixed-juice", "ミックスジュース"],
    ],
  },
];

const defaultStampSets = builtInStampSetDefinitions.map((stampSet) => ({
  id: stampSet.id,
  name: stampSet.name,
  priceSheets: stampSet.priceSheets || 1,
  memberIds: stampSet.members.map(([key]) => `${stampSet.id}-${key}`),
  hidden: false,
  requiresSetId: stampSet.requiresSetId || "",
  seriesId: stampSet.seriesId || "",
  seriesName: stampSet.seriesName || "",
  tier: stampSet.tier || 1,
}));

defaultStampAssets.push(
  ...builtInStampSetDefinitions.flatMap((stampSet) =>
    stampSet.members.map(([key, name]) => ({
      id: `${stampSet.id}-${key}`,
      name,
      reading: name,
      src: `assets/stamp-sets/${stampSet.slug}/${key}.png`,
      unlockAt: 0,
      purchaseOnly: true,
      shopPriceSheets: stampSet.priceSheets || 1,
      rarity: stampSet.rarity || "normal",
      setId: stampSet.id,
    })),
  ),
);

const builtInStampLegacyNames = new Map([
  ["built-in-animals-penguin", "ぺんぎん"],
  ["built-in-animals-special-red-panda", "れっさーぱんだ"],
  ["built-in-animals-special-lion", "らいおん"],
  ["built-in-animals-special-koala", "こあら"],
  ["built-in-animals-special-alpaca", "あるぱか"],
  ["built-in-animals-special-dolphin", "いるか"],
  ["built-in-animals-special-owl", "ふくろう"],
  ["built-in-vehicles-bus", "ばす"],
  ["built-in-vehicles-special-sports-car", "すぽーつかー"],
  ["built-in-vehicles-special-crane-truck", "くれーんしゃ"],
  ["built-in-vehicles-special-mixer-truck", "みきさーしゃ"],
  ["built-in-vehicles-special-ferry", "ふぇりー"],
  ["built-in-vehicles-special-helicopter", "へりこぷたー"],
  ["built-in-vehicles-special-rocket", "ろけっと"],
  ["built-in-vehicles-dream-gold-car", "きんのすぽーつかー"],
  ["built-in-vehicles-dream-future-bus", "みらいばす"],
  ["built-in-vehicles-dream-shuttle", "すぺーすしゃとる"],
  ["built-in-vehicles-dream-expedition-truck", "ぼうけんとらっく"],
  ["built-in-trains-local", ["ろーかるせん", "ローカルせん"]],
  ["built-in-trains-monorail", "ものれーる"],
  ["built-in-trains-steam", "えすえる"],
  ["built-in-trains-special-blue-sleeper", "あおいねっしゃ"],
  ["built-in-train-items-platform", "ほーむ"],
  ["built-in-train-items-special-suitcase", "すーつけーす"],
  ["built-in-train-items-special-lantern", "らんたん"],
  ["built-in-train-items-dream-jewel-lantern", "ほうせきらんたん"],
  ["built-in-train-items-dream-bell", "きんのべる"],
  ["built-in-train-items-dream-royal-trunk", "おうさまのとらんく"],
  ["built-in-sweets-cake", "けーき"],
  ["built-in-sweets-donut", "どーなつ"],
  ["built-in-sweets-pudding", "ぷりん"],
  ["built-in-sweets-chocolate", "ちょこれーと"],
  ["built-in-sweets-cookie", "くっきー"],
  ["built-in-sweets-special-parfait", "ぱふぇ"],
  ["built-in-sweets-special-fruit-tart", "ふるーつたると"],
  ["built-in-sweets-special-macarons", "まかろん"],
  ["built-in-sweets-special-chocolate-fountain", "ちょこれーとふぁうんてん"],
  ["built-in-sweets-special-sundae", "あいすぱふぇ"],
  ["built-in-sweets-special-cream-puff", "しゅーくりーむ"],
  ["built-in-sweets-dream-rainbow-cake", "にじいろけーき"],
  ["built-in-sweets-dream-crown-pudding", "おうかんぷりん"],
  ["built-in-sweets-dream-moon-macaron", "つきまかろん"],
  ["built-in-sweets-dream-golden-cookie", "きんのくっきー"],
  ["built-in-sweets-dream-star-chocolate", "ほしちょこれーと"],
  ["built-in-gems-ruby", "るびー"],
  ["built-in-gems-sapphire", "さふぁいあ"],
  ["built-in-gems-emerald", "えめらるど"],
  ["built-in-gems-diamond", "だいや"],
  ["built-in-gems-amethyst", "あめじすと"],
  ["built-in-gems-pearl", "ぱーる"],
  ["built-in-gems-special-opal", "おぱーる"],
  ["built-in-gems-special-aquamarine", "あくあまりん"],
  ["built-in-gems-special-citrine", "しとりん"],
  ["built-in-gems-special-garnet", "がーねっと"],
  ["built-in-gems-special-topaz", "とぱーず"],
  ["built-in-gems-special-tourmaline", "とるまりん"],
  ["built-in-gems-dream-star-diamond", "ほしだいや"],
  ["built-in-gems-dream-rainbow-opal", "にじおぱーる"],
  ["built-in-gems-dream-golden-crystal", "きんのくりすたる"],
  ["built-in-gems-dream-heart-ruby", "はーとるびー"],
  ["built-in-gems-dream-moon-sapphire", "つきさふぁいあ"],
]);

const hounyanOutfits = {
  default: {
    id: "default",
    name: "いつものほうにゃん",
    idle: "assets/hounyan-home.png",
    happy: "assets/hounyan-home.png",
    sheetComplete: "assets/hounyan-home.png",
    stampUnlock: "assets/hounyan-home.png",
    shop: "assets/hounyan-home.png",
  },
};

const defaultLevelRules = [
  { level: 1, requiredSheets: 0, name: "いつものほうにゃん", image: "assets/hounyan-home.png" },
  { level: 2, requiredSheets: 1, name: "小さな紙の王冠", image: "assets/hounyan-levels/hounyan-lv02-paper-crown.png" },
  { level: 3, requiredSheets: 2, name: "色つき紙王冠", image: "assets/hounyan-levels/hounyan-lv03-colored-paper-crown.png" },
  { level: 4, requiredSheets: 3, name: "星つき紙王冠", image: "assets/hounyan-levels/hounyan-lv04-star-paper-crown.png" },
  { level: 5, requiredSheets: 4, name: "ブロンズ王冠", image: "assets/hounyan-levels/hounyan-lv05-bronze-crown.png" },
  { level: 6, requiredSheets: 5, name: "ブロンズ王冠＋小さな星", image: "assets/hounyan-levels/hounyan-lv06-bronze-star-crown.png" },
  { level: 7, requiredSheets: 6, name: "ブロンズ王冠＋宝石1つ", image: "assets/hounyan-levels/hounyan-lv07-bronze-jewel-crown.png" },
  { level: 8, requiredSheets: 7, name: "シルバー王冠", image: "assets/hounyan-levels/hounyan-lv08-silver-crown.png" },
  { level: 9, requiredSheets: 8, name: "シルバー王冠＋星", image: "assets/hounyan-levels/hounyan-lv09-silver-star-crown.png" },
  { level: 10, requiredSheets: 9, name: "シルバー王冠＋宝石", image: "assets/hounyan-levels/hounyan-lv10-silver-jewel-crown.png" },
  { level: 11, requiredSheets: 11, name: "ゴールド王冠", image: "assets/hounyan-levels/hounyan-lv11-gold-crown.png" },
  { level: 12, requiredSheets: 13, name: "ゴールド王冠＋星2つ", image: "assets/hounyan-levels/hounyan-lv12-gold-star-crown.png" },
  { level: 13, requiredSheets: 15, name: "ゴールド王冠＋宝石2つ", image: "assets/hounyan-levels/hounyan-lv13-gold-jewel-crown.png" },
  { level: 14, requiredSheets: 17, name: "ゴールド王冠＋羽飾り", image: "assets/hounyan-levels/hounyan-lv14-gold-feather-crown.png" },
  { level: 15, requiredSheets: 19, name: "大きめゴールド王冠", image: "assets/hounyan-levels/hounyan-lv15-large-gold-crown.png" },
  { level: 16, requiredSheets: 22, name: "レインボー宝石王冠", image: "assets/hounyan-levels/hounyan-lv16-rainbow-jewel-crown.png" },
  { level: 17, requiredSheets: 25, name: "レインボー王冠＋羽", image: "assets/hounyan-levels/hounyan-lv17-rainbow-feather-crown.png" },
  { level: 18, requiredSheets: 28, name: "星のクラウン", image: "assets/hounyan-levels/hounyan-lv18-star-crown.png" },
  { level: 19, requiredSheets: 30, name: "星のクラウン＋大宝石", image: "assets/hounyan-levels/hounyan-lv19-star-jewel-crown.png" },
  { level: 20, requiredSheets: 32, name: "ほうにゃんマスタークラウン", image: "assets/hounyan-levels/hounyan-lv20-master-crown.png" },
];

const defaultRewards = [
  {
    id: "unlock-yokudekimashita",
    name: "よくできましたスタンプ",
    type: "unlock",
    costStamps: 20,
    description: "累計20個でピンクのスタンプが使えるようになります。",
    enabled: true,
  },
  {
    id: "unlock-sasuga",
    name: "さすがスタンプ",
    type: "unlock",
    costStamps: 40,
    description: "累計40個で青いスタンプが使えるようになります。",
    enabled: true,
  },
  {
    id: "unlock-ganbattane",
    name: "がんばったねスタンプ",
    type: "unlock",
    costStamps: 60,
    description: "累計60個で黄色のスタンプが使えるようになります。",
    enabled: true,
  },
  {
    id: "shop-sticker",
    name: "シール 1枚",
    type: "shop",
    costSheets: 1,
    description: "使えるシート1枚と交換します。",
    enabled: true,
  },
  {
    id: "shop-hounyan-dress",
    name: "ほうにゃん着せ替え券",
    type: "shop",
    costSheets: 2,
    description: "着せ替えはまだ解禁していません。",
    enabled: true,
    locked: true,
  },
];

const missionCategories = [
  ["learning", "学習量"], ["accuracy", "正確さ"], ["care", "丁寧さ"],
  ["continuity", "継続"], ["behavior", "行動"], ["stamp", "スタンプ"], ["other", "その他"],
];

const missionConditions = [
  ["print_completed_count", "プリント完了枚数", "まい"],
  ["question_answered_count", "問題を解いた数", "もん"],
  ["correct_answer_count", "正解数", "もん"],
  ["consecutive_correct_count", "連続正解数", "もん"],
  ["study_minutes", "学習時間", "ふん"],
  ["stamp_earned_count", "スタンプ獲得数", "こ"],
  ["manual", "先生による判定", ""],
];

const defaultMissionTemplates = [
  {
    id: "daily-print-completed", name: "プリントを終わらせる", displayText: "プリントを{target}まい おわらせよう",
    missionType: "daily", category: "learning", conditionType: "print_completed_count", defaultTargetValue: 1, unit: "まい",
    evaluationType: "automatic", defaultStampReward: 1, defaultTicketReward: 1, enabled: true,
  },
  {
    id: "daily-stamp-earned", name: "スタンプをもらう", displayText: "スタンプを{target}こ もらおう",
    missionType: "daily", category: "stamp", conditionType: "stamp_earned_count", defaultTargetValue: 1, unit: "こ",
    evaluationType: "automatic", defaultStampReward: 1, defaultTicketReward: 1, enabled: true,
  },
  {
    id: "daily-careful-work", name: "丁寧に取り組む", displayText: "ていねいに とりくもう",
    missionType: "daily", category: "care", conditionType: "manual", defaultTargetValue: 1, unit: "",
    evaluationType: "manual", defaultStampReward: 2, defaultTicketReward: 2, enabled: true,
  },
];

const defaultState = {
  students: [],
  groups: [],
  subjects: defaultSubjects,
  timetables: [],
  calendarEvents: [],
  timetableOverrides: [],
  stampEvents: [],
  missionTemplates: defaultMissionTemplates,
  studentMissionSettings: [],
  dailyMissions: [],
  rewards: defaultRewards,
  stampAssets: defaultStampAssets,
  stampSets: defaultStampSets,
  redemptions: [],
  settings: {
    activeOutfit: "default",
    levelRules: defaultLevelRules,
  },
  ownedOutfits: ["default"],
  ownedStampIdsByStudent: {},
  rewardGoalsByStudent: {},
  equippedHounyanLevelByStudent: {},
  selectedStudentId: "",
  selectedGroupId: "",
  selectedStampId: "sonochoshi",
};

let stateLoadFailed = false;
let state = loadState();
let lastStampedEventIds = new Set();
let stampAnimationTimer = 0;
let hounyanAnimationQueue = [];
let hounyanAnimationActive = false;
let stampCountContext = null;
let stampCountTarget = 0;
let stampPreviewContext = null;
let stampPreviewCounts = {};
let stampPreviewCategoryId = "all";
let exchangeConfirmRewardId = "";
let exchangeConfirmAction = null;
let timerDurationSeconds = TIMER_DEFAULT_SECONDS;
let timerRemainingSeconds = TIMER_DEFAULT_SECONDS;
let timerEndAt = 0;
let timerIntervalId = 0;
let timerIsRunning = false;
let timerAudioContext = null;
let timerFinishedSoundPlayed = false;
let timerMode = "study";
let stampSetDraftMembers = [];
let calendarCursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let calendarSelectedDate = CalendarDate.dateKey(new Date());
let timetableViewMode = "all";
let missionStudentId = "";
let lastCompletedMissionId = "";
let missionCelebrationTimer = 0;

const els = {
  viewButtons: document.querySelectorAll("[data-view-button]"),
  views: document.querySelectorAll("[data-view]"),
  studentSwitcher: document.querySelector("#studentSwitcher"),
  stampTabButtons: document.querySelectorAll("[data-stamp-tab-button]"),
  stampTabPanels: document.querySelectorAll("[data-stamp-tab-panel]"),
  calendarDisplayTabButtons: document.querySelectorAll("[data-calendar-display-tab-button]"),
  calendarDisplayTabPanels: document.querySelectorAll("[data-calendar-display-tab-panel]"),
  teacherTabButtons: document.querySelectorAll("[data-teacher-tab-button]"),
  teacherTabPanels: document.querySelectorAll("[data-teacher-tab-panel]"),
  timerPage: document.querySelector('[data-view="timer"]'),
  currentStudentLabel: document.querySelector("#currentStudentLabel"),
  studentSwitchList: document.querySelector("#studentSwitchList"),
  childHounyanButton: document.querySelector("#childHounyanButton"),
  childHounyanImage: document.querySelector("#childHounyanImage"),
  totalStudents: document.querySelector("#totalStudents"),
  todayStamps: document.querySelector("#todayStamps"),
  allStamps: document.querySelector("#allStamps"),
  childStudentList: document.querySelector("#childStudentList"),
  childStudentDetail: document.querySelector("#childStudentDetail"),
  childSelectedName: document.querySelector("#childSelectedName"),
  childTotal: document.querySelector("#childTotal"),
  childAvailableSheets: document.querySelector("#childAvailableSheets"),
  childCurrentSheetCount: document.querySelector("#childCurrentSheetCount"),
  childRemainingText: document.querySelector("#childRemainingText"),
  childLevelName: document.querySelector("#childLevelName"),
  childLevelRequirement: document.querySelector("#childLevelRequirement"),
  childLevelProgressBar: document.querySelector("#childLevelProgressBar"),
  childLevelProgressText: document.querySelector("#childLevelProgressText"),
  childNextLevelPreview: document.querySelector("#childNextLevelPreview"),
  childNextUnlock: document.querySelector("#childNextUnlock"),
  childDailyMissions: document.querySelector("#childDailyMissions"),
  childTicketBalance: document.querySelector("#childTicketBalance"),
  childRewardGoal: document.querySelector("#childRewardGoal"),
  childSheetTitle: document.querySelector("#childSheetTitle"),
  childSheetProgress: document.querySelector("#childSheetProgress"),
  childSheetGrid: document.querySelector("#childSheetGrid"),
  childCompletedSheets: document.querySelector("#childCompletedSheets"),
  openSheetAlbumButton: document.querySelector("#openSheetAlbumButton"),
  childAddStampButton: document.querySelector("#childAddStampButton"),
  teacherStudentList: document.querySelector("#teacherStudentList"),
  teacherStudentDetail: document.querySelector("#teacherStudentDetail"),
  selectedStudentName: document.querySelector("#selectedStudentName"),
  selectedTotal: document.querySelector("#selectedTotal"),
  selectedAvailable: document.querySelector("#selectedAvailable"),
  selectedLevel: document.querySelector("#selectedLevel"),
  nextLevelText: document.querySelector("#nextLevelText"),
  teacherLevelImage: document.querySelector("#teacherLevelImage"),
  teacherLevelName: document.querySelector("#teacherLevelName"),
  teacherLevelRequirement: document.querySelector("#teacherLevelRequirement"),
  missionStudentSelect: document.querySelector("#missionStudentSelect"),
  missionTemplateForm: document.querySelector("#missionTemplateForm"),
  missionTemplateId: document.querySelector("#missionTemplateId"),
  missionTemplateName: document.querySelector("#missionTemplateName"),
  missionTemplateDisplayText: document.querySelector("#missionTemplateDisplayText"),
  missionTemplateType: document.querySelector("#missionTemplateType"),
  missionTemplateCategory: document.querySelector("#missionTemplateCategory"),
  missionTemplateCondition: document.querySelector("#missionTemplateCondition"),
  missionTemplateEvaluation: document.querySelector("#missionTemplateEvaluation"),
  missionTemplateTarget: document.querySelector("#missionTemplateTarget"),
  missionTemplateUnit: document.querySelector("#missionTemplateUnit"),
  missionTemplateStampReward: document.querySelector("#missionTemplateStampReward"),
  missionTemplateTicketReward: document.querySelector("#missionTemplateTicketReward"),
  missionTemplateEnabled: document.querySelector("#missionTemplateEnabled"),
  clearMissionTemplateForm: document.querySelector("#clearMissionTemplateForm"),
  missionTemplateList: document.querySelector("#missionTemplateList"),
  studentMissionSettingForm: document.querySelector("#studentMissionSettingForm"),
  studentMissionSettingId: document.querySelector("#studentMissionSettingId"),
  studentMissionTemplateSelect: document.querySelector("#studentMissionTemplateSelect"),
  studentMissionTarget: document.querySelector("#studentMissionTarget"),
  studentMissionStampReward: document.querySelector("#studentMissionStampReward"),
  studentMissionTicketReward: document.querySelector("#studentMissionTicketReward"),
  studentMissionEnabled: document.querySelector("#studentMissionEnabled"),
  clearStudentMissionSettingForm: document.querySelector("#clearStudentMissionSettingForm"),
  studentMissionSettingList: document.querySelector("#studentMissionSettingList"),
  teacherDailyMissions: document.querySelector("#teacherDailyMissions"),
  teacherTicketBalance: document.querySelector("#teacherTicketBalance"),
  ticketAdjustment: document.querySelector("#ticketAdjustment"),
  applyTicketAdjustment: document.querySelector("#applyTicketAdjustment"),
  shopStudentSelect: document.querySelector("#shopStudentSelect"),
  shopHounyanImage: document.querySelector("#shopHounyanImage"),
  shopSelectedName: document.querySelector("#shopSelectedName"),
  shopAvailableSheets: document.querySelector("#shopAvailableSheets"),
  shopCompletedSheets: document.querySelector("#shopCompletedSheets"),
  stampBookLead: document.querySelector("#stampBookLead"),
  stampBookOwnedCount: document.querySelector("#stampBookOwnedCount"),
  stampBookTotalCount: document.querySelector("#stampBookTotalCount"),
  stampBookSetList: document.querySelector("#stampBookSetList"),
  teacherSheetTitle: document.querySelector("#teacherSheetTitle"),
  teacherSheetProgress: document.querySelector("#teacherSheetProgress"),
  teacherSheetGrid: document.querySelector("#teacherSheetGrid"),
  stampMemo: document.querySelector("#stampMemo"),
  teacherStampBatchCount: document.querySelector("#teacherStampBatchCount"),
  addStampButton: document.querySelector("#addStampButton"),
  historyList: document.querySelector("#historyList"),
  editStudentButton: document.querySelector("#editStudentButton"),
  deleteStudentButton: document.querySelector("#deleteStudentButton"),
  unlockRewards: document.querySelector("#unlockRewards"),
  shopRewards: document.querySelector("#shopRewards"),
  shopStampRewards: document.querySelector("#shopStampRewards"),
  timerRing: document.querySelector("#timerRing"),
  timerTime: document.querySelector("#timerTime"),
  timerStatus: document.querySelector("#timerStatus"),
  timerTitle: document.querySelector("#timer-title"),
  timerCheerText: document.querySelector("#timerCheerText"),
  timerMinutes: document.querySelector("#timerMinutes"),
  timerSeconds: document.querySelector("#timerSeconds"),
  timerSetButton: document.querySelector("#timerSetButton"),
  timerStartButton: document.querySelector("#timerStartButton"),
  timerPauseButton: document.querySelector("#timerPauseButton"),
  timerResetButton: document.querySelector("#timerResetButton"),
  timerModeButtons: document.querySelectorAll("[data-timer-mode]"),
  timerPresetButtons: document.querySelectorAll("[data-timer-preset]"),
  prizeForm: document.querySelector("#prizeForm"),
  prizeId: document.querySelector("#prizeId"),
  prizeName: document.querySelector("#prizeName"),
  prizeCostSheets: document.querySelector("#prizeCostSheets"),
  prizeDescription: document.querySelector("#prizeDescription"),
  prizeEnabled: document.querySelector("#prizeEnabled"),
  clearPrizeForm: document.querySelector("#clearPrizeForm"),
  prizeSettingsList: document.querySelector("#prizeSettingsList"),
  levelRuleForm: document.querySelector("#levelRuleForm"),
  levelRuleLevel: document.querySelector("#levelRuleLevel"),
  levelRuleName: document.querySelector("#levelRuleName"),
  levelRuleRequiredSheets: document.querySelector("#levelRuleRequiredSheets"),
  levelRuleImage: document.querySelector("#levelRuleImage"),
  levelRulesList: document.querySelector("#levelRulesList"),
  resetLevelRulesButton: document.querySelector("#resetLevelRulesButton"),
  studentForm: document.querySelector("#studentForm"),
  studentId: document.querySelector("#studentId"),
  studentName: document.querySelector("#studentName"),
  studentNote: document.querySelector("#studentNote"),
  studentGroup: document.querySelector("#studentGroup"),
  studentTestMode: document.querySelector("#studentTestMode"),
  createTestStudentButton: document.querySelector("#createTestStudentButton"),
  groupForm: document.querySelector("#groupForm"),
  groupId: document.querySelector("#groupId"),
  groupName: document.querySelector("#groupName"),
  groupEnabled: document.querySelector("#groupEnabled"),
  clearGroupForm: document.querySelector("#clearGroupForm"),
  currentGroupSelect: document.querySelector("#currentGroupSelect"),
  groupList: document.querySelector("#groupList"),
  timetableForm: document.querySelector("#timetableForm"),
  timetableGroupSelect: document.querySelector("#timetableGroupSelect"),
  timetableName: document.querySelector("#timetableName"),
  timetablePeriodCount: document.querySelector("#timetablePeriodCount"),
  timetableStartsOn: document.querySelector("#timetableStartsOn"),
  timetableEndsOn: document.querySelector("#timetableEndsOn"),
  applyTimetablePeriods: document.querySelector("#applyTimetablePeriods"),
  timetableEditor: document.querySelector("#timetableEditor"),
  timetableCopyTarget: document.querySelector("#timetableCopyTarget"),
  copyTimetableButton: document.querySelector("#copyTimetableButton"),
  resetTimetableButton: document.querySelector("#resetTimetableButton"),
  subjectForm: document.querySelector("#subjectForm"),
  subjectId: document.querySelector("#subjectId"),
  subjectName: document.querySelector("#subjectName"),
  clearSubjectForm: document.querySelector("#clearSubjectForm"),
  subjectList: document.querySelector("#subjectList"),
  calendarMonthLabel: document.querySelector("#calendarMonthLabel"),
  calendarGroupSelect: document.querySelector("#calendarGroupSelect"),
  calendarPreviousButton: document.querySelector("#calendarPreviousButton"),
  calendarNextButton: document.querySelector("#calendarNextButton"),
  calendarTodayButton: document.querySelector("#calendarTodayButton"),
  calendarGrid: document.querySelector("#calendarGrid"),
  calendarSelectedDateLabel: document.querySelector("#calendarSelectedDateLabel"),
  calendarDayStatus: document.querySelector("#calendarDayStatus"),
  calendarEventList: document.querySelector("#calendarEventList"),
  calendarDayTimetable: document.querySelector("#calendarDayTimetable"),
  calendarViewMonthLabel: document.querySelector("#calendarViewMonthLabel"),
  calendarViewGroupSelect: document.querySelector("#calendarViewGroupSelect"),
  calendarViewPreviousButton: document.querySelector("#calendarViewPreviousButton"),
  calendarViewNextButton: document.querySelector("#calendarViewNextButton"),
  calendarViewTodayButton: document.querySelector("#calendarViewTodayButton"),
  calendarViewGrid: document.querySelector("#calendarViewGrid"),
  calendarViewSelectedDateLabel: document.querySelector("#calendarViewSelectedDateLabel"),
  calendarViewDayStatus: document.querySelector("#calendarViewDayStatus"),
  calendarViewEventList: document.querySelector("#calendarViewEventList"),
  calendarViewDayTimetable: document.querySelector("#calendarViewDayTimetable"),
  calendarTimetableGroupSelect: document.querySelector("#calendarTimetableGroupSelect"),
  timetableViewModeButtons: document.querySelectorAll("[data-timetable-view-mode]"),
  calendarTimetableBoard: document.querySelector("#calendarTimetableBoard"),
  calendarEventForm: document.querySelector("#calendarEventForm"),
  calendarEventId: document.querySelector("#calendarEventId"),
  calendarEventTitle: document.querySelector("#calendarEventTitle"),
  calendarEventStart: document.querySelector("#calendarEventStart"),
  calendarEventEnd: document.querySelector("#calendarEventEnd"),
  calendarEventAllDay: document.querySelector("#calendarEventAllDay"),
  calendarEventTimeFields: document.querySelector("#calendarEventTimeFields"),
  calendarEventStartTime: document.querySelector("#calendarEventStartTime"),
  calendarEventEndTime: document.querySelector("#calendarEventEndTime"),
  calendarEventType: document.querySelector("#calendarEventType"),
  calendarEventScope: document.querySelector("#calendarEventScope"),
  calendarEventGroupsField: document.querySelector("#calendarEventGroupsField"),
  calendarEventGroups: document.querySelector("#calendarEventGroups"),
  calendarEventRepeat: document.querySelector("#calendarEventRepeat"),
  calendarEventSchoolDayEffect: document.querySelector("#calendarEventSchoolDayEffect"),
  calendarEventTimetableEffect: document.querySelector("#calendarEventTimetableEffect"),
  calendarEventNote: document.querySelector("#calendarEventNote"),
  clearCalendarEventForm: document.querySelector("#clearCalendarEventForm"),
  timetableOverrideForm: document.querySelector("#timetableOverrideForm"),
  overridePeriod: document.querySelector("#overridePeriod"),
  overrideSubject: document.querySelector("#overrideSubject"),
  overrideMemo: document.querySelector("#overrideMemo"),
  timetableOverrideList: document.querySelector("#timetableOverrideList"),
  exportButton: document.querySelector("#exportButton"),
  importInput: document.querySelector("#importInput"),
  createAutoBackupButton: document.querySelector("#createAutoBackupButton"),
  autoBackupStatus: document.querySelector("#autoBackupStatus"),
  autoBackupList: document.querySelector("#autoBackupList"),
  redemptionList: document.querySelector("#redemptionList"),
  stampAssetForm: document.querySelector("#stampAssetForm"),
  stampAssetId: document.querySelector("#stampAssetId"),
  stampAssetName: document.querySelector("#stampAssetName"),
  stampAssetUnlockMode: document.querySelector("#stampAssetUnlockMode"),
  stampAssetUnlockAt: document.querySelector("#stampAssetUnlockAt"),
  stampAssetShopPriceSheets: document.querySelector("#stampAssetShopPriceSheets"),
  stampAssetVisible: document.querySelector("#stampAssetVisible"),
  stampAssetImage: document.querySelector("#stampAssetImage"),
  clearStampAssetForm: document.querySelector("#clearStampAssetForm"),
  stampAssetsList: document.querySelector("#stampAssetsList"),
  stampSetForm: document.querySelector("#stampSetForm"),
  stampSetId: document.querySelector("#stampSetId"),
  stampSetName: document.querySelector("#stampSetName"),
  stampSetPriceSheets: document.querySelector("#stampSetPriceSheets"),
  stampSetVisible: document.querySelector("#stampSetVisible"),
  stampSetImages: document.querySelector("#stampSetImages"),
  stampSetMembersDraft: document.querySelector("#stampSetMembersDraft"),
  clearStampSetForm: document.querySelector("#clearStampSetForm"),
  stampSetsList: document.querySelector("#stampSetsList"),
  stampCountLayer: document.querySelector("#stampCountLayer"),
  stampCountStudent: document.querySelector("#stampCountStudent"),
  stampCountMinus: document.querySelector("#stampCountMinus"),
  stampCountValue: document.querySelector("#stampCountValue"),
  stampCountPlus: document.querySelector("#stampCountPlus"),
  stampCountHint: document.querySelector("#stampCountHint"),
  stampCountCancelButton: document.querySelector("#stampCountCancelButton"),
  stampCountNextButton: document.querySelector("#stampCountNextButton"),
  stampPreviewLayer: document.querySelector("#stampPreviewLayer"),
  stampPreviewStudent: document.querySelector("#stampPreviewStudent"),
  stampPreviewTabs: document.querySelector("#stampPreviewTabs"),
  stampPreviewRandomButton: document.querySelector("#stampPreviewRandomButton"),
  stampPreviewList: document.querySelector("#stampPreviewList"),
  stampPreviewTotal: document.querySelector("#stampPreviewTotal"),
  stampPreviewCancelButton: document.querySelector("#stampPreviewCancelButton"),
  stampPreviewConfirmButton: document.querySelector("#stampPreviewConfirmButton"),
  exchangeConfirmLayer: document.querySelector("#exchangeConfirmLayer"),
  exchangeConfirmTitle: document.querySelector("#exchangeConfirmTitle"),
  exchangeConfirmMessage: document.querySelector("#exchangeConfirmMessage"),
  exchangeCancelButton: document.querySelector("#exchangeCancelButton"),
  exchangeConfirmButton: document.querySelector("#exchangeConfirmButton"),
  hounyanClosetLayer: document.querySelector("#hounyanClosetLayer"),
  hounyanClosetStudent: document.querySelector("#hounyanClosetStudent"),
  hounyanClosetList: document.querySelector("#hounyanClosetList"),
  hounyanClosetCloseButton: document.querySelector("#hounyanClosetCloseButton"),
  sheetAlbumLayer: document.querySelector("#sheetAlbumLayer"),
  sheetAlbumStudent: document.querySelector("#sheetAlbumStudent"),
  sheetAlbumSummary: document.querySelector("#sheetAlbumSummary"),
  sheetAlbumList: document.querySelector("#sheetAlbumList"),
  sheetAlbumCloseButton: document.querySelector("#sheetAlbumCloseButton"),
  hounyanAnimationLayer: document.querySelector("#hounyanAnimationLayer"),
  animationCard: document.querySelector("#animationCard"),
  animationHounyan: document.querySelector("#animationHounyan"),
  animationFeatureImage: document.querySelector("#animationFeatureImage"),
  animationStampGallery: document.querySelector("#animationStampGallery"),
  animationMilestone: document.querySelector("#animationMilestone"),
  animationMilestoneValue: document.querySelector("#animationMilestoneValue"),
  animationMilestoneLabel: document.querySelector("#animationMilestoneLabel"),
  animationEyebrow: document.querySelector("#animationEyebrow"),
  animationTitle: document.querySelector("#animationTitle"),
  animationMessage: document.querySelector("#animationMessage"),
  animationCloseButton: document.querySelector("#animationCloseButton"),
  toast: document.querySelector("#toast"),
};

init();

function init() {
  bindEvents();
  showView("stamp");
  showStampTab("child");
  showCalendarDisplayTab("calendar");
  showTeacherTab("students");
  updateStampAssetModeFields();
  ensureSelection();
  renderTimer();
  render();
}

function bindEvents() {
  els.viewButtons.forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.viewButton));
  });
  els.teacherTabButtons.forEach((button) => {
    button.addEventListener("click", () => showTeacherTab(button.dataset.teacherTabButton));
  });
  els.stampTabButtons.forEach((button) => {
    button.addEventListener("click", () => showStampTab(button.dataset.stampTabButton));
  });
  els.calendarDisplayTabButtons.forEach((button) => {
    button.addEventListener("click", () => showCalendarDisplayTab(button.dataset.calendarDisplayTabButton));
  });

  els.studentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveStudent();
  });
  els.groupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveGroup();
  });
  els.clearGroupForm.addEventListener("click", clearGroupForm);
  els.currentGroupSelect.addEventListener("change", () => selectGroup(els.currentGroupSelect.value));
  els.timetableGroupSelect.addEventListener("change", () => selectGroup(els.timetableGroupSelect.value));
  els.calendarGroupSelect.addEventListener("change", () => selectGroup(els.calendarGroupSelect.value));
  els.timetableForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveTimetable();
  });
  els.applyTimetablePeriods.addEventListener("click", () => renderTimetableEditor(readTimetableEditor()));
  els.copyTimetableButton.addEventListener("click", copyTimetableToGroup);
  els.resetTimetableButton.addEventListener("click", resetTimetable);
  els.subjectForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveSubject();
  });
  els.clearSubjectForm.addEventListener("click", clearSubjectForm);
  els.calendarPreviousButton.addEventListener("click", () => moveCalendarMonth(-1));
  els.calendarNextButton.addEventListener("click", () => moveCalendarMonth(1));
  els.calendarTodayButton.addEventListener("click", goToCalendarToday);
  els.calendarViewGroupSelect.addEventListener("change", () => selectGroup(els.calendarViewGroupSelect.value));
  els.calendarTimetableGroupSelect.addEventListener("change", () => selectGroup(els.calendarTimetableGroupSelect.value));
  els.calendarViewPreviousButton.addEventListener("click", () => moveCalendarMonth(-1));
  els.calendarViewNextButton.addEventListener("click", () => moveCalendarMonth(1));
  els.calendarViewTodayButton.addEventListener("click", goToCalendarToday);
  els.timetableViewModeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      timetableViewMode = button.dataset.timetableViewMode;
      renderTimetableDisplay();
    });
  });
  els.calendarEventForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveCalendarEvent();
  });
  els.clearCalendarEventForm.addEventListener("click", clearCalendarEventForm);
  els.calendarEventAllDay.addEventListener("change", updateCalendarEventTimeFields);
  els.calendarEventScope.addEventListener("change", updateCalendarEventScopeFields);
  els.timetableOverrideForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveTimetableOverride();
  });
  els.createTestStudentButton.addEventListener("click", createTestStudent);
  els.missionStudentSelect.addEventListener("change", () => {
    missionStudentId = els.missionStudentSelect.value;
    renderDailyMissions();
  });
  els.missionTemplateForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveMissionTemplate();
  });
  els.clearMissionTemplateForm.addEventListener("click", clearMissionTemplateForm);
  els.missionTemplateCondition.addEventListener("change", updateMissionTemplateConditionFields);
  els.studentMissionSettingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveStudentMissionSetting();
  });
  els.clearStudentMissionSettingForm.addEventListener("click", clearStudentMissionSettingForm);
  els.studentMissionTemplateSelect.addEventListener("change", fillStudentMissionFromTemplate);
  els.applyTicketAdjustment.addEventListener("click", applyTicketAdjustment);
  els.stampAssetForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveStampAsset();
  });
  els.stampAssetUnlockMode.addEventListener("change", updateStampAssetModeFields);
  els.clearStampAssetForm.addEventListener("click", clearStampAssetForm);
  els.stampSetForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveStampSet();
  });
  els.stampSetImages.addEventListener("change", addStampSetImages);
  els.clearStampSetForm.addEventListener("click", clearStampSetForm);
  els.prizeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    savePrize();
  });
  els.clearPrizeForm.addEventListener("click", clearPrizeForm);
  els.levelRuleForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveLevelRule();
  });
  els.levelRuleLevel.addEventListener("change", () => editLevelRule(Number(els.levelRuleLevel.value || 1)));
  els.resetLevelRulesButton.addEventListener("click", resetLevelRules);

  els.childHounyanButton.addEventListener("click", openHounyanCloset);
  els.openSheetAlbumButton.addEventListener("click", openSheetAlbum);
  els.childAddStampButton.addEventListener("click", () => openStampCountChoice({ source: "child" }));
  els.addStampButton.addEventListener("click", openTeacherStampPreview);
  els.stampCountMinus.addEventListener("click", () => updateStampCountTarget(-1));
  els.stampCountPlus.addEventListener("click", () => updateStampCountTarget(1));
  els.stampCountCancelButton.addEventListener("click", closeStampCountChoice);
  els.stampCountNextButton.addEventListener("click", continueToStampPreview);
  els.stampCountLayer.addEventListener("click", (event) => {
    if (event.target === els.stampCountLayer) {
      closeStampCountChoice();
    }
  });
  els.stampPreviewCancelButton.addEventListener("click", closeStampPreview);
  els.stampPreviewRandomButton.addEventListener("click", chooseRandomPreviewStamps);
  els.stampPreviewConfirmButton.addEventListener("click", confirmStampPreview);
  els.stampPreviewLayer.addEventListener("click", (event) => {
    if (event.target === els.stampPreviewLayer) {
      closeStampPreview();
    }
  });
  els.editStudentButton.addEventListener("click", editSelectedStudent);
  els.deleteStudentButton.addEventListener("click", deleteSelectedStudent);
  els.shopStudentSelect.addEventListener("change", () => {
    state.selectedStudentId = els.shopStudentSelect.value;
    persist();
    render();
  });
  els.timerModeButtons.forEach((button) => {
    button.addEventListener("click", () => setTimerMode(button.dataset.timerMode));
  });
  els.timerPresetButtons.forEach((button) => {
    button.addEventListener("click", () => setTimerDuration(Number(button.dataset.timerPreset || TIMER_DEFAULT_SECONDS)));
  });
  els.timerSetButton.addEventListener("click", setTimerFromInputs);
  els.timerStartButton.addEventListener("click", startTimer);
  els.timerPauseButton.addEventListener("click", pauseTimer);
  els.timerResetButton.addEventListener("click", resetTimer);
  els.exportButton.addEventListener("click", exportData);
  els.importInput.addEventListener("change", importData);
  els.createAutoBackupButton.addEventListener("click", () => {
    const created = createAutoBackup("manual", { force: true });
    renderAutoBackups();
    showToast(created ? "自動バックアップを作成しました" : "自動バックアップを更新できませんでした");
  });
  els.exchangeCancelButton.addEventListener("click", closeExchangeConfirm);
  els.exchangeConfirmButton.addEventListener("click", confirmExchange);
  els.exchangeConfirmLayer.addEventListener("click", (event) => {
    if (event.target === els.exchangeConfirmLayer) {
      closeExchangeConfirm();
    }
  });
  els.hounyanClosetCloseButton.addEventListener("click", closeHounyanCloset);
  els.hounyanClosetLayer.addEventListener("click", (event) => {
    if (event.target === els.hounyanClosetLayer) {
      closeHounyanCloset();
    }
  });
  els.sheetAlbumCloseButton.addEventListener("click", closeSheetAlbum);
  els.sheetAlbumLayer.addEventListener("click", (event) => {
    if (event.target === els.sheetAlbumLayer) {
      closeSheetAlbum();
    }
  });
  els.animationCloseButton.addEventListener("click", hideHounyanAnimation);
  els.hounyanAnimationLayer.addEventListener("click", (event) => {
    if (event.target === els.hounyanAnimationLayer) {
      hideHounyanAnimation();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.stampCountLayer.hidden) {
      closeStampCountChoice();
      return;
    }
    if (event.key === "Escape" && !els.stampPreviewLayer.hidden) {
      closeStampPreview();
      return;
    }
    if (event.key === "Escape" && !els.exchangeConfirmLayer.hidden) {
      closeExchangeConfirm();
      return;
    }
    if (event.key === "Escape" && !els.hounyanClosetLayer.hidden) {
      closeHounyanCloset();
      return;
    }
    if (event.key === "Escape" && !els.hounyanAnimationLayer.hidden) {
      hideHounyanAnimation();
    }
  });
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return structuredClone(defaultState);
    }
    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
  } catch (error) {
    console.error(error);
    stateLoadFailed = true;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        localStorage.setItem(BACKUP_STORAGE_KEY, raw);
      } catch (backupError) {
        console.error(backupError);
      }
    }
    return structuredClone(defaultState);
  }
}

function normalizeState(input) {
  const merged = {
    ...structuredClone(defaultState),
    ...input,
  };

  merged.students = Array.isArray(input.students)
    ? input.students.map((student) => ({
      ...student,
      groupId: String(student?.groupId || ""),
      isTest: Boolean(student?.isTest),
      ticketBalance: Math.max(0, Math.floor(Number(student?.ticketBalance || 0))),
    }))
    : [];
  merged.groups = normalizeGroups(input.groups);
  merged.subjects = normalizeSubjects(input.subjects);
  merged.timetables = normalizeTimetables(input.timetables);
  merged.calendarEvents = normalizeCalendarEvents(input.calendarEvents);
  merged.timetableOverrides = normalizeTimetableOverrides(input.timetableOverrides);
  merged.selectedGroupId = String(input.selectedGroupId || "");
  merged.stampEvents = Array.isArray(input.stampEvents) ? input.stampEvents : [];
  merged.missionTemplates = normalizeMissionTemplates(input.missionTemplates);
  merged.studentMissionSettings = normalizeStudentMissionSettings(input.studentMissionSettings);
  merged.dailyMissions = normalizeDailyMissions(input.dailyMissions);
  merged.redemptions = Array.isArray(input.redemptions)
    ? input.redemptions.filter((redemption) => !REMOVED_PURCHASABLE_STAMP_IDS.has(redemption.stampId))
    : [];
  merged.rewards = normalizeRewards(input.rewards);
  merged.stampAssets = normalizeStampAssets(input.stampAssets || input.stamps || input.stampSettings);
  merged.stampSets = normalizeStampSets(input.stampSets, merged.stampAssets);
  merged.settings = {
    ...defaultState.settings,
    ...(input.settings || {}),
  };
  merged.settings.levelRules = normalizeLevelRules(merged.settings.levelRules || input.levelRules);
  merged.ownedOutfits = Array.isArray(input.ownedOutfits) && input.ownedOutfits.length
    ? input.ownedOutfits
    : [...defaultState.ownedOutfits];
  merged.ownedStampIdsByStudent = normalizeOwnedStampIdsByStudent(input.ownedStampIdsByStudent);
  merged.rewardGoalsByStudent = normalizeRewardGoalsByStudent(input.rewardGoalsByStudent);
  merged.equippedHounyanLevelByStudent = normalizeEquippedHounyanLevels(input.equippedHounyanLevelByStudent);
  return merged;
}

function normalizeMissionTemplates(input) {
  const source = Array.isArray(input) ? input : defaultMissionTemplates;
  return source.filter((template) => template && template.id && String(template.name || "").trim()).map((template) => ({
    id: String(template.id),
    name: String(template.name).trim(),
    displayText: String(template.displayText || template.name).trim(),
    missionType: ["daily", "special"].includes(template.missionType) ? template.missionType : "daily",
    category: missionCategories.some(([id]) => id === template.category) ? template.category : "other",
    conditionType: missionConditions.some(([id]) => id === template.conditionType) ? template.conditionType : "manual",
    defaultTargetValue: Math.max(1, Math.floor(Number(template.defaultTargetValue || 1))),
    unit: String(template.unit || ""),
    evaluationType: template.evaluationType === "manual" ? "manual" : "automatic",
    defaultStampReward: Math.max(0, Math.floor(Number(template.defaultStampReward || 0))),
    defaultTicketReward: Math.max(0, Math.floor(Number(template.defaultTicketReward || 0))),
    enabled: template.enabled !== false,
    createdAt: template.createdAt || new Date().toISOString(),
    updatedAt: template.updatedAt || template.createdAt || new Date().toISOString(),
  }));
}

function normalizeStudentMissionSettings(input) {
  if (!Array.isArray(input)) return [];
  return input.filter((setting) => setting && setting.id && setting.studentId && setting.missionTemplateId).map((setting, index) => ({
    id: String(setting.id), studentId: String(setting.studentId), missionTemplateId: String(setting.missionTemplateId),
    targetValue: Math.max(1, Math.floor(Number(setting.targetValue || 1))),
    stampReward: Math.max(0, Math.floor(Number(setting.stampReward || 0))),
    ticketReward: Math.max(0, Math.floor(Number(setting.ticketReward || 0))),
    displayOrder: Number.isFinite(Number(setting.displayOrder)) ? Number(setting.displayOrder) : index,
    enabled: setting.enabled !== false, validFrom: String(setting.validFrom || ""), validUntil: String(setting.validUntil || ""),
    createdAt: setting.createdAt || new Date().toISOString(), updatedAt: setting.updatedAt || setting.createdAt || new Date().toISOString(),
  }));
}

function normalizeDailyMissions(input) {
  if (!Array.isArray(input)) return [];
  return input.filter((mission) => mission && mission.id && mission.studentId && mission.targetDate).map((mission) => ({
    id: String(mission.id), studentId: String(mission.studentId), missionTemplateId: String(mission.missionTemplateId || ""),
    studentMissionSettingId: String(mission.studentMissionSettingId || ""), targetDate: String(mission.targetDate),
    name: String(mission.name || "ミッション"), displayText: String(mission.displayText || mission.name || "ミッション"),
    missionType: mission.missionType === "special" ? "special" : "daily", category: String(mission.category || "other"),
    conditionType: String(mission.conditionType || "manual"), evaluationType: mission.evaluationType === "manual" ? "manual" : "automatic",
    targetValue: Math.max(1, Math.floor(Number(mission.targetValue || 1))), unit: String(mission.unit || ""),
    currentValue: Math.max(0, Number(mission.currentValue || 0)), manualAdjustment: Number(mission.manualAdjustment || 0),
    stampReward: Math.max(0, Math.floor(Number(mission.stampReward || 0))), ticketReward: Math.max(0, Math.floor(Number(mission.ticketReward || 0))),
    status: ["not_started", "in_progress", "completed", "expired", "revoked"].includes(mission.status) ? mission.status : "not_started",
    completedAt: mission.completedAt || "", rewardGranted: Boolean(mission.rewardGranted), createdAt: mission.createdAt || new Date().toISOString(),
    updatedAt: mission.updatedAt || mission.createdAt || new Date().toISOString(),
  }));
}

function normalizeRewardGoalsByStudent(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }
  return Object.fromEntries(Object.entries(input).flatMap(([studentId, goal]) => {
    if (!goal || typeof goal !== "object" || !["stamp", "stamp-set"].includes(goal.type) || !goal.id) {
      return [];
    }
    return [[studentId, { type: goal.type, id: String(goal.id) }]];
  }));
}

function normalizeGroups(input) {
  if (!Array.isArray(input)) return [];
  return input
    .filter((group) => group && group.id && String(group.name || "").trim())
    .map((group, index) => ({
      id: String(group.id),
      name: String(group.name).trim(),
      sortOrder: Number.isFinite(Number(group.sortOrder)) ? Number(group.sortOrder) : index,
      enabled: group.enabled !== false,
      createdAt: group.createdAt || new Date().toISOString(),
      updatedAt: group.updatedAt || group.createdAt || new Date().toISOString(),
    }))
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

function normalizeSubjects(input) {
  const source = Array.isArray(input) && input.length ? input : defaultSubjects;
  return source
    .filter((subject) => subject && subject.id && String(subject.name || "").trim())
    .map((subject, index) => ({
      id: String(subject.id),
      name: String(subject.name).trim(),
      sortOrder: Number.isFinite(Number(subject.sortOrder)) ? Number(subject.sortOrder) : index,
      enabled: subject.enabled !== false,
    }))
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

function normalizeTimetables(input) {
  if (!Array.isArray(input)) return [];
  return input.filter((timetable) => timetable && timetable.id && timetable.groupId).map((timetable) => ({
    id: String(timetable.id),
    groupId: String(timetable.groupId),
    name: String(timetable.name || "基本時間割").trim() || "基本時間割",
    startsOn: String(timetable.startsOn || ""),
    endsOn: String(timetable.endsOn || ""),
    enabled: timetable.enabled !== false,
    periodCount: Math.min(10, Math.max(1, Math.floor(Number(timetable.periodCount || DEFAULT_PERIOD_COUNT)))),
    cells: timetable.cells && typeof timetable.cells === "object" && !Array.isArray(timetable.cells) ? timetable.cells : {},
    createdAt: timetable.createdAt || new Date().toISOString(),
    updatedAt: timetable.updatedAt || timetable.createdAt || new Date().toISOString(),
  }));
}

function normalizeCalendarEvents(input) {
  if (!Array.isArray(input)) return [];
  return input.filter((event) => event && event.id && event.startDate && event.title).map((event) => ({
    id: String(event.id),
    title: String(event.title).trim(),
    startDate: String(event.startDate),
    endDate: String(event.endDate || event.startDate),
    allDay: event.allDay !== false,
    startTime: String(event.startTime || ""),
    endTime: String(event.endTime || ""),
    type: String(event.type || "other"),
    scope: event.scope === "groups" ? "groups" : "school",
    groupIds: Array.isArray(event.groupIds) ? event.groupIds.map(String) : [],
    note: String(event.note || ""),
    repeat: event.repeat === "weekly" ? "weekly" : "none",
    schoolDayEffect: String(event.schoolDayEffect || "auto"),
    timetableEffect: String(event.timetableEffect || "none"),
    createdAt: event.createdAt || new Date().toISOString(),
    updatedAt: event.updatedAt || event.createdAt || new Date().toISOString(),
  }));
}

function normalizeTimetableOverrides(input) {
  if (!Array.isArray(input)) return [];
  return input.filter((override) => override && override.id && override.date && override.groupId).map((override) => ({
    id: String(override.id),
    date: String(override.date),
    groupId: String(override.groupId),
    periodNumber: Math.max(1, Math.floor(Number(override.periodNumber || 1))),
    subjectId: String(override.subjectId || ""),
    note: String(override.note || ""),
    createdAt: override.createdAt || new Date().toISOString(),
    updatedAt: override.updatedAt || override.createdAt || new Date().toISOString(),
  }));
}

function normalizeLevelRules(inputRules) {
  const byLevel = new Map(defaultLevelRules.map((rule) => [rule.level, structuredClone(rule)]));
  if (Array.isArray(inputRules)) {
    inputRules.forEach((rule) => {
      const level = Math.floor(Number(rule?.level || 0));
      const base = byLevel.get(level);
      if (!base) {
        return;
      }
      const inputImage = String(rule.image || base.image).trim();
      const image = inputImage === "assets/hounyan-home.png" && base.image !== "assets/hounyan-home.png"
        ? base.image
        : inputImage;
      byLevel.set(level, {
        ...base,
        name: String(rule.name || base.name).trim(),
        requiredSheets: Math.max(0, Math.floor(Number(rule.requiredSheets ?? base.requiredSheets))),
        image,
      });
    });
  }

  let minimumSheets = 0;
  const rules = Array.from(byLevel.values())
    .sort((a, b) => a.level - b.level)
    .map((rule, index) => {
      const requiredSheets = index === 0 ? 0 : Math.max(minimumSheets, rule.requiredSheets);
      minimumSheets = requiredSheets;
      return {
        ...rule,
        requiredSheets,
      };
    });
  rules[0].requiredSheets = 0;
  return rules;
}

function activeLevelRules() {
  if (!state.settings) {
    state.settings = structuredClone(defaultState.settings);
  }
  state.settings.levelRules = normalizeLevelRules(state.settings.levelRules);
  return state.settings.levelRules;
}

function normalizeRewards(inputRewards) {
  const byId = new Map(defaultRewards.map((reward) => [reward.id, reward]));
  if (!Array.isArray(inputRewards)) {
    return structuredClone(defaultRewards);
  }

  inputRewards.forEach((reward) => {
    const base = byId.get(reward.id);
    if (!base) {
      byId.set(reward.id, normalizeReward(reward));
      return;
    }
    byId.set(reward.id, normalizeReward(reward, base));
  });

  return Array.from(byId.values()).map((reward) => normalizeReward(reward));
}

function normalizeReward(reward, base = {}) {
  const costFromLegacy = reward.cost === undefined ? undefined : stampsToSheets(reward.cost);
  return {
    ...base,
    ...reward,
    id: String(reward.id || base.id || `shop-${crypto.randomUUID()}`),
    name: String(reward.name || base.name || "新しい景品").trim(),
    type: reward.type || base.type || "shop",
    costStamps: Number(reward.costStamps ?? base.costStamps ?? reward.cost ?? 0),
    costSheets: Math.max(1, Number(reward.costSheets ?? costFromLegacy ?? base.costSheets ?? 1)),
    description: String(reward.description ?? base.description ?? "").trim(),
    enabled: reward.enabled ?? base.enabled ?? true,
    locked: reward.locked ?? base.locked ?? false,
  };
}

function normalizeStampAssets(inputAssets) {
  const byId = new Map(defaultStampAssets.map((stamp) => [stamp.id, structuredClone(stamp)]));
  if (Array.isArray(inputAssets)) {
    inputAssets.forEach((stamp) => {
      if (!stamp || !stamp.id) {
        return;
      }
      if (REMOVED_PURCHASABLE_STAMP_IDS.has(String(stamp.id))) {
        return;
      }
      const base = byId.get(stamp.id) || {};
      const legacyNames = builtInStampLegacyNames.get(String(stamp.id));
      const useUpdatedBuiltInName = Array.isArray(legacyNames)
        ? legacyNames.includes(String(stamp.name || ""))
        : legacyNames === String(stamp.name || "");
      const name = useUpdatedBuiltInName
        ? String(base.name || "新しいスタンプ").trim()
        : String(stamp.name || base.name || "新しいスタンプ").trim();
      byId.set(stamp.id, {
        ...base,
        ...stamp,
        id: String(stamp.id),
        name,
        reading: useUpdatedBuiltInName
          ? String(base.reading || name).trim()
          : String(stamp.reading || stamp.name || base.reading || name).trim(),
        src: String(stamp.src || base.src || defaultStampAssets[0].src),
        unlockAt: Math.max(0, Math.floor(Number(stamp.unlockAt ?? base.unlockAt ?? 0))),
        custom: Boolean(stamp.custom || !base.id),
        purchaseOnly: Boolean(stamp.purchaseOnly ?? base.purchaseOnly ?? false),
        shopPriceSheets: Math.max(1, Math.floor(Number(stamp.shopPriceSheets ?? base.shopPriceSheets ?? 1))),
        rarity: String(stamp.rarity || base.rarity || "normal"),
        hidden: Boolean(stamp.hidden ?? base.hidden ?? false),
        setId: stamp.setId ? String(stamp.setId) : "",
      });
    });
  }
  return Array.from(byId.values()).sort((a, b) =>
    Number(a.purchaseOnly) - Number(b.purchaseOnly) ||
    a.unlockAt - b.unlockAt ||
    stampPriceSheets(a) - stampPriceSheets(b) ||
    a.name.localeCompare(b.name, "ja")
  );
}

function normalizeStampSets(inputSets, stampAssets = []) {
  const byId = new Map(defaultStampSets.map((stampSet) => [stampSet.id, structuredClone(stampSet)]));
  const knownStampIds = new Set(stampAssets.map((stamp) => stamp.id));
  if (Array.isArray(inputSets)) {
    inputSets.filter((stampSet) => stampSet && stampSet.id).forEach((stampSet) => {
      const id = String(stampSet.id);
      const base = byId.get(id) || {};
      const builtInSet = Boolean(base.id && isBuiltInStampSet(id));
      const memberIds = Array.isArray(stampSet.memberIds)
        ? stampSet.memberIds.map(String).filter((stampId) => knownStampIds.has(stampId))
        : stampAssets.filter((stamp) => stamp.setId === id).map((stamp) => stamp.id);
      byId.set(id, {
        ...base,
        id,
        name: String(stampSet.name || base.name || "あたらしいスタンプセット").trim(),
        priceSheets: Math.max(1, Math.floor(Number(stampSet.priceSheets || base.priceSheets || 1))),
        memberIds: [...new Set(memberIds)],
        hidden: Boolean(stampSet.hidden ?? base.hidden ?? false),
        requiresSetId: String(builtInSet ? base.requiresSetId || "" : stampSet.requiresSetId ?? base.requiresSetId ?? ""),
        seriesId: String(builtInSet ? base.seriesId || "" : stampSet.seriesId ?? base.seriesId ?? ""),
        seriesName: String(builtInSet ? base.seriesName || "" : stampSet.seriesName ?? base.seriesName ?? ""),
        tier: Math.max(1, Math.floor(Number(builtInSet ? base.tier || 1 : stampSet.tier ?? base.tier ?? 1))),
      });
    });
  }
  return Array.from(byId.values())
    .filter((stampSet) => stampSet.memberIds.length)
    .sort(stampSetDisplayOrder);
}

function isBuiltInStampSet(stampSetId) {
  return defaultStampSets.some((stampSet) => stampSet.id === stampSetId);
}

function normalizeOwnedStampIdsByStudent(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(input).map(([studentId, stampIds]) => [
      studentId,
      Array.isArray(stampIds)
        ? [...new Set(stampIds.map(String).filter((stampId) => !REMOVED_PURCHASABLE_STAMP_IDS.has(stampId)))]
        : [],
    ]),
  );
}

function normalizeEquippedHounyanLevels(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(input)
      .map(([studentId, level]) => [studentId, Math.floor(Number(level))])
      .filter(([, level]) => Number.isFinite(level) && level >= 1)
  );
}

function activeStampAssets() {
  if (!Array.isArray(state.stampAssets) || !state.stampAssets.length) {
    state.stampAssets = normalizeStampAssets();
  }
  return state.stampAssets;
}

function visibleStampAssets() {
  return activeStampAssets().filter((stamp) => !stamp.hidden && stampSetIsVisible(stamp));
}

function activeStampSets() {
  if (!Array.isArray(state.stampSets)) {
    state.stampSets = [];
  }
  return state.stampSets;
}

function visibleStampSets() {
  return activeStampSets()
    .filter((stampSet) => !stampSet.hidden && stampSetMembers(stampSet).length)
    .sort(stampSetDisplayOrder);
}

function stampSetDisplayOrder(a, b) {
  const aBuiltInOrder = defaultStampSets.findIndex((stampSet) => stampSet.id === a.id);
  const bBuiltInOrder = defaultStampSets.findIndex((stampSet) => stampSet.id === b.id);
  if (aBuiltInOrder >= 0 || bBuiltInOrder >= 0) {
    if (aBuiltInOrder >= 0 && bBuiltInOrder >= 0) {
      return aBuiltInOrder - bBuiltInOrder;
    }
    return aBuiltInOrder >= 0 ? -1 : 1;
  }
  if (a.requiresSetId === b.id) {
    return 1;
  }
  if (b.requiresSetId === a.id) {
    return -1;
  }
  const aFamily = a.seriesName || a.name;
  const bFamily = b.seriesName || b.name;
  const familyOrder = aFamily.localeCompare(bFamily, "ja");
  if (familyOrder !== 0) {
    return familyOrder;
  }
  if (a.seriesId && a.seriesId === b.seriesId) {
    return Number(a.tier || 1) - Number(b.tier || 1);
  }
  return a.name.localeCompare(b.name, "ja");
}

function stampSetMembers(stampSet) {
  if (!stampSet) {
    return [];
  }
  const ids = new Set(stampSet.memberIds || []);
  return activeStampAssets().filter((stamp) => ids.has(stamp.id));
}

function stampSetIsVisible(stamp) {
  if (!stamp?.setId) {
    return true;
  }
  const stampSet = activeStampSets().find((item) => item.id === stamp.setId);
  return Boolean(stampSet && !stampSet.hidden);
}

function persist() {
  if (stateLoadFailed) {
    showToast("保存データの読み込みに失敗しました。上書きを止めています");
    return false;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    createAutoBackup("auto");
    return true;
  } catch (error) {
    console.error(error);
    showToast("保存容量がいっぱいです。画像を小さくしてもう一度試してください");
    return false;
  }
}

function render() {
  if (expirePastDailyMissions()) persist();
  renderTopStats();
  renderStudentSwitch();
  renderStudentLists();
  renderStudentDetails();
  renderDailyMissions();
  renderSheetAlbum();
  renderRewards();
  renderStampBook();
  renderRedemptions();
  renderStampAssets();
  renderStampSets();
  renderLevelSettings();
  renderAutoBackups();
  renderGroups();
  renderTimetable();
  renderCalendar();
  renderCalendarDisplay();
  renderTimetableDisplay();
  els.viewButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewButton === activeView());
  });
}

function renderStudentSwitch() {
  const student = selectedStudent();
  els.currentStudentLabel.textContent = student
    ? `選択中：${student.name}${isTestStudent(student) ? "（テスト）" : ""}`
    : "選択中：児童未選択";

  if (!state.students.length) {
    els.studentSwitchList.innerHTML = '<p class="empty-state switch-empty">先生ページで児童を追加してください。</p>';
    return;
  }

  els.studentSwitchList.innerHTML = state.students
    .map((studentItem) => {
      const stats = studentStats(studentItem.id);
      const selected = studentItem.id === state.selectedStudentId ? " is-selected" : "";
      const selectedText = studentItem.id === state.selectedStudentId ? "true" : "false";
      return `
        <button class="student-tab-button${selected}${isTestStudent(studentItem) ? " is-test" : ""}" type="button" role="tab" aria-selected="${selectedText}" data-switch-student="${studentItem.id}">
          <strong>${escapeHtml(studentItem.name)}</strong>
          <span>${isTestStudent(studentItem) ? "テスト" : `${stats.currentSheet.count}/${SHEET_SIZE}`}</span>
        </button>
      `;
    })
    .join("");

  els.studentSwitchList.querySelectorAll("[data-switch-student]").forEach((button) => {
    button.addEventListener("click", () => {
      selectStudent(button.dataset.switchStudent);
    });
  });
}

function renderTopStats() {
  const regularStudents = state.students.filter((student) => !isTestStudent(student));
  const regularStudentIds = new Set(regularStudents.map((student) => student.id));
  if (els.totalStudents) {
    els.totalStudents.textContent = regularStudents.length;
  }
  if (els.todayStamps) {
    els.todayStamps.textContent = eventsForToday()
      .filter((event) => !event.canceled && regularStudentIds.has(event.studentId))
      .length;
  }
  if (els.allStamps) {
    els.allStamps.textContent = regularStudents.reduce((sum, student) => sum + studentStats(student.id).total, 0);
  }
}

function renderStudentLists() {
  if (els.childStudentList) {
    renderStudentList(els.childStudentList, { childMode: true });
  }
  renderStudentList(els.teacherStudentList, { childMode: false });
}

function renderStudentList(container, { childMode }) {
  if (!state.students.length) {
    container.innerHTML = childMode
      ? '<p class="empty-state">まだなまえがありません。先生ページで登録してください。</p>'
      : '<p class="empty-state">まだ児童が登録されていません。上のフォームから追加できます。</p>';
    return;
  }

  container.innerHTML = state.students
    .map((student) => {
      const stats = studentStats(student.id);
      const selected = student.id === state.selectedStudentId ? " is-selected" : "";
      const testStudent = isTestStudent(student);
      const sheetText = testStudent
        ? childMode ? "テスト / つかいほうだい" : "テスト / 制限なし"
        : childMode
        ? `シート ${stats.currentSheet.count}/${SHEET_SIZE}`
        : `累計 ${stats.total} / 使えるシート ${stats.availableSheets}`;
      const group = groupById(student.groupId);
      const meta = student.note || group?.name || (testStudent ? "制限なし・集計に入らない" : childMode ? "がんばり中" : "メモなし");
      return `
        <button class="student-card${selected}${testStudent ? " is-test" : ""}" type="button" data-select-student="${student.id}">
          <span>
            <span class="student-name">${escapeHtml(student.name)}${testStudent ? '<span class="test-student-badge">テスト</span>' : ""}</span>
            <span class="student-meta">${escapeHtml(meta)}</span>
          </span>
          <span class="student-meta">${escapeHtml(sheetText)}</span>
        </button>
      `;
    })
    .join("");

  container.querySelectorAll("[data-select-student]").forEach((button) => {
    button.addEventListener("click", () => {
      selectStudent(button.dataset.selectStudent);
      const detail = childMode ? els.childStudentDetail : els.teacherStudentDetail;
      detail?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function renderStudentDetails() {
  const student = selectedStudent();
  els.childStudentDetail.hidden = !student;
  els.teacherStudentDetail.hidden = !student;

  if (!student) {
    els.childCompletedSheets.textContent = "0";
    renderHounyanLevel(null, emptyStats());
    renderChildRewardGoal(null, emptyStats());
    return;
  }

  const stats = studentStats(student.id);
  const level = studentMascotLevel(student, stats);
  renderHounyanLevel(student, stats);

  els.childSelectedName.textContent = student.name;
  els.childTotal.textContent = stats.total;
  els.childAvailableSheets.textContent = testSheetBalanceText(student, stats);
  els.childCurrentSheetCount.textContent = `${stats.currentSheet.count}/${SHEET_SIZE}`;
  els.childRemainingText.textContent = `${stats.currentSheet.remaining}こ`;
  els.childCompletedSheets.textContent = stats.completedSheets;
  renderChildNextUnlock(stats.total, student);
  renderChildRewardGoal(student, stats);
  renderSheet({
    grid: els.childSheetGrid,
    title: els.childSheetTitle,
    progress: els.childSheetProgress,
    stats,
    childMode: true,
  });

  els.selectedStudentName.textContent = student.name;
  els.selectedTotal.textContent = stats.total;
  els.selectedAvailable.textContent = testSheetBalanceText(student, stats);
  els.selectedLevel.textContent = level.current;
  els.nextLevelText.textContent = level.remainingSheets === 0 ? "最大" : `あと${level.remainingSheets}シート`;
  renderSheet({
    grid: els.teacherSheetGrid,
    title: els.teacherSheetTitle,
    progress: els.teacherSheetProgress,
    stats,
    childMode: false,
  });
  renderHistory(student.id);
}

function missionProgressText(mission) {
  if (mission.status === "completed") return "達成！";
  if (mission.evaluationType === "manual") return "先生の確認待ち";
  const current = Math.min(mission.targetValue, Math.max(0, Number(mission.currentValue || 0)));
  return `${current} / ${mission.targetValue}${mission.unit}`;
}

function dailyMissionCardMarkup(mission, { teacher = false } = {}) {
  const completed = mission.status === "completed";
  const controls = !teacher ? "" : completed
    ? `<div class="mission-card-actions"><span class="mission-reward-status">${mission.rewardGranted ? "報酬付与済み" : "報酬未付与"}</span><button class="text-button" type="button" data-mission-revert="${escapeHtml(mission.id)}">未達成に戻す</button></div>`
    : mission.evaluationType === "manual"
      ? `<div class="mission-card-actions"><button class="primary-button compact-button" type="button" data-mission-complete="${escapeHtml(mission.id)}">達成にする</button></div>`
      : `<div class="mission-card-actions"><label class="field compact-field"><span>進捗を増減</span><input type="number" value="1" data-mission-adjustment="${escapeHtml(mission.id)}"></label><button class="soft-button compact-button" type="button" data-mission-adjust="${escapeHtml(mission.id)}">反映</button><button class="text-button" type="button" data-mission-complete="${escapeHtml(mission.id)}">達成にする</button></div>`;
  return `
    <article class="daily-mission-card${completed ? " is-completed" : ""}${lastCompletedMissionId === mission.id ? " is-newly-completed" : ""}">
      <div class="mission-card-main">
        <div class="mission-card-copy"><span class="mission-category">${escapeHtml(missionCategoryLabel(mission.category))}${mission.evaluationType === "manual" ? " / 先生判定" : ""}</span><h4>${escapeHtml(mission.displayText)}</h4></div>
        <strong class="mission-progress">${escapeHtml(missionProgressText(mission))}</strong>
      </div>
      <div class="mission-rewards"><span>できたら</span><strong>スタンプ ${mission.stampReward}こ</strong><strong>きっぷ ${mission.ticketReward}まい</strong></div>
      ${controls}
    </article>
  `;
}

function renderMissionTemplateOptions() {
  const previousCategory = els.missionTemplateCategory.value || "learning";
  const previousCondition = els.missionTemplateCondition.value || "print_completed_count";
  els.missionTemplateCategory.innerHTML = missionCategories.map(([id, label]) => `<option value="${id}">${label}</option>`).join("");
  els.missionTemplateCondition.innerHTML = missionConditions.map(([id, label]) => `<option value="${id}">${label}</option>`).join("");
  els.missionTemplateCategory.value = missionCategories.some(([id]) => id === previousCategory) ? previousCategory : "learning";
  els.missionTemplateCondition.value = missionConditions.some(([id]) => id === previousCondition) ? previousCondition : "print_completed_count";
}

function renderDailyMissions() {
  const today = CalendarDate.dateKey(new Date());
  const childStudent = selectedStudent();
  if (!missionStudentId || !state.students.some((student) => student.id === missionStudentId)) {
    missionStudentId = childStudent?.id || state.students[0]?.id || "";
  }
  const beforeMissionCount = state.dailyMissions.length;
  const beforeSettingCount = state.studentMissionSettings.length;
  let automaticChanged = false;
  const missionStudents = [childStudent, state.students.find((student) => student.id === missionStudentId)]
    .filter(Boolean)
    .filter((student, index, students) => students.findIndex((item) => item.id === student.id) === index);
  missionStudents.forEach((student) => {
    generateDailyMissions(student.id, today);
    automaticChanged = refreshAutomaticMissions(student.id, today) || automaticChanged;
  });
  if (state.dailyMissions.length !== beforeMissionCount || state.studentMissionSettings.length !== beforeSettingCount || automaticChanged) persist();

  if (!childStudent) {
    els.childTicketBalance.textContent = "きっぷ 0まい";
    els.childDailyMissions.innerHTML = '<p class="empty-state compact-empty">児童を選ぶと、きょうのミッションが表示されます。</p>';
  } else if (!canGenerateDailyMissions(childStudent.id, today)) {
    els.childTicketBalance.textContent = `きっぷ ${childStudent.ticketBalance || 0}まい`;
    els.childDailyMissions.innerHTML = '<p class="empty-state compact-empty">今日はお休みです。デイリーミッションはありません。</p>';
  } else {
    const missions = getDailyMissions(childStudent.id, today);
    els.childTicketBalance.textContent = `きっぷ ${childStudent.ticketBalance || 0}まい`;
    els.childDailyMissions.innerHTML = missions.length
      ? missions.map((mission) => dailyMissionCardMarkup(mission)).join("")
      : '<p class="empty-state compact-empty">先生ページでミッションを追加してください。</p>';
  }

  els.missionStudentSelect.innerHTML = state.students.map((student) => `<option value="${escapeHtml(student.id)}">${escapeHtml(student.name)}${isTestStudent(student) ? "（テスト）" : ""}</option>`).join("") || '<option value="">児童未登録</option>';
  els.missionStudentSelect.value = missionStudentId;
  renderMissionTemplateManagement();
  renderStudentMissionSettings();
  renderTeacherDailyMissions();
}

function renderMissionTemplateManagement() {
  renderMissionTemplateOptions();
  const selectedTemplate = els.studentMissionTemplateSelect.value;
  const templates = state.missionTemplates.slice().sort((left, right) => left.name.localeCompare(right.name, "ja"));
  els.studentMissionTemplateSelect.innerHTML = `<option value="">ひな形を選ぶ</option>${templates.filter((template) => template.missionType === "daily" && template.enabled).map((template) => `<option value="${escapeHtml(template.id)}">${escapeHtml(template.name)}</option>`).join("")}`;
  if ([...els.studentMissionTemplateSelect.options].some((option) => option.value === selectedTemplate)) els.studentMissionTemplateSelect.value = selectedTemplate;
  els.missionTemplateList.innerHTML = templates.length ? templates.map((template) => `
    <article class="management-item${template.enabled ? "" : " is-disabled"}"><div><strong>${escapeHtml(template.name)}</strong><span>${escapeHtml(missionCategoryLabel(template.category))} / ${template.missionType === "daily" ? "デイリー" : "特別"} / ${escapeHtml(missionConditionLabel(template.conditionType))}</span></div><div class="management-actions"><button class="text-button" type="button" data-mission-template-edit="${escapeHtml(template.id)}">編集</button><button class="text-button" type="button" data-mission-template-copy="${escapeHtml(template.id)}">複製</button><button class="text-button" type="button" data-mission-template-toggle="${escapeHtml(template.id)}">${template.enabled ? "無効にする" : "有効にする"}</button><button class="text-button danger-text" type="button" data-mission-template-delete="${escapeHtml(template.id)}">削除</button></div></article>
  `).join("") : '<p class="empty-state">ミッションひな形はありません。</p>';
  els.missionTemplateList.querySelectorAll("[data-mission-template-edit]").forEach((button) => button.addEventListener("click", () => editMissionTemplate(button.dataset.missionTemplateEdit)));
  els.missionTemplateList.querySelectorAll("[data-mission-template-copy]").forEach((button) => button.addEventListener("click", () => copyMissionTemplate(button.dataset.missionTemplateCopy)));
  els.missionTemplateList.querySelectorAll("[data-mission-template-toggle]").forEach((button) => button.addEventListener("click", () => toggleMissionTemplate(button.dataset.missionTemplateToggle)));
  els.missionTemplateList.querySelectorAll("[data-mission-template-delete]").forEach((button) => button.addEventListener("click", () => deleteMissionTemplate(button.dataset.missionTemplateDelete)));
}

function renderStudentMissionSettings() {
  const student = state.students.find((item) => item.id === missionStudentId);
  els.teacherTicketBalance.textContent = `きっぷ ${student?.ticketBalance || 0}まい`;
  if (!student) {
    els.studentMissionSettingList.innerHTML = '<p class="empty-state">児童を追加してください。</p>';
    return;
  }
  const settings = state.studentMissionSettings.filter((setting) => setting.studentId === student.id).slice().sort((left, right) => left.displayOrder - right.displayOrder);
  els.studentMissionSettingList.innerHTML = settings.length ? settings.map((setting) => {
    const template = missionTemplateById(setting.missionTemplateId);
    return `<article class="management-item${setting.enabled ? "" : " is-disabled"}"><div><strong>${escapeHtml(template?.name || "削除されたひな形")}</strong><span>目標 ${setting.targetValue}${escapeHtml(template?.unit || "")} / スタンプ ${setting.stampReward}こ / きっぷ ${setting.ticketReward}まい</span></div><div class="management-actions"><button class="text-button" type="button" data-student-mission-edit="${escapeHtml(setting.id)}">編集</button><button class="text-button" type="button" data-student-mission-toggle="${escapeHtml(setting.id)}">${setting.enabled ? "外す" : "使う"}</button><button class="text-button danger-text" type="button" data-student-mission-delete="${escapeHtml(setting.id)}">削除</button></div></article>`;
  }).join("") : '<p class="empty-state">この児童のミッションはまだありません。</p>';
  els.studentMissionSettingList.querySelectorAll("[data-student-mission-edit]").forEach((button) => button.addEventListener("click", () => editStudentMissionSetting(button.dataset.studentMissionEdit)));
  els.studentMissionSettingList.querySelectorAll("[data-student-mission-toggle]").forEach((button) => button.addEventListener("click", () => toggleStudentMissionSetting(button.dataset.studentMissionToggle)));
  els.studentMissionSettingList.querySelectorAll("[data-student-mission-delete]").forEach((button) => button.addEventListener("click", () => deleteStudentMissionSetting(button.dataset.studentMissionDelete)));
}

function renderTeacherDailyMissions() {
  const student = state.students.find((item) => item.id === missionStudentId);
  const today = CalendarDate.dateKey(new Date());
  if (!student) {
    els.teacherDailyMissions.innerHTML = '<p class="empty-state">児童を選んでください。</p>';
    return;
  }
  if (!canGenerateDailyMissions(student.id, today)) {
    els.teacherDailyMissions.innerHTML = '<p class="empty-state">今日はこの児童の休業日です。</p>';
    return;
  }
  const missions = getDailyMissions(student.id, today);
  els.teacherDailyMissions.innerHTML = missions.length ? missions.map((mission) => dailyMissionCardMarkup(mission, { teacher: true })).join("") : '<p class="empty-state">表示するミッションはありません。</p>';
  els.teacherDailyMissions.querySelectorAll("[data-mission-complete]").forEach((button) => button.addEventListener("click", () => {
    if (!completeMission(button.dataset.missionComplete)) return;
    persist(); render(); showToast("ミッション達成！ 報酬を追加しました");
  }));
  els.teacherDailyMissions.querySelectorAll("[data-mission-revert]").forEach((button) => button.addEventListener("click", () => {
    if (revertMission(button.dataset.missionRevert)) showToast("未達成へ戻し、報酬も取り消しました");
  }));
  els.teacherDailyMissions.querySelectorAll("[data-mission-adjust]").forEach((button) => button.addEventListener("click", () => {
    const input = els.teacherDailyMissions.querySelector(`[data-mission-adjustment="${button.dataset.missionAdjust}"]`);
    if (adjustMissionProgress(button.dataset.missionAdjust, Number(input?.value || 0))) showToast("進捗を更新しました");
  }));
}

function clearMissionTemplateForm() {
  els.missionTemplateId.value = ""; els.missionTemplateName.value = ""; els.missionTemplateDisplayText.value = "";
  els.missionTemplateType.value = "daily"; els.missionTemplateCategory.value = "learning"; els.missionTemplateCondition.value = "print_completed_count";
  els.missionTemplateEvaluation.value = "automatic"; els.missionTemplateTarget.value = "1"; els.missionTemplateUnit.value = "まい";
  els.missionTemplateStampReward.value = "1"; els.missionTemplateTicketReward.value = "1"; els.missionTemplateEnabled.checked = true;
}

function updateMissionTemplateConditionFields() {
  const condition = missionConditions.find(([id]) => id === els.missionTemplateCondition.value);
  if (condition) els.missionTemplateUnit.value = condition[2];
  if (els.missionTemplateCondition.value === "manual") els.missionTemplateEvaluation.value = "manual";
}

function saveMissionTemplate() {
  const now = new Date().toISOString();
  const existing = missionTemplateById(els.missionTemplateId.value);
  const draft = {
    name: els.missionTemplateName.value.trim(), displayText: els.missionTemplateDisplayText.value.trim(), missionType: els.missionTemplateType.value,
    category: els.missionTemplateCategory.value, conditionType: els.missionTemplateCondition.value,
    evaluationType: els.missionTemplateCondition.value === "manual" ? "manual" : els.missionTemplateEvaluation.value,
    defaultTargetValue: Math.max(1, Number(els.missionTemplateTarget.value || 1)), unit: els.missionTemplateUnit.value.trim(),
    defaultStampReward: Math.max(0, Number(els.missionTemplateStampReward.value || 0)), defaultTicketReward: Math.max(0, Number(els.missionTemplateTicketReward.value || 0)),
    enabled: els.missionTemplateEnabled.checked, updatedAt: now,
  };
  if (!draft.name || !draft.displayText) return;
  if (existing) Object.assign(existing, draft);
  else state.missionTemplates.push({ id: crypto.randomUUID(), ...draft, createdAt: now });
  clearMissionTemplateForm(); persist(); render(); showToast("ミッションひな形を保存しました");
}

function editMissionTemplate(templateId) {
  const template = missionTemplateById(templateId); if (!template) return;
  els.missionTemplateId.value = template.id; els.missionTemplateName.value = template.name; els.missionTemplateDisplayText.value = template.displayText;
  els.missionTemplateType.value = template.missionType; els.missionTemplateCategory.value = template.category; els.missionTemplateCondition.value = template.conditionType;
  els.missionTemplateEvaluation.value = template.evaluationType; els.missionTemplateTarget.value = template.defaultTargetValue; els.missionTemplateUnit.value = template.unit;
  els.missionTemplateStampReward.value = template.defaultStampReward; els.missionTemplateTicketReward.value = template.defaultTicketReward; els.missionTemplateEnabled.checked = template.enabled;
  els.missionTemplateName.focus();
}

function copyMissionTemplate(templateId) {
  const template = missionTemplateById(templateId); if (!template) return;
  const now = new Date().toISOString(); state.missionTemplates.push({ ...structuredClone(template), id: crypto.randomUUID(), name: `${template.name}（コピー）`, createdAt: now, updatedAt: now });
  persist(); render(); showToast("ひな形を複製しました");
}

function toggleMissionTemplate(templateId) {
  const template = missionTemplateById(templateId); if (!template) return;
  template.enabled = !template.enabled; template.updatedAt = new Date().toISOString(); persist(); render();
}

function deleteMissionTemplate(templateId) {
  const template = missionTemplateById(templateId); if (!template || !confirm(`「${template.name}」を削除しますか？\n児童への設定も外れます。`)) return;
  state.missionTemplates = state.missionTemplates.filter((item) => item.id !== templateId);
  state.studentMissionSettings = state.studentMissionSettings.filter((setting) => setting.missionTemplateId !== templateId);
  persist(); render(); showToast("ミッションひな形を削除しました");
}

function clearStudentMissionSettingForm() {
  els.studentMissionSettingId.value = ""; els.studentMissionTemplateSelect.value = ""; els.studentMissionTarget.value = "1";
  els.studentMissionStampReward.value = "1"; els.studentMissionTicketReward.value = "1"; els.studentMissionEnabled.checked = true;
}

function fillStudentMissionFromTemplate() {
  const template = missionTemplateById(els.studentMissionTemplateSelect.value); if (!template) return;
  els.studentMissionTarget.value = template.defaultTargetValue; els.studentMissionStampReward.value = template.defaultStampReward; els.studentMissionTicketReward.value = template.defaultTicketReward;
}

function saveStudentMissionSetting() {
  const student = state.students.find((item) => item.id === missionStudentId); const template = missionTemplateById(els.studentMissionTemplateSelect.value);
  if (!student || !template) return;
  const now = new Date().toISOString(); const existing = missionSettingById(els.studentMissionSettingId.value);
  const draft = { studentId: student.id, missionTemplateId: template.id, targetValue: Math.max(1, Number(els.studentMissionTarget.value || 1)), stampReward: Math.max(0, Number(els.studentMissionStampReward.value || 0)), ticketReward: Math.max(0, Number(els.studentMissionTicketReward.value || 0)), enabled: els.studentMissionEnabled.checked, updatedAt: now };
  if (existing) Object.assign(existing, draft); else state.studentMissionSettings.push({ id: crypto.randomUUID(), ...draft, displayOrder: state.studentMissionSettings.filter((setting) => setting.studentId === student.id).length, validFrom: "", validUntil: "", createdAt: now });
  clearStudentMissionSettingForm(); persist(); render(); showToast("児童のミッションを保存しました");
}

function editStudentMissionSetting(settingId) {
  const setting = missionSettingById(settingId); if (!setting) return;
  els.studentMissionSettingId.value = setting.id; els.studentMissionTemplateSelect.value = setting.missionTemplateId; els.studentMissionTarget.value = setting.targetValue;
  els.studentMissionStampReward.value = setting.stampReward; els.studentMissionTicketReward.value = setting.ticketReward; els.studentMissionEnabled.checked = setting.enabled;
}

function toggleStudentMissionSetting(settingId) {
  const setting = missionSettingById(settingId); if (!setting) return;
  setting.enabled = !setting.enabled; setting.updatedAt = new Date().toISOString(); persist(); render();
}

function deleteStudentMissionSetting(settingId) {
  const setting = missionSettingById(settingId); if (!setting || !confirm("この児童のミッション設定を削除しますか？")) return;
  state.studentMissionSettings = state.studentMissionSettings.filter((item) => item.id !== settingId); persist(); render();
}

function applyTicketAdjustment() {
  const student = state.students.find((item) => item.id === missionStudentId); const amount = Number(els.ticketAdjustment.value || 0);
  if (!student || !amount) return;
  student.ticketBalance = Math.max(0, Number(student.ticketBalance || 0) + amount); els.ticketAdjustment.value = "0"; persist(); render(); showToast("きっぷ残高を更新しました");
}

function renderChildNextUnlock(total, student) {
  if (isTestStudent(student)) {
    els.childNextUnlock.innerHTML = `
      <div>
        <span>テスト</span>
        <strong>スタンプはぜんぶつかえるよ！</strong>
      </div>
    `;
    els.childNextUnlock.classList.add("is-complete");
    return;
  }
  const nextStamp = nextUnlockStamp(total);
  if (!nextStamp) {
    els.childNextUnlock.innerHTML = `
      <div>
        <span>つぎのもくひょう</span>
        <strong>ぜんぶかいほうずみ！</strong>
      </div>
    `;
    els.childNextUnlock.classList.add("is-complete");
    return;
  }

  const remaining = Math.max(0, nextStamp.unlockAt - total);
  els.childNextUnlock.innerHTML = `
    <div>
      <span>つぎのもくひょう</span>
      <strong>あと${remaining}こで${escapeHtml(nextStamp.name)}かいほう！</strong>
    </div>
    <img class="next-unlock-preview" src="${escapeHtml(nextStamp.src)}" alt="${escapeHtml(nextStamp.name)}のプレビュー">
  `;
  els.childNextUnlock.classList.remove("is-complete");
}

function rewardGoalForStudent(student) {
  const goal = state.rewardGoalsByStudent?.[student?.id];
  if (!goal) {
    return null;
  }
  if (goal.type === "stamp") {
    const stamp = activeStampAssets().find((item) => item.id === goal.id && item.purchaseOnly && !item.hidden);
    return stamp ? { type: "stamp", item: stamp, costSheets: stampPriceSheets(stamp) } : null;
  }
  if (goal.type === "stamp-set") {
    const stampSet = visibleStampSets().find((item) => item.id === goal.id);
    return stampSet ? { type: "stamp-set", item: stampSet, costSheets: stampSetPriceSheets(stampSet) } : null;
  }
  return null;
}

function renderChildRewardGoal(student, stats) {
  const goal = rewardGoalForStudent(student);
  if (!goal) {
    els.childRewardGoal.innerHTML = `
      <div class="reward-goal-preview reward-goal-placeholder" aria-hidden="true">?</div>
      <div class="reward-goal-copy">
        <span>いまのねらい</span>
        <strong>おかいもので えらぼう！</strong>
        <p>スタンプかセットを ねらいにできるよ。</p>
      </div>
    `;
    els.childRewardGoal.classList.remove("is-ready");
    els.childRewardGoal.removeAttribute("hidden");
    return;
  }

  const availableSheets = stats.availableSheets;
  const ready = availableSheets >= goal.costSheets;
  const remaining = Math.max(0, goal.costSheets - availableSheets);
  const preview = goal.type === "stamp"
    ? `<img class="reward-goal-stamp" src="${escapeHtml(goal.item.src)}" alt="${escapeHtml(goal.item.name)}スタンプ">`
    : `<div class="reward-goal-set-preview" aria-label="${escapeHtml(goal.item.name)}のスタンプ">
        ${stampSetMembers(goal.item).slice(0, 6).map((stamp) => `<img src="${escapeHtml(stamp.src)}" alt="${escapeHtml(stamp.name)}">`).join("")}
      </div>`;
  const progressText = isTestStudent(student)
    ? "テストなら いつでも こうにゅうできるよ！"
    : ready
      ? "いま こうにゅうできるよ！"
      : `あと${remaining}まいで こうにゅうできるよ！`;

  els.childRewardGoal.innerHTML = `
    <div class="reward-goal-preview">${preview}</div>
    <div class="reward-goal-copy">
      <span>いまのねらい</span>
      <strong>${escapeHtml(goal.item.name)}</strong>
      <p>${goal.costSheets}シート / ${progressText}</p>
    </div>
  `;
  els.childRewardGoal.removeAttribute("hidden");
  els.childRewardGoal.classList.toggle("is-ready", ready || isTestStudent(student));
}

function renderHounyanLevel(student, stats) {
  const level = studentMascotLevel(student, stats);
  const currentRule = level.currentRule || defaultLevelRules[0];
  const displayRule = equippedHounyanRule(student, level);
  const image = displayRule.image || defaultLevelRules[0].image;
  const actualImage = currentRule.image || defaultLevelRules[0].image;
  const alt = `${currentRule.name}のほうにゃん`;
  if (els.childHounyanImage) {
    els.childHounyanImage.src = image;
    els.childHounyanImage.alt = `${displayRule.name}のほうにゃん`;
  }
  if (els.shopHounyanImage) {
    els.shopHounyanImage.src = image;
    els.shopHounyanImage.alt = `${displayRule.name}のほうにゃん`;
  }
  if (els.teacherLevelImage) {
    els.teacherLevelImage.src = actualImage;
    els.teacherLevelImage.alt = alt;
  }
  if (els.teacherLevelName) {
    els.teacherLevelName.textContent = student
      ? `Lv.${level.current} ${currentRule.name}`
      : "Lv.1 いつものほうにゃん";
  }
  if (els.teacherLevelRequirement) {
    els.teacherLevelRequirement.textContent = level.nextRule
      ? `次はあと${level.remainingSheets}シートで「${level.nextRule.name}」`
      : "今の設定では最大レベルです";
  }
  if (els.childLevelName) {
    els.childLevelName.textContent = `Lv.${level.current} ${currentRule.name}`;
  }
  if (els.childLevelRequirement) {
    els.childLevelRequirement.textContent = level.nextRule
      ? `あと${level.remainingStamps}こでレベルアップ！`
      : "いまのせっていではさいだいレベルです";
  }
  if (els.childLevelProgressBar) {
    els.childLevelProgressBar.style.width = `${level.progressPercent}%`;
  }
  if (els.childLevelProgressText) {
    els.childLevelProgressText.textContent = level.nextRule
      ? `${level.progressCurrent}/${level.progressNeeded}こ`
      : "さいだいレベル";
  }
  if (els.childNextLevelPreview) {
    els.childNextLevelPreview.textContent = level.nextRule ? "?" : "★";
    els.childNextLevelPreview.setAttribute(
      "aria-label",
      level.nextRule ? "つぎのかぶりものはひみつ" : "さいだいレベル"
    );
  }
}

function equippedHounyanRule(student, level) {
  if (!student) {
    return level.currentRule || defaultLevelRules[0];
  }
  if (!state.equippedHounyanLevelByStudent) {
    state.equippedHounyanLevelByStudent = {};
  }
  const hasChoice = Object.prototype.hasOwnProperty.call(state.equippedHounyanLevelByStudent, student.id);
  const choice = hasChoice ? Math.floor(Number(state.equippedHounyanLevelByStudent[student.id])) : level.current;
  const chosenLevel = Math.max(1, Math.min(level.current, Number.isFinite(choice) ? choice : level.current));
  return activeLevelRules().find((rule) => rule.level === chosenLevel) || level.currentRule || defaultLevelRules[0];
}

function openHounyanCloset() {
  const student = selectedStudent();
  if (!student) {
    showToast("先に児童をえらんでね");
    return;
  }
  renderHounyanCloset();
  els.hounyanClosetLayer.hidden = false;
  els.hounyanClosetLayer.classList.remove("is-showing");
  requestAnimationFrame(() => {
    els.hounyanClosetLayer.classList.add("is-showing");
    els.hounyanClosetList.querySelector(".is-selected, .hounyan-closet-option")?.focus();
  });
}

function sortedGroups({ includeDisabled = true } = {}) {
  return state.groups
    .filter((group) => includeDisabled || group.enabled)
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

function groupById(groupId) {
  return state.groups.find((group) => group.id === groupId) || null;
}

function selectedGroup() {
  return groupById(state.selectedGroupId);
}

function selectGroup(groupId) {
  const group = groupById(groupId);
  if (!group || !group.enabled) {
    state.selectedGroupId = "";
  } else {
    state.selectedGroupId = group.id;
  }
  persist();
  render();
}

function ensureGroupSelection() {
  if (selectedGroup()?.enabled) return;
  state.selectedGroupId = sortedGroups({ includeDisabled: false })[0]?.id || "";
}

function groupOptions(selectedId = "", { includeBlank = false, includeDisabled = false } = {}) {
  const groups = sortedGroups({ includeDisabled });
  const blank = includeBlank ? '<option value="">組を選ばない</option>' : "";
  return blank + groups.map((group) => `
    <option value="${escapeHtml(group.id)}"${group.id === selectedId ? " selected" : ""}>${escapeHtml(group.name)}${group.enabled ? "" : "（無効）"}</option>
  `).join("");
}

function renderGroups() {
  ensureGroupSelection();
  const currentId = state.selectedGroupId;
  els.currentGroupSelect.innerHTML = groupOptions(currentId, { includeBlank: true });
  els.timetableGroupSelect.innerHTML = groupOptions(currentId, { includeBlank: true });
  els.calendarGroupSelect.innerHTML = groupOptions(currentId, { includeBlank: true });
  els.calendarViewGroupSelect.innerHTML = groupOptions(currentId, { includeBlank: true });
  els.calendarTimetableGroupSelect.innerHTML = groupOptions(currentId, { includeBlank: true });
  els.studentGroup.innerHTML = groupOptions(els.studentGroup.value, { includeBlank: true, includeDisabled: true });
  els.timetableCopyTarget.innerHTML = groupOptions("", { includeBlank: true });

  if (!state.groups.length) {
    els.groupList.innerHTML = '<p class="empty-state">まだ組がありません。先に組を追加してください。</p>';
    return;
  }

  els.groupList.innerHTML = sortedGroups().map((group, index) => `
    <article class="management-item${group.enabled ? "" : " is-disabled"}">
      <div>
        <strong>${escapeHtml(group.name)}</strong>
        <span>${group.enabled ? "使用中" : "無効（履歴は残っています）"}</span>
      </div>
      <div class="management-actions">
        <button class="icon-button" type="button" title="上へ移動" aria-label="上へ移動" data-group-move="up" data-group-id="${escapeHtml(group.id)}"${index === 0 ? " disabled" : ""}>↑</button>
        <button class="icon-button" type="button" title="下へ移動" aria-label="下へ移動" data-group-move="down" data-group-id="${escapeHtml(group.id)}"${index === state.groups.length - 1 ? " disabled" : ""}>↓</button>
        <button class="text-button" type="button" data-group-select="${escapeHtml(group.id)}">選択</button>
        <button class="text-button" type="button" data-group-edit="${escapeHtml(group.id)}">編集</button>
        <button class="text-button" type="button" data-group-toggle="${escapeHtml(group.id)}">${group.enabled ? "無効にする" : "有効にする"}</button>
        <button class="text-button danger-text" type="button" data-group-delete="${escapeHtml(group.id)}">完全削除</button>
      </div>
    </article>
  `).join("");

  els.groupList.querySelectorAll("[data-group-select]").forEach((button) => button.addEventListener("click", () => selectGroup(button.dataset.groupSelect)));
  els.groupList.querySelectorAll("[data-group-edit]").forEach((button) => button.addEventListener("click", () => editGroup(button.dataset.groupEdit)));
  els.groupList.querySelectorAll("[data-group-toggle]").forEach((button) => button.addEventListener("click", () => toggleGroup(button.dataset.groupToggle)));
  els.groupList.querySelectorAll("[data-group-delete]").forEach((button) => button.addEventListener("click", () => deleteGroup(button.dataset.groupDelete)));
  els.groupList.querySelectorAll("[data-group-move]").forEach((button) => button.addEventListener("click", () => moveGroup(button.dataset.groupId, button.dataset.groupMove)));
}

function saveGroup() {
  const name = els.groupName.value.trim();
  if (!name) {
    showToast("組名を入力してください");
    return;
  }
  const now = new Date().toISOString();
  if (els.groupId.value) {
    const group = groupById(els.groupId.value);
    if (!group) return;
    group.name = name;
    group.enabled = els.groupEnabled.checked;
    group.updatedAt = now;
  } else {
    const group = {
      id: crypto.randomUUID(),
      name,
      enabled: els.groupEnabled.checked,
      sortOrder: sortedGroups().length,
      createdAt: now,
      updatedAt: now,
    };
    state.groups.push(group);
    if (group.enabled) state.selectedGroupId = group.id;
  }
  clearGroupForm();
  persist();
  render();
  showToast("組を保存しました");
}

function clearGroupForm() {
  els.groupId.value = "";
  els.groupName.value = "";
  els.groupEnabled.checked = true;
}

function editGroup(groupId) {
  const group = groupById(groupId);
  if (!group) return;
  els.groupId.value = group.id;
  els.groupName.value = group.name;
  els.groupEnabled.checked = group.enabled;
  els.groupName.focus();
}

function toggleGroup(groupId) {
  const group = groupById(groupId);
  if (!group) return;
  group.enabled = !group.enabled;
  group.updatedAt = new Date().toISOString();
  if (!group.enabled && state.selectedGroupId === group.id) ensureGroupSelection();
  persist();
  render();
  showToast(group.enabled ? "組を有効にしました" : "組を無効にしました");
}

function moveGroup(groupId, direction) {
  const groups = sortedGroups();
  const index = groups.findIndex((group) => group.id === groupId);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= groups.length) return;
  const current = groups[index];
  const target = groups[targetIndex];
  [current.sortOrder, target.sortOrder] = [target.sortOrder, current.sortOrder];
  persist();
  render();
}

function deleteGroup(groupId) {
  const group = groupById(groupId);
  if (!group) return;
  const related = state.timetables.filter((timetable) => timetable.groupId === groupId).length
    + state.timetableOverrides.filter((override) => override.groupId === groupId).length
    + state.calendarEvents.filter((event) => event.groupIds.includes(groupId)).length;
  const ok = confirm(`${group.name}を完全に削除します。関連する時間割・当日変更・組別予定も削除されます（${related}件）。よろしいですか？`);
  if (!ok) return;
  createAutoBackup("before-delete", { force: true });
  state.groups = state.groups.filter((item) => item.id !== groupId);
  state.timetables = state.timetables.filter((timetable) => timetable.groupId !== groupId);
  state.timetableOverrides = state.timetableOverrides.filter((override) => override.groupId !== groupId);
  state.calendarEvents = state.calendarEvents.map((event) => ({ ...event, groupIds: event.groupIds.filter((id) => id !== groupId) }))
    .filter((event) => event.scope !== "groups" || event.groupIds.length);
  state.students.forEach((student) => {
    if (student.groupId === groupId) student.groupId = "";
  });
  ensureGroupSelection();
  persist();
  render();
  showToast("組と関連データを削除しました");
}

function activeSubjects({ includeDisabled = false } = {}) {
  return state.subjects.filter((subject) => includeDisabled || subject.enabled).slice().sort((left, right) => left.sortOrder - right.sortOrder);
}

function subjectById(subjectId) {
  return state.subjects.find((subject) => subject.id === subjectId) || null;
}

function subjectOptions(selectedId = "", { includeBlank = true } = {}) {
  const blank = includeBlank ? '<option value="">未設定</option>' : "";
  return blank + activeSubjects({ includeDisabled: selectedId ? true : false }).map((subject) => `
    <option value="${escapeHtml(subject.id)}"${subject.id === selectedId ? " selected" : ""}>${escapeHtml(subject.name)}${subject.enabled ? "" : "（無効）"}</option>
  `).join("");
}

function timetableForEditor(groupId) {
  return state.timetables.filter((timetable) => timetable.groupId === groupId && timetable.enabled)
    .sort((left, right) => String(right.startsOn).localeCompare(String(left.startsOn)) || String(right.updatedAt).localeCompare(String(left.updatedAt)))[0] || null;
}

function renderTimetable() {
  const group = selectedGroup();
  const timetable = group ? timetableForEditor(group.id) : null;
  els.timetableName.value = timetable?.name || "基本時間割";
  els.timetablePeriodCount.value = String(timetable?.periodCount || DEFAULT_PERIOD_COUNT);
  els.timetableStartsOn.value = timetable?.startsOn || "";
  els.timetableEndsOn.value = timetable?.endsOn || "";
  renderTimetableEditor(timetable ? { periodCount: timetable.periodCount, cells: timetable.cells } : null);
  renderSubjectList();
}

function readTimetableEditor() {
  const cells = {};
  els.timetableEditor.querySelectorAll("[data-timetable-cell]").forEach((select) => {
    if (select.value) cells[select.dataset.timetableCell] = select.value;
  });
  return {
    periodCount: Math.min(10, Math.max(1, Math.floor(Number(els.timetablePeriodCount.value || DEFAULT_PERIOD_COUNT)))),
    cells,
  };
}

function renderTimetableEditor(draft = null) {
  const group = selectedGroup();
  if (!group) {
    els.timetableEditor.innerHTML = '<p class="empty-state">先に「組の管理」で組を追加・選択してください。</p>';
    return;
  }
  const timetable = timetableForEditor(group.id);
  const source = draft || (timetable ? { periodCount: timetable.periodCount, cells: timetable.cells } : { periodCount: DEFAULT_PERIOD_COUNT, cells: {} });
  const periodCount = Math.min(10, Math.max(1, Math.floor(Number(source.periodCount || DEFAULT_PERIOD_COUNT))));
  els.timetablePeriodCount.value = String(periodCount);
  els.timetableEditor.innerHTML = `
    <table class="timetable-table">
      <thead><tr><th>時間</th>${WEEKDAYS.map((weekday) => `<th>${weekday}</th>`).join("")}</tr></thead>
      <tbody>${Array.from({ length: periodCount }, (_, periodIndex) => {
        const periodNumber = periodIndex + 1;
        return `<tr><th>${periodNumber}時間目</th>${WEEKDAYS.map((_, weekdayIndex) => {
          const key = `${weekdayIndex}-${periodNumber}`;
          return `<td><select class="select timetable-cell-select" data-timetable-cell="${key}">${subjectOptions(source.cells?.[key] || "")}</select></td>`;
        }).join("")}</tr>`;
      }).join("")}</tbody>
    </table>
  `;
}

function saveTimetable() {
  const group = selectedGroup();
  if (!group) {
    showToast("先に対象の組を選んでください");
    return;
  }
  const draft = readTimetableEditor();
  const name = els.timetableName.value.trim() || "基本時間割";
  const startsOn = els.timetableStartsOn.value;
  const endsOn = els.timetableEndsOn.value;
  if (startsOn && endsOn && CalendarDate.compareDateKeys(startsOn, endsOn) > 0) {
    showToast("適用終了日は開始日以降にしてください");
    return;
  }
  const current = timetableForEditor(group.id);
  const now = new Date().toISOString();
  if (current) {
    Object.assign(current, { name, startsOn, endsOn, ...draft, updatedAt: now });
  } else {
    state.timetables.push({ id: crypto.randomUUID(), groupId: group.id, name, startsOn, endsOn, enabled: true, ...draft, createdAt: now, updatedAt: now });
  }
  persist();
  render();
  showToast(`${group.name}の時間割を保存しました`);
}

function copyTimetableToGroup() {
  const sourceGroup = selectedGroup();
  const targetGroup = groupById(els.timetableCopyTarget.value);
  if (!sourceGroup || !targetGroup || sourceGroup.id === targetGroup.id) {
    showToast("コピー先の別の組を選んでください");
    return;
  }
  const draft = readTimetableEditor();
  const now = new Date().toISOString();
  const existing = timetableForEditor(targetGroup.id);
  const copied = { name: els.timetableName.value.trim() || "基本時間割", startsOn: els.timetableStartsOn.value, endsOn: els.timetableEndsOn.value, ...draft, updatedAt: now };
  if (existing) Object.assign(existing, copied);
  else state.timetables.push({ id: crypto.randomUUID(), groupId: targetGroup.id, enabled: true, createdAt: now, ...copied });
  persist();
  render();
  showToast(`${targetGroup.name}へ時間割をコピーしました`);
}

function resetTimetable() {
  const group = selectedGroup();
  if (!group) return;
  if (!confirm(`${group.name}の時間割を空にします。よろしいですか？`)) return;
  const timetable = timetableForEditor(group.id);
  if (timetable) {
    timetable.cells = {};
    timetable.periodCount = DEFAULT_PERIOD_COUNT;
    timetable.updatedAt = new Date().toISOString();
  }
  persist();
  render();
  showToast("時間割を初期化しました");
}

function renderSubjectList() {
  els.subjectList.innerHTML = activeSubjects({ includeDisabled: true }).map((subject) => `
    <span class="subject-chip${subject.enabled ? "" : " is-disabled"}">${escapeHtml(subject.name)}
      <button type="button" title="編集" aria-label="${escapeHtml(subject.name)}を編集" data-subject-edit="${escapeHtml(subject.id)}">✎</button>
      <button type="button" title="${subject.enabled ? "無効にする" : "有効にする"}" aria-label="${escapeHtml(subject.name)}を切り替え" data-subject-toggle="${escapeHtml(subject.id)}">${subject.enabled ? "−" : "+"}</button>
    </span>
  `).join("");
  els.subjectList.querySelectorAll("[data-subject-edit]").forEach((button) => button.addEventListener("click", () => editSubject(button.dataset.subjectEdit)));
  els.subjectList.querySelectorAll("[data-subject-toggle]").forEach((button) => button.addEventListener("click", () => toggleSubject(button.dataset.subjectToggle)));
}

function saveSubject() {
  const name = els.subjectName.value.trim();
  if (!name) return;
  const subject = subjectById(els.subjectId.value);
  if (subject) subject.name = name;
  else state.subjects.push({ id: crypto.randomUUID(), name, sortOrder: state.subjects.length, enabled: true });
  clearSubjectForm();
  persist();
  render();
}

function clearSubjectForm() {
  els.subjectId.value = "";
  els.subjectName.value = "";
}

function editSubject(subjectId) {
  const subject = subjectById(subjectId);
  if (!subject) return;
  els.subjectId.value = subject.id;
  els.subjectName.value = subject.name;
  els.subjectName.focus();
}

function toggleSubject(subjectId) {
  const subject = subjectById(subjectId);
  if (!subject) return;
  subject.enabled = !subject.enabled;
  persist();
  render();
}

function calendarEventTypeLabel(type) {
  return calendarEventTypes.find(([id]) => id === type)?.[1] || "その他";
}

function eventTargetsGroup(event, groupId) {
  return event.scope === "school" || (Boolean(groupId) && event.groupIds.includes(groupId));
}

function eventOccursOnDate(event, date) {
  if (!CalendarDate.isDateInRange(date, event.startDate, event.endDate || event.startDate)) return false;
  if (event.repeat !== "weekly") return true;
  const start = CalendarDate.parseDateKey(event.startDate);
  const target = CalendarDate.parseDateKey(date);
  return Boolean(start && target && start.getDay() === target.getDay());
}

function calendarEventsForDate(date, groupId) {
  return state.calendarEvents
    .filter((event) => eventTargetsGroup(event, groupId) && eventOccursOnDate(event, date))
    .slice()
    .sort((left, right) => left.allDay === right.allDay ? left.title.localeCompare(right.title, "ja") : left.allDay ? -1 : 1);
}

function eventSchoolDayEffect(event) {
  if (event.schoolDayEffect && event.schoolDayEffect !== "auto") return event.schoolDayEffect;
  if (["holiday", "substitute-holiday", "school-closure", "long-vacation"].includes(event.type)) return "holiday";
  if (event.type === "saturday-school") return "school-day";
  if (event.type === "shortened") return "shortened";
  if (["school-event", "grade-event", "group-event"].includes(event.type)) return "event-day";
  return "none";
}

function schoolDayInfo(date, groupId = "") {
  const target = CalendarDate.parseDateKey(date);
  if (!target) return { date, isSchoolDay: false, isHoliday: false, isRegularSchoolDay: false, hasSpecialEvent: false, status: "unset", events: [] };
  const events = calendarEventsForDate(date, groupId);
  const effects = events.map(eventSchoolDayEffect);
  const holiday = CalendarDate.holidayName(date);
  const weekday = target.getDay();
  const baseSchoolDay = weekday >= 1 && weekday <= 5 && !holiday;
  const forcedHoliday = effects.includes("holiday");
  const forcedSchoolDay = effects.includes("school-day");
  const isSchoolDay = forcedHoliday ? false : forcedSchoolDay || baseSchoolDay;
  const isShortened = isSchoolDay && (effects.includes("shortened") || events.some((event) => event.timetableEffect === "shortened"));
  const isEventDay = isSchoolDay && (effects.includes("event-day") || events.some((event) => event.timetableEffect === "event"));
  return {
    date,
    isSchoolDay,
    isHoliday: !isSchoolDay,
    isRegularSchoolDay: isSchoolDay && !forcedSchoolDay && !isShortened && !isEventDay,
    hasSpecialEvent: Boolean(events.length || holiday || isShortened || isEventDay),
    status: !isSchoolDay ? "holiday" : isShortened ? "shortened" : isEventDay ? "event" : forcedSchoolDay ? "special" : "normal",
    holidayName: holiday,
    events,
  };
}

function isSchoolDay(date, groupId = "") {
  return schoolDayInfo(date, groupId).isSchoolDay;
}

function isHoliday(date, groupId = "") {
  return !isSchoolDay(date, groupId);
}

function timetableForDate(groupId, date) {
  return state.timetables
    .filter((timetable) => timetable.groupId === groupId && timetable.enabled && CalendarDate.isDateInRange(date, timetable.startsOn, timetable.endsOn))
    .slice()
    .sort((left, right) => String(right.startsOn).localeCompare(String(left.startsOn)) || String(right.updatedAt).localeCompare(String(left.updatedAt)))[0] || null;
}

function getDayTimetable(groupId, date) {
  const day = schoolDayInfo(date, groupId);
  if (!groupId || !day.isSchoolDay) return { ...day, timetable: null, periods: [] };
  const timetable = timetableForDate(groupId, date);
  if (!timetable) return { ...day, timetable: null, periods: [] };
  const weekdayIndex = (CalendarDate.parseDateKey(date).getDay() + 6) % 7;
  const overrides = state.timetableOverrides.filter((override) => override.groupId === groupId && override.date === date);
  const overrideByPeriod = new Map(overrides.map((override) => [override.periodNumber, override]));
  const periods = Array.from({ length: timetable.periodCount }, (_, periodIndex) => {
    const periodNumber = periodIndex + 1;
    const override = overrideByPeriod.get(periodNumber);
    const subjectId = override ? override.subjectId : timetable.cells[`${weekdayIndex}-${periodNumber}`] || "";
    return { periodNumber, subjectId, subject: subjectById(subjectId), override };
  });
  return { ...day, timetable, periods };
}

function hasSubjectOnDate(groupId, date, subjectId) {
  return getDayTimetable(groupId, date).periods.some((period) => period.subjectId === subjectId);
}

function schoolDaysAfter(date, count, groupId = "") {
  let cursor = String(date || "");
  const goal = Math.max(0, Math.floor(Number(count || 0)));
  if (!CalendarDate.parseDateKey(cursor)) return "";
  let found = 0;
  while (found < goal) {
    cursor = CalendarDate.addDays(cursor, 1);
    if (isSchoolDay(cursor, groupId)) found += 1;
  }
  return cursor;
}

function countSchoolDaysBetween(startDate, endDate, groupId = "") {
  if (!CalendarDate.parseDateKey(startDate) || !CalendarDate.parseDateKey(endDate) || CalendarDate.compareDateKeys(startDate, endDate) > 0) return 0;
  let count = 0;
  let cursor = startDate;
  while (CalendarDate.compareDateKeys(cursor, endDate) <= 0) {
    if (isSchoolDay(cursor, groupId)) count += 1;
    cursor = CalendarDate.addDays(cursor, 1);
  }
  return count;
}

function canGenerateDailyMission(studentId, date = CalendarDate.dateKey(new Date())) {
  const student = state.students.find((item) => item.id === studentId);
  return Boolean(student && (isTestStudent(student) || isSchoolDay(date, student.groupId)));
}

function missionCalendarContext(studentId, date = CalendarDate.dateKey(new Date())) {
  const student = state.students.find((item) => item.id === studentId);
  const testMode = isTestStudent(student);
  const day = schoolDayInfo(date, student?.groupId || "");
  return {
    canGenerate: Boolean(student && (testMode || day.isSchoolDay)),
    isTestStudent: testMode,
    schoolDay: day,
    timetable: !testMode || student?.testUseTimetable ? getDayTimetable(student?.groupId || "", date) : { ...day, timetable: null, periods: [] },
  };
}

function canGenerateDailyMissions(studentId, date = CalendarDate.dateKey(new Date())) {
  return canGenerateDailyMission(studentId, date);
}

function missionTemplateById(templateId) {
  return state.missionTemplates.find((template) => template.id === templateId) || null;
}

function missionSettingById(settingId) {
  return state.studentMissionSettings.find((setting) => setting.id === settingId) || null;
}

function missionCategoryLabel(category) {
  return missionCategories.find(([id]) => id === category)?.[1] || "その他";
}

function missionConditionLabel(conditionType) {
  return missionConditions.find(([id]) => id === conditionType)?.[1] || "先生による判定";
}

function missionDisplayText(text, targetValue) {
  return String(text || "ミッション").replaceAll("{target}", String(targetValue));
}

function missionSettingsForStudent(studentId, date = CalendarDate.dateKey(new Date())) {
  return state.studentMissionSettings.filter((setting) => {
    const template = missionTemplateById(setting.missionTemplateId);
    return setting.studentId === studentId && setting.enabled && template?.enabled && template.missionType === "daily"
      && CalendarDate.isDateInRange(date, setting.validFrom, setting.validUntil);
  }).slice().sort((left, right) => left.displayOrder - right.displayOrder);
}

function ensureTestStudentMissionSettings(student) {
  if (!isTestStudent(student) || state.studentMissionSettings.some((setting) => setting.studentId === student.id)) {
    return false;
  }
  const now = new Date().toISOString();
  const templateIds = ["daily-print-completed", "daily-stamp-earned", "daily-careful-work"];
  templateIds.forEach((templateId, index) => {
    const template = missionTemplateById(templateId);
    if (!template) return;
    state.studentMissionSettings.push({
      id: crypto.randomUUID(), studentId: student.id, missionTemplateId: template.id,
      targetValue: template.defaultTargetValue, stampReward: template.defaultStampReward, ticketReward: template.defaultTicketReward,
      displayOrder: index, enabled: true, validFrom: "", validUntil: "", createdAt: now, updatedAt: now,
    });
  });
  return true;
}

function generateDailyMissions(studentId, date = CalendarDate.dateKey(new Date())) {
  const student = state.students.find((item) => item.id === studentId);
  if (!student || !canGenerateDailyMissions(studentId, date)) return [];
  ensureTestStudentMissionSettings(student);
  const now = new Date().toISOString();
  missionSettingsForStudent(studentId, date).forEach((setting) => {
    const exists = state.dailyMissions.some((mission) => mission.studentId === studentId && mission.targetDate === date && mission.studentMissionSettingId === setting.id);
    if (exists) return;
    const template = missionTemplateById(setting.missionTemplateId);
    if (!template) return;
    state.dailyMissions.push({
      id: crypto.randomUUID(), studentId, missionTemplateId: template.id, studentMissionSettingId: setting.id, targetDate: date,
      name: template.name, displayText: missionDisplayText(template.displayText, setting.targetValue), missionType: template.missionType,
      category: template.category, conditionType: template.conditionType, evaluationType: template.evaluationType,
      targetValue: setting.targetValue, unit: template.unit, currentValue: 0, manualAdjustment: 0,
      stampReward: setting.stampReward, ticketReward: setting.ticketReward, status: "not_started", completedAt: "", rewardGranted: false,
      createdAt: now, updatedAt: now,
    });
  });
  return getDailyMissions(studentId, date);
}

function getDailyMissions(studentId, date = CalendarDate.dateKey(new Date())) {
  return state.dailyMissions.filter((mission) => mission.studentId === studentId && mission.targetDate === date)
    .slice().sort((left, right) => {
      const leftSetting = missionSettingById(left.studentMissionSettingId);
      const rightSetting = missionSettingById(right.studentMissionSettingId);
      return Number(leftSetting?.displayOrder || 0) - Number(rightSetting?.displayOrder || 0);
    });
}

function expirePastDailyMissions(today = CalendarDate.dateKey(new Date())) {
  let changed = false;
  state.dailyMissions.forEach((mission) => {
    if (mission.missionType !== "daily" || mission.targetDate >= today || ["completed", "expired"].includes(mission.status)) return;
    mission.status = "expired";
    mission.updatedAt = new Date().toISOString();
    changed = true;
  });
  return changed;
}

function automaticMissionBaseValue(mission) {
  const stampCount = state.stampEvents.filter((event) => event.studentId === mission.studentId && !event.canceled
    && event.source !== "mission-reward" && CalendarDate.dateKey(new Date(event.createdAt)) === mission.targetDate).length;
  if (["print_completed_count", "stamp_earned_count"].includes(mission.conditionType)) return stampCount;
  return 0;
}

function missionProgressValue(mission) {
  if (mission.conditionType === "manual") return Math.min(mission.targetValue, Math.max(0, mission.currentValue || 0));
  return Math.max(0, automaticMissionBaseValue(mission) + Number(mission.manualAdjustment || 0));
}

function grantMissionReward(mission) {
  if (mission.rewardGranted) return false;
  const student = state.students.find((item) => item.id === mission.studentId);
  if (!student) return false;
  const now = new Date().toISOString();
  const stamp = stampById(state.selectedStampId);
  for (let index = 0; index < mission.stampReward; index += 1) {
    state.stampEvents.push({ id: crypto.randomUUID(), studentId: student.id, stampId: stamp.id, memo: `ミッション報酬: ${mission.name}`, createdAt: now, canceled: false, source: "mission-reward", missionId: mission.id });
  }
  student.ticketBalance = Math.max(0, Number(student.ticketBalance || 0) + mission.ticketReward);
  mission.rewardGranted = true;
  return true;
}

function revokeMissionReward(mission) {
  if (!mission.rewardGranted) return false;
  const student = state.students.find((item) => item.id === mission.studentId);
  if (!student) return false;
  state.stampEvents.forEach((event) => {
    if (event.missionId === mission.id && event.source === "mission-reward") event.canceled = true;
  });
  student.ticketBalance = Math.max(0, Number(student.ticketBalance || 0) - mission.ticketReward);
  mission.rewardGranted = false;
  return true;
}

function completeMission(missionId) {
  const mission = state.dailyMissions.find((item) => item.id === missionId);
  if (!mission || mission.status === "completed") return false;
  mission.currentValue = mission.targetValue;
  mission.status = "completed";
  mission.completedAt = new Date().toISOString();
  mission.updatedAt = mission.completedAt;
  grantMissionReward(mission);
  lastCompletedMissionId = mission.id;
  clearTimeout(missionCelebrationTimer);
  missionCelebrationTimer = window.setTimeout(() => {
    lastCompletedMissionId = "";
    renderDailyMissions();
  }, 1800);
  return true;
}

function refreshAutomaticMissions(studentId, date = CalendarDate.dateKey(new Date())) {
  let changed = false;
  getDailyMissions(studentId, date).forEach((mission) => {
    if (mission.evaluationType !== "automatic" || mission.status === "completed") return;
    const value = missionProgressValue(mission);
    mission.currentValue = value;
    mission.status = value > 0 ? "in_progress" : "not_started";
    mission.updatedAt = new Date().toISOString();
    if (value >= mission.targetValue) changed = completeMission(mission.id) || changed;
  });
  return changed;
}

function adjustMissionProgress(missionId, amount) {
  const mission = state.dailyMissions.find((item) => item.id === missionId);
  if (!mission || mission.status === "completed") return false;
  const value = Number(amount || 0);
  if (!value) return false;
  if (mission.conditionType === "manual") mission.currentValue = Math.max(0, Number(mission.currentValue || 0) + value);
  else mission.manualAdjustment = Math.max(-automaticMissionBaseValue(mission), Number(mission.manualAdjustment || 0) + value);
  const progress = missionProgressValue(mission);
  mission.currentValue = progress;
  mission.status = progress > 0 ? "in_progress" : "not_started";
  mission.updatedAt = new Date().toISOString();
  if (progress >= mission.targetValue) completeMission(mission.id);
  persist();
  render();
  return true;
}

function revertMission(missionId) {
  const mission = state.dailyMissions.find((item) => item.id === missionId);
  if (!mission || mission.status !== "completed") return false;
  revokeMissionReward(mission);
  mission.status = "in_progress";
  mission.completedAt = "";
  mission.currentValue = Math.min(mission.targetValue - 1, missionProgressValue(mission));
  mission.updatedAt = new Date().toISOString();
  persist();
  render();
  return true;
}

function renderCalendar() {
  if (!els.calendarEventId.value && !els.calendarEventStart.value) {
    els.calendarEventStart.value = calendarSelectedDate;
  }
  renderCalendarEventTypeOptions();
  renderCalendarGroupOptions();
  renderCalendarMonth();
  renderCalendarDayDetail();
  updateCalendarEventTimeFields();
  updateCalendarEventScopeFields();
}

function renderCalendarEventTypeOptions() {
  const previous = els.calendarEventType.value || "other";
  els.calendarEventType.innerHTML = calendarEventTypes.map(([id, label]) => `<option value="${id}">${label}</option>`).join("");
  els.calendarEventType.value = calendarEventTypes.some(([id]) => id === previous) ? previous : "other";
}

function renderCalendarGroupOptions() {
  const selectedIds = new Set([...els.calendarEventGroups.selectedOptions].map((option) => option.value));
  els.calendarEventGroups.innerHTML = groupOptions("", { includeBlank: false }).replaceAll(" selected", "");
  [...els.calendarEventGroups.options].forEach((option) => {
    option.selected = selectedIds.has(option.value);
  });
}

function renderCalendarMonth() {
  const groupId = state.selectedGroupId;
  const today = CalendarDate.dateKey(new Date());
  els.calendarMonthLabel.textContent = `${calendarCursor.getFullYear()}年${calendarCursor.getMonth() + 1}月`;
  els.calendarGrid.innerHTML = CalendarDate.monthGrid(calendarCursor).map(({ key, date, inMonth }) => {
    const info = schoolDayInfo(key, groupId);
    const events = info.events;
    const weekend = date.getDay() === 0 ? " is-sunday" : date.getDay() === 6 ? " is-saturday" : "";
    const eventLabels = events.slice(0, 2).map((event) => `<span>${escapeHtml(event.title)}</span>`).join("");
    const more = events.length > 2 ? `<span>ほか${events.length - 2}件</span>` : "";
    return `
      <button class="calendar-day${inMonth ? "" : " is-outside"}${key === today ? " is-today" : ""}${key === calendarSelectedDate ? " is-selected" : ""}${info.isSchoolDay ? "" : " is-holiday"}${weekend}" type="button" data-calendar-date="${key}">
        <strong>${date.getDate()}</strong>
        <div class="calendar-day-events">${eventLabels}${more}</div>
      </button>
    `;
  }).join("");
  els.calendarGrid.querySelectorAll("[data-calendar-date]").forEach((button) => button.addEventListener("click", () => selectCalendarDate(button.dataset.calendarDate)));
}

function formatCalendarDate(date) {
  const value = CalendarDate.parseDateKey(date);
  if (!value) return "日付";
  return `${value.getFullYear()}年${value.getMonth() + 1}月${value.getDate()}日（${["日", "月", "火", "水", "木", "金", "土"][value.getDay()]}）`;
}

function schoolDayStatusLabel(info) {
  if (!info.isSchoolDay) return info.holidayName || "休業日";
  if (info.status === "shortened") return "短縮授業日";
  if (info.status === "event") return "行事日";
  if (info.status === "special") return "特別登校日";
  return "通常登校日";
}

function renderCalendarDayDetail() {
  const groupId = state.selectedGroupId;
  const info = schoolDayInfo(calendarSelectedDate, groupId);
  const dayTimetable = getDayTimetable(groupId, calendarSelectedDate);
  els.calendarSelectedDateLabel.textContent = formatCalendarDate(calendarSelectedDate);
  els.calendarDayStatus.textContent = schoolDayStatusLabel(info);
  els.calendarDayStatus.className = `calendar-status is-${info.status}`;
  els.calendarEventList.innerHTML = info.events.length ? info.events.map((event) => `
    <article class="calendar-event-item"><div><strong>${escapeHtml(event.title)}</strong><span>${escapeHtml(calendarEventTypeLabel(event.type))}${event.repeat === "weekly" ? " / 毎週" : ""}${event.note ? ` / ${escapeHtml(event.note)}` : ""}</span></div>
      <div><button class="text-button" type="button" data-calendar-event-edit="${escapeHtml(event.id)}">編集</button><button class="text-button" type="button" data-calendar-event-copy="${escapeHtml(event.id)}">複製</button><button class="text-button danger-text" type="button" data-calendar-event-delete="${escapeHtml(event.id)}">削除</button></div></article>
  `).join("") : '<p class="empty-state compact-empty">予定はありません。右側から追加できます。</p>';
  els.calendarEventList.querySelectorAll("[data-calendar-event-edit]").forEach((button) => button.addEventListener("click", () => editCalendarEvent(button.dataset.calendarEventEdit)));
  els.calendarEventList.querySelectorAll("[data-calendar-event-copy]").forEach((button) => button.addEventListener("click", () => duplicateCalendarEvent(button.dataset.calendarEventCopy)));
  els.calendarEventList.querySelectorAll("[data-calendar-event-delete]").forEach((button) => button.addEventListener("click", () => deleteCalendarEvent(button.dataset.calendarEventDelete)));

  els.calendarDayTimetable.innerHTML = !info.isSchoolDay
    ? '<p class="empty-state compact-empty">休業日のため授業はありません。</p>'
    : !dayTimetable.timetable
      ? '<p class="empty-state compact-empty">基本時間割は未設定です。</p>'
      : `<ol class="day-timetable-list">${dayTimetable.periods.map((period) => `<li><span>${period.periodNumber}時間目</span><strong>${escapeHtml(period.subject?.name || "未設定")}</strong>${period.override ? '<em>変更</em>' : ""}</li>`).join("")}</ol>`;

  const periodCount = dayTimetable.timetable?.periodCount || timetableForEditor(groupId)?.periodCount || DEFAULT_PERIOD_COUNT;
  els.overridePeriod.innerHTML = Array.from({ length: periodCount }, (_, index) => `<option value="${index + 1}">${index + 1}時間目</option>`).join("");
  els.overrideSubject.innerHTML = subjectOptions("", { includeBlank: true });
  const overrides = state.timetableOverrides.filter((override) => override.groupId === groupId && override.date === calendarSelectedDate).sort((left, right) => left.periodNumber - right.periodNumber);
  els.timetableOverrideList.innerHTML = overrides.map((override) => `
    <div class="override-item"><span>${override.periodNumber}時間目: <strong>${escapeHtml(subjectById(override.subjectId)?.name || "未設定")}</strong>${override.note ? `（${escapeHtml(override.note)}）` : ""}</span><button class="text-button danger-text" type="button" data-override-delete="${escapeHtml(override.id)}">変更を取り消す</button></div>
  `).join("");
  els.timetableOverrideList.querySelectorAll("[data-override-delete]").forEach((button) => button.addEventListener("click", () => deleteTimetableOverride(button.dataset.overrideDelete)));
}

function renderCalendarDisplay() {
  const groupId = state.selectedGroupId;
  const today = CalendarDate.dateKey(new Date());
  els.calendarViewMonthLabel.textContent = `${calendarCursor.getFullYear()}年${calendarCursor.getMonth() + 1}月`;
  els.calendarViewGrid.innerHTML = CalendarDate.monthGrid(calendarCursor).map(({ key, date, inMonth }) => {
    const info = schoolDayInfo(key, groupId);
    const weekend = date.getDay() === 0 ? " is-sunday" : date.getDay() === 6 ? " is-saturday" : "";
    const eventLabels = info.events.slice(0, 2).map((event) => `<span>${escapeHtml(event.title)}</span>`).join("");
    const more = info.events.length > 2 ? `<span>ほか${info.events.length - 2}件</span>` : "";
    return `
      <button class="calendar-day${inMonth ? "" : " is-outside"}${key === today ? " is-today" : ""}${key === calendarSelectedDate ? " is-selected" : ""}${info.isSchoolDay ? "" : " is-holiday"}${weekend}" type="button" data-calendar-view-date="${key}">
        <strong>${date.getDate()}</strong>
        <div class="calendar-day-events">${eventLabels}${more}</div>
      </button>
    `;
  }).join("");
  els.calendarViewGrid.querySelectorAll("[data-calendar-view-date]").forEach((button) => {
    button.addEventListener("click", () => selectCalendarDate(button.dataset.calendarViewDate));
  });

  const info = schoolDayInfo(calendarSelectedDate, groupId);
  const dayTimetable = getDayTimetable(groupId, calendarSelectedDate);
  els.calendarViewSelectedDateLabel.textContent = formatCalendarDate(calendarSelectedDate);
  els.calendarViewDayStatus.textContent = schoolDayStatusLabel(info);
  els.calendarViewDayStatus.className = `calendar-status is-${info.status}`;
  els.calendarViewEventList.innerHTML = info.events.length
    ? info.events.map((event) => `<article class="calendar-event-item calendar-view-event"><div><strong>${escapeHtml(event.title)}</strong><span>${escapeHtml(calendarEventTypeLabel(event.type))}${event.note ? ` / ${escapeHtml(event.note)}` : ""}</span></div></article>`).join("")
    : '<p class="empty-state compact-empty">予定はありません。</p>';
  els.calendarViewDayTimetable.innerHTML = !info.isSchoolDay
    ? '<p class="empty-state compact-empty">休業日のため授業はありません。</p>'
    : !dayTimetable.timetable
      ? '<p class="empty-state compact-empty">この組の基本時間割は未設定です。</p>'
      : `<ol class="day-timetable-list">${dayTimetable.periods.map((period) => `<li><span>${period.periodNumber}時間目</span><strong>${escapeHtml(period.subject?.name || "未設定")}</strong>${period.override ? '<em>変更</em>' : ""}</li>`).join("")}</ol>`;
}

function timetableDisplayMarkup(group) {
  const timetable = timetableForEditor(group.id);
  if (!timetable) {
    return `<article class="timetable-display-card"><h4>${escapeHtml(group.name)}</h4><p class="empty-state compact-empty">基本時間割は未設定です。</p></article>`;
  }
  const headers = ["月", "火", "水", "木", "金"];
  const rows = Array.from({ length: timetable.periodCount }, (_, periodIndex) => {
    const periodNumber = periodIndex + 1;
    const cells = headers.map((_, weekdayIndex) => {
      const subject = subjectById(timetable.cells[`${weekdayIndex}-${periodNumber}`]);
      return `<td>${escapeHtml(subject?.name || "")}</td>`;
    }).join("");
    return `<tr><th scope="row">${periodNumber}時間目</th>${cells}</tr>`;
  }).join("");
  return `
    <article class="timetable-display-card">
      <div class="timetable-display-head"><h4>${escapeHtml(group.name)}</h4><span>${escapeHtml(timetable.name)}</span></div>
      <div class="timetable-scroll"><table class="timetable-table timetable-display-table"><thead><tr><th>時間</th>${headers.map((day) => `<th>${day}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>
    </article>
  `;
}

function renderTimetableDisplay() {
  const groups = sortedGroups({ includeDisabled: false });
  const selected = selectedGroup();
  els.calendarTimetableGroupSelect.disabled = timetableViewMode === "all";
  els.timetableViewModeButtons.forEach((button) => {
    const active = button.dataset.timetableViewMode === timetableViewMode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  if (!groups.length) {
    els.calendarTimetableBoard.innerHTML = '<p class="empty-state">先生ページの「組の管理」で組を追加してください。</p>';
    return;
  }
  if (timetableViewMode === "group") {
    els.calendarTimetableBoard.innerHTML = selected
      ? timetableDisplayMarkup(selected)
      : '<p class="empty-state">組を選んでください。</p>';
    return;
  }
  els.calendarTimetableBoard.innerHTML = groups.map(timetableDisplayMarkup).join("");
}

function selectCalendarDate(date) {
  if (!CalendarDate.parseDateKey(date)) return;
  calendarSelectedDate = date;
  const selected = CalendarDate.parseDateKey(date);
  calendarCursor = new Date(selected.getFullYear(), selected.getMonth(), 1);
  clearCalendarEventForm();
  renderCalendar();
  renderCalendarDisplay();
}

function moveCalendarMonth(amount) {
  calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + amount, 1);
  renderCalendar();
  renderCalendarDisplay();
}

function goToCalendarToday() {
  calendarSelectedDate = CalendarDate.dateKey(new Date());
  calendarCursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  clearCalendarEventForm();
  renderCalendar();
  renderCalendarDisplay();
}

function updateCalendarEventTimeFields() {
  els.calendarEventTimeFields.hidden = els.calendarEventAllDay.checked;
}

function updateCalendarEventScopeFields() {
  els.calendarEventGroupsField.hidden = els.calendarEventScope.value !== "groups";
}

function clearCalendarEventForm() {
  els.calendarEventId.value = "";
  els.calendarEventTitle.value = "";
  els.calendarEventStart.value = calendarSelectedDate;
  els.calendarEventEnd.value = "";
  els.calendarEventAllDay.checked = true;
  els.calendarEventStartTime.value = "";
  els.calendarEventEndTime.value = "";
  els.calendarEventType.value = "other";
  els.calendarEventScope.value = "school";
  [...els.calendarEventGroups.options].forEach((option) => { option.selected = false; });
  els.calendarEventRepeat.value = "none";
  els.calendarEventSchoolDayEffect.value = "auto";
  els.calendarEventTimetableEffect.value = "none";
  els.calendarEventNote.value = "";
  updateCalendarEventTimeFields();
  updateCalendarEventScopeFields();
}

function readCalendarEventForm() {
  const startDate = els.calendarEventStart.value;
  const endDate = els.calendarEventEnd.value || startDate;
  return {
    title: els.calendarEventTitle.value.trim(),
    startDate,
    endDate,
    allDay: els.calendarEventAllDay.checked,
    startTime: els.calendarEventStartTime.value,
    endTime: els.calendarEventEndTime.value,
    type: els.calendarEventType.value,
    scope: els.calendarEventScope.value,
    groupIds: [...els.calendarEventGroups.selectedOptions].map((option) => option.value),
    note: els.calendarEventNote.value.trim(),
    repeat: els.calendarEventRepeat.value,
    schoolDayEffect: els.calendarEventSchoolDayEffect.value,
    timetableEffect: els.calendarEventTimetableEffect.value,
  };
}

function saveCalendarEvent() {
  const draft = readCalendarEventForm();
  if (!draft.title || !CalendarDate.parseDateKey(draft.startDate)) {
    showToast("予定名と開始日を入力してください");
    return;
  }
  if (CalendarDate.compareDateKeys(draft.startDate, draft.endDate) > 0) {
    showToast("終了日は開始日以降にしてください");
    return;
  }
  if (draft.scope === "groups" && !draft.groupIds.length) {
    showToast("対象の組を選んでください");
    return;
  }
  const now = new Date().toISOString();
  const existing = state.calendarEvents.find((event) => event.id === els.calendarEventId.value);
  if (existing) Object.assign(existing, draft, { updatedAt: now });
  else state.calendarEvents.push({ id: crypto.randomUUID(), ...draft, createdAt: now, updatedAt: now });
  calendarSelectedDate = draft.startDate;
  calendarCursor = new Date(CalendarDate.parseDateKey(draft.startDate).getFullYear(), CalendarDate.parseDateKey(draft.startDate).getMonth(), 1);
  clearCalendarEventForm();
  persist();
  render();
  showToast("予定を保存しました");
}

function editCalendarEvent(eventId) {
  const event = state.calendarEvents.find((item) => item.id === eventId);
  if (!event) return;
  els.calendarEventId.value = event.id;
  els.calendarEventTitle.value = event.title;
  els.calendarEventStart.value = event.startDate;
  els.calendarEventEnd.value = event.endDate === event.startDate ? "" : event.endDate;
  els.calendarEventAllDay.checked = event.allDay;
  els.calendarEventStartTime.value = event.startTime;
  els.calendarEventEndTime.value = event.endTime;
  els.calendarEventType.value = event.type;
  els.calendarEventScope.value = event.scope;
  [...els.calendarEventGroups.options].forEach((option) => { option.selected = event.groupIds.includes(option.value); });
  els.calendarEventRepeat.value = event.repeat;
  els.calendarEventSchoolDayEffect.value = event.schoolDayEffect;
  els.calendarEventTimetableEffect.value = event.timetableEffect;
  els.calendarEventNote.value = event.note;
  updateCalendarEventTimeFields();
  updateCalendarEventScopeFields();
  els.calendarEventTitle.focus();
}

function duplicateCalendarEvent(eventId) {
  const event = state.calendarEvents.find((item) => item.id === eventId);
  if (!event) return;
  editCalendarEvent(eventId);
  els.calendarEventId.value = "";
  els.calendarEventTitle.value = `${event.title}（コピー）`;
  els.calendarEventTitle.focus();
}

function deleteCalendarEvent(eventId) {
  const event = state.calendarEvents.find((item) => item.id === eventId);
  if (!event || !confirm(`「${event.title}」を削除します。よろしいですか？`)) return;
  state.calendarEvents = state.calendarEvents.filter((item) => item.id !== eventId);
  clearCalendarEventForm();
  persist();
  render();
  showToast("予定を削除しました");
}

function saveTimetableOverride() {
  const group = selectedGroup();
  if (!group) {
    showToast("先に対象の組を選んでください");
    return;
  }
  const periodNumber = Math.max(1, Math.floor(Number(els.overridePeriod.value || 1)));
  const subjectId = els.overrideSubject.value;
  const existing = state.timetableOverrides.find((override) => override.groupId === group.id && override.date === calendarSelectedDate && override.periodNumber === periodNumber);
  if (!subjectId) {
    if (existing) state.timetableOverrides = state.timetableOverrides.filter((override) => override.id !== existing.id);
    persist();
    render();
    showToast("この時間の変更を取り消しました");
    return;
  }
  const now = new Date().toISOString();
  if (existing) Object.assign(existing, { subjectId, note: els.overrideMemo.value.trim(), updatedAt: now });
  else state.timetableOverrides.push({ id: crypto.randomUUID(), date: calendarSelectedDate, groupId: group.id, periodNumber, subjectId, note: els.overrideMemo.value.trim(), createdAt: now, updatedAt: now });
  els.overrideMemo.value = "";
  persist();
  render();
  showToast("当日の時間割を変更しました");
}

function deleteTimetableOverride(overrideId) {
  const override = state.timetableOverrides.find((item) => item.id === overrideId);
  if (!override || !confirm(`${override.periodNumber}時間目の変更を取り消しますか？`)) return;
  state.timetableOverrides = state.timetableOverrides.filter((item) => item.id !== overrideId);
  persist();
  render();
  showToast("基本時間割に戻しました");
}

window.HounyanSchoolCalendar = {
  isSchoolDay,
  isHoliday,
  schoolDayInfo,
  schoolDaysAfter,
  countSchoolDaysBetween,
  getDayTimetable,
  hasSubjectOnDate,
  canGenerateDailyMission,
  missionCalendarContext,
  canGenerateDailyMissions,
  generateDailyMissions,
  getDailyMissions,
  adjustMissionProgress,
  completeMission,
};

function renderHounyanCloset() {
  const student = selectedStudent();
  if (!student) {
    return;
  }
  const stats = studentStats(student.id);
  const level = studentMascotLevel(student, stats);
  const equippedRule = equippedHounyanRule(student, level);
  els.hounyanClosetStudent.textContent = `${student.name}のほうにゃん`;
  els.hounyanClosetList.innerHTML = activeLevelRules()
    .map((rule) => {
      const unlocked = rule.level <= level.current;
      const selected = rule.level === equippedRule.level;
      if (!unlocked) {
        return `
          <button class="hounyan-closet-option is-locked" type="button" disabled aria-disabled="true">
            <span class="hounyan-closet-mystery" aria-hidden="true">?</span>
            <strong>Lv.${rule.level} ${escapeHtml(rule.name)}</strong>
            <span>まだひみつ</span>
          </button>
        `;
      }
      return `
        <button class="hounyan-closet-option${selected ? " is-selected" : ""}" type="button" data-equip-hounyan-level="${rule.level}" aria-pressed="${selected ? "true" : "false"}">
          <img src="${escapeHtml(rule.image)}" alt="${escapeHtml(rule.name)}のほうにゃん">
          <strong>Lv.${rule.level} ${escapeHtml(rule.name)}</strong>
          <span>${selected ? "いま" : "えらぶ"}</span>
        </button>
      `;
    })
    .join("");

  els.hounyanClosetList.querySelectorAll("[data-equip-hounyan-level]").forEach((button) => {
    button.addEventListener("click", () => equipHounyanLevel(Number(button.dataset.equipHounyanLevel)));
  });
}

function equipHounyanLevel(levelNumber) {
  const student = selectedStudent();
  if (!student) {
    return;
  }
  const level = studentMascotLevel(student, studentStats(student.id));
  const rule = activeLevelRules().find((item) => item.level === levelNumber && item.level <= level.current);
  if (!rule) {
    showToast("まだえらべないかぶりものです");
    return;
  }
  state.equippedHounyanLevelByStudent[student.id] = rule.level;
  persist();
  render();
  closeHounyanCloset();
  showToast(`${rule.name}にきがえたよ`);
}

function closeHounyanCloset() {
  els.hounyanClosetLayer.classList.remove("is-showing");
  setTimeout(() => {
    els.hounyanClosetLayer.hidden = true;
  }, 180);
}

function openSheetAlbum() {
  if (!selectedStudent()) {
    showToast("先に児童をえらんでね");
    return;
  }
  renderSheetAlbum();
  els.sheetAlbumLayer.hidden = false;
  els.sheetAlbumLayer.classList.remove("is-showing");
  requestAnimationFrame(() => {
    els.sheetAlbumLayer.classList.add("is-showing");
    els.sheetAlbumCloseButton.focus();
  });
}

function closeSheetAlbum() {
  els.sheetAlbumLayer.classList.remove("is-showing");
  setTimeout(() => {
    els.sheetAlbumLayer.hidden = true;
  }, 180);
}

function renderSheetAlbum() {
  const student = selectedStudent();
  if (!student) {
    els.sheetAlbumStudent.textContent = "がんばり";
    els.sheetAlbumSummary.textContent = "児童をえらぶと、できあがったシートがここにならぶよ。";
    els.sheetAlbumList.innerHTML = '<p class="empty-state">まだ見るシートがありません。</p>';
    return;
  }

  const sheets = completedSheetsForStudent(student.id);
  els.sheetAlbumStudent.textContent = `${student.name}のがんばり`;
  els.sheetAlbumSummary.textContent = sheets.length
    ? `これまでに${sheets.length}まい、${sheets.length * SHEET_SIZE}このスタンプをあつめたよ！`
    : `スタンプを${SHEET_SIZE}こあつめると、ここに1まいめがのこるよ。`;
  els.sheetAlbumList.innerHTML = sheets.length
    ? sheets.map((sheet) => completedSheetCard(sheet)).join("")
    : '<p class="empty-state">まだできあがったシートはないよ。もうすこしで1まいめ！</p>';
}

function completedSheetsForStudent(studentId) {
  const events = state.stampEvents
    .filter((event) => event.studentId === studentId && !event.canceled)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const completedCount = Math.floor(events.length / SHEET_SIZE);
  return Array.from({ length: completedCount }, (_, index) => ({
    number: index + 1,
    events: events.slice(index * SHEET_SIZE, (index + 1) * SHEET_SIZE),
  })).reverse();
}

function completedSheetCard(sheet) {
  const completedAt = sheet.events.at(-1)?.createdAt;
  return `
    <article class="completed-sheet-card">
      <div class="completed-sheet-head">
        <div>
          <span>がんばりシート</span>
          <strong>${sheet.number}まいめ</strong>
        </div>
        <p>${completedAt ? formatDateTime(completedAt) : ""}</p>
      </div>
      <div class="completed-sheet-grid" aria-label="${sheet.number}まいめの20こスタンプシート">
        ${sheet.events.map((event) => {
          const stamp = stampById(event.stampId);
          return `<div class="stamp-slot is-filled"><img src="${escapeHtml(stamp.src)}" alt="${escapeHtml(stamp.name)}"></div>`;
        }).join("")}
      </div>
    </article>
  `;
}

function nextUnlockStamp(total) {
  return visibleStampAssets()
    .filter((stamp) => !stamp.purchaseOnly && stamp.unlockAt > total)
    .sort((a, b) => a.unlockAt - b.unlockAt || a.name.localeCompare(b.name, "ja"))[0] || null;
}

function renderSheet({ grid, title, progress, stats, childMode }) {
  title.textContent = `シート ${stats.currentSheet.number}`;
  progress.textContent = stats.currentSheet.remaining === 0
    ? childMode
      ? "シートがいっぱいになったよ"
      : "シートが埋まりました"
    : childMode
      ? `あと${stats.currentSheet.remaining}こでシートがいっぱい`
      : `あと${stats.currentSheet.remaining}個でシートが埋まります`;

  grid.innerHTML = Array.from({ length: SHEET_SIZE }, (_, index) => {
    const event = stats.currentSheet.events[index];
    if (!event) {
      return `<div class="stamp-slot is-empty"><span>${index + 1}</span></div>`;
    }

    const stamp = stampById(event.stampId);
    const isNew = lastStampedEventIds.has(event.id) ? " is-new" : "";
    return `
      <div class="stamp-slot is-filled${isNew}">
        <img src="${stamp.src}" alt="${escapeHtml(stamp.name)}">
      </div>
    `;
  }).join("");
}

function renderHistory(studentId) {
  const events = state.stampEvents
    .filter((event) => event.studentId === studentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 12);

  if (!events.length) {
    els.historyList.innerHTML = '<p class="empty-state">まだスタンプ履歴がありません。</p>';
    return;
  }

  els.historyList.innerHTML = events
    .map((event) => {
      const stamp = stampById(event.stampId);
      return `
        <article class="history-card${event.canceled ? " is-canceled" : ""}">
          <img src="${stamp.src}" alt="${escapeHtml(stamp.name)}">
          <div>
            <strong>${escapeHtml(stamp.name)}${event.canceled ? "（取消）" : ""}</strong>
            <span>${formatDateTime(event.createdAt)} ${escapeHtml(event.memo || "")}</span>
          </div>
          ${
            event.canceled
              ? ""
              : `<button class="danger-button" type="button" data-cancel-event="${event.id}">取消</button>`
          }
        </article>
      `;
    })
    .join("");

  els.historyList.querySelectorAll("[data-cancel-event]").forEach((button) => {
    button.addEventListener("click", () => cancelStamp(button.dataset.cancelEvent));
  });
}

function renderRewards() {
  if (!state.students.length) {
    els.shopStudentSelect.innerHTML = '<option value="">児童未登録</option>';
  } else {
    els.shopStudentSelect.innerHTML = state.students
      .map((student) => `<option value="${student.id}">${escapeHtml(student.name)}</option>`)
      .join("");
    els.shopStudentSelect.value = state.selectedStudentId || state.students[0].id;
  }

  const student = selectedStudent();
  const stats = student ? studentStats(student.id) : emptyStats();
  const unlockRewards = visibleStampAssets().filter((stamp) => stamp.unlockAt > 0);
  const shopRewards = state.rewards.filter((reward) => reward.enabled && reward.type === "shop");
  renderShopSummary(student, stats);
  els.unlockRewards.innerHTML = unlockRewards.length
    ? unlockRewards.map((stamp) => unlockStampCard(stamp, stats, student)).join("")
    : '<p class="empty-state">解放条件つきのスタンプはありません。</p>';
  els.shopRewards.innerHTML = shopRewards.length
    ? shopRewards.map((reward) => rewardCard(reward, stats, student)).join("")
    : '<p class="empty-state">まだ景品がありません。先生ページで追加してください。</p>';
  renderStampShop(student, stats);
  renderPrizeSettings();

  els.shopRewards.querySelectorAll("[data-redeem]").forEach((button) => {
    button.addEventListener("click", () => openExchangeConfirm(button.dataset.redeem));
  });
  els.shopStampRewards.querySelectorAll("[data-buy-stamp]").forEach((button) => {
    button.addEventListener("click", () => openStampPurchaseConfirm(button.dataset.buyStamp));
  });
}

function renderShopSummary(student, stats) {
  els.shopSelectedName.textContent = student ? student.name : "未選択";
  els.shopAvailableSheets.textContent = testSheetBalanceText(student, stats);
  els.shopCompletedSheets.textContent = stats.completedSheets;
}

function unlockStampCard(stamp, stats, student) {
  const value = stats.total;
  const testStudent = isTestStudent(student);
  const done = testStudent || value >= stamp.unlockAt;
  const percent = testStudent ? 100 : stamp.unlockAt > 0 ? Math.min(100, Math.round((value / stamp.unlockAt) * 100)) : 100;
  return `
    <article class="reward-card">
      <div class="reward-top">
        <div>
          <strong>${escapeHtml(stamp.name)}スタンプ</strong>
          <p>累計${stamp.unlockAt}個で使えるようになります。</p>
        </div>
        <strong>${done ? "解放済み" : `あと${stamp.unlockAt - value}個`}</strong>
      </div>
      <div class="progress" aria-label="${percent}%">
        <span style="width: ${percent}%"></span>
      </div>
      <p>${value} / ${stamp.unlockAt}個</p>
    </article>
  `;
}

function rewardCard(reward, stats, student) {
  const isUnlock = reward.type === "unlock";
  const cost = isUnlock ? reward.costStamps : reward.costSheets;
  const value = isUnlock ? stats.total : stats.availableSheets;
  const done = value >= cost;
  const percent = cost > 0 ? Math.min(100, Math.round((value / cost) * 100)) : 100;
  const unit = isUnlock ? "個" : "シート";
  if (!isUnlock) {
    const remaining = Math.max(0, cost - value);
    return `
      <article class="reward-card shop-prize-card${reward.locked ? " is-disabled" : ""}">
        <div class="shop-prize-head">
          <div>
            <span class="shop-prize-label">景品</span>
            <strong>${escapeHtml(reward.name)}</strong>
          </div>
          <span class="sheet-badge">${cost}シート</span>
        </div>
        <p>${escapeHtml(reward.description || "説明なし")}</p>
        <div class="progress" aria-label="${percent}%">
          <span style="width: ${percent}%"></span>
        </div>
        <div class="shop-prize-foot">
          <span>${done ? "交換できます" : `あと${remaining}シート`}</span>
          <button class="primary-button" type="button" data-redeem="${reward.id}" ${!student || !done || reward.locked ? "disabled" : ""}>${reward.locked ? "使用不可" : "交換する"}</button>
        </div>
      </article>
    `;
  }
  const button = isUnlock
    ? `<strong>${done ? "解放済み" : `あと${cost - value}${unit}`}</strong>`
    : `<button class="primary-button" type="button" data-redeem="${reward.id}" ${!student || !done || reward.locked ? "disabled" : ""}>${reward.locked ? "使用不可" : "交換"}</button>`;

  return `
    <article class="reward-card${reward.locked ? " is-disabled" : ""}">
      <div class="reward-top">
        <div>
          <strong>${escapeHtml(reward.name)}</strong>
          <p>${escapeHtml(reward.description)}</p>
        </div>
        ${button}
      </div>
      <div class="progress" aria-label="${percent}%">
        <span style="width: ${percent}%"></span>
      </div>
      <p>${value} / ${cost}${unit}</p>
    </article>
  `;
}

function renderPrizeSettings() {
  const prizes = state.rewards.filter((reward) => reward.type === "shop");
  if (!prizes.length) {
    els.prizeSettingsList.innerHTML = '<p class="empty-state">まだ景品がありません。</p>';
    return;
  }

  els.prizeSettingsList.innerHTML = prizes
    .map((prize) => `
      <article class="reward-card prize-setting-card${prize.locked || !prize.enabled ? " is-disabled" : ""}">
        <div class="reward-top">
          <div>
            <strong>${escapeHtml(prize.name)}</strong>
            <p>${escapeHtml(prize.description || "説明なし")} / ${prize.costSheets}シート${prize.enabled ? "" : " / 非表示"}${prize.locked ? " / 使用不可" : ""}</p>
          </div>
          <button class="soft-button compact-button" type="button" data-edit-prize="${prize.id}">編集</button>
        </div>
      </article>
    `)
    .join("");

  els.prizeSettingsList.querySelectorAll("[data-edit-prize]").forEach((button) => {
    button.addEventListener("click", () => editPrize(button.dataset.editPrize));
  });
}

function renderLevelSettings() {
  const rules = activeLevelRules();
  if (!els.levelRuleLevel.options.length) {
    els.levelRuleLevel.innerHTML = rules
      .map((rule) => `<option value="${rule.level}">Lv.${rule.level}</option>`)
      .join("");
    editLevelRule(1);
  }

  els.levelRulesList.innerHTML = rules
    .map((rule) => `
      <article class="level-rule-card">
        <img src="${escapeHtml(rule.image)}" alt="${escapeHtml(rule.name)}">
        <div>
          <strong>Lv.${rule.level} ${escapeHtml(rule.name)}</strong>
          <p>${rule.requiredSheets}シート完成でレベルアップ</p>
        </div>
        <button class="soft-button compact-button" type="button" data-edit-level-rule="${rule.level}">編集</button>
      </article>
    `)
    .join("");

  els.levelRulesList.querySelectorAll("[data-edit-level-rule]").forEach((button) => {
    button.addEventListener("click", () => editLevelRule(Number(button.dataset.editLevelRule)));
  });
}

function renderStampAssets() {
  els.stampAssetsList.innerHTML = activeStampAssets()
    .filter((stamp) => !stamp.setId)
    .map((stamp) => {
      const text = stamp.purchaseOnly
        ? `買い物で購入（${stampPriceSheets(stamp)}シート）`
        : stamp.unlockAt === 0
          ? "最初から使用可"
          : `累計${stamp.unlockAt}個で解放`;
      const visibilityText = stamp.hidden ? "非表示" : "表示中";
      const deletionReason = stampDeletionReason(stamp.id);
      const canDelete = stamp.custom && !deletionReason;
      return `
        <article class="asset-card${stamp.hidden ? " is-hidden" : ""}">
          <img src="${stamp.src}" alt="${escapeHtml(stamp.name)}">
          <div>
            <strong>${escapeHtml(stamp.name)}</strong>
            <p>${text} / ${visibilityText}</p>
          </div>
          <div class="asset-card-actions">
            <button class="soft-button compact-button" type="button" data-edit-stamp="${stamp.id}">編集</button>
            ${stamp.custom ? `<button class="danger-button compact-button" type="button" data-delete-stamp="${stamp.id}" ${canDelete ? "" : "disabled"} title="${escapeHtml(deletionReason || "追加したスタンプを完全に削除します")}">${canDelete ? "削除" : "使用中"}</button>` : ""}
          </div>
        </article>
      `;
    })
    .join("");

  els.stampAssetsList.querySelectorAll("[data-edit-stamp]").forEach((button) => {
    button.addEventListener("click", () => editStampAsset(button.dataset.editStamp));
  });
  els.stampAssetsList.querySelectorAll("[data-delete-stamp]").forEach((button) => {
    button.addEventListener("click", () => deleteStampAsset(button.dataset.deleteStamp));
  });
}

function renderStampSets() {
  const sets = activeStampSets();
  if (!sets.length) {
    els.stampSetsList.innerHTML = '<p class="empty-state">スタンプセットはまだありません。</p>';
    return;
  }

  els.stampSetsList.innerHTML = sets
    .map((stampSet) => {
      const members = stampSetMembers(stampSet);
      const visibility = stampSet.hidden ? "非表示" : "表示中";
      const deletionReason = isBuiltInStampSet(stampSet.id)
        ? "最初からあるスタンプセットです"
        : members.map((stamp) => stampDeletionReason(stamp.id)).find(Boolean);
      const canDelete = !deletionReason;
      return `
        <article class="stamp-set-settings-card${stampSet.hidden ? " is-hidden" : ""}">
          ${stampSetCover(stampSet, members)}
          <div>
            <strong>${escapeHtml(stampSet.name)}</strong>
            <p>${members.length}こ / ${stampSet.priceSheets}シート / ${visibility}</p>
          </div>
          <div class="asset-card-actions">
            <button class="soft-button compact-button" type="button" data-edit-stamp-set="${stampSet.id}">編集</button>
            <button class="danger-button compact-button" type="button" data-delete-stamp-set="${stampSet.id}" ${canDelete ? "" : "disabled"} title="${escapeHtml(deletionReason || "セットと中の画像を完全に削除します")}">${canDelete ? "削除" : "使用中"}</button>
          </div>
        </article>
      `;
    })
    .join("");

  els.stampSetsList.querySelectorAll("[data-edit-stamp-set]").forEach((button) => {
    button.addEventListener("click", () => editStampSet(button.dataset.editStampSet));
  });
  els.stampSetsList.querySelectorAll("[data-delete-stamp-set]").forEach((button) => {
    button.addEventListener("click", () => deleteStampSet(button.dataset.deleteStampSet));
  });
}

function stampSetCover(stampSet, members) {
  const previews = members.slice(0, 4);
  return `
    <div class="stamp-set-cover" aria-label="${escapeHtml(stampSet.name)}のスタンプ">
      ${previews.map((stamp) => `<img src="${escapeHtml(stamp.src)}" alt="">`).join("")}
    </div>
  `;
}

function renderRedemptions() {
  const student = selectedStudent();
  if (!student) {
    els.redemptionList.innerHTML = '<p class="empty-state">児童を選ぶと交換履歴が表示されます。</p>';
    return;
  }

  const redemptions = state.redemptions
    .filter((redemption) => redemption.studentId === student.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (!redemptions.length) {
    els.redemptionList.innerHTML = '<p class="empty-state">まだ交換はありません。</p>';
    return;
  }

  els.redemptionList.innerHTML = redemptions
    .map((redemption) => {
      const reward = state.rewards.find((item) => item.id === redemption.rewardId);
      const name = redemption.memo || reward?.name || "交換";
      const sheetCost = redemptionSheetCost(redemption);
      return `
        <article class="redemption-card${redemption.canceled ? " is-canceled" : ""}">
          <div>
            <strong>${escapeHtml(name)}</strong>
            <p>${formatDateTime(redemption.createdAt)} / ${sheetCost}シート${redemption.canceled ? " / 取消済み" : ""}</p>
          </div>
          ${
            redemption.canceled
              ? '<span class="status-pill">取消済み</span>'
              : `<button class="danger-button compact-button" type="button" data-cancel-redemption="${redemption.id}">取り消す</button>`
          }
        </article>
      `;
    })
    .join("");

  els.redemptionList.querySelectorAll("[data-cancel-redemption]").forEach((button) => {
    button.addEventListener("click", () => cancelRedemption(button.dataset.cancelRedemption));
  });
}

function editStampAsset(stampId) {
  const stamp = activeStampAssets().find((item) => item.id === stampId);
  if (!stamp) {
    return;
  }

  els.stampAssetId.value = stamp.id;
  els.stampAssetName.value = stamp.name;
  els.stampAssetUnlockMode.value = stamp.purchaseOnly ? "purchase" : "count";
  els.stampAssetUnlockAt.value = String(stamp.unlockAt);
  els.stampAssetShopPriceSheets.value = String(stampPriceSheets(stamp));
  els.stampAssetVisible.checked = !stamp.hidden;
  els.stampAssetImage.value = "";
  updateStampAssetModeFields();
  els.stampAssetName.focus();
}

function clearStampAssetForm() {
  els.stampAssetId.value = "";
  els.stampAssetName.value = "";
  els.stampAssetUnlockMode.value = "count";
  els.stampAssetUnlockAt.value = "20";
  els.stampAssetShopPriceSheets.value = "1";
  els.stampAssetVisible.checked = true;
  els.stampAssetImage.value = "";
  updateStampAssetModeFields();
}

function stampDeletionReason(stampId) {
  if (state.stampEvents.some((event) => event.stampId === stampId)) {
    return "児童のスタンプ履歴に使われています";
  }
  if (Object.values(state.ownedStampIdsByStudent).some((stampIds) => stampIds.includes(stampId))) {
    return "児童が購入済みです";
  }
  if (state.redemptions.some((redemption) =>
    (redemption.type === "stamp-purchase" && redemption.stampId === stampId) ||
    (redemption.type === "stamp-set-purchase" && Array.isArray(redemption.stampIds) && redemption.stampIds.includes(stampId))
  )) {
    return "交換履歴に残っています";
  }
  return "";
}

function deleteStampAsset(stampId) {
  const stamp = activeStampAssets().find((item) => item.id === stampId);
  const deletionReason = stampDeletionReason(stampId);
  if (!stamp?.custom || deletionReason) {
    showToast(deletionReason || "最初からあるスタンプは削除できません");
    return;
  }
  if (!confirm(`「${stamp.name}」を完全に削除します。画像データは自動バックアップからも消え、元に戻せません。よろしいですか？`)) {
    return;
  }

  const previousStampAssets = state.stampAssets;
  state.stampAssets = normalizeStampAssets(activeStampAssets().filter((item) => item.id !== stampId));
  if (state.selectedStampId === stampId) {
    state.selectedStampId = visibleStampAssets()[0]?.id || activeStampAssets()[0]?.id || "sonochoshi";
  }
  if (!persist()) {
    state.stampAssets = previousStampAssets;
    return;
  }
  if (els.stampAssetId.value === stampId) {
    clearStampAssetForm();
  }
  purgeDeletedStampData([stampId]);
  render();
  showToast("スタンプと画像を削除しました");
}

function deleteStampSet(stampSetId) {
  const stampSet = activeStampSets().find((item) => item.id === stampSetId);
  if (!stampSet) {
    return;
  }
  if (isBuiltInStampSet(stampSetId)) {
    showToast("最初からあるスタンプセットは削除できません");
    return;
  }
  const members = stampSetMembers(stampSet);
  const deletionReason = members.map((stamp) => stampDeletionReason(stamp.id)).find(Boolean);
  if (deletionReason) {
    showToast(`このセットは${deletionReason}ため削除できません`);
    return;
  }
  if (!confirm(`「${stampSet.name}」と中のスタンプ${members.length}こを完全に削除します。画像データは自動バックアップからも消え、元に戻せません。よろしいですか？`)) {
    return;
  }

  const previousStampAssets = state.stampAssets;
  const previousStampSets = state.stampSets;
  const memberIds = new Set(members.map((stamp) => stamp.id));
  state.stampAssets = normalizeStampAssets(activeStampAssets().filter((stamp) => !memberIds.has(stamp.id)));
  state.stampSets = activeStampSets().filter((item) => item.id !== stampSetId);
  if (memberIds.has(state.selectedStampId)) {
    state.selectedStampId = visibleStampAssets()[0]?.id || activeStampAssets()[0]?.id || "sonochoshi";
  }
  if (!persist()) {
    state.stampAssets = previousStampAssets;
    state.stampSets = previousStampSets;
    return;
  }
  if (els.stampSetId.value === stampSetId) {
    clearStampSetForm();
  }
  purgeDeletedStampData([...memberIds], [stampSetId]);
  render();
  showToast("スタンプセットと画像を削除しました");
}

function purgeDeletedStampData(stampIds, stampSetIds = []) {
  const deletedStampIds = new Set(stampIds);
  const deletedSetIds = new Set(stampSetIds);
  try {
    const nextBackups = readAutoBackups().map((backup) => {
      const backupState = backup.state || {};
      const stampAssets = Array.isArray(backupState.stampAssets)
        ? backupState.stampAssets.filter((stamp) => !deletedStampIds.has(stamp.id))
        : backupState.stampAssets;
      const stampSets = Array.isArray(backupState.stampSets)
        ? backupState.stampSets
          .filter((stampSet) => !deletedSetIds.has(stampSet.id))
          .map((stampSet) => ({
            ...stampSet,
            memberIds: Array.isArray(stampSet.memberIds)
              ? stampSet.memberIds.filter((stampId) => !deletedStampIds.has(stampId))
              : [],
          }))
          .filter((stampSet) => stampSet.memberIds.length)
        : backupState.stampSets;
      const ownedStampIdsByStudent = backupState.ownedStampIdsByStudent && typeof backupState.ownedStampIdsByStudent === "object"
        ? Object.fromEntries(Object.entries(backupState.ownedStampIdsByStudent).map(([studentId, ownedStampIds]) => [
          studentId,
          Array.isArray(ownedStampIds) ? ownedStampIds.filter((stampId) => !deletedStampIds.has(stampId)) : [],
        ]))
        : backupState.ownedStampIdsByStudent;
      return {
        ...backup,
        state: {
          ...backupState,
          stampAssets,
          stampSets,
          ownedStampIdsByStudent,
        },
      };
    });
    writeAutoBackups(nextBackups);
  } catch (error) {
    console.error(error);
  }
}

function editStampSet(stampSetId) {
  const stampSet = activeStampSets().find((item) => item.id === stampSetId);
  if (!stampSet) {
    return;
  }
  els.stampSetId.value = stampSet.id;
  els.stampSetName.value = stampSet.name;
  els.stampSetPriceSheets.value = String(stampSet.priceSheets);
  els.stampSetVisible.checked = !stampSet.hidden;
  els.stampSetImages.value = "";
  stampSetDraftMembers = stampSetMembers(stampSet).map((stamp) => ({
    stampId: stamp.id,
    name: stamp.name,
    src: stamp.src,
  }));
  renderStampSetDraft();
  els.stampSetName.focus();
}

function clearStampSetForm() {
  els.stampSetId.value = "";
  els.stampSetName.value = "";
  els.stampSetPriceSheets.value = "1";
  els.stampSetVisible.checked = true;
  els.stampSetImages.value = "";
  stampSetDraftMembers = [];
  renderStampSetDraft();
}

async function addStampSetImages() {
  const files = Array.from(els.stampSetImages.files || []);
  els.stampSetImages.value = "";
  if (!files.length) {
    return;
  }
  const remaining = STAMP_SET_MAX_MEMBERS - stampSetDraftMembers.length;
  if (remaining <= 0) {
    showToast(`スタンプセットは${STAMP_SET_MAX_MEMBERS}こまでです`);
    return;
  }
  const accepted = files.slice(0, remaining);
  if (accepted.some((file) => !file.type.startsWith("image/"))) {
    showToast("画像ファイルを選んでください");
    return;
  }
  try {
    const members = await Promise.all(accepted.map(async (file) => ({
      draftId: crypto.randomUUID(),
      name: stampNameFromFileName(file.name),
      src: await imageFileToStampDataUrl(file),
    })));
    stampSetDraftMembers = [...stampSetDraftMembers, ...members];
    renderStampSetDraft();
    if (files.length > accepted.length) {
      showToast(`最初の${remaining}こを追加しました`);
    }
  } catch (error) {
    console.error(error);
    showToast("画像を読み込めませんでした");
  }
}

function stampNameFromFileName(fileName) {
  return String(fileName || "スタンプ")
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim() || "スタンプ";
}

function renderStampSetDraft() {
  if (!stampSetDraftMembers.length) {
    els.stampSetMembersDraft.innerHTML = '<p class="empty-state">画像をえらぶと、ここにスタンプがならびます。</p>';
    return;
  }

  els.stampSetMembersDraft.innerHTML = stampSetDraftMembers
    .map((member, index) => `
      <div class="stamp-set-draft-item">
        <img src="${escapeHtml(member.src)}" alt="">
        <input type="text" value="${escapeHtml(member.name)}" data-stamp-set-member-name="${index}" aria-label="スタンプ${index + 1}の名前">
        <button class="icon-button" type="button" data-remove-stamp-set-member="${index}" aria-label="スタンプ${index + 1}を外す">×</button>
      </div>
    `)
    .join("");

  els.stampSetMembersDraft.querySelectorAll("[data-stamp-set-member-name]").forEach((input) => {
    input.addEventListener("input", () => {
      const index = Number(input.dataset.stampSetMemberName);
      if (stampSetDraftMembers[index]) {
        stampSetDraftMembers[index].name = input.value;
      }
    });
  });
  els.stampSetMembersDraft.querySelectorAll("[data-remove-stamp-set-member]").forEach((button) => {
    button.addEventListener("click", () => {
      stampSetDraftMembers.splice(Number(button.dataset.removeStampSetMember), 1);
      renderStampSetDraft();
    });
  });
}

function saveStampSet() {
  const name = els.stampSetName.value.trim();
  const priceSheets = Math.max(1, Math.floor(Number(els.stampSetPriceSheets.value || 1)));
  const hidden = !els.stampSetVisible.checked;
  const stampSetId = els.stampSetId.value;
  const existing = activeStampSets().find((item) => item.id === stampSetId);
  if (!name) {
    showToast("セットの名前を入力してください");
    return;
  }
  if (!stampSetDraftMembers.length) {
    showToast("セットに入れるスタンプ画像を選んでください");
    return;
  }
  if (stampSetDraftMembers.some((member) => !member.name.trim())) {
    showToast("スタンプの名前を入力してください");
    return;
  }

  const id = existing?.id || `stamp-set-${crypto.randomUUID()}`;
  const nextMembers = stampSetDraftMembers.map((member) => ({
    id: member.stampId || `set-stamp-${crypto.randomUUID()}`,
    name: member.name.trim(),
    reading: member.name.trim(),
    src: member.src,
    unlockAt: 0,
    custom: true,
    purchaseOnly: true,
    shopPriceSheets: priceSheets,
    rarity: "normal",
    hidden: false,
    setId: id,
  }));
  const nextById = new Map(nextMembers.map((stamp) => [stamp.id, stamp]));
  const previousAssets = state.stampAssets;
  const previousSets = state.stampSets;
  const existingMemberIds = new Set(existing?.memberIds || []);
  const untouchedAssets = activeStampAssets().map((stamp) => {
    if (!existingMemberIds.has(stamp.id)) {
      return stamp;
    }
    return nextById.get(stamp.id) || { ...stamp, setId: "", hidden: true };
  });
  const addedMembers = nextMembers.filter((stamp) => !existingMemberIds.has(stamp.id));

  state.stampAssets = normalizeStampAssets([...untouchedAssets, ...addedMembers]);
  state.stampSets = normalizeStampSets([
    ...activeStampSets().filter((item) => item.id !== id),
    {
      id,
      name,
      priceSheets,
      memberIds: nextMembers.map((stamp) => stamp.id),
      hidden,
      requiresSetId: existing?.requiresSetId || "",
      seriesId: existing?.seriesId || "",
      seriesName: existing?.seriesName || "",
      tier: existing?.tier || 1,
    },
  ], state.stampAssets);
  if (!visibleStampAssets().some((stamp) => stamp.id === state.selectedStampId)) {
    state.selectedStampId = visibleStampAssets()[0]?.id || activeStampAssets()[0]?.id || "sonochoshi";
  }
  if (!persist()) {
    state.stampAssets = previousAssets;
    state.stampSets = previousSets;
    return;
  }
  clearStampSetForm();
  render();
  showToast(existing ? "スタンプセットを更新しました" : "スタンプセットを追加しました");
}

function updateStampAssetModeFields() {
  const purchaseOnly = els.stampAssetUnlockMode.value === "purchase";
  els.stampAssetUnlockAt.disabled = purchaseOnly;
  els.stampAssetShopPriceSheets.disabled = !purchaseOnly;
}

function ownedStampIdsForStudent(studentId) {
  if (!studentId) {
    return [];
  }
  if (!Array.isArray(state.ownedStampIdsByStudent[studentId])) {
    state.ownedStampIdsByStudent[studentId] = [];
  }
  return state.ownedStampIdsByStudent[studentId];
}

function studentOwnsStamp(studentId, stampId) {
  return ownedStampIdsForStudent(studentId).includes(stampId);
}

function stampIsAvailableForStudent(stamp, student, total) {
  if (!stamp) {
    return false;
  }
  if (stamp.hidden) {
    return false;
  }
  if (isTestStudent(student)) {
    return true;
  }
  if (student && studentOwnsStamp(student.id, stamp.id)) {
    return true;
  }
  if (stamp.purchaseOnly) {
    return false;
  }
  return total >= stamp.unlockAt;
}

function stampPriceSheets(stamp) {
  return Math.max(1, Math.floor(Number(stamp.shopPriceSheets || 1)));
}

async function saveStampAsset() {
  const name = els.stampAssetName.value.trim();
  const purchaseOnly = els.stampAssetUnlockMode.value === "purchase";
  const unlockAt = purchaseOnly ? 0 : Math.max(0, Math.floor(Number(els.stampAssetUnlockAt.value || 0)));
  const shopPriceSheets = Math.max(1, Math.floor(Number(els.stampAssetShopPriceSheets.value || 1)));
  const hidden = !els.stampAssetVisible.checked;
  const stampId = els.stampAssetId.value;
  const existing = activeStampAssets().find((stamp) => stamp.id === stampId);
  const file = els.stampAssetImage.files?.[0];

  if (!name) {
    showToast("スタンプ名を入力してください");
    return;
  }
  if (!purchaseOnly && !Number.isFinite(unlockAt)) {
    showToast("解放する数を入力してください");
    return;
  }
  if (purchaseOnly && (!Number.isFinite(shopPriceSheets) || shopPriceSheets < 1)) {
    showToast("購入に必要なシート数を入力してください");
    return;
  }
  if (!existing && !file) {
    showToast("新規スタンプは画像を選んでください");
    return;
  }

  let src = existing?.src || "";
  if (file) {
    if (!file.type.startsWith("image/")) {
      showToast("画像ファイルを選んでください");
      return;
    }
    try {
      src = await imageFileToStampDataUrl(file);
    } catch (error) {
      console.error(error);
      showToast("画像を読み込めませんでした");
      return;
    }
  }

  const nextStamp = {
    id: existing?.id || `custom-${crypto.randomUUID()}`,
    name,
    reading: name,
    src,
    unlockAt,
    custom: existing?.custom || !existing,
    purchaseOnly,
    shopPriceSheets,
    rarity: existing?.rarity || "normal",
    hidden,
  };

  const previousStampAssets = state.stampAssets;
  const nextStampAssets = normalizeStampAssets([
    ...activeStampAssets().filter((stamp) => stamp.id !== nextStamp.id),
    nextStamp,
  ]);
  state.stampAssets = nextStampAssets;
  if (!visibleStampAssets().some((stamp) => stamp.id === state.selectedStampId)) {
    state.selectedStampId = visibleStampAssets()[0]?.id || activeStampAssets()[0]?.id || "sonochoshi";
  }
  if (!persist()) {
    state.stampAssets = previousStampAssets;
    return;
  }
  clearStampAssetForm();
  render();
  showToast(existing ? "スタンプ設定を更新しました" : "新しいスタンプを追加しました");
}

function renderStampShop(student, stats) {
  const stampSets = visibleStampSets();
  const stamps = visibleStampAssets().filter((stamp) => stamp.purchaseOnly && !stamp.setId);
  if (!stampSets.length && !stamps.length) {
    els.shopStampRewards.innerHTML = '<p class="empty-state">買えるスタンプはまだありません。</p>';
    return;
  }

  els.shopStampRewards.innerHTML = stamps
    .map((stamp) => stampShopCard(stamp, stats, student))
    .concat(stampSets.map((stampSet) => stampSetShopCard(stampSet, stats, student)))
    .join("");
  els.shopStampRewards.querySelectorAll("[data-buy-stamp-set]").forEach((button) => {
    button.addEventListener("click", () => openStampSetPurchaseConfirm(button.dataset.buyStampSet));
  });
  els.shopStampRewards.querySelectorAll("[data-set-reward-goal]").forEach((button) => {
    button.addEventListener("click", () => setRewardGoal(button.dataset.setRewardGoalType, button.dataset.setRewardGoal));
  });
}

function stampSetShopCard(stampSet, stats, student) {
  const members = stampSetMembers(stampSet);
  const owned = student ? stampSetIsOwned(student.id, stampSet) : false;
  const unlocked = stampSetIsUnlockedForStudent(student, stampSet);
  const isGoal = rewardGoalForStudent(student)?.type === "stamp-set" && rewardGoalForStudent(student)?.item.id === stampSet.id;
  const priceSheets = stampSetPriceSheets(stampSet);
  const canBuy = Boolean(student) && unlocked && !owned && stats.availableSheets >= priceSheets;
  const label = owned
    ? "購入済み"
    : !student
      ? "児童をえらぶ"
      : !unlocked
        ? "まだ かえない"
        : canBuy
          ? "セットを買う"
          : `あと${Math.max(0, priceSheets - stats.availableSheets)}シート`;
  const locked = Boolean(student) && !unlocked;
  return `
    <article class="stamp-shop-card stamp-set-shop-card${owned ? " is-owned" : ""}${locked ? " is-locked" : ""}">
      ${locked ? lockedStampSetCover(stampSet) : stampSetCover(stampSet, members)}
      <div>
        <span>${locked ? "つぎのセット" : `${members.length}こスタンプセット`}</span>
        <strong>${escapeHtml(stampSet.name)}</strong>
        <p>${locked ? escapeHtml(stampSetLockText(stampSet)) : `${priceSheets}シート`}</p>
      </div>
      <div class="shop-card-actions">
        <button class="primary-button" type="button" data-buy-stamp-set="${stampSet.id}" ${!canBuy ? "disabled" : ""}>${label}</button>
        ${student && !owned && unlocked ? `<button class="soft-button" type="button" data-set-reward-goal="${stampSet.id}" data-set-reward-goal-type="stamp-set" ${isGoal ? "disabled" : ""}>${isGoal ? "ねらい中" : "ねらいにする"}</button>` : ""}
      </div>
    </article>
  `;
}

function stampSetIsOwned(studentId, stampSet) {
  const members = stampSetMembers(stampSet);
  return Boolean(members.length) && members.every((stamp) => studentOwnsStamp(studentId, stamp.id));
}

function stampSetPriceSheets(stampSet) {
  return Math.max(1, Math.floor(Number(stampSet?.priceSheets || 1)));
}

function stampSetIsUnlockedForStudent(student, stampSet) {
  if (!stampSet?.requiresSetId || isTestStudent(student)) {
    return true;
  }
  if (!student) {
    return false;
  }
  const requiredSet = activeStampSets().find((item) => item.id === stampSet.requiresSetId);
  return Boolean(requiredSet && stampSetIsOwned(student.id, requiredSet));
}

function stampSetLockText(stampSet) {
  const requiredSet = activeStampSets().find((item) => item.id === stampSet?.requiresSetId);
  return requiredSet ? `${requiredSet.name}を あつめよう` : "まだ ひみつ";
}

function nextStampSetInSeries(stampSet) {
  return activeStampSets().find((item) => item.requiresSetId === stampSet?.id && !item.hidden) || null;
}

function setRewardGoal(type, id) {
  const student = selectedStudent();
  if (!student || !["stamp", "stamp-set"].includes(type) || !id) {
    return;
  }

  if (type === "stamp") {
    const stamp = activeStampAssets().find((item) => item.id === id && item.purchaseOnly && !item.hidden);
    if (!stamp || studentOwnsStamp(student.id, stamp.id)) {
      return;
    }
  } else {
    const stampSet = visibleStampSets().find((item) => item.id === id);
    if (!stampSet || !stampSetIsUnlockedForStudent(student, stampSet) || stampSetIsOwned(student.id, stampSet)) {
      return;
    }
  }

  const previousGoal = state.rewardGoalsByStudent[student.id];
  state.rewardGoalsByStudent[student.id] = { type, id };
  if (!persist()) {
    if (previousGoal) {
      state.rewardGoalsByStudent[student.id] = previousGoal;
    } else {
      delete state.rewardGoalsByStudent[student.id];
    }
    return;
  }
  render();
  showToast(type === "stamp-set" ? "スタンプセットをねらいにしたよ！" : "スタンプをねらいにしたよ！");
}

function clearRewardGoalIfMatches(studentId, type, id) {
  const goal = state.rewardGoalsByStudent?.[studentId];
  if (!goal || goal.type !== type || goal.id !== id) {
    return null;
  }
  const previousGoal = { ...goal };
  delete state.rewardGoalsByStudent[studentId];
  return previousGoal;
}

function lockedStampSetCover(stampSet) {
  return `
    <div class="stamp-set-cover stamp-set-cover-locked" aria-label="${escapeHtml(stampSet.name)}はまだひみつ">
      <span aria-hidden="true">?</span>
    </div>
  `;
}

function renderStampBook() {
  const student = selectedStudent();
  const stampSets = visibleStampSets();
  const allStamps = stampSets.flatMap((stampSet) => stampSetMembers(stampSet));
  const ownedCount = student
    ? allStamps.filter((stamp) => studentOwnsStamp(student.id, stamp.id)).length
    : 0;

  els.stampBookOwnedCount.textContent = ownedCount;
  els.stampBookTotalCount.textContent = allStamps.length;
  els.stampBookLead.textContent = student
    ? `${student.name}さんの あつめた スタンプだよ`
    : "じどうを えらぶと、あつめた スタンプが みられるよ";

  if (!stampSets.length) {
    els.stampBookSetList.innerHTML = '<p class="empty-state">ずかんに のせる スタンプセットが まだ ないよ。</p>';
    return;
  }

  els.stampBookSetList.innerHTML = stampSets
    .map((stampSet) => stampBookSetCard(stampSet, student))
    .join("");
}

function stampBookSetCard(stampSet, student) {
  const members = stampSetMembers(stampSet);
  const ownedCount = student
    ? members.filter((stamp) => studentOwnsStamp(student.id, stamp.id)).length
    : 0;
  const unlocked = stampSetIsUnlockedForStudent(student, stampSet);
  const complete = members.length > 0 && ownedCount === members.length;
  const cardClass = !unlocked ? " is-locked" : complete ? " is-complete" : "";
  const stateText = complete
    ? "あつめたよ！"
    : !unlocked
      ? "まだ ひみつ"
      : `${ownedCount}/${members.length}こ あつめたよ`;
  const stamps = members.map((stamp) => {
    const owned = student && studentOwnsStamp(student.id, stamp.id);
    return owned
      ? `<div class="stamp-book-stamp"><img src="${escapeHtml(stamp.src)}" alt="${escapeHtml(stamp.name)}"></div>`
      : '<div class="stamp-book-stamp is-unknown" aria-label="まだひみつ"><span aria-hidden="true">?</span></div>';
  }).join("");

  return `
    <article class="stamp-book-set-card${cardClass}">
      <div class="stamp-book-set-head">
        <div>
          <span>${stampSet.seriesName ? `${escapeHtml(stampSet.seriesName)} ${stampSet.tier}` : "スタンプセット"}</span>
          <h3>${escapeHtml(stampSet.name)}</h3>
        </div>
        <strong>${stateText}</strong>
      </div>
      <div class="stamp-book-stamp-grid">${stamps}</div>
      ${!unlocked ? `<p class="stamp-book-note">${escapeHtml(stampSetLockText(stampSet))}</p>` : ""}
    </article>
  `;
}

function stampShopCard(stamp, stats, student) {
  const owned = student ? studentOwnsStamp(student.id, stamp.id) : false;
  const isGoal = rewardGoalForStudent(student)?.type === "stamp" && rewardGoalForStudent(student)?.item.id === stamp.id;
  const price = stampPriceSheets(stamp);
  const canBuy = Boolean(student) && !owned && stats.availableSheets >= price;
  const special = stamp.rarity === "special";
  const label = owned ? "購入済み" : canBuy ? "購入する" : `あと${Math.max(0, price - stats.availableSheets)}シート`;
  return `
    <article class="stamp-shop-card${special ? " is-special" : ""}${owned ? " is-owned" : ""}">
      <img src="${escapeHtml(stamp.src)}" alt="${escapeHtml(stamp.name)}スタンプ">
      <div>
        <span>${special ? "スペシャル" : "スタンプ"}</span>
        <strong>${escapeHtml(stamp.name)}</strong>
        <p>${price}シート</p>
      </div>
      <div class="shop-card-actions">
        <button class="primary-button" type="button" data-buy-stamp="${stamp.id}" ${!canBuy ? "disabled" : ""}>${label}</button>
        ${student && !owned ? `<button class="soft-button" type="button" data-set-reward-goal="${stamp.id}" data-set-reward-goal-type="stamp" ${isGoal ? "disabled" : ""}>${isGoal ? "ねらい中" : "ねらいにする"}</button>` : ""}
      </div>
    </article>
  `;
}

function imageFileToStampDataUrl(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.addEventListener("load", () => {
      const maxSize = 300;
      const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/webp", 0.76));
    });
    image.addEventListener("error", () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("image load failed"));
    });
    image.src = objectUrl;
  });
}

function editPrize(prizeId) {
  const prize = state.rewards.find((reward) => reward.id === prizeId && reward.type === "shop");
  if (!prize) {
    return;
  }

  els.prizeId.value = prize.id;
  els.prizeName.value = prize.name;
  els.prizeCostSheets.value = String(prize.costSheets || 1);
  els.prizeDescription.value = prize.description || "";
  els.prizeEnabled.checked = prize.enabled !== false;
  els.prizeName.focus();
}

function clearPrizeForm() {
  els.prizeId.value = "";
  els.prizeName.value = "";
  els.prizeCostSheets.value = "1";
  els.prizeDescription.value = "";
  els.prizeEnabled.checked = true;
}

function savePrize() {
  const name = els.prizeName.value.trim();
  const costSheets = Math.max(1, Math.floor(Number(els.prizeCostSheets.value || 1)));
  const description = els.prizeDescription.value.trim();
  const prizeId = els.prizeId.value;
  const existing = state.rewards.find((reward) => reward.id === prizeId && reward.type === "shop");

  if (!name) {
    showToast("景品名を入力してください");
    return;
  }
  if (!Number.isFinite(costSheets) || costSheets < 1) {
    showToast("必要なシート数を入力してください");
    return;
  }

  const nextPrize = normalizeReward({
    id: existing?.id || `shop-${crypto.randomUUID()}`,
    name,
    type: "shop",
    costSheets,
    description,
    enabled: els.prizeEnabled.checked,
    locked: existing?.locked || false,
  }, existing || {});

  state.rewards = normalizeRewards([
    ...state.rewards.filter((reward) => reward.id !== nextPrize.id),
    nextPrize,
  ]);
  clearPrizeForm();
  persist();
  render();
  showToast(existing ? "景品を更新しました" : "景品を追加しました");
}

function editLevelRule(level) {
  const rule = activeLevelRules().find((item) => item.level === level) || activeLevelRules()[0];
  els.levelRuleLevel.value = String(rule.level);
  els.levelRuleName.value = rule.name;
  els.levelRuleRequiredSheets.value = String(rule.requiredSheets);
  els.levelRuleImage.value = rule.image;
}

function saveLevelRule() {
  const level = Math.floor(Number(els.levelRuleLevel.value || 1));
  const name = els.levelRuleName.value.trim();
  const requiredSheets = Math.max(0, Math.floor(Number(els.levelRuleRequiredSheets.value || 0)));
  const image = els.levelRuleImage.value.trim() || defaultLevelRules.find((rule) => rule.level === level)?.image || defaultLevelRules[0].image;
  if (!name) {
    showToast("レベル名を入力してください");
    return;
  }

  state.settings.levelRules = normalizeLevelRules(activeLevelRules().map((rule) => (
    rule.level === level
      ? { ...rule, name, requiredSheets: level === 1 ? 0 : requiredSheets, image }
      : rule
  )));
  persist();
  render();
  editLevelRule(level);
  showToast(`Lv.${level}の条件を保存しました`);
}

function resetLevelRules() {
  const ok = confirm("ほうにゃんレベル設定を既定に戻します。よろしいですか？");
  if (!ok) {
    return;
  }
  state.settings.levelRules = structuredClone(defaultLevelRules);
  persist();
  render();
  editLevelRule(1);
  showToast("レベル設定を既定に戻しました");
}

function showView(viewName) {
  els.views.forEach((view) => {
    view.classList.toggle("is-active", view.dataset.view === viewName);
  });
  els.studentSwitcher.hidden = viewName !== "stamp";
  els.viewButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewButton === viewName);
  });
}

function showStampTab(tabName) {
  const nextTab = [...els.stampTabButtons].some((button) => button.dataset.stampTabButton === tabName)
    ? tabName
    : "child";
  els.stampTabButtons.forEach((button) => {
    const isActive = button.dataset.stampTabButton === nextTab;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
  els.stampTabPanels.forEach((panel) => {
    const isActive = panel.dataset.stampTabPanel === nextTab;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });
}

function showCalendarDisplayTab(tabName) {
  const nextTab = [...els.calendarDisplayTabButtons].some((button) => button.dataset.calendarDisplayTabButton === tabName)
    ? tabName
    : "calendar";
  els.calendarDisplayTabButtons.forEach((button) => {
    const isActive = button.dataset.calendarDisplayTabButton === nextTab;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
  els.calendarDisplayTabPanels.forEach((panel) => {
    const isActive = panel.dataset.calendarDisplayTabPanel === nextTab;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });
}

function showTeacherTab(tabName) {
  const nextTab = [...els.teacherTabButtons].some((button) => button.dataset.teacherTabButton === tabName)
    ? tabName
    : "students";
  els.teacherTabButtons.forEach((button) => {
    const isActive = button.dataset.teacherTabButton === nextTab;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  els.teacherTabPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.teacherTabPanel === nextTab);
  });
}

function activeView() {
  return document.querySelector(".view.is-active")?.dataset.view || "stamp";
}

function setTimerMode(mode) {
  if (!TIMER_FINISH_SOUNDS[mode] || timerIsRunning) {
    return;
  }
  timerMode = mode;
  renderTimer();
}

function setTimerDuration(seconds) {
  const nextSeconds = clampTimerSeconds(seconds);
  stopTimerInterval();
  timerDurationSeconds = nextSeconds;
  timerRemainingSeconds = nextSeconds;
  timerIsRunning = false;
  timerEndAt = 0;
  timerFinishedSoundPlayed = false;
  syncTimerInputs();
  renderTimer();
}

function setTimerFromInputs() {
  const minutes = Math.max(0, Math.floor(Number(els.timerMinutes.value || 0)));
  const seconds = Math.max(0, Math.floor(Number(els.timerSeconds.value || 0)));
  setTimerDuration(minutes * 60 + seconds);
}

function startTimer() {
  showView("timer");
  unlockTimerSound();
  if (timerRemainingSeconds <= 0) {
    timerRemainingSeconds = timerDurationSeconds;
    timerFinishedSoundPlayed = false;
  }
  if (timerRemainingSeconds <= 0) {
    setTimerDuration(TIMER_DEFAULT_SECONDS);
  }

  timerIsRunning = true;
  timerEndAt = Date.now() + timerRemainingSeconds * 1000;
  stopTimerInterval();
  timerIntervalId = window.setInterval(updateTimerTick, 200);
  updateTimerTick();
}

function pauseTimer() {
  if (!timerIsRunning) {
    return;
  }
  updateTimerTick();
  timerIsRunning = false;
  timerEndAt = 0;
  stopTimerInterval();
  renderTimer();
}

function resetTimer() {
  stopTimerInterval();
  timerIsRunning = false;
  timerEndAt = 0;
  timerRemainingSeconds = timerDurationSeconds;
  timerFinishedSoundPlayed = false;
  syncTimerInputs();
  renderTimer();
}

function updateTimerTick() {
  if (!timerIsRunning) {
    return;
  }
  timerRemainingSeconds = Math.max(0, Math.ceil((timerEndAt - Date.now()) / 1000));
  if (timerRemainingSeconds <= 0) {
    timerIsRunning = false;
    timerEndAt = 0;
    stopTimerInterval();
    playTimerFinishedSound();
  }
  renderTimer();
}

function unlockTimerSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }
  if (!timerAudioContext) {
    timerAudioContext = new AudioContextClass();
  }
  if (timerAudioContext.state === "suspended") {
    const resumeResult = timerAudioContext.resume?.();
    if (resumeResult?.catch) {
      resumeResult.catch(() => {});
    }
  }
}

function playTimerFinishedSound() {
  if (timerFinishedSoundPlayed) {
    return;
  }
  timerFinishedSoundPlayed = true;
  if (playTimerFinishAudioFile()) {
    return;
  }
  playBuiltInTimerChime();
}

function playTimerFinishAudioFile() {
  const src = TIMER_FINISH_SOUNDS[timerMode];
  if (!src) {
    return false;
  }

  const audio = new Audio(src);
  let fallbackPlayed = false;
  const playFallback = () => {
    if (fallbackPlayed) {
      return;
    }
    fallbackPlayed = true;
    playBuiltInTimerChime();
  };
  audio.preload = "auto";
  audio.addEventListener("error", playFallback, { once: true });
  const playResult = audio.play();
  if (playResult?.catch) {
    playResult.catch(playFallback);
  }
  return true;
}

function playBuiltInTimerChime() {
  unlockTimerSound();
  if (!timerAudioContext) {
    return;
  }

  const startAt = timerAudioContext.currentTime;
  const notes = [
    { frequency: 523.25, start: 0, duration: 0.22 },
    { frequency: 659.25, start: 0.24, duration: 0.22 },
    { frequency: 783.99, start: 0.48, duration: 0.34 },
    { frequency: 1046.5, start: 0.9, duration: 0.44 },
    { frequency: 783.99, start: 1.42, duration: 0.28 },
    { frequency: 1046.5, start: 1.76, duration: 0.52 },
  ];

  notes.forEach((note) => {
    const oscillator = timerAudioContext.createOscillator();
    const gain = timerAudioContext.createGain();
    const noteStart = startAt + note.start;
    const noteEnd = noteStart + note.duration;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(note.frequency, noteStart);
    gain.gain.setValueAtTime(0.0001, noteStart);
    gain.gain.exponentialRampToValueAtTime(0.18, noteStart + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);
    oscillator.connect(gain);
    gain.connect(timerAudioContext.destination);
    oscillator.start(noteStart);
    oscillator.stop(noteEnd + 0.02);
  });
}

function stopTimerInterval() {
  if (timerIntervalId) {
    window.clearInterval(timerIntervalId);
    timerIntervalId = 0;
  }
}

function renderTimer() {
  const progress = timerDurationSeconds > 0 ? timerRemainingSeconds / timerDurationSeconds : 0;
  const isFinished = !timerIsRunning && timerRemainingSeconds <= 0;
  els.timerTime.textContent = formatTimerTime(timerRemainingSeconds);
  els.timerRing.style.setProperty("--timer-progress", String(Math.max(0, Math.min(1, progress))));
  els.timerRing.classList.toggle("is-low", timerDurationSeconds > 0 && progress <= 0.2);
  els.timerPage.classList.toggle("is-running", timerIsRunning);
  els.timerPage.classList.toggle("is-finished", isFinished);
  if (els.timerPage.dataset.timerMode !== timerMode) {
    els.timerPage.dataset.timerMode = timerMode;
  }
  els.timerModeButtons.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.timerMode === timerMode);
  });
  els.timerStatus.textContent = timerIsRunning
    ? "カウントダウン中"
    : timerRemainingSeconds <= 0
      ? "おしまい！"
      : timerRemainingSeconds === timerDurationSeconds
        ? "じゅんびOK"
        : "一時停止中";
  els.timerTitle.textContent = timerIsRunning
    ? timerMode === "play"
      ? "ほうにゃんとひとやすみ"
      : "ほうにゃんとがんばる"
    : isFinished
      ? "おしまい！"
      : "じかんをきめる";
  if (isFinished) {
    els.timerCheerText.innerHTML = TIMER_FINISH_MESSAGES[timerMode] || TIMER_FINISH_MESSAGES.study;
  } else {
    els.timerCheerText.textContent = timerIsRunning
      ? timerMode === "play"
        ? progress <= 0.2
          ? "あとすこしで きゅうけい おしまい"
          : "のんびり きゅうけい しよう"
        : progress <= 0.2
          ? "あとすこし！ほうにゃんが見てるよ"
          : "そのちょうし！いっしょにがんばろう"
      : timerMode === "play"
        ? "ほうにゃんと ひとやすみ しよう"
        : "ほうにゃんもいっしょに見てるよ";
  }
  els.timerStartButton.disabled = timerIsRunning;
  els.timerPauseButton.disabled = !timerIsRunning;
}

function syncTimerInputs() {
  els.timerMinutes.value = String(Math.floor(timerDurationSeconds / 60));
  els.timerSeconds.value = String(timerDurationSeconds % 60);
}

function clampTimerSeconds(seconds) {
  const value = Math.floor(Number(seconds || 0));
  if (!Number.isFinite(value) || value <= 0) {
    return TIMER_DEFAULT_SECONDS;
  }
  return Math.min(TIMER_MAX_SECONDS, value);
}

function formatTimerTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function saveStudent() {
  const name = els.studentName.value.trim();
  const note = els.studentNote.value.trim();
  const groupId = els.studentGroup.value;
  const isTest = Boolean(els.studentTestMode.checked);
  if (!name) {
    showToast("名前を入力してください");
    return;
  }

  let savedStudent = null;
  if (els.studentId.value) {
    const student = state.students.find((item) => item.id === els.studentId.value);
    if (student) {
      student.name = name;
      student.note = note;
      student.groupId = groupId;
      student.isTest = isTest;
      savedStudent = student;
    }
  } else {
    const student = {
      id: crypto.randomUUID(),
      name,
      note,
      groupId,
      isTest,
      ticketBalance: 0,
      createdAt: new Date().toISOString(),
    };
    state.students.push(student);
    state.selectedStudentId = student.id;
    savedStudent = student;
  }

  if (isTestStudent(savedStudent)) ensureTestStudentMissionSettings(savedStudent);

  clearStudentForm();
  persist();
  render();
  showToast("児童を保存しました。上の切り替えに反映しました");
}

function clearStudentForm() {
  els.studentId.value = "";
  els.studentName.value = "";
  els.studentNote.value = "";
  els.studentGroup.value = "";
  els.studentTestMode.checked = false;
}

function createTestStudent() {
  const existing = state.students.find((student) => isTestStudent(student));
  if (existing) {
    state.selectedStudentId = existing.id;
    persist();
    render();
    showToast("テスト児童を選びました");
    return;
  }

  const student = {
    id: crypto.randomUUID(),
    name: TEST_STUDENT_NAME,
    note: "動作テスト用",
    isTest: true,
    createdAt: new Date().toISOString(),
  };
  state.students.push(student);
  ensureTestStudentMissionSettings(student);
  state.selectedStudentId = student.id;
  persist();
  render();
  showToast("テスト児童を追加しました。制限なしで試せます");
}

function openTeacherStampPreview() {
  const student = selectedStudent();
  if (!student) {
    showToast("先に児童を登録してください");
    return;
  }
  const plannedCount = Math.min(
    STAMP_BATCH_MAX,
    Math.max(1, Math.floor(Number(els.teacherStampBatchCount.value || 1)))
  );
  els.teacherStampBatchCount.value = String(plannedCount);

  openStampPreview({
    source: "teacher",
    studentId: student.id,
    memo: els.stampMemo.value.trim(),
    plannedCount,
  });
}

function openStampCountChoice({ source }) {
  const student = selectedStudent();
  if (!student) {
    showToast(source === "child" ? "先生に名前を登録してもらってね" : "先に児童を登録してください");
    return;
  }

  const stats = studentStats(student.id);
  const stamps = visibleStampAssets();
  const availableStamps = stamps.filter((stamp) => stampIsAvailableForStudent(stamp, student, stats.total));
  if (!availableStamps.length) {
    showToast("使えるスタンプがありません");
    return;
  }

  stampCountContext = {
    source,
    studentId: student.id,
    totalBefore: stats.total,
    memo: source === "teacher" ? els.stampMemo.value.trim() : "",
  };
  stampCountTarget = 0;
  els.stampCountStudent.textContent = source === "child" ? `${student.name}のスタンプ` : `${student.name} / スタンプ`;
  renderStampCountChoice();
  els.stampCountLayer.hidden = false;
  els.stampCountLayer.classList.remove("is-showing");
  requestAnimationFrame(() => {
    els.stampCountLayer.classList.add("is-showing");
    els.stampCountPlus.focus();
  });
}

function renderStampCountChoice() {
  const childMode = stampCountContext?.source === "child";
  const unit = childMode ? "こ" : "個";
  els.stampCountValue.textContent = `${stampCountTarget}${unit}`;
  els.stampCountHint.textContent = stampCountTarget > 0
    ? `このあと、${stampCountTarget}${unit}ぶんのスタンプを選びます。`
    : "先に、全部で押す数を決めます。";
  els.stampCountMinus.disabled = stampCountTarget <= 0;
  els.stampCountPlus.disabled = stampCountTarget >= STAMP_BATCH_MAX;
  els.stampCountNextButton.disabled = stampCountTarget <= 0;
}

function updateStampCountTarget(delta) {
  stampCountTarget = Math.min(STAMP_BATCH_MAX, Math.max(0, stampCountTarget + delta));
  renderStampCountChoice();
}

function closeStampCountChoice() {
  els.stampCountLayer.classList.remove("is-showing");
  window.setTimeout(() => {
    els.stampCountLayer.hidden = true;
    stampCountContext = null;
    stampCountTarget = 0;
  }, 160);
}

function continueToStampPreview() {
  if (!stampCountContext) {
    return;
  }
  if (stampCountTarget <= 0) {
    showToast("押すスタンプの数を決めてください");
    return;
  }

  const context = {
    ...stampCountContext,
    plannedCount: stampCountTarget,
  };
  els.stampCountLayer.classList.remove("is-showing");
  els.stampCountLayer.hidden = true;
  stampCountContext = null;
  stampCountTarget = 0;
  openStampPreview(context);
}

function openStampPreview(context) {
  const student = selectedStudent();
  if (!student || student.id !== context.studentId) {
    showToast("児童をもう一度選んでください");
    return;
  }

  const stats = studentStats(student.id);
  const stamps = visibleStampAssets();
  const availableStamps = stamps.filter((stamp) => stampIsAvailableForStudent(stamp, student, stats.total));
  if (!availableStamps.length) {
    showToast("使えるスタンプがありません");
    return;
  }

  stampPreviewContext = {
    ...context,
    totalBefore: stats.total,
  };
  stampPreviewCounts = Object.fromEntries(stamps.map((stamp) => [stamp.id, 0]));
  const categories = stampPreviewCategories(stamps);
  if (context.source === "teacher" && Number(context.plannedCount || 0) > 0) {
    const defaultStamp = availableStamps.find((stamp) => stamp.id === state.selectedStampId) || availableStamps[0];
    stampPreviewCounts[defaultStamp.id] = Math.min(STAMP_BATCH_MAX, Number(context.plannedCount || 0));
    stampPreviewCategoryId = stampPreviewCategoryForStamp(defaultStamp, categories);
  } else {
    stampPreviewCategoryId = categories.find((category) => category.id === "basic")?.id || categories[0]?.id || "all";
  }
  els.stampPreviewStudent.textContent = context.source === "child" ? `${student.name}のスタンプ` : `${student.name} / スタンプ`;
  renderStampPreview();
  els.stampPreviewLayer.hidden = false;
  els.stampPreviewLayer.classList.remove("is-showing");
  requestAnimationFrame(() => {
    els.stampPreviewLayer.classList.add("is-showing");
    els.stampPreviewConfirmButton.focus();
  });
}

function renderStampPreview() {
  const student = selectedStudent();
  const stats = student ? studentStats(student.id) : emptyStats();
  const childMode = stampPreviewContext?.source === "child";
  const totalCount = stampPreviewTotalCount();
  const plannedCount = Number(stampPreviewContext?.plannedCount || 0);
  const unit = childMode ? "こ" : "個";
  const categories = stampPreviewCategories(visibleStampAssets());
  if (!categories.some((category) => category.id === stampPreviewCategoryId)) {
    stampPreviewCategoryId = categories[0]?.id || "all";
  }
  const activeCategory = categories.find((category) => category.id === stampPreviewCategoryId) || categories[0];
  const categoryStamps = activeCategory?.stamps || [];

  els.stampPreviewTabs.innerHTML = categories
    .map((category) => {
      const selectedCount = category.stamps.reduce(
        (sum, stamp) => sum + Number(stampPreviewCounts[stamp.id] || 0),
        0,
      );
      const isActive = category.id === stampPreviewCategoryId;
      return `
        <button
          class="stamp-preview-tab${isActive ? " is-active" : ""}"
          type="button"
          role="tab"
          aria-selected="${isActive}"
          aria-controls="stampPreviewList"
          data-stamp-preview-category="${escapeHtml(category.id)}"
        >
          <span>${escapeHtml(category.name)}</span>${selectedCount ? `<b>${selectedCount}</b>` : ""}
        </button>
      `;
    })
    .join("");

  els.stampPreviewList.innerHTML = categoryStamps
    .map((stamp) => {
      const locked = !stampIsAvailableForStudent(stamp, student, stats.total);
      const count = Number(stampPreviewCounts[stamp.id] || 0);
      const plusDisabled = locked || (plannedCount > 0 && totalCount >= plannedCount);
      const label = locked
        ? stamp.purchaseOnly
          ? childMode
            ? "おかいものでこうにゅう"
            : "買い物で購入"
          : `${stamp.unlockAt}${childMode ? "こ" : "個"}で解放`
        : stamp.name;
      return `
        <article class="preview-stamp${locked ? " is-locked" : ""}">
          <img src="${stamp.src}" alt="${escapeHtml(stamp.name)}">
          <div>
            <strong>${escapeHtml(locked && childMode ? label : stamp.name)}</strong>
            <span>${escapeHtml(locked ? label : "押す数を選びます")}</span>
          </div>
          <div class="preview-stepper" aria-label="${escapeHtml(stamp.name)}の数">
            <button type="button" data-preview-count="${stamp.id}" data-delta="-1" ${locked || count === 0 ? "disabled" : ""}>-</button>
            <output>${count}</output>
            <button type="button" data-preview-count="${stamp.id}" data-delta="1" ${plusDisabled ? "disabled" : ""}>+</button>
          </div>
        </article>
      `;
    })
    .join("");

  els.stampPreviewTabs.querySelectorAll("[data-stamp-preview-category]").forEach((button) => {
    button.addEventListener("click", () => {
      stampPreviewCategoryId = button.dataset.stampPreviewCategory;
      renderStampPreview();
    });
  });

  els.stampPreviewTotal.textContent = plannedCount > 0
    ? `合計 ${totalCount}/${plannedCount}${unit}`
    : `合計 ${totalCount}${unit}`;
  els.stampPreviewConfirmButton.disabled = plannedCount > 0 ? totalCount !== plannedCount : totalCount === 0;
  els.stampPreviewList.querySelectorAll("[data-preview-count]").forEach((button) => {
    button.addEventListener("click", () => {
      const stampId = button.dataset.previewCount;
      const delta = Number(button.dataset.delta || 0);
      if (delta > 0 && plannedCount > 0 && stampPreviewTotalCount() >= plannedCount) {
        return;
      }
      stampPreviewCounts[stampId] = Math.max(0, Number(stampPreviewCounts[stampId] || 0) + delta);
      renderStampPreview();
    });
  });
}

function closeStampPreview() {
  els.stampPreviewLayer.classList.remove("is-showing");
  window.setTimeout(() => {
    els.stampPreviewLayer.hidden = true;
    stampPreviewContext = null;
    stampPreviewCounts = {};
    stampPreviewCategoryId = "all";
  }, 160);
}

function chooseRandomPreviewStamps() {
  const student = selectedStudent();
  if (!student || !stampPreviewContext) {
    return;
  }
  const stats = studentStats(student.id);
  const availableStamps = visibleStampAssets().filter((stamp) => stampIsAvailableForStudent(stamp, student, stats.total));
  if (!availableStamps.length) {
    showToast("使えるスタンプがありません");
    return;
  }

  const plannedCount = Math.max(1, Number(stampPreviewContext.plannedCount || 1));
  stampPreviewCounts = Object.fromEntries(visibleStampAssets().map((stamp) => [stamp.id, 0]));
  for (let index = 0; index < plannedCount; index += 1) {
    const stamp = availableStamps[Math.floor(Math.random() * availableStamps.length)];
    stampPreviewCounts[stamp.id] += 1;
  }
  renderStampPreview();
  showToast(`ランダムに ${plannedCount} ${stampPreviewContext.source === "child" ? "こ" : "個"}えらびました`);
}

function stampPreviewCategories(stamps) {
  const stampSets = activeStampSets();
  const stampSetsById = new Map(stampSets.map((stampSet) => [stampSet.id, stampSet]));
  const stampSetOrder = new Map(stampSets.map((stampSet, index) => [stampSet.id, index]));
  const categoriesById = new Map();
  const basicStamps = [];

  stamps.forEach((stamp) => {
    if (!stamp.setId) {
      basicStamps.push(stamp);
      return;
    }
    const stampSet = stampSetsById.get(stamp.setId);
    const categoryId = stampSet?.seriesId ? `series:${stampSet.seriesId}` : `set:${stamp.setId}`;
    const firstSetInSeries = stampSet?.seriesId
      ? stampSets.find((item) => item.seriesId === stampSet.seriesId && Number(item.tier || 1) === 1)
      : null;
    const categoryName = firstSetInSeries?.name || stampSet?.name || "そのほか";
    const order = stampSetOrder.get(stamp.setId) ?? Number.MAX_SAFE_INTEGER;
    const category = categoriesById.get(categoryId) || {
      id: categoryId,
      name: categoryName,
      order,
      stamps: [],
    };
    category.order = Math.min(category.order, order);
    category.stamps.push(stamp);
    categoriesById.set(categoryId, category);
  });

  const categories = [{ id: "all", name: "すべて", stamps }];
  if (basicStamps.length) {
    categories.push({ id: "basic", name: "いつもの", stamps: basicStamps });
  }
  return categories.concat(
    Array.from(categoriesById.values()).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "ja")),
  );
}

function stampPreviewCategoryForStamp(stamp, categories) {
  return categories.find((category) => category.id !== "all" && category.stamps.some((item) => item.id === stamp.id))?.id || "all";
}

function confirmStampPreview() {
  if (!stampPreviewContext) {
    return;
  }

  const student = selectedStudent();
  if (!student || student.id !== stampPreviewContext.studentId) {
    closeStampPreview();
    showToast("児童をもう一度選んでください");
    return;
  }

  const selections = stampPreviewSelections();
  if (!selections.length) {
    showToast("押すスタンプを選んでください");
    return;
  }
  const plannedCount = Number(stampPreviewContext.plannedCount || 0);
  const totalCount = stampPreviewTotalCount();
  if (plannedCount > 0 && totalCount !== plannedCount) {
    showToast(`決めた数と同じ ${plannedCount} 個にしてください`);
    renderStampPreview();
    return;
  }

  const stats = studentStats(student.id);
  const lockedSelection = selections.find(({ stamp }) => !stampIsAvailableForStudent(stamp, student, stats.total));
  if (lockedSelection) {
    showToast("まだ使えないスタンプがあります");
    renderStampPreview();
    return;
  }

  addStampBatch({
    student,
    selections,
    source: stampPreviewContext.source,
    memo: stampPreviewContext.memo,
  });
  closeStampPreview();
}

function addStampBatch({ student, selections, source, memo }) {
  const stats = studentStats(student.id);
  const totalAdded = selections.reduce((sum, selection) => sum + selection.count, 0);
  const createdAt = new Date().toISOString();
  const events = [];

  selections.forEach(({ stamp, count }) => {
    for (let index = 0; index < count; index += 1) {
      events.push({
        id: crypto.randomUUID(),
        studentId: student.id,
        stampId: stamp.id,
        memo,
        createdAt,
        canceled: false,
        source: source === "teacher" ? "teacher-stamp" : "child-stamp",
      });
    }
  });

  const nextTotal = stats.total + totalAdded;
  const completedSheets = sheetsCompletedBetween(stats.total, nextTotal);
  const unlockedStamps = stampsUnlockedBetween(stats.total, nextTotal);
  const unlockedLevels = levelsUnlockedBetween(stats.total, nextTotal);
  const dominantStamp = dominantStampFromSelections(selections);
  state.stampEvents.push(...events);
  const missionDate = CalendarDate.dateKey(new Date(createdAt));
  generateDailyMissions(student.id, missionDate);
  refreshAutomaticMissions(student.id, missionDate);
  autoEquipLatestUnlockedHounyan(student.id, unlockedLevels);
  lastStampedEventIds = new Set(events.map((event) => event.id));
  if (source === "teacher") {
    els.stampMemo.value = "";
  }
  playDominantStampVoice(dominantStamp);
  persist();
  render();
  showToast(source === "child" ? `${totalAdded}こスタンプをおしたよ` : `${student.name}に${totalAdded}個スタンプを押しました`);
  unlockedStamps.forEach((unlockedStamp) => {
    showHounyanAnimation("stamp-unlocked", {
      stamp: unlockedStamp,
      studentName: student.name,
    });
  });
  completedSheets.forEach((sheetNumber) => {
    showHounyanAnimation("sheet-completed", {
      studentName: student.name,
      sheetNumber,
    });
  });
  unlockedLevels.forEach((levelRule) => {
    showHounyanAnimation("level-up", {
      studentName: student.name,
      levelRule,
    });
  });

  clearTimeout(stampAnimationTimer);
  stampAnimationTimer = window.setTimeout(() => {
    lastStampedEventIds.clear();
    renderStudentDetails();
  }, 900);
}

function autoEquipLatestUnlockedHounyan(studentId, unlockedLevels) {
  if (!studentId || !unlockedLevels.length) {
    return;
  }
  if (!state.equippedHounyanLevelByStudent) {
    state.equippedHounyanLevelByStudent = {};
  }
  const latestLevel = unlockedLevels.reduce((latest, rule) =>
    !latest || rule.level > latest.level ? rule : latest
  , null);
  if (latestLevel) {
    state.equippedHounyanLevelByStudent[studentId] = latestLevel.level;
  }
}

function stampPreviewSelections() {
  return visibleStampAssets()
    .map((stamp) => ({
      stamp,
      count: Number(stampPreviewCounts[stamp.id] || 0),
    }))
    .filter((selection) => selection.count > 0);
}

function stampPreviewTotalCount() {
  return Object.values(stampPreviewCounts).reduce((sum, value) => sum + Number(value || 0), 0);
}

function dominantStampFromSelections(selections) {
  return selections.reduce((best, current) => {
    if (!best || current.count > best.count) {
      return current;
    }
    return best;
  }, null)?.stamp || visibleStampAssets()[0] || activeStampAssets()[0];
}

function playDominantStampVoice(stamp) {
  // Voice files are not wired yet. This is the future hook for stamp-specific audio.
  return stamp;
}

function cancelStamp(eventId) {
  const event = state.stampEvents.find((item) => item.id === eventId);
  if (!event) {
    return;
  }

  event.canceled = true;
  event.canceledAt = new Date().toISOString();
  persist();
  render();
  showToast("スタンプを取り消しました");
}

function openExchangeConfirm(rewardId) {
  const student = selectedStudent();
  const reward = state.rewards.find((item) => item.id === rewardId);
  if (!student || !reward || reward.type !== "shop" || reward.locked) {
    return;
  }

  const stats = studentStats(student.id);
  const costSheets = Number(reward.costSheets || 0);
  if (stats.availableSheets < costSheets) {
    showToast("使えるシートが足りません");
    return;
  }

  exchangeConfirmRewardId = rewardId;
  exchangeConfirmAction = { type: "reward", id: rewardId };
  els.exchangeConfirmTitle.textContent = "こうかんする？";
  els.exchangeConfirmMessage.textContent = `${student.name}の使えるシート${costSheets}枚を「${reward.name}」と交換します。`;
  els.exchangeConfirmLayer.hidden = false;
  els.exchangeConfirmLayer.classList.remove("is-showing");
  requestAnimationFrame(() => {
    els.exchangeConfirmLayer.classList.add("is-showing");
    els.exchangeConfirmButton.focus();
  });
}

function closeExchangeConfirm() {
  els.exchangeConfirmLayer.classList.remove("is-showing");
  window.setTimeout(() => {
    els.exchangeConfirmLayer.hidden = true;
    exchangeConfirmRewardId = "";
    exchangeConfirmAction = null;
  }, 160);
}

function confirmExchange() {
  const action = exchangeConfirmAction || { type: "reward", id: exchangeConfirmRewardId };
  closeExchangeConfirm();
  if (action.type === "stamp") {
    buyStamp(action.id);
    return;
  }
  if (action.type === "stamp-set") {
    buyStampSet(action.id);
    return;
  }
  redeemReward(action.id);
}

function openStampPurchaseConfirm(stampId) {
  const student = selectedStudent();
  const stamp = activeStampAssets().find((item) => item.id === stampId);
  if (!student || !stamp || stamp.hidden || !stamp.purchaseOnly || studentOwnsStamp(student.id, stamp.id)) {
    return;
  }

  const stats = studentStats(student.id);
  const costSheets = stampPriceSheets(stamp);
  if (stats.availableSheets < costSheets) {
    showToast("使えるシートが足りません");
    return;
  }

  exchangeConfirmRewardId = "";
  exchangeConfirmAction = { type: "stamp", id: stampId };
  els.exchangeConfirmTitle.textContent = "こうにゅうする？";
  els.exchangeConfirmMessage.textContent = `${student.name}の使えるシート${costSheets}枚で「${stamp.name}」スタンプを購入します。`;
  els.exchangeConfirmLayer.hidden = false;
  els.exchangeConfirmLayer.classList.remove("is-showing");
  requestAnimationFrame(() => {
    els.exchangeConfirmLayer.classList.add("is-showing");
    els.exchangeConfirmButton.focus();
  });
}

function openStampSetPurchaseConfirm(stampSetId) {
  const student = selectedStudent();
  const stampSet = visibleStampSets().find((item) => item.id === stampSetId);
  const members = stampSetMembers(stampSet);
  if (!student || !stampSet || !members.length || stampSetIsOwned(student.id, stampSet)) {
    return;
  }
  if (!stampSetIsUnlockedForStudent(student, stampSet)) {
    showToast(stampSetLockText(stampSet));
    return;
  }

  const stats = studentStats(student.id);
  const costSheets = stampSetPriceSheets(stampSet);
  if (stats.availableSheets < costSheets) {
    showToast("使えるシートが足りません");
    return;
  }

  exchangeConfirmRewardId = "";
  exchangeConfirmAction = { type: "stamp-set", id: stampSetId };
  els.exchangeConfirmTitle.textContent = "こうにゅうする？";
  els.exchangeConfirmMessage.textContent = `${student.name}の使えるシート${costSheets}枚で、「${stampSet.name}」のスタンプ${members.length}こをまとめて買います。`;
  els.exchangeConfirmLayer.hidden = false;
  els.exchangeConfirmLayer.classList.remove("is-showing");
  requestAnimationFrame(() => {
    els.exchangeConfirmLayer.classList.add("is-showing");
    els.exchangeConfirmButton.focus();
  });
}

function redeemReward(rewardId) {
  const student = selectedStudent();
  const reward = state.rewards.find((item) => item.id === rewardId);
  if (!student || !reward || reward.type !== "shop" || reward.locked) {
    return;
  }

  const stats = studentStats(student.id);
  const costSheets = Number(reward.costSheets || 0);
  if (stats.availableSheets < costSheets) {
    showToast("使えるシートが足りません");
    return;
  }

  state.redemptions.push({
    id: crypto.randomUUID(),
    studentId: student.id,
    rewardId: reward.id,
    sheetCost: costSheets,
    createdAt: new Date().toISOString(),
    memo: reward.name,
  });
  persist();
  render();
  showToast(`${reward.name}と交換しました`);
}

function buyStamp(stampId) {
  const student = selectedStudent();
  const stamp = activeStampAssets().find((item) => item.id === stampId);
  if (!student || !stamp || stamp.hidden || !stamp.purchaseOnly || studentOwnsStamp(student.id, stamp.id)) {
    return;
  }

  const stats = studentStats(student.id);
  const costSheets = stampPriceSheets(stamp);
  if (stats.availableSheets < costSheets) {
    showToast("使えるシートが足りません");
    return;
  }

  const previousGoal = clearRewardGoalIfMatches(student.id, "stamp", stamp.id);
  ownedStampIdsForStudent(student.id).push(stamp.id);
  state.ownedStampIdsByStudent[student.id] = [...new Set(ownedStampIdsForStudent(student.id))];
  state.redemptions.push({
    id: crypto.randomUUID(),
    studentId: student.id,
    rewardId: `stamp:${stamp.id}`,
    type: "stamp-purchase",
    stampId: stamp.id,
    sheetCost: costSheets,
    createdAt: new Date().toISOString(),
    memo: `${stamp.name}スタンプ`,
  });
  if (!persist()) {
    state.ownedStampIdsByStudent[student.id] = ownedStampIdsForStudent(student.id).filter((id) => id !== stamp.id);
    state.redemptions = state.redemptions.filter((redemption) => redemption.stampId !== stamp.id || redemption.studentId !== student.id || redemption.type !== "stamp-purchase");
    if (previousGoal) {
      state.rewardGoalsByStudent[student.id] = previousGoal;
    }
    return;
  }
  render();
  showToast(`${stamp.name}スタンプを購入しました`);
  showHounyanAnimation("stamps-purchased", {
    studentName: student.name,
    stamps: [stamp],
  });
}

function buyStampSet(stampSetId) {
  const student = selectedStudent();
  const stampSet = visibleStampSets().find((item) => item.id === stampSetId);
  const members = stampSetMembers(stampSet);
  if (!student || !stampSet || !members.length || stampSetIsOwned(student.id, stampSet)) {
    return;
  }
  if (!stampSetIsUnlockedForStudent(student, stampSet)) {
    showToast(stampSetLockText(stampSet));
    return;
  }

  const stats = studentStats(student.id);
  const costSheets = stampSetPriceSheets(stampSet);
  if (stats.availableSheets < costSheets) {
    showToast("使えるシートが足りません");
    return;
  }

  const previousOwnedStampIds = [...ownedStampIdsForStudent(student.id)];
  const previousGoal = clearRewardGoalIfMatches(student.id, "stamp-set", stampSet.id);
  const stampIds = members.map((stamp) => stamp.id);
  const redemption = {
    id: crypto.randomUUID(),
    studentId: student.id,
    rewardId: `stamp-set:${stampSet.id}`,
    type: "stamp-set-purchase",
    stampSetId: stampSet.id,
    stampIds,
    sheetCost: costSheets,
    createdAt: new Date().toISOString(),
    memo: `${stampSet.name} スタンプセット（${members.length}こ）`,
  };
  state.ownedStampIdsByStudent[student.id] = [...new Set([...previousOwnedStampIds, ...stampIds])];
  state.redemptions.push(redemption);
  if (!persist()) {
    state.ownedStampIdsByStudent[student.id] = previousOwnedStampIds;
    state.redemptions = state.redemptions.filter((item) => item.id !== redemption.id);
    if (previousGoal) {
      state.rewardGoalsByStudent[student.id] = previousGoal;
    }
    return;
  }
  render();
  const nextStampSet = nextStampSetInSeries(stampSet);
  showToast(nextStampSet
    ? `${stampSet.name}を購入！ ${nextStampSet.name}が かいほうされたよ！`
    : `${stampSet.name}を購入しました`);
  showHounyanAnimation("stamps-purchased", {
    studentName: student.name,
    stampSet,
    stamps: members,
  });
}

function cancelRedemption(redemptionId) {
  const redemption = state.redemptions.find((item) => item.id === redemptionId);
  if (!redemption || redemption.canceled) {
    return;
  }

  redemption.canceled = true;
  redemption.canceledAt = new Date().toISOString();
  const purchasedStampIds = redemption.type === "stamp-purchase" && redemption.stampId
    ? [redemption.stampId]
    : redemption.type === "stamp-set-purchase" && Array.isArray(redemption.stampIds)
      ? redemption.stampIds
      : [];
  if (purchasedStampIds.length) {
    purchasedStampIds.forEach((stampId) => {
      const stillOwned = state.redemptions.some((item) =>
        item.id !== redemption.id &&
        item.studentId === redemption.studentId &&
        !item.canceled &&
        (
          (item.type === "stamp-purchase" && item.stampId === stampId) ||
          (item.type === "stamp-set-purchase" && Array.isArray(item.stampIds) && item.stampIds.includes(stampId))
        )
      );
      if (!stillOwned) {
        state.ownedStampIdsByStudent[redemption.studentId] = ownedStampIdsForStudent(redemption.studentId)
          .filter((ownedStampId) => ownedStampId !== stampId);
      }
    });
  }
  persist();
  render();
  showToast("交換を取り消しました。シートを戻しました");
}

function editSelectedStudent() {
  const student = selectedStudent();
  if (!student) {
    return;
  }

  els.studentId.value = student.id;
  els.studentName.value = student.name;
  els.studentNote.value = student.note || "";
  els.studentGroup.value = student.groupId || "";
  els.studentTestMode.checked = isTestStudent(student);
  showView("teacher");
  els.studentName.focus();
}

function deleteSelectedStudent() {
  const student = selectedStudent();
  if (!student) {
    return;
  }

  const ok = confirm(`${student.name}の児童データと履歴を削除します。よろしいですか？`);
  if (!ok) {
    return;
  }

  createAutoBackup("before-delete", { force: true });
  state.students = state.students.filter((item) => item.id !== student.id);
  state.stampEvents = state.stampEvents.filter((event) => event.studentId !== student.id);
  state.studentMissionSettings = state.studentMissionSettings.filter((setting) => setting.studentId !== student.id);
  state.dailyMissions = state.dailyMissions.filter((mission) => mission.studentId !== student.id);
  state.redemptions = state.redemptions.filter((redemption) => redemption.studentId !== student.id);
  delete state.ownedStampIdsByStudent[student.id];
  delete state.rewardGoalsByStudent[student.id];
  delete state.equippedHounyanLevelByStudent[student.id];
  state.selectedStudentId = state.students[0]?.id || "";
  clearStudentForm();
  persist();
  render();
  showToast("児童データを削除しました");
}

function readAutoBackups() {
  try {
    const raw = localStorage.getItem(AUTO_BACKUP_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((backup) => backup && backup.id && backup.createdAt && backup.state)
      .slice(0, AUTO_BACKUP_LIMIT);
  } catch (error) {
    console.error(error);
    return [];
  }
}

function writeAutoBackups(backups) {
  localStorage.setItem(AUTO_BACKUP_STORAGE_KEY, JSON.stringify(backups.slice(0, AUTO_BACKUP_LIMIT)));
}

function createAutoBackup(reason = "auto", options = {}) {
  if (stateLoadFailed) {
    return false;
  }

  try {
    const rawState = JSON.stringify(state);
    const backups = readAutoBackups();
    const now = new Date();
    const newest = backups[0];
    if (newest && JSON.stringify(newest.state) === rawState) {
      return true;
    }

    const createdAt = now.toISOString();
    const snapshot = {
      id: crypto.randomUUID(),
      createdAt,
      reason,
      summary: backupSummary(state),
      state: JSON.parse(rawState),
    };

    if (!options.force && newest) {
      const newestTime = new Date(newest.createdAt).getTime();
      if (Number.isFinite(newestTime) && now.getTime() - newestTime < AUTO_BACKUP_BUCKET_MS) {
        backups[0] = {
          ...snapshot,
          id: newest.id,
        };
        writeAutoBackups(backups);
        return true;
      }
    }

    backups.unshift(snapshot);
    writeAutoBackups(backups);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

function backupSummary(sourceState) {
  return {
    students: Array.isArray(sourceState.students) ? sourceState.students.length : 0,
    stamps: Array.isArray(sourceState.stampEvents) ? sourceState.stampEvents.length : 0,
    redemptions: Array.isArray(sourceState.redemptions) ? sourceState.redemptions.length : 0,
  };
}

function renderAutoBackups() {
  const backups = readAutoBackups();
  if (!backups.length) {
    els.autoBackupStatus.textContent = "まだ自動バックアップはありません。データを保存すると自動で作成されます。";
    els.autoBackupList.innerHTML = '<p class="empty-state">バックアップはまだありません。</p>';
    return;
  }

  els.autoBackupStatus.textContent = `最新: ${formatDateTime(backups[0].createdAt)} / ${backups.length}件保存中`;
  els.autoBackupList.innerHTML = backups
    .map((backup) => {
      const summary = backup.summary || backupSummary(backup.state || {});
      return `
        <article class="auto-backup-card">
          <div>
            <strong>${escapeHtml(formatDateTime(backup.createdAt))}</strong>
            <span>${escapeHtml(summary.students)}人 / スタンプ${escapeHtml(summary.stamps)}個 / 交換${escapeHtml(summary.redemptions)}件</span>
          </div>
          <div class="auto-backup-actions">
            <button class="soft-button compact-button" type="button" data-download-backup="${backup.id}">JSON保存</button>
            <button class="danger-button compact-button" type="button" data-restore-backup="${backup.id}">復元</button>
          </div>
        </article>
      `;
    })
    .join("");

  els.autoBackupList.querySelectorAll("[data-download-backup]").forEach((button) => {
    button.addEventListener("click", () => downloadAutoBackup(button.dataset.downloadBackup));
  });
  els.autoBackupList.querySelectorAll("[data-restore-backup]").forEach((button) => {
    button.addEventListener("click", () => restoreAutoBackup(button.dataset.restoreBackup));
  });
}

function findAutoBackup(id) {
  return readAutoBackups().find((backup) => backup.id === id) || null;
}

function downloadAutoBackup(id) {
  const backup = findAutoBackup(id);
  if (!backup) {
    showToast("バックアップが見つかりません");
    return;
  }
  downloadJson(backup.state, `hounyan-stamps-backup-${backup.createdAt.slice(0, 10)}.json`);
  showToast("バックアップを書き出しました");
}

function restoreAutoBackup(id) {
  const backup = findAutoBackup(id);
  if (!backup) {
    showToast("バックアップが見つかりません");
    return;
  }

  const ok = confirm(`${formatDateTime(backup.createdAt)}の自動バックアップに戻します。現在の状態も復元前バックアップとして残します。`);
  if (!ok) {
    return;
  }

  createAutoBackup("before-restore", { force: true });
  state = normalizeState(backup.state);
  stateLoadFailed = false;
  ensureSelection();
  persist();
  render();
  showToast("自動バックアップから復元しました");
}

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function exportData() {
  downloadJson(state, `hounyan-stamps-${new Date().toISOString().slice(0, 10)}.json`);
  showToast("JSONを書き出しました");
}

function importData(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const imported = JSON.parse(String(reader.result));
      createAutoBackup("before-import", { force: true });
      state = normalizeState(imported);
      stateLoadFailed = false;
      ensureSelection();
      persist();
      render();
      showToast("JSONを読み込みました");
    } catch {
      showToast("JSONを読み込めませんでした");
    } finally {
      els.importInput.value = "";
    }
  });
  reader.readAsText(file);
}

function showHounyanAnimation(type, options = {}) {
  hounyanAnimationQueue.push({ type, options });
  playNextHounyanAnimation();
}

function playNextHounyanAnimation() {
  if (hounyanAnimationActive || !hounyanAnimationQueue.length) {
    return;
  }

  hounyanAnimationActive = true;
  const { type, options } = hounyanAnimationQueue.shift();
  const outfit = activeOutfit();
  const animation = animationContent(type, options);
  els.animationCard.dataset.animationType = type;
  els.animationHounyan.src = animation.hounyanSrc || outfitAsset(outfit, animation.pose);
  els.animationHounyan.alt = animation.hounyanAlt || outfit.name;
  if (animation.featureImage) {
    els.animationFeatureImage.src = animation.featureImage.src;
    els.animationFeatureImage.alt = animation.featureImage.alt;
    els.animationFeatureImage.hidden = false;
  } else {
    els.animationFeatureImage.hidden = true;
    els.animationFeatureImage.removeAttribute("src");
    els.animationFeatureImage.alt = "";
  }
  if (animation.stamps?.length) {
    els.animationStampGallery.dataset.count = String(animation.stamps.length);
    els.animationStampGallery.innerHTML = animation.stamps.map((stamp) => `
      <figure>
        <img src="${escapeHtml(stamp.src)}" alt="${escapeHtml(stamp.name)}スタンプ">
        <figcaption>${escapeHtml(stamp.name)}</figcaption>
      </figure>
    `).join("");
    els.animationStampGallery.hidden = false;
  } else {
    els.animationStampGallery.hidden = true;
    els.animationStampGallery.removeAttribute("data-count");
    els.animationStampGallery.innerHTML = "";
  }
  if (animation.milestone) {
    els.animationMilestoneValue.textContent = animation.milestone.value;
    els.animationMilestoneLabel.textContent = animation.milestone.label;
    els.animationMilestone.hidden = false;
  } else {
    els.animationMilestone.hidden = true;
    els.animationMilestoneValue.textContent = "";
    els.animationMilestoneLabel.textContent = "";
  }
  els.animationEyebrow.textContent = animation.eyebrow;
  els.animationTitle.textContent = animation.title;
  els.animationMessage.textContent = animation.message;
  els.hounyanAnimationLayer.hidden = false;
  els.hounyanAnimationLayer.classList.remove("is-showing");
  requestAnimationFrame(() => {
    els.hounyanAnimationLayer.classList.add("is-showing");
    els.animationCloseButton.focus();
  });
}

function hideHounyanAnimation() {
  els.hounyanAnimationLayer.classList.remove("is-showing");
  window.setTimeout(() => {
    els.hounyanAnimationLayer.hidden = true;
    hounyanAnimationActive = false;
    playNextHounyanAnimation();
  }, 180);
}

function animationContent(type, options) {
  if (type === "stamps-purchased") {
    const stamps = Array.isArray(options.stamps) ? options.stamps : [];
    const setName = options.stampSet?.name;
    const firstStamp = stamps[0];
    return {
      pose: "shop",
      eyebrow: options.studentName ? `${options.studentName}のおかいもの` : "おかいもの",
      title: "スタンプが つかえるよ！",
      message: setName
        ? `「${setName}」を こうにゅうしたよ。つぎにスタンプをおすとき、えらべるよ！`
        : `${firstStamp?.name || "あたらしい"}スタンプを こうにゅうしたよ。つぎのプリントで つかってみよう！`,
      stamps,
    };
  }

  if (type === "stamp-unlocked") {
    const stamp = options.stamp || activeStampAssets()[0];
    return {
      pose: "stampUnlock",
      eyebrow: options.studentName ? `${options.studentName}の新スタンプ` : "新スタンプ",
      title: "スタンプ解放！",
      message: `${stamp.name}がつかえるようになったよ。次のプリントでためしてみよう！`,
      featureImage: {
        src: stamp.src,
        alt: `${stamp.name}スタンプ`,
      },
    };
  }

  if (type === "sheet-completed") {
    return {
      pose: "sheetComplete",
      eyebrow: options.studentName ? `${options.studentName}のシート` : "シート",
      title: "シート完成！",
      message: `${options.sheetNumber || 1}まいめのシートがいっぱいになったよ。ほうにゃんもおいわいしてるよ！`,
      milestone: {
        value: `${SHEET_SIZE}こ`,
        label: `${options.sheetNumber || 1}まいめ かんせい`,
      },
    };
  }

  if (type === "level-up") {
    const levelRule = options.levelRule || defaultLevelRules[0];
    return {
      pose: "happy",
      hounyanSrc: levelRule.image,
      hounyanAlt: `${levelRule.name}のほうにゃん`,
      eyebrow: options.studentName ? `${options.studentName}のほうにゃん` : "ほうにゃん",
      title: `Lv.${levelRule.level}になったよ！`,
      message: `${levelRule.name}にへんしん！あたらしいほうにゃんで、つぎもがんばろう。`,
      milestone: {
        value: `Lv.${levelRule.level}`,
        label: "レベルアップ！",
      },
    };
  }

  return {
    pose: "happy",
    eyebrow: "ほうにゃん",
    title: "やったね！",
    message: "がんばりがふえたよ。",
  };
}

function activeOutfit() {
  const outfitId = state.settings?.activeOutfit || "default";
  return hounyanOutfits[outfitId] || hounyanOutfits.default;
}

function outfitAsset(outfit, pose) {
  return outfit[pose] || outfit.happy || outfit.idle || hounyanOutfits.default.idle;
}

function stampsUnlockedBetween(beforeTotal, afterTotal) {
  return visibleStampAssets().filter((stamp) => !stamp.purchaseOnly && stamp.unlockAt > 0 && beforeTotal < stamp.unlockAt && afterTotal >= stamp.unlockAt);
}

function levelsUnlockedBetween(beforeTotal, afterTotal) {
  const beforeSheets = Math.floor(beforeTotal / SHEET_SIZE);
  const afterSheets = Math.floor(afterTotal / SHEET_SIZE);
  if (afterSheets <= beforeSheets) {
    return [];
  }
  return activeLevelRules()
    .filter((rule) => rule.level > 1 && beforeSheets < rule.requiredSheets && afterSheets >= rule.requiredSheets)
    .sort((a, b) => a.level - b.level);
}

function sheetsCompletedBetween(beforeTotal, afterTotal) {
  const completed = [];
  const firstSheet = Math.floor(beforeTotal / SHEET_SIZE) + 1;
  const lastSheet = Math.floor(afterTotal / SHEET_SIZE);
  for (let sheetNumber = firstSheet; sheetNumber <= lastSheet; sheetNumber += 1) {
    const completeAt = sheetNumber * SHEET_SIZE;
    if (beforeTotal < completeAt && afterTotal >= completeAt) {
      completed.push(sheetNumber);
    }
  }
  return completed;
}

function selectedStudent() {
  return state.students.find((student) => student.id === state.selectedStudentId) || null;
}

function selectStudent(studentId) {
  if (!state.students.some((student) => student.id === studentId)) {
    return;
  }

  state.selectedStudentId = studentId;
  persist();
  render();
}

function ensureSelection() {
  if (!state.selectedStudentId && state.students[0]) {
    state.selectedStudentId = state.students[0].id;
  }
  if (state.selectedStudentId && !state.students.some((student) => student.id === state.selectedStudentId)) {
    state.selectedStudentId = state.students[0]?.id || "";
  }
  if (!state.selectedStampId) {
    state.selectedStampId = "sonochoshi";
  }
  persist();
}

function studentStats(studentId) {
  const student = state.students.find((item) => item.id === studentId) || null;
  const activeEvents = state.stampEvents
    .filter((event) => event.studentId === studentId && !event.canceled)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const total = activeEvents.length;
  const completedSheets = Math.floor(total / SHEET_SIZE);
  const spentSheets = state.redemptions
    .filter((redemption) => redemption.studentId === studentId && !redemption.canceled)
    .reduce((sum, redemption) => sum + redemptionSheetCost(redemption), 0);
  const currentSheet = currentSheetInfo(activeEvents);

  return {
    total,
    completedSheets,
    spentSheets,
    availableSheets: isTestStudent(student) ? TEST_AVAILABLE_SHEETS : Math.max(0, completedSheets - spentSheets),
    currentSheet,
  };
}

function isTestStudent(studentOrId) {
  const student = typeof studentOrId === "string"
    ? state.students.find((item) => item.id === studentOrId)
    : studentOrId;
  return Boolean(student?.isTest);
}

function testSheetBalanceText(student, stats) {
  return isTestStudent(student) ? "∞" : stats.availableSheets;
}

function currentSheetInfo(activeEvents) {
  const total = activeEvents.length;
  const number = total === 0 ? 1 : Math.floor((total - 1) / SHEET_SIZE) + 1;
  const start = (number - 1) * SHEET_SIZE;
  const events = activeEvents.slice(start, start + SHEET_SIZE);
  const count = events.length;

  return {
    number,
    events,
    count,
    remaining: SHEET_SIZE - count,
  };
}

function emptyStats() {
  return {
    total: 0,
    completedSheets: 0,
    spentSheets: 0,
    availableSheets: 0,
    currentSheet: {
      number: 1,
      events: [],
      count: 0,
      remaining: SHEET_SIZE,
    },
  };
}

function redemptionSheetCost(redemption) {
  if (Number.isFinite(Number(redemption.sheetCost))) {
    return Number(redemption.sheetCost);
  }
  return stampsToSheets(redemption.cost);
}

function stampsToSheets(value) {
  const stamps = Number(value || 0);
  if (!stamps) {
    return 0;
  }
  return Math.max(1, Math.ceil(stamps / SHEET_SIZE));
}

function mascotLevel(statsOrTotal) {
  const totalStamps = typeof statsOrTotal === "object"
    ? Number(statsOrTotal.total || 0)
    : Number(statsOrTotal || 0);
  const completedSheets = typeof statsOrTotal === "object"
    ? Number(statsOrTotal.completedSheets || 0)
    : Math.floor(totalStamps / SHEET_SIZE);
  const rules = activeLevelRules();
  const currentRule = rules
    .filter((rule) => rule.requiredSheets <= completedSheets)
    .at(-1) || rules[0];
  const nextRule = rules.find((rule) => rule.requiredSheets > completedSheets) || null;
  const currentAtStamps = currentRule.requiredSheets * SHEET_SIZE;
  const nextAtStamps = nextRule ? nextRule.requiredSheets * SHEET_SIZE : currentAtStamps;
  const progressNeeded = nextRule ? Math.max(1, nextAtStamps - currentAtStamps) : 0;
  const progressCurrent = nextRule ? Math.max(0, Math.min(progressNeeded, totalStamps - currentAtStamps)) : 0;
  return {
    current: currentRule.level,
    currentRule,
    nextRule,
    remainingSheets: nextRule ? Math.max(0, nextRule.requiredSheets - completedSheets) : 0,
    remainingStamps: nextRule ? Math.max(0, nextAtStamps - totalStamps) : 0,
    progressCurrent,
    progressNeeded,
    progressPercent: nextRule ? Math.round((progressCurrent / progressNeeded) * 100) : 100,
  };
}

function studentMascotLevel(student, stats) {
  if (!isTestStudent(student)) {
    return mascotLevel(stats);
  }
  const currentRule = activeLevelRules().at(-1) || defaultLevelRules[0];
  return {
    current: currentRule.level,
    currentRule,
    nextRule: null,
    remainingSheets: 0,
    remainingStamps: 0,
    progressCurrent: 0,
    progressNeeded: 0,
    progressPercent: 100,
  };
}

function stampById(stampId) {
  return activeStampAssets().find((stamp) => stamp.id === stampId) || activeStampAssets()[0];
}

function eventsForToday() {
  const today = new Date().toDateString();
  return state.stampEvents.filter((event) => new Date(event.createdAt).toDateString() === today);
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove("is-visible"), 2200);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
