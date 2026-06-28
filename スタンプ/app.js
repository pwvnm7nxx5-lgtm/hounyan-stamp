const STORAGE_KEY = "hounyan-stamp-ledger-v1";

const stampAssets = [
  {
    id: "sonochoshi",
    name: "そのちょうし",
    src: "assets/stamp-sonochoshi.png",
    unlockAt: 0,
  },
  {
    id: "yokudekimashita",
    name: "よくできました",
    src: "assets/stamp-yokudekimashita.png",
    unlockAt: 10,
  },
  {
    id: "sasuga",
    name: "さすが",
    src: "assets/stamp-sasuga.png",
    unlockAt: 20,
  },
  {
    id: "ganbattane",
    name: "がんばったね",
    src: "assets/stamp-ganbattane.png",
    unlockAt: 30,
  },
];

const defaultRewards = [
  {
    id: "unlock-yokudekimashita",
    name: "よくできましたスタンプ",
    type: "unlock",
    cost: 10,
    description: "累計10個でピンクのスタンプが使えるようになります。",
    enabled: true,
  },
  {
    id: "unlock-sasuga",
    name: "さすがスタンプ",
    type: "unlock",
    cost: 20,
    description: "累計20個で青いスタンプが使えるようになります。",
    enabled: true,
  },
  {
    id: "unlock-ganbattane",
    name: "がんばったねスタンプ",
    type: "unlock",
    cost: 30,
    description: "累計30個で黄色のスタンプが使えるようになります。",
    enabled: true,
  },
  {
    id: "shop-sticker",
    name: "シール 1枚",
    type: "shop",
    cost: 20,
    description: "使えるスタンプ20個と交換します。",
    enabled: true,
  },
  {
    id: "shop-hounyan-dress",
    name: "ほうにゃん着せ替え券",
    type: "shop",
    cost: 40,
    description: "ホームの着せ替えアイテム用の交換枠です。",
    enabled: true,
  },
];

const defaultState = {
  students: [],
  stampEvents: [],
  rewards: defaultRewards,
  redemptions: [],
  settings: {
    homeCharacter: "assets/hounyan-home.png",
    hounyanLine: "今日もプリント、いっしょにがんばろう！",
    voiceUrl: "",
  },
  selectedStudentId: "",
  selectedStampId: "sonochoshi",
};

let state = loadState();

const els = {
  viewButtons: document.querySelectorAll("[data-view-button]"),
  views: document.querySelectorAll("[data-view]"),
  totalStudents: document.querySelector("#totalStudents"),
  todayStamps: document.querySelector("#todayStamps"),
  allStamps: document.querySelector("#allStamps"),
  hounyanLine: document.querySelector("#hounyan-line"),
  voiceButton: document.querySelector("#voiceButton"),
  quickAddOpen: document.querySelector("#quickAddOpen"),
  studentList: document.querySelector("#studentList"),
  studentDetail: document.querySelector("#studentDetail"),
  selectedStudentName: document.querySelector("#selectedStudentName"),
  selectedTotal: document.querySelector("#selectedTotal"),
  selectedAvailable: document.querySelector("#selectedAvailable"),
  selectedLevel: document.querySelector("#selectedLevel"),
  nextLevelText: document.querySelector("#nextLevelText"),
  stampPicker: document.querySelector("#stampPicker"),
  stampMemo: document.querySelector("#stampMemo"),
  addStampButton: document.querySelector("#addStampButton"),
  historyList: document.querySelector("#historyList"),
  editStudentButton: document.querySelector("#editStudentButton"),
  deleteStudentButton: document.querySelector("#deleteStudentButton"),
  rewardStudentSelect: document.querySelector("#rewardStudentSelect"),
  unlockRewards: document.querySelector("#unlockRewards"),
  shopRewards: document.querySelector("#shopRewards"),
  upgradeLevel: document.querySelector("#upgradeLevel"),
  upgradeText: document.querySelector("#upgradeText"),
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

  els.quickAddOpen.addEventListener("click", () => {
    showView("settings");
    clearStudentForm();
    els.studentName.focus();
  });

  els.studentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveStudent();
  });

  els.addStampButton.addEventListener("click", addStamp);
  els.editStudentButton.addEventListener("click", editSelectedStudent);
  els.deleteStudentButton.addEventListener("click", deleteSelectedStudent);
  els.rewardStudentSelect.addEventListener("change", () => {
    state.selectedStudentId = els.rewardStudentSelect.value;
    persist();
    render();
  });
  els.exportButton.addEventListener("click", exportData);
  els.importInput.addEventListener("change", importData);
  els.voiceButton.addEventListener("click", playVoice);
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
    settings: {
      ...defaultState.settings,
      ...(input.settings || {}),
    },
  };

  merged.students = Array.isArray(input.students) ? input.students : [];
  merged.stampEvents = Array.isArray(input.stampEvents) ? input.stampEvents : [];
  merged.redemptions = Array.isArray(input.redemptions) ? input.redemptions : [];
  merged.rewards = Array.isArray(input.rewards) && input.rewards.length ? input.rewards : defaultRewards;
  return merged;
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  renderTopStats();
  renderStudents();
  renderStudentDetail();
  renderRewards();
  renderStampAssets();
  els.hounyanLine.textContent = state.settings.hounyanLine;
  els.viewButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewButton === activeView());
  });
}

function renderTopStats() {
  els.totalStudents.textContent = state.students.length;
  els.todayStamps.textContent = eventsForToday().filter((event) => !event.canceled).length;
  els.allStamps.textContent = state.students.reduce((sum, student) => sum + studentStats(student.id).total, 0);
}

function renderStudents() {
  if (!state.students.length) {
    els.studentList.innerHTML = '<p class="empty-state">まだ児童が登録されていません。＋ボタンから追加できます。</p>';
    return;
  }

  els.studentList.innerHTML = state.students
    .map((student) => {
      const stats = studentStats(student.id);
      const selected = student.id === state.selectedStudentId ? " is-selected" : "";
      return `
        <button class="student-card${selected}" type="button" data-select-student="${student.id}">
          <span>
            <span class="student-name">${escapeHtml(student.name)}</span>
            <span class="student-meta">${escapeHtml(student.note || "メモなし")}</span>
          </span>
          <span class="student-meta">累計 ${stats.total} / 使用可 ${stats.available}</span>
        </button>
      `;
    })
    .join("");

  els.studentList.querySelectorAll("[data-select-student]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedStudentId = button.dataset.selectStudent;
      persist();
      render();
      document.querySelector("#studentDetail")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function renderStudentDetail() {
  const student = selectedStudent();
  els.studentDetail.hidden = !student;

  if (!student) {
    return;
  }

  const stats = studentStats(student.id);
  const level = mascotLevel(stats.total);
  els.selectedStudentName.textContent = student.name;
  els.selectedTotal.textContent = stats.total;
  els.selectedAvailable.textContent = stats.available;
  els.selectedLevel.textContent = level.current;
  els.nextLevelText.textContent = level.remaining === 0 ? "最大" : `あと${level.remaining}`;
  renderStampPicker(stats.total);
  renderHistory(student.id);
}

function renderStampPicker(total) {
  els.stampPicker.innerHTML = stampAssets
    .map((stamp) => {
      const locked = total < stamp.unlockAt;
      const selected = state.selectedStampId === stamp.id;
      const label = locked ? `${stamp.unlockAt}個で解放` : stamp.name;
      return `
        <button class="stamp-option${selected ? " is-selected" : ""}${locked ? " is-locked" : ""}"
          type="button"
          data-stamp="${stamp.id}"
          ${locked ? "disabled" : ""}
          title="${escapeHtml(label)}">
          <img src="${stamp.src}" alt="${escapeHtml(stamp.name)}">
          <span>${escapeHtml(label)}</span>
        </button>
      `;
    })
    .join("");

  els.stampPicker.querySelectorAll("[data-stamp]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedStampId = button.dataset.stamp;
      persist();
      renderStudentDetail();
    });
  });

  const selectedStamp = stampAssets.find((stamp) => stamp.id === state.selectedStampId);
  if (!selectedStamp || total < selectedStamp.unlockAt) {
    state.selectedStampId = "sonochoshi";
    persist();
    renderStampPicker(total);
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
  const stats = student ? studentStats(student.id) : { total: 0, available: 0 };
  const level = mascotLevel(stats.total);
  els.upgradeLevel.textContent = `Lv.${level.current}`;
  els.upgradeText.textContent = `次のレベルまで ${level.remaining === 0 ? "到達済み" : `あと${level.remaining}個`}`;

  const unlockRewards = state.rewards.filter((reward) => reward.enabled && reward.type === "unlock");
  const shopRewards = state.rewards.filter((reward) => reward.enabled && reward.type === "shop");
  els.unlockRewards.innerHTML = unlockRewards.map((reward) => rewardCard(reward, stats, student)).join("");
  els.shopRewards.innerHTML = shopRewards.map((reward) => rewardCard(reward, stats, student)).join("");

  els.shopRewards.querySelectorAll("[data-redeem]").forEach((button) => {
    button.addEventListener("click", () => redeemReward(button.dataset.redeem));
  });
}

function rewardCard(reward, stats, student) {
  const value = reward.type === "unlock" ? stats.total : stats.available;
  const done = value >= reward.cost;
  const percent = Math.min(100, Math.round((value / reward.cost) * 100));
  const button =
    reward.type === "shop"
      ? `<button class="primary-button" type="button" data-redeem="${reward.id}" ${!student || !done ? "disabled" : ""}>交換</button>`
      : `<strong>${done ? "解放済み" : `あと${reward.cost - value}`}</strong>`;

  return `
    <article class="reward-card">
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
      <p>${value} / ${reward.cost}</p>
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

function activeView() {
  return document.querySelector(".view.is-active")?.dataset.view || "home";
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
  showView("home");
  showToast("児童を保存しました");
}

function clearStudentForm() {
  els.studentId.value = "";
  els.studentName.value = "";
  els.studentNote.value = "";
}

function addStamp() {
  const student = selectedStudent();
  if (!student) {
    showToast("先に児童を登録してください");
    return;
  }

  const stats = studentStats(student.id);
  const stamp = stampById(state.selectedStampId);
  if (stats.total < stamp.unlockAt) {
    showToast("このスタンプはまだ解放されていません");
    return;
  }

  state.stampEvents.push({
    id: crypto.randomUUID(),
    studentId: student.id,
    stampId: stamp.id,
    memo: els.stampMemo.value.trim(),
    createdAt: new Date().toISOString(),
    canceled: false,
  });
  els.stampMemo.value = "";
  persist();
  render();
  showToast(`${student.name}にスタンプを押しました`);
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
  if (!student || !reward || reward.type !== "shop") {
    return;
  }

  const stats = studentStats(student.id);
  if (stats.available < reward.cost) {
    showToast("使えるスタンプが足りません");
    return;
  }

  state.redemptions.push({
    id: crypto.randomUUID(),
    studentId: student.id,
    rewardId: reward.id,
    cost: reward.cost,
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
  showView("settings");
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

function playVoice() {
  if (!state.settings.voiceUrl) {
    showToast("音声ファイルはあとから設定できます");
    return;
  }

  const audio = new Audio(state.settings.voiceUrl);
  audio.play().catch(() => showToast("音声を再生できませんでした"));
}

function selectedStudent() {
  return state.students.find((student) => student.id === state.selectedStudentId) || null;
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
  const total = state.stampEvents.filter((event) => event.studentId === studentId && !event.canceled).length;
  const spent = state.redemptions
    .filter((redemption) => redemption.studentId === studentId)
    .reduce((sum, redemption) => sum + Number(redemption.cost || 0), 0);
  return {
    total,
    spent,
    available: Math.max(0, total - spent),
  };
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
