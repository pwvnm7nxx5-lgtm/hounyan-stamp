const STORAGE_KEY = "hounyan-stamp-ledger-v1";
const BACKUP_STORAGE_KEY = `${STORAGE_KEY}-broken-backup`;
const SHEET_SIZE = 20;
const STAMP_BATCH_MAX = SHEET_SIZE;
const TIMER_DEFAULT_SECONDS = 5 * 60;
const TIMER_MAX_SECONDS = 99 * 60 + 59;
const TIMER_FINISH_SOUNDS = {
  study: "assets/timer-sounds/study-finish.mp3",
  play: "assets/timer-sounds/play-finish.mp3",
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

const defaultState = {
  students: [],
  stampEvents: [],
  rewards: defaultRewards,
  stampAssets: defaultStampAssets,
  redemptions: [],
  settings: {
    activeOutfit: "default",
  },
  ownedOutfits: ["default"],
  ownedStampIdsByStudent: {},
  selectedStudentId: "",
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

const els = {
  viewButtons: document.querySelectorAll("[data-view-button]"),
  views: document.querySelectorAll("[data-view]"),
  timerPage: document.querySelector('[data-view="timer"]'),
  currentStudentLabel: document.querySelector("#currentStudentLabel"),
  studentSwitchList: document.querySelector("#studentSwitchList"),
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
  childNextUnlock: document.querySelector("#childNextUnlock"),
  childSheetTitle: document.querySelector("#childSheetTitle"),
  childSheetProgress: document.querySelector("#childSheetProgress"),
  childSheetGrid: document.querySelector("#childSheetGrid"),
  childAddStampButton: document.querySelector("#childAddStampButton"),
  teacherStudentList: document.querySelector("#teacherStudentList"),
  teacherStudentDetail: document.querySelector("#teacherStudentDetail"),
  selectedStudentName: document.querySelector("#selectedStudentName"),
  selectedTotal: document.querySelector("#selectedTotal"),
  selectedAvailable: document.querySelector("#selectedAvailable"),
  selectedLevel: document.querySelector("#selectedLevel"),
  nextLevelText: document.querySelector("#nextLevelText"),
  shopStudentSelect: document.querySelector("#shopStudentSelect"),
  shopSelectedName: document.querySelector("#shopSelectedName"),
  shopAvailableSheets: document.querySelector("#shopAvailableSheets"),
  shopCompletedSheets: document.querySelector("#shopCompletedSheets"),
  teacherSheetTitle: document.querySelector("#teacherSheetTitle"),
  teacherSheetProgress: document.querySelector("#teacherSheetProgress"),
  teacherSheetGrid: document.querySelector("#teacherSheetGrid"),
  stampMemo: document.querySelector("#stampMemo"),
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
  studentForm: document.querySelector("#studentForm"),
  studentId: document.querySelector("#studentId"),
  studentName: document.querySelector("#studentName"),
  studentNote: document.querySelector("#studentNote"),
  exportButton: document.querySelector("#exportButton"),
  importInput: document.querySelector("#importInput"),
  redemptionList: document.querySelector("#redemptionList"),
  stampAssetForm: document.querySelector("#stampAssetForm"),
  stampAssetId: document.querySelector("#stampAssetId"),
  stampAssetName: document.querySelector("#stampAssetName"),
  stampAssetUnlockMode: document.querySelector("#stampAssetUnlockMode"),
  stampAssetUnlockAt: document.querySelector("#stampAssetUnlockAt"),
  stampAssetShopPriceSheets: document.querySelector("#stampAssetShopPriceSheets"),
  stampAssetImage: document.querySelector("#stampAssetImage"),
  clearStampAssetForm: document.querySelector("#clearStampAssetForm"),
  stampAssetsList: document.querySelector("#stampAssetsList"),
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
  stampPreviewList: document.querySelector("#stampPreviewList"),
  stampPreviewTotal: document.querySelector("#stampPreviewTotal"),
  stampPreviewCancelButton: document.querySelector("#stampPreviewCancelButton"),
  stampPreviewConfirmButton: document.querySelector("#stampPreviewConfirmButton"),
  exchangeConfirmLayer: document.querySelector("#exchangeConfirmLayer"),
  exchangeConfirmTitle: document.querySelector("#exchangeConfirmTitle"),
  exchangeConfirmMessage: document.querySelector("#exchangeConfirmMessage"),
  exchangeCancelButton: document.querySelector("#exchangeCancelButton"),
  exchangeConfirmButton: document.querySelector("#exchangeConfirmButton"),
  hounyanAnimationLayer: document.querySelector("#hounyanAnimationLayer"),
  animationHounyan: document.querySelector("#animationHounyan"),
  animationFeatureImage: document.querySelector("#animationFeatureImage"),
  animationEyebrow: document.querySelector("#animationEyebrow"),
  animationTitle: document.querySelector("#animationTitle"),
  animationMessage: document.querySelector("#animationMessage"),
  animationCloseButton: document.querySelector("#animationCloseButton"),
  toast: document.querySelector("#toast"),
};

init();

function init() {
  bindEvents();
  updateStampAssetModeFields();
  ensureSelection();
  renderTimer();
  render();
}

function bindEvents() {
  els.viewButtons.forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.viewButton));
  });

  els.studentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveStudent();
  });
  els.stampAssetForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveStampAsset();
  });
  els.stampAssetUnlockMode.addEventListener("change", updateStampAssetModeFields);
  els.clearStampAssetForm.addEventListener("click", clearStampAssetForm);
  els.prizeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    savePrize();
  });
  els.clearPrizeForm.addEventListener("click", clearPrizeForm);

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
  els.exchangeCancelButton.addEventListener("click", closeExchangeConfirm);
  els.exchangeConfirmButton.addEventListener("click", confirmExchange);
  els.exchangeConfirmLayer.addEventListener("click", (event) => {
    if (event.target === els.exchangeConfirmLayer) {
      closeExchangeConfirm();
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

  merged.students = Array.isArray(input.students) ? input.students : [];
  merged.stampEvents = Array.isArray(input.stampEvents) ? input.stampEvents : [];
  merged.redemptions = Array.isArray(input.redemptions)
    ? input.redemptions.filter((redemption) => !REMOVED_PURCHASABLE_STAMP_IDS.has(redemption.stampId))
    : [];
  merged.rewards = normalizeRewards(input.rewards);
  merged.stampAssets = normalizeStampAssets(input.stampAssets || input.stamps || input.stampSettings);
  merged.settings = {
    ...defaultState.settings,
    ...(input.settings || {}),
  };
  merged.ownedOutfits = Array.isArray(input.ownedOutfits) && input.ownedOutfits.length
    ? input.ownedOutfits
    : [...defaultState.ownedOutfits];
  merged.ownedStampIdsByStudent = normalizeOwnedStampIdsByStudent(input.ownedStampIdsByStudent);
  return merged;
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
      const name = String(stamp.name || base.name || "新しいスタンプ").trim();
      byId.set(stamp.id, {
        ...base,
        ...stamp,
        id: String(stamp.id),
        name,
        reading: String(stamp.reading || stamp.name || base.reading || name).trim(),
        src: String(stamp.src || base.src || defaultStampAssets[0].src),
        unlockAt: Math.max(0, Math.floor(Number(stamp.unlockAt ?? base.unlockAt ?? 0))),
        custom: Boolean(stamp.custom || !base.id),
        purchaseOnly: Boolean(stamp.purchaseOnly ?? base.purchaseOnly ?? false),
        shopPriceSheets: Math.max(1, Math.floor(Number(stamp.shopPriceSheets ?? base.shopPriceSheets ?? 1))),
        rarity: String(stamp.rarity || base.rarity || "normal"),
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

function activeStampAssets() {
  if (!Array.isArray(state.stampAssets) || !state.stampAssets.length) {
    state.stampAssets = normalizeStampAssets();
  }
  return state.stampAssets;
}

function persist() {
  if (stateLoadFailed) {
    showToast("保存データの読み込みに失敗しました。上書きを止めています");
    return false;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error(error);
    showToast("保存容量がいっぱいです。画像を小さくしてもう一度試してください");
    return false;
  }
}

function render() {
  renderTopStats();
  renderStudentSwitch();
  renderStudentLists();
  renderStudentDetails();
  renderRewards();
  renderRedemptions();
  renderStampAssets();
  els.viewButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewButton === activeView());
  });
}

function renderStudentSwitch() {
  const student = selectedStudent();
  els.currentStudentLabel.textContent = student ? `選択中：${student.name}` : "選択中：児童未選択";

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
        <button class="student-tab-button${selected}" type="button" role="tab" aria-selected="${selectedText}" data-switch-student="${studentItem.id}">
          <strong>${escapeHtml(studentItem.name)}</strong>
          <span>${stats.currentSheet.count}/${SHEET_SIZE}</span>
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
  els.totalStudents.textContent = state.students.length;
  els.todayStamps.textContent = eventsForToday().filter((event) => !event.canceled).length;
  els.allStamps.textContent = state.students.reduce((sum, student) => sum + studentStats(student.id).total, 0);
}

function renderStudentLists() {
  renderStudentList(els.childStudentList, { childMode: true });
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
      const sheetText = childMode
        ? `シート ${stats.currentSheet.count}/${SHEET_SIZE}`
        : `累計 ${stats.total} / 使えるシート ${stats.availableSheets}`;
      return `
        <button class="student-card${selected}" type="button" data-select-student="${student.id}">
          <span>
            <span class="student-name">${escapeHtml(student.name)}</span>
            <span class="student-meta">${escapeHtml(student.note || (childMode ? "がんばり中" : "メモなし"))}</span>
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
    return;
  }

  const stats = studentStats(student.id);
  const level = mascotLevel(stats.total);

  els.childSelectedName.textContent = student.name;
  els.childTotal.textContent = stats.total;
  els.childAvailableSheets.textContent = stats.availableSheets;
  els.childCurrentSheetCount.textContent = `${stats.currentSheet.count}/${SHEET_SIZE}`;
  els.childRemainingText.textContent = `${stats.currentSheet.remaining}こ`;
  renderChildNextUnlock(stats.total);
  renderSheet({
    grid: els.childSheetGrid,
    title: els.childSheetTitle,
    progress: els.childSheetProgress,
    stats,
    childMode: true,
  });

  els.selectedStudentName.textContent = student.name;
  els.selectedTotal.textContent = stats.total;
  els.selectedAvailable.textContent = stats.availableSheets;
  els.selectedLevel.textContent = level.current;
  els.nextLevelText.textContent = level.remaining === 0 ? "最大" : `あと${level.remaining}`;
  renderSheet({
    grid: els.teacherSheetGrid,
    title: els.teacherSheetTitle,
    progress: els.teacherSheetProgress,
    stats,
    childMode: false,
  });
  renderHistory(student.id);
}

function renderChildNextUnlock(total) {
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

function nextUnlockStamp(total) {
  return activeStampAssets()
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
  const unlockRewards = activeStampAssets().filter((stamp) => stamp.unlockAt > 0);
  const shopRewards = state.rewards.filter((reward) => reward.enabled && reward.type === "shop");
  renderShopSummary(student, stats);
  els.unlockRewards.innerHTML = unlockRewards.length
    ? unlockRewards.map((stamp) => unlockStampCard(stamp, stats)).join("")
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
  els.shopAvailableSheets.textContent = stats.availableSheets;
  els.shopCompletedSheets.textContent = stats.completedSheets;
}

function unlockStampCard(stamp, stats) {
  const value = stats.total;
  const done = value >= stamp.unlockAt;
  const percent = stamp.unlockAt > 0 ? Math.min(100, Math.round((value / stamp.unlockAt) * 100)) : 100;
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

function renderStampAssets() {
  els.stampAssetsList.innerHTML = activeStampAssets()
    .map((stamp) => {
      const text = stamp.purchaseOnly
        ? `買い物で購入（${stampPriceSheets(stamp)}シート）`
        : stamp.unlockAt === 0
          ? "最初から使用可"
          : `累計${stamp.unlockAt}個で解放`;
      return `
        <article class="asset-card">
          <img src="${stamp.src}" alt="${escapeHtml(stamp.name)}">
          <div>
            <strong>${escapeHtml(stamp.name)}</strong>
            <p>${text}</p>
          </div>
          <button class="soft-button compact-button" type="button" data-edit-stamp="${stamp.id}">編集</button>
        </article>
      `;
    })
    .join("");

  els.stampAssetsList.querySelectorAll("[data-edit-stamp]").forEach((button) => {
    button.addEventListener("click", () => editStampAsset(button.dataset.editStamp));
  });
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
  els.stampAssetImage.value = "";
  updateStampAssetModeFields();
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
  };

  const previousStampAssets = state.stampAssets;
  const nextStampAssets = normalizeStampAssets([
    ...activeStampAssets().filter((stamp) => stamp.id !== nextStamp.id),
    nextStamp,
  ]);
  state.stampAssets = nextStampAssets;
  if (!activeStampAssets().some((stamp) => stamp.id === state.selectedStampId)) {
    state.selectedStampId = activeStampAssets()[0]?.id || "sonochoshi";
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
  const stamps = activeStampAssets().filter((stamp) => stamp.purchaseOnly);
  if (!stamps.length) {
    els.shopStampRewards.innerHTML = '<p class="empty-state">買えるスタンプはまだありません。</p>';
    return;
  }

  els.shopStampRewards.innerHTML = stamps
    .map((stamp) => stampShopCard(stamp, stats, student))
    .join("");
}

function stampShopCard(stamp, stats, student) {
  const owned = student ? studentOwnsStamp(student.id, stamp.id) : false;
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
      <button class="primary-button" type="button" data-buy-stamp="${stamp.id}" ${!canBuy ? "disabled" : ""}>${label}</button>
    </article>
  `;
}

function imageFileToStampDataUrl(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.addEventListener("load", () => {
      const maxSize = 360;
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
      resolve(canvas.toDataURL("image/webp", 0.82));
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

function showView(viewName) {
  els.views.forEach((view) => {
    view.classList.toggle("is-active", view.dataset.view === viewName);
  });
  els.viewButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewButton === viewName);
  });
}

function activeView() {
  return document.querySelector(".view.is-active")?.dataset.view || "child";
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
  els.timerPage.dataset.timerMode = timerMode;
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
    ? "ほうにゃんとがんばる"
    : isFinished
      ? "おしまい！"
      : "じかんをきめる";
  els.timerCheerText.textContent = timerIsRunning
    ? progress <= 0.2
      ? "あとすこし！ほうにゃんが見てるよ"
      : "そのちょうし！いっしょにがんばろう"
    : isFinished
      ? "よくがんばったね。ひとやすみしよう"
      : "ほうにゃんもいっしょに見てるよ";
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
  if (!name) {
    showToast("名前を入力してください");
    return;
  }

  if (els.studentId.value) {
    const student = state.students.find((item) => item.id === els.studentId.value);
    if (student) {
      student.name = name;
      student.note = note;
    }
  } else {
    const student = {
      id: crypto.randomUUID(),
      name,
      note,
      createdAt: new Date().toISOString(),
    };
    state.students.push(student);
    state.selectedStudentId = student.id;
  }

  clearStudentForm();
  persist();
  render();
  showToast("児童を保存しました。上の切り替えに反映しました");
}

function clearStudentForm() {
  els.studentId.value = "";
  els.studentName.value = "";
  els.studentNote.value = "";
}

function openTeacherStampPreview() {
  const student = selectedStudent();
  if (!student) {
    showToast("先に児童を登録してください");
    return;
  }

  openStampPreview({
    source: "teacher",
    studentId: student.id,
    memo: els.stampMemo.value.trim(),
    plannedCount: 0,
  });
}

function openStampCountChoice({ source }) {
  const student = selectedStudent();
  if (!student) {
    showToast(source === "child" ? "先生に名前を登録してもらってね" : "先に児童を登録してください");
    return;
  }

  const stats = studentStats(student.id);
  const stamps = activeStampAssets();
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
  const stamps = activeStampAssets();
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

  els.stampPreviewList.innerHTML = activeStampAssets()
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
  }, 160);
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
      });
    }
  });

  const nextTotal = stats.total + totalAdded;
  const completedSheets = sheetsCompletedBetween(stats.total, nextTotal);
  const unlockedStamps = stampsUnlockedBetween(stats.total, nextTotal);
  const dominantStamp = dominantStampFromSelections(selections);
  state.stampEvents.push(...events);
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

  clearTimeout(stampAnimationTimer);
  stampAnimationTimer = window.setTimeout(() => {
    lastStampedEventIds.clear();
    renderStudentDetails();
  }, 900);
}

function stampPreviewSelections() {
  return activeStampAssets()
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
  }, null)?.stamp || activeStampAssets()[0];
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
  redeemReward(action.id);
}

function openStampPurchaseConfirm(stampId) {
  const student = selectedStudent();
  const stamp = activeStampAssets().find((item) => item.id === stampId);
  if (!student || !stamp || !stamp.purchaseOnly || studentOwnsStamp(student.id, stamp.id)) {
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
  if (!student || !stamp || !stamp.purchaseOnly || studentOwnsStamp(student.id, stamp.id)) {
    return;
  }

  const stats = studentStats(student.id);
  const costSheets = stampPriceSheets(stamp);
  if (stats.availableSheets < costSheets) {
    showToast("使えるシートが足りません");
    return;
  }

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
    return;
  }
  render();
  showToast(`${stamp.name}スタンプを購入しました`);
}

function cancelRedemption(redemptionId) {
  const redemption = state.redemptions.find((item) => item.id === redemptionId);
  if (!redemption || redemption.canceled) {
    return;
  }

  redemption.canceled = true;
  redemption.canceledAt = new Date().toISOString();
  if (redemption.type === "stamp-purchase" && redemption.stampId) {
    const stillOwned = state.redemptions.some((item) =>
      item.id !== redemption.id &&
      item.studentId === redemption.studentId &&
      item.type === "stamp-purchase" &&
      item.stampId === redemption.stampId &&
      !item.canceled
    );
    if (!stillOwned) {
      state.ownedStampIdsByStudent[redemption.studentId] = ownedStampIdsForStudent(redemption.studentId)
        .filter((stampId) => stampId !== redemption.stampId);
    }
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

  state.students = state.students.filter((item) => item.id !== student.id);
  state.stampEvents = state.stampEvents.filter((event) => event.studentId !== student.id);
  state.redemptions = state.redemptions.filter((redemption) => redemption.studentId !== student.id);
  delete state.ownedStampIdsByStudent[student.id];
  state.selectedStudentId = state.students[0]?.id || "";
  clearStudentForm();
  persist();
  render();
  showToast("児童データを削除しました");
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `hounyan-stamps-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
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
  els.animationHounyan.src = outfitAsset(outfit, animation.pose);
  els.animationHounyan.alt = outfit.name;
  if (animation.featureImage) {
    els.animationFeatureImage.src = animation.featureImage.src;
    els.animationFeatureImage.alt = animation.featureImage.alt;
    els.animationFeatureImage.hidden = false;
  } else {
    els.animationFeatureImage.hidden = true;
    els.animationFeatureImage.removeAttribute("src");
    els.animationFeatureImage.alt = "";
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
  return activeStampAssets().filter((stamp) => !stamp.purchaseOnly && stamp.unlockAt > 0 && beforeTotal < stamp.unlockAt && afterTotal >= stamp.unlockAt);
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
    availableSheets: Math.max(0, completedSheets - spentSheets),
    currentSheet,
  };
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

function mascotLevel(total) {
  const current = Math.min(10, Math.floor(total / 5) + 1);
  const nextAt = current >= 10 ? total : current * 5;
  return {
    current,
    remaining: current >= 10 ? 0 : Math.max(0, nextAt - total),
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
