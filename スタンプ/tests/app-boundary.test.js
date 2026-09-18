const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const storageService = require("../storage-service.js");

class FakeStorage {
  constructor(initial = {}, { failGet = false, failSetKeys = [] } = {}) {
    this.values = new Map(Object.entries(initial));
    this.failGet = failGet;
    this.failSetKeys = new Set(failSetKeys);
  }

  getItem(key) {
    if (this.failGet) throw new Error("security error");
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    if (this.failSetKeys.has(key)) throw new Error("quota exceeded");
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

function makeElement() {
  const element = {
    value: "",
    checked: false,
    hidden: false,
    disabled: false,
    innerHTML: "",
    textContent: "",
    files: [],
    options: [],
    selectedOptions: [],
    dataset: {},
    style: { setProperty() {} },
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains() { return false; },
    },
    addEventListener() {},
    removeEventListener() {},
    querySelectorAll() { return []; },
    querySelector() { return null; },
    setAttribute() {},
    removeAttribute() {},
    append() {},
    appendChild() {},
    remove() {},
    focus() {},
    click() {},
    closest() { return null; },
  };
  return element;
}

function loadApp({ storage, confirmResult = true } = {}) {
  const fileReaders = [];
  class FakeFileReader {
    constructor() {
      this.result = "";
      this.listeners = new Map();
      fileReaders.push(this);
    }

    addEventListener(type, handler) {
      this.listeners.set(type, handler);
    }

    readAsText(file) {
      this.file = file;
    }

    emit(type, result = "") {
      this.result = result;
      this.listeners.get(type)?.({ target: this });
    }
  }

  const sandbox = {
    console,
    crypto: globalThis.crypto,
    Blob: class Blob {},
    URL: { createObjectURL() { return "blob:stub"; }, revokeObjectURL() {} },
    localStorage: storage,
    confirm: () => confirmResult,
    requestAnimationFrame: () => {},
    setTimeout: () => 1,
    clearTimeout: () => {},
    FileReader: FakeFileReader,
    document: null,
  };
  sandbox.window = sandbox;
  const elements = new Map();
  sandbox.document = {
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, makeElement());
      return elements.get(selector);
    },
    querySelectorAll() { return []; },
    addEventListener() {},
    createElement() { return makeElement(); },
    body: { append() {} },
  };
  vm.createContext(sandbox);
  vm.runInContext("this.structuredClone = (value) => JSON.parse(JSON.stringify(value));", sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "storage-service.js"), "utf8"), sandbox, { filename: "storage-service.js" });
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "calendar-service.js"), "utf8"), sandbox, { filename: "calendar-service.js" });
  sandbox.__HOUNYAN_TEST__ = true;
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8"), sandbox, { filename: "app.js" });
  sandbox.__fileReaders = fileReaders;
  return sandbox;
}

function seedStudentState(api) {
  const state = api.getState();
  state.students = [{ id: "student-1", name: "テスト児童", isTest: false, ticketBalance: 0, groupId: "" }];
  state.selectedStudentId = "student-1";
  state.stampEvents = [];
  state.redemptions = [];
  state.dailyMissions = [];
  state.studentMissionSettings = [];
  state.ownedStampIdsByStudent = { "student-1": [] };
  assert.equal(api.replaceCandidate(state), true);
  return api.getState();
}

test("album printing includes only complete uncanceled sheets for the selected student and never saves", async () => {
  const storage = new FakeStorage();
  const sandbox = loadApp({ storage });
  const api = sandbox.__HounyanStampTestApi;
  const state = seedStudentState(api);
  state.stampEvents = Array.from({ length: 42 }, (_, index) => ({
    id: `print-${index}`, studentId: "student-1", stampId: "sonochoshi",
    createdAt: `2026-09-18T09:00:${String(index).padStart(2, "0")}.000Z`, canceled: index === 41,
  }));
  state.stampEvents.push({ id: "other-child", studentId: "other", stampId: "sonochoshi", createdAt: "2026-09-18T08:00:00.000Z" });
  assert.equal(api.replaceCandidate(state), true);
  const saved = storage.getItem(storageService.STORAGE_KEY);
  const calls = [];
  sandbox.HounyanSheetPrint = { printSheets: async (name, sheets) => calls.push({ name, sheets }) };
  await sandbox.printCompletedSheets();
  assert.deepEqual(Array.from(calls[0].sheets, (item) => item.number), [1, 2]);
  assert.equal(calls[0].sheets[0].stamps.length, 20);
  await sandbox.printCompletedSheets(2);
  assert.equal(calls[1].sheets.length, 1);
  assert.equal(calls[1].sheets[0].number, 2);
  await sandbox.printCompletedSheets(3);
  assert.equal(calls.length, 2);
  assert.equal(storage.getItem(storageService.STORAGE_KEY), saved);
});

test("actual legacy raw data without newer arrays is normalized without erasing history", () => {
  const legacy = {
    students: [{ id: "student-legacy", name: "旧児童", ticketBalance: 2 }],
    stampEvents: [{ id: "legacy-event", studentId: "student-legacy", stampId: "sonochoshi", createdAt: "2026-09-04T09:00:00.000Z" }],
    dailyMissions: [{
      id: "legacy-mission",
      studentId: "student-legacy",
      missionTemplateId: "deleted-template",
      studentMissionSettingId: "deleted-setting",
      targetDate: "2026-09-04",
      name: "過去の記録",
      status: "completed",
    }],
    redemptions: [{
      id: "legacy-redemption",
      studentId: "student-legacy",
      rewardId: "deleted-reward",
      type: "reward",
      createdAt: "2026-09-04T09:05:00.000Z",
    }],
    selectedStampId: "sonochoshi",
    selectedGroupId: "deleted-group",
    selectedSupportGroupIdByYear: { "deleted-year": "deleted-group" },
  };
  const storage = new FakeStorage({ [storageService.STORAGE_KEY]: JSON.stringify(legacy) });
  const sandbox = loadApp({ storage });
  const api = sandbox.__HounyanStampTestApi;
  const state = api.getState();
  assert.equal(api.getStorageStatus().stateLoadFailed, false);
  assert.equal(state.students[0].id, "student-legacy");
  assert.equal(state.stampEvents[0].stampId, "sonochoshi");
  assert.equal(state.dailyMissions[0].missionTemplateId, "deleted-template");
  assert.equal(state.redemptions[0].rewardId, "deleted-reward");
  assert.equal(state.selectedSupportGroupId, "all");
});

test("app-created history remains readable after source templates, settings, rewards, and groups disappear", () => {
  const storage = new FakeStorage();
  const sandbox = loadApp({ storage });
  const api = sandbox.__HounyanStampTestApi;
  seedStudentState(api);
  assert.equal(api.mutateAndPersist((state) => {
    state.students[0].isTest = true;
    state.missionTemplates.push({
      id: "template-old", name: "過去の設定", displayText: "過去の設定", missionType: "daily", category: "care",
      conditionType: "manual", evaluationType: "manual", defaultTargetValue: 1, unit: "",
      defaultStampReward: 1, defaultTicketReward: 1, enabled: true,
    });
    state.studentMissionSettings.push({
      id: "setting-old", studentId: "student-1", missionTemplateId: "template-old", targetValue: 1,
      stampReward: 1, ticketReward: 1, displayOrder: 0, enabled: true,
    });
    state.dailyMissions.push({
      id: "mission-old", studentId: "student-1", missionTemplateId: "template-old",
      studentMissionSettingId: "setting-old", targetDate: "2026-09-05", name: "過去のミッション",
      displayText: "過去のミッション", missionType: "daily", category: "care", conditionType: "manual",
      evaluationType: "manual", targetValue: 1, unit: "", currentValue: 0, manualAdjustment: 0,
      stampReward: 1, ticketReward: 1, status: "not_started", completedAt: "", rewardGranted: false,
      createdAt: "2026-09-05T09:00:00.000Z", updatedAt: "2026-09-05T09:00:00.000Z",
    });
  }), true);
  const stampId = api.getState().stampAssets.find((stamp) => stamp.id === "sonochoshi")?.id;
  assert.equal(api.addStampBatch({ selections: [{ stampId, count: 1 }], source: "teacher" }), true);
  api.redeemReward("shop-sticker");
  assert.equal(api.completeMissionAndPersist("mission-old"), true);

  assert.equal(api.mutateAndPersist((state) => {
    state.missionTemplates = [];
    state.studentMissionSettings = [];
    state.rewards = [];
    state.groups = [];
    state.calendarEvents = [{
      id: "old-group-event", title: "過去のクラス行事", startDate: "2026-09-05", endDate: "2026-09-05",
      allDay: true, scope: "groups", groupIds: ["deleted-group"], type: "group-event", repeat: "none",
    }];
    state.selectedGroupId = "deleted-group";
    state.selectedSupportGroupIdByYear = { "deleted-year": "deleted-group" };
  }), true);

  const reloaded = loadApp({ storage }).__HounyanStampTestApi;
  const state = reloaded.getState();
  assert.equal(reloaded.getStorageStatus().stateLoadFailed, false);
  assert.equal(state.dailyMissions.some((mission) => mission.id === "mission-old"), true);
  assert.equal(state.redemptions.some((redemption) => redemption.rewardId === "shop-sticker"), true);
  assert.equal(state.calendarEvents[0].groupIds[0], "deleted-group");
});

test("app boundary commits a 100-stamp batch and mission reward atomically", () => {
  const storage = new FakeStorage();
  const sandbox = loadApp({ storage });
  const api = sandbox.__HounyanStampTestApi;
  seedStudentState(api);
  const state = api.getState();
  const stampId = state.stampAssets.find((stamp) => !stamp.hidden && !stamp.missionOnly && !stamp.purchaseOnly)?.id;
  assert.equal(api.addStampBatch({ selections: [{ stampId, count: 100 }], source: "teacher" }), true);
  const afterBatch = api.getState();
  assert.equal(afterBatch.stampEvents.filter((event) => event.studentId === "student-1").length, 100);

  afterBatch.dailyMissions = [{
    id: "mission-1",
    studentId: "student-1",
    missionTemplateId: "",
    studentMissionSettingId: "",
    targetDate: "2026-09-05",
    name: "手動ミッション",
    displayText: "手動ミッション",
    missionType: "daily",
    category: "care",
    conditionType: "manual",
    evaluationType: "manual",
    targetValue: 1,
    unit: "",
    currentValue: 0,
    manualAdjustment: 0,
    stampReward: 2,
    ticketReward: 3,
    status: "not_started",
    completedAt: "",
    rewardGranted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }];
  assert.equal(api.replaceCandidate(afterBatch), true);
  assert.equal(api.completeMissionAndPersist("mission-1"), true);
  const completed = api.getState();
  assert.equal(completed.dailyMissions[0].rewardGranted, true);
  assert.equal(completed.students[0].ticketBalance, 3);
  assert.equal(completed.stampEvents.filter((event) => event.missionId === "mission-1").length, 2);
});

test("app primary save failure rolls back live state and a retry succeeds", () => {
  const storage = new FakeStorage();
  const sandbox = loadApp({ storage });
  const api = sandbox.__HounyanStampTestApi;
  seedStudentState(api);
  const before = api.getState();
  const mainKey = storageService.STORAGE_KEY;
  const rawBefore = storage.getItem(mainKey);
  storage.failSetKeys.add(mainKey);
  assert.equal(api.mutateAndPersist((state) => {
    state.students[0].ticketBalance = 99;
  }), false);
  assert.deepEqual(api.getState().students[0].ticketBalance, before.students[0].ticketBalance);
  assert.equal(storage.getItem(mainKey), rawBefore);
  assert.match(sandbox.document.querySelector("#storageStatus").textContent, /保存できませんでした/);
  storage.failSetKeys.delete(mainKey);
  assert.equal(api.mutateAndPersist((state) => {
    state.students[0].ticketBalance = 4;
  }), true);
  assert.equal(api.getState().students[0].ticketBalance, 4);
});

test("purchase cancellation keeps owned stamps consistent", () => {
  const storage = new FakeStorage();
  const sandbox = loadApp({ storage });
  const api = sandbox.__HounyanStampTestApi;
  seedStudentState(api);
  api.mutateAndPersist((state) => {
    state.students[0].isTest = true;
  });
  api.buyStamp("shop-medal");
  let state = api.getState();
  assert.deepEqual(Array.from(state.ownedStampIdsByStudent["student-1"]), ["shop-medal"]);
  const redemption = state.redemptions.find((item) => item.type === "stamp-purchase");
  api.cancelRedemption(redemption.id);
  state = api.getState();
  assert.deepEqual(Array.from(state.ownedStampIdsByStudent["student-1"]), []);
  assert.equal(state.redemptions.find((item) => item.id === redemption.id).canceled, true);
});

test("mission completion and revert use the same primary transaction boundary", () => {
  const storage = new FakeStorage();
  const sandbox = loadApp({ storage });
  const api = sandbox.__HounyanStampTestApi;
  seedStudentState(api);
  const state = api.getState();
  state.dailyMissions = [{
    id: "mission-1", studentId: "student-1", missionTemplateId: "", studentMissionSettingId: "",
    targetDate: "2026-09-05", name: "手動", displayText: "手動", missionType: "daily", category: "care",
    conditionType: "manual", evaluationType: "manual", targetValue: 1, unit: "", currentValue: 0,
    manualAdjustment: 0, stampReward: 1, ticketReward: 2, status: "not_started", completedAt: "",
    rewardGranted: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }];
  api.replaceCandidate(state);
  assert.equal(api.completeMissionAndPersist("mission-1"), true);
  let completed = api.getState();
  assert.equal(completed.students[0].ticketBalance, 2);
  assert.equal(api.revertMissionAndPersist("mission-1"), true);
  completed = api.getState();
  assert.equal(completed.dailyMissions[0].status, "revoked");
  assert.equal(completed.students[0].ticketBalance, 0);
  assert.equal(completed.stampEvents.filter((event) => event.missionId === "mission-1").every((event) => event.canceled), true);
});

test("replacement cancellation, pre-backup failure, and primary restore failure preserve current state", () => {
  const mainKey = storageService.STORAGE_KEY;
  const backupKey = storageService.AUTO_BACKUP_STORAGE_KEY;
  const storage = new FakeStorage();
  const sandbox = loadApp({ storage, confirmResult: false });
  const api = sandbox.__HounyanStampTestApi;
  seedStudentState(api);
  api.mutateAndPersist((state) => {
    state.students[0].note = "現在の未バックアップ変更";
  }, { createBackup: false });
  const currentRaw = storage.getItem(mainKey);
  const candidate = api.getState();
  candidate.students[0].name = "置換候補";
  assert.equal(api.replaceImportedState(candidate).ok, false);
  assert.equal(storage.getItem(mainKey), currentRaw);
  assert.equal(api.getState().students[0].name, "テスト児童");

  sandbox.confirm = () => true;
  storage.failSetKeys.add(backupKey);
  assert.equal(api.replaceImportedState(candidate).reason, "pre_backup_failed");
  assert.equal(api.getState().students[0].name, "テスト児童");
  storage.failSetKeys.delete(backupKey);
  storage.failSetKeys.add(mainKey);
  assert.equal(api.replaceImportedState(candidate).reason, "primary_write_failed");
  assert.equal(api.getState().students[0].name, "テスト児童");
  assert.equal(storage.getItem(mainKey), currentRaw);
});

test("load failure keeps the protected raw source and permits only staged recovery", () => {
  const brokenRaw = JSON.stringify({ students: [null], stampEvents: [] });
  const storage = new FakeStorage({ [storageService.STORAGE_KEY]: brokenRaw });
  const sandbox = loadApp({ storage });
  const api = sandbox.__HounyanStampTestApi;
  assert.equal(api.getStorageStatus().stateLoadFailed, true);
  assert.equal(api.getStorageStatus().stateLoadRecoveryAvailable, true);

  assert.equal(api.mutateAndPersist((state) => {
    state.students.push({ id: "not-saved", name: "保存不可", ticketBalance: 0 });
  }), false);
  assert.equal(api.getState().students.some((student) => student.id === "not-saved"), false);
  assert.match(sandbox.document.querySelector("#storageStatus").textContent, /復元用原本/);

  const candidate = api.getState();
  candidate.students = [{ id: "recovered", name: "復旧児童", ticketBalance: 0, groupId: "" }];
  candidate.selectedStudentId = "recovered";
  candidate.stampEvents = [];
  assert.equal(api.replaceImportedState(candidate).ok, true);
  assert.equal(storage.getItem(storageService.BACKUP_STORAGE_KEY), brokenRaw);
  assert.equal(api.getStorageStatus().stateLoadFailed, false);
  assert.equal(api.getState().students[0].id, "recovered");
});

test("load failure keeps raw, live default, and protection when recovery primary write fails", () => {
  const brokenRaw = JSON.stringify({ students: [null], stampEvents: [] });
  const storage = new FakeStorage({ [storageService.STORAGE_KEY]: brokenRaw }, {
    failSetKeys: new Set([storageService.STORAGE_KEY]),
  });
  const sandbox = loadApp({ storage });
  const api = sandbox.__HounyanStampTestApi;
  const candidate = api.getState();
  candidate.students = [{ id: "recovery-failed", name: "復旧失敗", ticketBalance: 0, groupId: "" }];
  candidate.selectedStudentId = "recovery-failed";
  candidate.stampEvents = [];

  const result = api.replaceImportedState(candidate);
  assert.equal(result.reason, "primary_write_failed");
  assert.equal(storage.getItem(storageService.STORAGE_KEY), brokenRaw);
  assert.equal(storage.getItem(storageService.BACKUP_STORAGE_KEY), brokenRaw);
  assert.equal(api.getStorageStatus().stateLoadFailed, true);
  assert.equal(api.getStorageStatus().stateLoadRecoveryAvailable, true);
  assert.equal(api.getState().students.some((student) => student.id === "recovery-failed"), false);
});

test("invalid import and restore candidates leave live state and primary storage unchanged", () => {
  const storage = new FakeStorage();
  const sandbox = loadApp({ storage });
  const api = sandbox.__HounyanStampTestApi;
  seedStudentState(api);
  const currentState = api.getState();
  const currentRaw = storage.getItem(storageService.STORAGE_KEY);
  const invalidImport = {
    ...currentState,
    timetables: [{ id: "timetable-invalid", groupId: "deleted-group", periodCount: 1, cells: { "0-1": "deleted-subject" } }],
  };
  assert.equal(api.replaceImportedState(invalidImport).reason, "validation");
  assert.equal(storage.getItem(storageService.STORAGE_KEY), currentRaw);
  assert.deepEqual(api.getState(), currentState);

  const invalidBackup = {
    id: "invalid-backup",
    createdAt: "2026-09-05T12:00:00.000Z",
    reason: "auto",
    state: {
      ...currentState,
      stampSets: [{ id: "set-invalid", name: "壊れたセット", memberIds: ["missing-stamp"] }],
    },
  };
  storage.setItem(storageService.AUTO_BACKUP_STORAGE_KEY, JSON.stringify([invalidBackup]));
  assert.equal(api.restoreAutoBackup("invalid-backup").reason, "validation");
  assert.equal(storage.getItem(storageService.STORAGE_KEY), currentRaw);
  assert.deepEqual(api.getState(), currentState);
});

test("stamp deletion requires a pre-delete backup and never leaves set member references", () => {
  const storage = new FakeStorage();
  const sandbox = loadApp({ storage });
  const api = sandbox.__HounyanStampTestApi;
  seedStudentState(api);
  assert.equal(api.mutateAndPersist((state) => {
    state.stampAssets.push(
      { id: "custom-alone", name: "単体", custom: true, hidden: false, setId: "" },
      { id: "custom-in-set", name: "セット内", custom: true, hidden: false, setId: "custom-set" },
    );
    state.stampSets.push({ id: "custom-set", name: "テストセット", memberIds: ["custom-in-set"], priceSheets: 1 });
  }), true);
  const autoBackupKey = storageService.AUTO_BACKUP_STORAGE_KEY;
  storage.failSetKeys.add(autoBackupKey);
  api.deleteStampAsset("custom-alone");
  assert.equal(api.getState().stampAssets.some((stamp) => stamp.id === "custom-alone"), true);
  api.deleteStampSet("custom-set");
  assert.equal(api.getState().stampSets.some((stampSet) => stampSet.id === "custom-set"), true);
  assert.equal(api.getState().stampAssets.some((stamp) => stamp.id === "custom-in-set"), true);
  storage.failSetKeys.delete(autoBackupKey);

  api.deleteStampAsset("custom-in-set");
  assert.equal(api.getState().stampAssets.some((stamp) => stamp.id === "custom-in-set"), true);
  assert.equal(api.deleteStampSet("custom-set"), undefined);
  assert.equal(api.getState().stampAssets.some((stamp) => stamp.id === "custom-in-set"), false);
  assert.equal(api.getState().stampSets.some((stampSet) => stampSet.id === "custom-set"), false);
  const beforeDelete = storageService.readAutoBackups({ storage }).backups
    .find((item) => item.reason === "before-delete");
  assert.ok(beforeDelete);
  assert.equal(beforeDelete.state.stampAssets.some((stamp) => stamp.id === "custom-in-set"), true);

  const reloaded = loadApp({ storage }).__HounyanStampTestApi;
  assert.equal(reloaded.getStorageStatus().stateLoadFailed, false);
  assert.equal(reloaded.getState().stampAssets.some((stamp) => stamp.id === "custom-in-set"), false);
});

test("restore route uses the transaction boundary and FileReader errors reset the input", () => {
  const storage = new FakeStorage();
  const sandbox = loadApp({ storage });
  const api = sandbox.__HounyanStampTestApi;
  seedStudentState(api);
  api.mutateAndPersist((state) => {
    state.students[0].name = "復元前";
  }, { createBackup: false });
  const backup = storageService.readAutoBackups({
    storage,
    key: storageService.AUTO_BACKUP_STORAGE_KEY,
  }).backups[0];
  assert.ok(backup);
  const currentRaw = storage.getItem(storageService.STORAGE_KEY);
  storage.failSetKeys.add(storageService.STORAGE_KEY);
  assert.equal(api.restoreAutoBackup(backup.id).reason, "primary_write_failed");
  assert.equal(storage.getItem(storageService.STORAGE_KEY), currentRaw);
  assert.equal(api.getState().students[0].name, "復元前");

  storage.failSetKeys.delete(storageService.STORAGE_KEY);
  const input = sandbox.document.querySelector("#importInput");
  input.files = [{ name: "broken.json" }];
  input.value = "selected";
  api.importData({ target: input });
  const reader = sandbox.__fileReaders.at(-1);
  assert.ok(reader);
  reader.emit("error");
  assert.equal(input.value, "");
  assert.equal(api.getState().students[0].name, "復元前");

  const restored = api.restoreAutoBackup(backup.id);
  assert.equal(restored.ok, true);
  const protectedBeforeRestore = storageService.readAutoBackups({ storage }).backups
    .find((item) => item.reason === "before-restore");
  assert.ok(protectedBeforeRestore);
  assert.equal(protectedBeforeRestore.state.students[0].name, "復元前");
  api.mutateAndPersist((state) => {
    state.students[0].name = "復元後の後続保存";
  });
  const stillProtected = storageService.readAutoBackups({ storage }).backups
    .find((item) => item.id === protectedBeforeRestore.id);
  assert.equal(stillProtected.state.students[0].name, "復元前");
});

test("storage-unavailable startup renders with saving disabled", () => {
  const storage = new FakeStorage({}, { failGet: true });
  const sandbox = loadApp({ storage });
  const status = sandbox.__HounyanStampTestApi.getStorageStatus();
  assert.equal(status.stateLoadFailed, true);
  assert.equal(status.storageUnavailable, true);
  assert.match(sandbox.document.querySelector("#storageStatus").textContent, /保存不可/);
});

test("backup-only failure leaves the successful primary state in place", () => {
  const storage = new FakeStorage();
  const sandbox = loadApp({ storage });
  const api = sandbox.__HounyanStampTestApi;
  seedStudentState(api);
  storage.failSetKeys.add(storageService.AUTO_BACKUP_STORAGE_KEY);
  assert.equal(api.mutateAndPersist((state) => {
    state.students[0].ticketBalance = 7;
  }), true);
  assert.equal(api.getState().students[0].ticketBalance, 7);
  assert.equal(JSON.parse(storage.getItem(storageService.STORAGE_KEY)).students[0].ticketBalance, 7);
  assert.match(api.getStorageStatus().storageBackupWarning, /自動バックアップ/);
});
