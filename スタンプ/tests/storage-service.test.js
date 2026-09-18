const test = require("node:test");
const assert = require("node:assert/strict");

const storageService = require("../storage-service.js");

class FakeStorage {
  constructor(initial = {}, { failGet = false, failSetKeys = new Set(), failRemove = false } = {}) {
    this.values = new Map(Object.entries(initial));
    this.failGet = failGet;
    this.failSetKeys = failSetKeys instanceof Set ? failSetKeys : new Set(failSetKeys);
    this.failRemove = failRemove;
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
    if (this.failRemove) throw new Error("security error");
    this.values.delete(key);
  }
}

function makeState(overrides = {}) {
  return {
    students: [{ id: "student-1", name: "A", ticketBalance: 0 }],
    schoolYears: [{ id: "year-1", name: "2026年度", year: 2026, active: true }],
    groups: [{ id: "group-1", name: "1組", schoolYearId: "year-1", type: "mainstream" }],
    classMemberships: [{ id: "membership-1", studentId: "student-1", groupId: "group-1", schoolYearId: "year-1", active: true }],
    subjects: [{ id: "subject-1", name: "国語" }],
    timetables: [{ id: "timetable-1", groupId: "group-1", periodCount: 1, cells: {} }],
    calendarEvents: [],
    timetableOverrides: [],
    stampEvents: [],
    missionTemplates: [{ id: "template-1", name: "ミッション" }],
    studentMissionSettings: [{ id: "setting-1", studentId: "student-1", missionTemplateId: "template-1" }],
    dailyMissions: [],
    rewards: [{ id: "reward-1", name: "シール" }],
    stampAssets: [{ id: "stamp-1", name: "そのちょうし" }],
    stampSets: [],
    redemptions: [],
    ownedOutfits: ["default"],
    ownedStampIdsByStudent: { "student-1": ["stamp-1"] },
    selectedStudentId: "student-1",
    selectedSchoolYearId: "year-1",
    selectedGroupId: "group-1",
    ...overrides,
  };
}

function normalizeForTest(value) {
  return {
    ...makeState(),
    ...value,
  };
}

test("serialize/parse/snapshot and storage get/set/remove are separated", () => {
  const original = { nested: { count: 1 } };
  const copy = storageService.snapshot(original);
  copy.nested.count = 2;
  assert.equal(original.nested.count, 1);
  assert.deepEqual(storageService.parse(storageService.serialize(original)), original);

  const storage = new FakeStorage();
  assert.equal(storageService.storageSet(storage, "key", "value").ok, true);
  assert.deepEqual(storageService.storageGet(storage, "key"), { ok: true, value: "value" });
  assert.equal(storageService.storageRemove(storage, "key").ok, true);
  assert.equal(storageService.storageGet(storage, "key").value, null);
});

test("normal primary save and reload accept the main key", () => {
  const storage = new FakeStorage();
  const state = makeState();
  const saved = storageService.savePrimary({ storage, state });
  assert.equal(saved.ok, true);
  const loaded = storageService.loadState({
    storage,
    defaultState: makeState({ students: [], groups: [], classMemberships: [], selectedStudentId: "" }),
    normalize: normalizeForTest,
  });
  assert.equal(loaded.ok, true);
  assert.equal(loaded.state.students[0].id, "student-1");
  assert.equal(storage.getItem(storageService.STORAGE_KEY) !== null, true);
});

test("valid legacy raw JSON and new export envelope are both accepted", () => {
  const legacy = makeState();
  const legacyStorage = new FakeStorage({ [storageService.STORAGE_KEY]: JSON.stringify(legacy) });
  const legacyLoaded = storageService.loadState({ storage: legacyStorage, defaultState: makeState({ students: [] }), normalize: normalizeForTest });
  assert.equal(legacyLoaded.ok, true);
  assert.equal(legacyLoaded.state.students[0].name, "A");

  const envelopeStorage = new FakeStorage({
    [storageService.STORAGE_KEY]: JSON.stringify(storageService.exportEnvelope(legacy)),
  });
  const envelopeLoaded = storageService.loadState({ storage: envelopeStorage, defaultState: makeState({ students: [] }), normalize: normalizeForTest });
  assert.equal(envelopeLoaded.ok, true);
  assert.equal(envelopeLoaded.state.students[0].id, "student-1");
});

test("legacy nonempty raw state may omit newer arrays and retain historical references", () => {
  const legacy = {
    students: [{ id: "student-legacy", name: "旧形式の児童", ticketBalance: 2 }],
    stampEvents: [{ id: "event-legacy", studentId: "student-legacy", stampId: "sonochoshi", createdAt: "2026-09-04T09:00:00.000Z" }],
    dailyMissions: [{
      id: "mission-history",
      studentId: "student-legacy",
      missionTemplateId: "deleted-template",
      studentMissionSettingId: "deleted-setting",
      targetDate: "2026-09-04",
      name: "過去のミッション",
      targetValue: 1,
      currentValue: 1,
      status: "completed",
    }],
    redemptions: [{
      id: "redemption-history",
      studentId: "student-legacy",
      rewardId: "deleted-reward",
      type: "reward",
      canceled: false,
      createdAt: "2026-09-04T09:05:00.000Z",
    }],
    selectedStampId: "sonochoshi",
    selectedGroupId: "deleted-group",
    selectedSupportGroupIdByYear: { "deleted-year": "deleted-group" },
  };
  const storage = new FakeStorage({ [storageService.STORAGE_KEY]: JSON.stringify(legacy) });
  const loaded = storageService.loadState({
    storage,
    defaultState: makeState({ students: [] }),
    normalize: normalizeForTest,
  });
  assert.equal(loaded.ok, true);
  assert.equal(loaded.state.students[0].id, "student-legacy");
  assert.equal(loaded.state.stampEvents[0].stampId, "sonochoshi");
  assert.equal(loaded.state.dailyMissions[0].missionTemplateId, "deleted-template");
  assert.equal(loaded.state.redemptions[0].rewardId, "deleted-reward");
});

test("invalid numeric strings, negative balances, and nonfinite values are never silently serialized", () => {
  const storage = new FakeStorage({ [storageService.STORAGE_KEY]: JSON.stringify(makeState({ students: [] })) });
  const before = storage.getItem(storageService.STORAGE_KEY);
  const invalidText = storageService.savePrimary({
    storage,
    state: makeState({ students: [{ id: "student-1", ticketBalance: "oops" }] }),
  });
  assert.equal(invalidText.ok, false);
  assert.match(invalidText.error.message, /数値/);
  assert.equal(storage.getItem(storageService.STORAGE_KEY), before);

  const invalidNegative = storageService.savePrimary({
    storage,
    state: makeState({ students: [{ id: "student-1", ticketBalance: -1 }] }),
  });
  assert.equal(invalidNegative.ok, false);
  assert.equal(storage.getItem(storageService.STORAGE_KEY), before);

  const invalidInfinity = storageService.savePrimary({
    storage,
    state: makeState({ students: [{ id: "student-1", ticketBalance: Infinity }] }),
  });
  assert.equal(invalidInfinity.ok, false);
  assert.equal(storage.getItem(storageService.STORAGE_KEY), before);
  assert.equal(JSON.parse(storage.getItem(storageService.STORAGE_KEY)).students.length, 0);
});

test("forced before-restore backup is not replaced by a later coalesced save", () => {
  const storage = new FakeStorage();
  const beforeState = makeState({ students: [{ id: "student-1", name: "復元前", ticketBalance: 1 }] });
  const afterState = makeState({ students: [{ id: "student-1", name: "復元後", ticketBalance: 9 }] });
  assert.equal(storageService.createAutoBackup({
    storage,
    state: beforeState,
    reason: "before-restore",
    force: true,
    now: new Date("2026-09-05T10:00:00.000Z"),
    idFactory: () => "before-restore-id",
  }).ok, true);
  assert.equal(storageService.createAutoBackup({
    storage,
    state: afterState,
    reason: "auto",
    force: false,
    now: new Date("2026-09-05T10:01:00.000Z"),
    idFactory: () => "after-save-id",
  }).ok, true);
  const backups = storageService.readAutoBackups({ storage }).backups;
  assert.equal(backups[0].reason, "auto");
  assert.equal(backups[1].reason, "before-restore");
  assert.equal(backups[1].state.students[0].name, "復元前");
  assert.equal(backups[1].protected, true);
});

test("validation rejects wrong roots, missing essential arrays, malformed values, and unsafe current links", () => {
  const cases = [
    [{}, "必須配列"],
    [[], "ルート"],
    [{ format: "other-app", schemaVersion: 1, state: makeState() }, "台帳の書き出し形式"],
    [makeState({ students: [null] }), "null"],
    [makeState({ students: [{ name: "IDなし" }] }), "IDがありません"],
    [makeState({ students: [{ id: "student-1" }, { id: "student-1" }] }), "重複"],
    [makeState({ students: [{ id: "student-1", ticketBalance: Infinity }] }), "有限"],
    [makeState({ students: [{ id: "student-1", ticketBalance: "oops" }] }), "有限な数値"],
    [makeState({ students: [{ id: "student-1", ticketBalance: -1 }] }), "以上"],
    [makeState({ stampEvents: [{ id: "event-1", studentId: "student-1", stampId: "stamp-1", createdAt: "not-a-date" }] }), "createdAt"],
    [makeState({ stampAssets: [{ id: "stamp-1", setId: "missing-set" }] }), "参照先"],
    [makeState({ timetables: [{ id: "timetable-1", groupId: "group-1", periodCount: 1, cells: { "0-1": "missing-subject" } }] }), "参照先"],
    [makeState({ stampSets: [{ id: "set-1", name: "セット", memberIds: ["missing-stamp"] }] }), "参照先"],
    [makeState({ stampSets: [{ id: "set-1", name: "セット", memberIds: ["stamp-1"] }], redemptions: [{ id: "redemption-1", stampSetId: "missing-set" }] }), "参照先"],
  ];
  cases.forEach(([input, expected]) => {
    const result = storageService.validateState(input);
    assert.equal(result.ok, false);
    assert.match(result.message, new RegExp(expected));
  });
});

test("primary write failure leaves storage unchanged and can be retried", () => {
  const key = storageService.STORAGE_KEY;
  const storage = new FakeStorage({ [key]: JSON.stringify(makeState({ students: [] })) }, { failSetKeys: new Set([key]) });
  const before = storage.getItem(key);
  const failed = storageService.savePrimary({ storage, state: makeState() });
  assert.equal(failed.ok, false);
  assert.equal(storage.getItem(key), before);
  storage.failSetKeys.clear();
  assert.equal(storageService.savePrimary({ storage, state: makeState() }).ok, true);
  assert.equal(JSON.parse(storage.getItem(key)).students[0].id, "student-1");
});

test("auto backup keeps six full-state entries and backup-only failure does not affect primary", () => {
  const mainKey = storageService.STORAGE_KEY;
  const backupKey = storageService.AUTO_BACKUP_STORAGE_KEY;
  const storage = new FakeStorage({}, { failSetKeys: new Set([backupKey]) });
  const primary = storageService.savePrimary({ storage, state: makeState({ stampEvents: Array.from({ length: 100 }, (_, index) => ({ id: `event-${index}`, studentId: "student-1", stampId: "stamp-1", createdAt: new Date(2026, 0, 1, 0, index).toISOString() })) }) });
  assert.equal(primary.ok, true);
  const backup = storageService.createAutoBackup({ storage, state: primary.state, reason: "auto", force: true });
  assert.equal(backup.ok, false);
  assert.equal(JSON.parse(storage.getItem(mainKey)).stampEvents.length, 100);

  const successfulStorage = new FakeStorage();
  for (let index = 0; index < 8; index += 1) {
    const result = storageService.createAutoBackup({
      storage: successfulStorage,
      state: makeState({ stampEvents: [{ id: `event-${index}`, studentId: "student-1", stampId: "stamp-1", createdAt: "2026-01-01T00:00:00.000Z" }] }),
      reason: `test-${index}`,
      force: true,
      now: new Date(2026, 0, index + 1),
    });
    assert.equal(result.ok, true);
  }
  assert.equal(JSON.parse(successfulStorage.getItem(backupKey)).length, 6);
});

test("inaccessible startup returns a default state without attempting a write", () => {
  const storage = new FakeStorage({}, { failGet: true });
  const result = storageService.loadState({ storage, defaultState: makeState({ students: [] }), normalize: normalizeForTest });
  assert.equal(result.ok, false);
  assert.equal(result.storageAvailable, false);
  assert.deepEqual(result.state.students, []);
});

test("legacy recovery key is preserved instead of overwritten", () => {
  const storage = new FakeStorage({
    [storageService.STORAGE_KEY]: "{broken",
    [storageService.BACKUP_STORAGE_KEY]: "older-recovery",
  });
  const result = storageService.loadState({ storage, defaultState: makeState({ students: [] }), normalize: normalizeForTest });
  assert.equal(result.ok, false);
  assert.equal(storage.getItem(storageService.BACKUP_STORAGE_KEY), "older-recovery");
});
