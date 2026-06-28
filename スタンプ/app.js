const STORAGE_KEY = "hounyan-stamp-ledger-v1";
const SHEET_SIZE = 20;

const stampAssets = [
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
    unlockAt: 10,
  },
  {
    id: "sasuga",
    name: "さすが",
    reading: "さすが",
    src: "assets/stamp-sasuga.png",
    unlockAt: 20,
  },
  {
    id: "ganbattane",
    name: "がんばったね",
    reading: "がんばったね",
    src: "assets/stamp-ganbattane.png",
    unlockAt: 30,
  },
];

const defaultRewards = [
  {
    id: "unlock-yokudekimashita",
    name: "よくできましたスタンプ",
    type: "unlock",
    costStamps: 10,
    description: "累計10個でピンクのスタンプが使えるようになります。",
    enabled: true,
  },
  {
    id: "unlock-sasuga",
    name: "さすがスタンプ",
    type: "unlock",
    costStamps: 20,
    description: "累計20個で青いスタンプが使えるようになります。",
    enabled: true,
  },
  {
    id: "unlock-ganbattane",
    name: "がんばったねスタンプ",
    type: "unlock",
    costStamps: 30,
    description: "累計30個で黄色のスタンプが使えるようになります。",
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
  redemptions: [],
  selectedStudentId: "",
  selectedStampId: "sonochoshi",
};

let state = loadState();
let lastStampedEventId = "";
let stampAnimationTimer = 0;

const els = {
  viewButtons: document.querySelectorAll("[data-view-button]"),
  views: document.querySelectorAll("[data-view]"),
  studentSwitchButton: document.querySelector("#studentSwitchButton"),
  currentStudentLabel: document.querySelector("#currentStudentLabel"),
  studentSwitchMenu: document.querySelector("#studentSwitchMenu"),
  closeSwitchButton: document.querySelector("#closeSwitchButton"),
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
  childSheetTitle: document.querySelector("#childSheetTitle"),
  childSheetProgress: document.querySelector("#childSheetProgress"),
  childSheetGrid: document.querySelector("#childSheetGrid"),
  childStampPicker: document.querySelector("#childStampPicker"),
  childAddStampButton: document.querySelector("#childAddStampButton"),
  teacherStudentList: document.querySelector("#teacherStudentList"),
  teacherStudentDetail: document.querySelector("#teacherStudentDetail"),
  selectedStudentName: document.querySelector("#selectedStudentName"),
  selectedTotal: document.querySelector("#selectedTotal"),
  selectedAvailable: document.querySelector("#selectedAvailable"),
  selectedLevel: document.querySelector("#selectedLevel"),
  nextLevelText: document.querySelector("#nextLevelText"),
  teacherSheetTitle: document.querySelector("#teacherSheetTitle"),
  teacherSheetProgress: document.querySelector("#teacherSheetProgress"),
  teacherSheetGrid: document.querySelector("#teacherSheetGrid"),
  teacherStampPicker: document.querySelector("#teacherStampPicker"),
  stampMemo: document.querySelector("#stampMemo"),
  addStampButton: document.querySelector("#addStampButton"),
  historyList: document.querySelector("#historyList"),
  editStudentButton: document.querySelector("#editStudentButton"),
  deleteStudentButton: document.querySelector("#deleteStudentButton"),
  rewardStudentSelect: document.querySelector("#rewardStudentSelect"),
  unlockRewards: document.querySelector("#unlockRewards"),
  shopRewards: document.querySelector("#shopRewards"),
  studentForm: document.querySelector("#studentForm"),
  studentId: document.querySelector("#studentId"),
  studentName: document.querySelector("#studentName"),
  studentNote: document.querySelector("#studentNote"),
  exportButton: document.querySelector("#exportButton"),
  importInput: document.querySelector("#importInput"),
  stampAssetsList: document.querySelector("#stampAssetsList"),
  toast: document.querySelector("#toast"),
};

init();

function init() {
  bindEvents();
  ensureSelection();
  render();
}

function bindEvents() {
  els.viewButtons.forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.viewButton));
  });

  els.studentSwitchButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleStudentSwitch();
  });
  els.closeSwitchButton.addEventListener("click", closeStudentSwitch);
  els.studentSwitchMenu.addEventListener("click", (event) => event.stopPropagation());
  document.addEventListener("click", closeStudentSwitch);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeStudentSwitch();
    }
  });

  els.studentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveStudent();
  });

  els.childAddStampButton.addEventListener("click", () => addStamp({ source: "child" }));
  els.addStampButton.addEventListener("click", () => addStamp({ source: "teacher" }));
  els.editStudentButton.addEventListener("click", editSelectedStudent);
  els.deleteStudentButton.addEventListener("click", deleteSelectedStudent);
  els.rewardStudentSelect.addEventListener("change", () => {
    state.selectedStudentId = els.rewardStudentSelect.value;
    persist();
    render();
  });
  els.exportButton.addEventListener("click", exportData);
  els.importInput.addEventListener("change", importData);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return structuredClone(defaultState);
    }
    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
  } catch {
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
  merged.redemptions = Array.isArray(input.redemptions) ? input.redemptions : [];
  merged.rewards = normalizeRewards(input.rewards);
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
      byId.set(reward.id, reward);
      return;
    }
    byId.set(reward.id, {
      ...base,
      ...reward,
      costStamps: base.costStamps ?? reward.costStamps ?? reward.cost,
      costSheets: base.costSheets ?? reward.costSheets ?? stampsToSheets(reward.cost),
      locked: base.locked ?? reward.locked ?? false,
      description: base.description,
    });
  });

  return Array.from(byId.values());
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  renderTopStats();
  renderStudentSwitch();
  renderStudentLists();
  renderStudentDetails();
  renderRewards();
  renderStampAssets();
  els.viewButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewButton === activeView());
  });
}

function renderStudentSwitch() {
  const student = selectedStudent();
  els.currentStudentLabel.textContent = student ? student.name : "児童未選択";

  if (!state.students.length) {
    els.studentSwitchList.innerHTML = '<p class="empty-state">先生ページで児童を追加してください。</p>';
    els.studentSwitchButton.disabled = true;
    closeStudentSwitch();
    return;
  }

  els.studentSwitchButton.disabled = false;
  els.studentSwitchList.innerHTML = state.students
    .map((studentItem) => {
      const stats = studentStats(studentItem.id);
      const selected = studentItem.id === state.selectedStudentId ? " is-selected" : "";
      return `
        <button class="switch-student${selected}" type="button" data-switch-student="${studentItem.id}">
          <span>
            <strong>${escapeHtml(studentItem.name)}</strong>
            <small>${escapeHtml(studentItem.note || "メモなし")}</small>
          </span>
          <small>${stats.currentSheet.count}/${SHEET_SIZE}</small>
        </button>
      `;
    })
    .join("");

  els.studentSwitchList.querySelectorAll("[data-switch-student]").forEach((button) => {
    button.addEventListener("click", () => {
      selectStudent(button.dataset.switchStudent, { closeSwitch: true });
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
  renderSheet({
    grid: els.childSheetGrid,
    title: els.childSheetTitle,
    progress: els.childSheetProgress,
    stats,
    childMode: true,
  });
  renderStampPicker(els.childStampPicker, stats.total, { childMode: true });

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
  renderStampPicker(els.teacherStampPicker, stats.total, { childMode: false });
  renderHistory(student.id);
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
    const isNew = event.id === lastStampedEventId ? " is-new" : "";
    return `
      <div class="stamp-slot is-filled${isNew}">
        <img src="${stamp.src}" alt="${escapeHtml(stamp.name)}">
      </div>
    `;
  }).join("");
}

function renderStampPicker(container, total, { childMode }) {
  container.innerHTML = stampAssets
    .map((stamp) => {
      const locked = total < stamp.unlockAt;
      const selected = state.selectedStampId === stamp.id;
      const label = locked ? `${stamp.unlockAt}個で解放` : stamp.name;
      const childLabel = locked ? `${stamp.unlockAt}こでつかえる` : stamp.reading;
      return `
        <button class="stamp-option${selected ? " is-selected" : ""}${locked ? " is-locked" : ""}"
          type="button"
          data-stamp="${stamp.id}"
          ${locked ? "disabled" : ""}
          title="${escapeHtml(label)}">
          <img src="${stamp.src}" alt="${escapeHtml(stamp.name)}">
          <span>${escapeHtml(childMode ? childLabel : label)}</span>
        </button>
      `;
    })
    .join("");

  container.querySelectorAll("[data-stamp]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedStampId = button.dataset.stamp;
      persist();
      renderStudentDetails();
    });
  });

  const selectedStamp = stampAssets.find((stamp) => stamp.id === state.selectedStampId);
  if (!selectedStamp || total < selectedStamp.unlockAt) {
    state.selectedStampId = "sonochoshi";
    persist();
    renderStampPicker(container, total, { childMode });
  }
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
    els.rewardStudentSelect.innerHTML = '<option value="">児童未登録</option>';
  } else {
    els.rewardStudentSelect.innerHTML = state.students
      .map((student) => `<option value="${student.id}">${escapeHtml(student.name)}</option>`)
      .join("");
    els.rewardStudentSelect.value = state.selectedStudentId || state.students[0].id;
  }

  const student = selectedStudent();
  const stats = student ? studentStats(student.id) : emptyStats();
  const unlockRewards = state.rewards.filter((reward) => reward.enabled && reward.type === "unlock");
  const shopRewards = state.rewards.filter((reward) => reward.enabled && reward.type === "shop");
  els.unlockRewards.innerHTML = unlockRewards.map((reward) => rewardCard(reward, stats, student)).join("");
  els.shopRewards.innerHTML = shopRewards.map((reward) => rewardCard(reward, stats, student)).join("");

  els.shopRewards.querySelectorAll("[data-redeem]").forEach((button) => {
    button.addEventListener("click", () => redeemReward(button.dataset.redeem));
  });
}

function rewardCard(reward, stats, student) {
  const isUnlock = reward.type === "unlock";
  const cost = isUnlock ? reward.costStamps : reward.costSheets;
  const value = isUnlock ? stats.total : stats.availableSheets;
  const done = value >= cost;
  const percent = cost > 0 ? Math.min(100, Math.round((value / cost) * 100)) : 100;
  const unit = isUnlock ? "個" : "シート";
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

function renderStampAssets() {
  els.stampAssetsList.innerHTML = stampAssets
    .map((stamp) => {
      const text = stamp.unlockAt === 0 ? "最初から使用可" : `累計${stamp.unlockAt}個で解放`;
      return `
        <article class="asset-card">
          <img src="${stamp.src}" alt="${escapeHtml(stamp.name)}">
          <div>
            <strong>${escapeHtml(stamp.name)}</strong>
            <p>${text}</p>
          </div>
        </article>
      `;
    })
    .join("");
}

function showView(viewName) {
  els.views.forEach((view) => {
    view.classList.toggle("is-active", view.dataset.view === viewName);
  });
  els.viewButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewButton === viewName);
  });
}

function toggleStudentSwitch() {
  const willOpen = els.studentSwitchMenu.hidden;
  els.studentSwitchMenu.hidden = !willOpen;
  els.studentSwitchButton.setAttribute("aria-expanded", String(willOpen));
}

function closeStudentSwitch() {
  els.studentSwitchMenu.hidden = true;
  els.studentSwitchButton.setAttribute("aria-expanded", "false");
}

function activeView() {
  return document.querySelector(".view.is-active")?.dataset.view || "child";
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

function addStamp({ source }) {
  const student = selectedStudent();
  if (!student) {
    showToast(source === "child" ? "先生に名前を登録してもらってね" : "先に児童を登録してください");
    return;
  }

  const stats = studentStats(student.id);
  const stamp = stampById(state.selectedStampId);
  if (stats.total < stamp.unlockAt) {
    showToast(source === "child" ? "このスタンプはまだつかえません" : "このスタンプはまだ解放されていません");
    return;
  }

  const event = {
    id: crypto.randomUUID(),
    studentId: student.id,
    stampId: stamp.id,
    memo: source === "teacher" ? els.stampMemo.value.trim() : "",
    createdAt: new Date().toISOString(),
    canceled: false,
  };
  state.stampEvents.push(event);
  lastStampedEventId = event.id;
  if (source === "teacher") {
    els.stampMemo.value = "";
  }
  persist();
  render();
  showToast(source === "child" ? "スタンプをおしたよ" : `${student.name}にスタンプを押しました`);

  clearTimeout(stampAnimationTimer);
  stampAnimationTimer = window.setTimeout(() => {
    if (lastStampedEventId === event.id) {
      lastStampedEventId = "";
      renderStudentDetails();
    }
  }, 900);
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

function selectedStudent() {
  return state.students.find((student) => student.id === state.selectedStudentId) || null;
}

function selectStudent(studentId, { closeSwitch = false } = {}) {
  if (!state.students.some((student) => student.id === studentId)) {
    return;
  }

  state.selectedStudentId = studentId;
  persist();
  render();
  if (closeSwitch) {
    closeStudentSwitch();
  }
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
    .filter((redemption) => redemption.studentId === studentId)
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
  return stampAssets.find((stamp) => stamp.id === stampId) || stampAssets[0];
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
