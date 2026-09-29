(function attachStorageService(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.HounyanStorageService = api;
    root.HounyanStorage = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  "use strict";

  const STORAGE_KEY = "hounyan-stamp-ledger-v1";
  const BACKUP_STORAGE_KEY = `${STORAGE_KEY}-broken-backup`;
  const AUTO_BACKUP_STORAGE_KEY = `${STORAGE_KEY}-auto-backups`;
  const AUTO_BACKUP_LIMIT = 6;
  const AUTO_BACKUP_BUCKET_MS = 3 * 60 * 1000;
  const EXPORT_FORMAT = "hounyan-stamp-ledger";
  const EXPORT_SCHEMA_VERSION = 1;
  const NUMERIC_FIELD_RULES = {
    ticketBalance: { integer: true, min: 0 },
    year: { integer: true, min: 1 },
    cost: { min: 0 },
    costSheets: { min: 0 },
    costStamps: { min: 0 },
    sheetCost: { min: 0 },
    priceSheets: { min: 0 },
    shopPriceSheets: { min: 0 },
    requiredSheets: { min: 0 },
    defaultTargetValue: { min: 0 },
    targetValue: { min: 0 },
    currentValue: { min: 0 },
    stampReward: { min: 0 },
    ticketReward: { min: 0 },
    defaultStampReward: { min: 0 },
    defaultTicketReward: { min: 0 },
    unlockAt: { min: 0 },
    periodCount: { integer: true, min: 1, max: 10 },
    periodNumber: { integer: true, min: 1 },
    level: { integer: true, min: 1 },
    tier: { integer: true, min: 1 },
    displayOrder: { min: 0 },
    sortOrder: { min: 0 },
    manualAdjustment: {},
  };
  const HISTORICAL_TOMBSTONE_STATUSES = new Set(["canceled", "cancelled", "removed", "revoked", "expired"]);

  function assertSerializable(value, path = "state", seen = new Set()) {
    if (typeof value === "number") {
      if (!Number.isFinite(value)) throw new Error(`${path}に有限でない数値があります`);
      return;
    }
    if (!value || typeof value !== "object") return;
    if (seen.has(value)) throw new Error(`${path}に循環参照があります`);
    seen.add(value);
    if (Array.isArray(value)) {
      value.forEach((item, index) => assertSerializable(item, `${path}[${index}]`, seen));
    } else {
      Object.entries(value).forEach(([key, child]) => assertSerializable(child, `${path}.${key}`, seen));
    }
    seen.delete(value);
  }

  function snapshot(value) {
    if (value === undefined) return undefined;
    assertSerializable(value);
    return JSON.parse(JSON.stringify(value));
  }

  function serialize(value, replacer = null, space) {
    assertSerializable(value);
    return JSON.stringify(value, replacer, space);
  }

  function parse(raw) {
    return JSON.parse(String(raw));
  }

  function errorInfo(code, message, cause, extra = {}) {
    return {
      code,
      message,
      cause: cause instanceof Error ? cause.message : cause ? String(cause) : "",
      ...extra,
    };
  }

  function failed(code, message, cause, extra = {}) {
    return { ok: false, error: errorInfo(code, message, cause, extra) };
  }

  function storageGet(storage, key) {
    if (!storage || typeof storage.getItem !== "function") {
      return failed("storage_unavailable", "ブラウザの保存領域を利用できません。保存は無効です。");
    }
    try {
      return { ok: true, value: storage.getItem(key) };
    } catch (error) {
      return failed("storage_get_failed", `保存領域から「${key}」を読み込めませんでした。`, error, { key });
    }
  }

  function storageSet(storage, key, value) {
    if (!storage || typeof storage.setItem !== "function") {
      return failed("storage_unavailable", "ブラウザの保存領域を利用できません。保存は無効です。");
    }
    try {
      storage.setItem(key, String(value));
      return { ok: true, key };
    } catch (error) {
      return failed("storage_set_failed", `「${key}」を保存できませんでした。容量不足または保存権限の問題です。`, error, {
        key, errorName: error?.name || "Error", attemptedChars: String(value).length,
      });
    }
  }

  function storageRemove(storage, key) {
    if (!storage || typeof storage.removeItem !== "function") {
      return failed("storage_unavailable", "ブラウザの保存領域を利用できません。削除は無効です。");
    }
    try {
      storage.removeItem(key);
      return { ok: true, key };
    } catch (error) {
      return failed("storage_remove_failed", `保存領域の「${key}」を削除できませんでした。`, error, { key });
    }
  }

  function isPlainObject(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return Object.prototype.toString.call(value) === "[object Object]"
      && (prototype === null || Object.getPrototypeOf(prototype) === null);
  }

  function unwrapCandidate(input) {
    if (!isPlainObject(input)) {
      return failed("wrong_root", "JSONのルートはオブジェクトである必要があります。配列やnullは読み込めません。");
    }

    const hasEnvelopeMarker = Object.prototype.hasOwnProperty.call(input, "format")
      || Object.prototype.hasOwnProperty.call(input, "schemaVersion")
      || Object.prototype.hasOwnProperty.call(input, "state")
      || Object.prototype.hasOwnProperty.call(input, "data");
    if (!hasEnvelopeMarker) {
      return { ok: true, value: input, envelope: false };
    }

    if (input.format !== EXPORT_FORMAT) {
      return failed("wrong_envelope", "このJSONはほうにゃんスタンプ台帳の書き出し形式ではありません。");
    }
    if (Number(input.schemaVersion) !== EXPORT_SCHEMA_VERSION) {
      return failed("unsupported_schema", `このJSONのスキーマバージョン（${String(input.schemaVersion)}）には対応していません。`);
    }
    const value = input.state || input.data;
    if (!isPlainObject(value)) {
      return failed("wrong_envelope_state", "書き出しJSONのstateが見つからないか、オブジェクトではありません。");
    }
    return { ok: true, value, envelope: true };
  }

  function addValidationError(errors, message) {
    if (!errors.includes(message) && errors.length < 40) errors.push(message);
  }

  function validateFiniteNumbers(value, path, errors, fieldName = "") {
    const rule = NUMERIC_FIELD_RULES[fieldName];
    if (rule) {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        addValidationError(errors, `${path}は有限な数値である必要があります。`);
      } else if (rule.integer && !Number.isInteger(value)) {
        addValidationError(errors, `${path}は整数である必要があります。`);
      } else if (rule.min !== undefined && value < rule.min) {
        addValidationError(errors, `${path}は${rule.min}以上である必要があります。`);
      } else if (rule.max !== undefined && value > rule.max) {
        addValidationError(errors, `${path}は${rule.max}以下である必要があります。`);
      }
      return;
    }
    if (typeof value === "number") {
      if (!Number.isFinite(value)) addValidationError(errors, `${path}に有限でない数値があります。`);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => validateFiniteNumbers(item, `${path}[${index}]`, errors));
      return;
    }
    if (!value || typeof value !== "object") return;
    Object.entries(value).forEach(([key, child]) => validateFiniteNumbers(child, `${path}.${key}`, errors, key));
  }

  function validateArrayShape(source, key, errors, objectEntries = true) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) return;
    const value = source[key];
    if (!Array.isArray(value)) {
      addValidationError(errors, `「${key}」は配列である必要があります。`);
      return;
    }
    const ids = new Set();
    value.forEach((entry, index) => {
      if (entry === null || entry === undefined) {
        addValidationError(errors, `「${key}」の${index + 1}番目がnullです。削除してから読み込んでください。`);
        return;
      }
      if (objectEntries && (typeof entry !== "object" || Array.isArray(entry))) {
        addValidationError(errors, `「${key}」の${index + 1}番目がオブジェクトではありません。`);
        return;
      }
      if (!objectEntries) return;
      if (!Object.prototype.hasOwnProperty.call(entry, "id")) {
        addValidationError(errors, `「${key}」の${index + 1}番目にIDがありません。`);
        return;
      }
      const id = String(entry.id ?? "").trim();
      if (!id) {
        addValidationError(errors, `「${key}」の${index + 1}番目にIDがありません。`);
        return;
      }
      if (ids.has(id)) addValidationError(errors, `「${key}」にID「${id}」が重複しています。`);
      ids.add(id);
    });
  }

  function validateNestedShapes(source, errors) {
    if (Array.isArray(source.timetables)) {
      source.timetables.forEach((timetable, index) => {
        if (!timetable || typeof timetable !== "object" || Array.isArray(timetable)) return;
        if (!Object.prototype.hasOwnProperty.call(timetable, "cells")) return;
        if (!isPlainObject(timetable.cells)) {
          addValidationError(errors, `時間割${index + 1}のcellsはオブジェクトである必要があります。`);
        }
      });
    }
    if (Array.isArray(source.stampSets)) {
      source.stampSets.forEach((stampSet, index) => {
        if (!stampSet || typeof stampSet !== "object" || Array.isArray(stampSet)) return;
        if (Object.prototype.hasOwnProperty.call(stampSet, "memberIds") && !Array.isArray(stampSet.memberIds)) {
          addValidationError(errors, `スタンプセット${index + 1}のmemberIdsは配列である必要があります。`);
        }
        if (Array.isArray(stampSet.memberIds)) {
          stampSet.memberIds.forEach((stampId, memberIndex) => {
            if (typeof stampId !== "string" || !stampId.trim()) {
              addValidationError(errors, `スタンプセット${index + 1}の${memberIndex + 1}番目のスタンプIDが不正です。`);
            }
          });
        }
      });
    }
    if (Array.isArray(source.redemptions)) {
      source.redemptions.forEach((redemption, index) => {
        if (!redemption || typeof redemption !== "object" || Array.isArray(redemption)) return;
        if (Object.prototype.hasOwnProperty.call(redemption, "stampIds") && !Array.isArray(redemption.stampIds)) {
          addValidationError(errors, `交換履歴${index + 1}のstampIdsは配列である必要があります。`);
        }
      });
    }
    ["settings", "ownedStampIdsByStudent", "rewardGoalsByStudent", "equippedHounyanLevelByStudent", "selectedSupportGroupIdByYear"].forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(source, key) && !isPlainObject(source[key])) {
        addValidationError(errors, `「${key}」はオブジェクトである必要があります。`);
      }
    });
    if (source.settings && isPlainObject(source.settings)
      && Object.prototype.hasOwnProperty.call(source.settings, "levelRules")
      && !Array.isArray(source.settings.levelRules)) {
      addValidationError(errors, "settings.levelRulesは配列である必要があります。");
    }
    if (source.settings && isPlainObject(source.settings) && Array.isArray(source.settings.levelRules)) {
      source.settings.levelRules.forEach((rule, index) => {
        if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
          addValidationError(errors, `settings.levelRulesの${index + 1}番目がオブジェクトではありません。`);
        }
      });
    }
  }

  function validateDateFields(source, errors) {
    ["stampEvents", "redemptions"].forEach((key) => {
      if (!Array.isArray(source[key])) return;
      source[key].forEach((entry, index) => {
        const value = entry?.createdAt;
        if (value === undefined || value === null || !Number.isFinite(new Date(value).getTime())) {
          addValidationError(errors, `「${key}」の${index + 1}番目のcreatedAtが不正です。`);
        }
      });
    });
  }

  function validateReferences(source, errors) {
    const idsOf = (key) => new Set(Array.isArray(source[key])
      ? source[key].filter(Boolean).map((item) => String(item.id || ""))
      : []);
    const stampIds = idsOf("stampAssets");
    const stampSetIds = idsOf("stampSets");
    const subjectIds = idsOf("subjects");

    const requireRef = (exists, value, label) => {
      if (value !== undefined && value !== null && String(value) && !exists.has(String(value))) {
        addValidationError(errors, `${label}「${String(value)}」が参照先にありません。`);
      }
    };

    // Only validate current configuration links. Historical events, mission
    // snapshots, reward records, and selection fields are intentionally left
    // usable after their source records are removed or renamed.
    if (Array.isArray(source.stampAssets) && Array.isArray(source.stampSets)) {
      source.stampAssets.forEach((stamp, index) => requireRef(stampSetIds, stamp?.setId, `スタンプ${index + 1}のセット`));
      source.stampSets.forEach((stampSet, index) => {
        requireRef(stampSetIds, stampSet?.requiresSetId, `スタンプセット${index + 1}の前提セット`);
        (Array.isArray(stampSet?.memberIds) ? stampSet.memberIds : []).forEach((stampId) => {
          requireRef(stampIds, stampId, `スタンプセット${index + 1}のスタンプ`);
        });
      });
    }

    if (Array.isArray(source.timetables)) {
      source.timetables.forEach((timetable, index) => {
        const cells = timetable?.cells && typeof timetable.cells === "object" && !Array.isArray(timetable.cells)
          ? timetable.cells
          : {};
        Object.entries(cells).forEach(([cellKey, cell]) => {
          const subjectId = typeof cell === "string" ? cell : cell?.subjectId;
          if (subjectId && Array.isArray(source.subjects)) {
            requireRef(subjectIds, subjectId, `時間割${index + 1}の${cellKey}の教科`);
          }
        });
      });
    }

    if (Array.isArray(source.redemptions) && Array.isArray(source.stampSets)) {
      source.redemptions.forEach((redemption, index) => {
        const historical = redemption?.canceled === true
          || redemption?.deletedAt
          || HISTORICAL_TOMBSTONE_STATUSES.has(String(redemption?.status || "").toLowerCase());
        if (!historical && redemption?.stampSetId) {
          requireRef(stampSetIds, redemption.stampSetId, `交換履歴${index + 1}のスタンプセット`);
        }
      });
    }

    // These objects are checked for shape elsewhere, but their old references
    // must survive normalization so deleted templates/rewards/groups do not
    // turn a valid historical ledger into an empty state.
  }

  function validateState(input, options = {}) {
    const unwrapped = unwrapCandidate(input);
    if (!unwrapped.ok) return { ...unwrapped, valid: false, errors: [unwrapped.error.message], message: unwrapped.error.message };
    const source = unwrapped.value;
    const errors = [];
    const requiredArrays = options.requiredArrays || ["students", "stampEvents"];
    requiredArrays.forEach((key) => {
      if (!Array.isArray(source[key])) addValidationError(errors, `必須配列「${key}」がありません。旧形式でもこのデータは必要です。`);
    });
    [
      "students", "schoolYears", "groups", "classMemberships", "subjects", "timetables", "calendarEvents",
      "timetableOverrides", "stampEvents", "missionTemplates", "studentMissionSettings", "dailyMissions",
      "rewards", "stampAssets", "stampSets", "redemptions",
    ].forEach((key) => validateArrayShape(source, key, errors, true));
    validateArrayShape(source, "ownedOutfits", errors, false);
    validateNestedShapes(source, errors);
    validateDateFields(source, errors);
    validateFiniteNumbers(source, "state", errors);
    validateReferences(source, errors);
    const ok = errors.length === 0;
    return {
      ok,
      valid: ok,
      value: source,
      envelope: unwrapped.envelope,
      errors,
      message: errors.join(" "),
    };
  }

  function normalizeCandidate(input, normalize) {
    const validation = validateState(input);
    if (!validation.ok) return validation;
    if (typeof normalize !== "function") return failed("normalize_unavailable", "状態を正規化する処理がありません。");
    try {
      const normalized = normalize(snapshot(validation.value));
      if (!isPlainObject(normalized)) return failed("normalize_failed", "読み込んだ状態を正規化できませんでした。");
      const normalizedValidation = validateState(normalized);
      if (!normalizedValidation.ok) {
        return {
          ...normalizedValidation,
          error: errorInfo("normalized_state_invalid", "正規化後の状態を検証できないため、読み込みを中止しました。"),
        };
      }
      return { ok: true, valid: true, value: normalized, state: normalized, errors: [], envelope: validation.envelope };
    } catch (error) {
      return failed("normalize_failed", "読み込んだ状態を正規化できませんでした。", error);
    }
  }

  function defaultNormalizedState(defaultState, normalize) {
    try {
      return typeof normalize === "function" ? normalize(snapshot(defaultState)) : snapshot(defaultState);
    } catch (error) {
      return snapshot(defaultState);
    }
  }

  function preserveRecoveryRaw(storage, recoveryKey, raw) {
    if (raw === null || raw === undefined) return { ok: true, skipped: true };
    const existing = storageGet(storage, recoveryKey);
    if (!existing.ok) return existing;
    if (existing.value !== null && existing.value !== undefined) {
      const matching = existing.value === raw;
      return { ok: true, skipped: true, preserved: true, matching, available: matching };
    }
    const written = storageSet(storage, recoveryKey, raw);
    return written.ok
      ? { ...written, matching: true, available: true }
      : { ...written, matching: false, available: false };
  }

  function loadState({ storage, key = STORAGE_KEY, recoveryKey = BACKUP_STORAGE_KEY, defaultState, normalize }) {
    const emptyState = defaultNormalizedState(defaultState, normalize);
    const primary = storageGet(storage, key);
    if (!primary.ok) {
      return { ok: false, state: emptyState, usedDefault: true, storageAvailable: false, recoveryAvailable: false, error: primary.error };
    }
    if (primary.value === null || primary.value === "") {
      return { ok: true, state: emptyState, usedDefault: true, storageAvailable: true, source: "default" };
    }
    let parsed;
    try {
      parsed = parse(primary.value);
    } catch (error) {
      const recovery = preserveRecoveryRaw(storage, recoveryKey, primary.value);
      return {
        ok: false,
        state: emptyState,
        usedDefault: true,
        storageAvailable: true,
        raw: primary.value,
        recoveryRaw: primary.value,
        error: errorInfo("json_parse_failed", "保存データのJSONを読み込めませんでした。", error),
        recovery,
        recoveryAvailable: recovery.available === true && recovery.matching === true,
      };
    }
    const candidate = normalizeCandidate(parsed, normalize);
    if (!candidate.ok) {
      const recovery = preserveRecoveryRaw(storage, recoveryKey, primary.value);
      return {
        ok: false,
        state: emptyState,
        usedDefault: true,
        storageAvailable: true,
        raw: primary.value,
        recoveryRaw: primary.value,
        error: candidate.error || errorInfo("state_invalid", candidate.message),
        validation: candidate,
        recovery,
        recoveryAvailable: recovery.available === true && recovery.matching === true,
      };
    }
    return { ok: true, state: candidate.state, usedDefault: false, storageAvailable: true, source: "primary" };
  }

  function savePrimary({ storage, key = STORAGE_KEY, state }) {
    let raw;
    let candidate;
    try {
      const validation = validateState(state);
      if (!validation.ok) {
        return failed("state_invalid", validation.message || "保存する状態の内容を検証できないため、保存を中止しました。", null, { validation });
      }
      candidate = snapshot(state);
      raw = serialize(candidate);
    } catch (error) {
      return failed("serialize_failed", "保存する状態をJSONに変換できませんでした。", error);
    }
    const written = storageSet(storage, key, raw);
    if (!written.ok) return { ...written, state: candidate, raw };
    return { ok: true, state: candidate, raw, key };
  }

  const COMPACT_BACKUP_FORMAT = "hounyan-backups-shared-v1";

  function describeBackupFailure(error, storage) {
    const code = error?.code || "unknown";
    const name = error?.errorName;
    const reason = code === "backup_parse_failed" ? "既存バックアップを読み込めません。"
      : name === "QuotaExceededError" ? "ブラウザの保存容量が不足しています。"
      : name === "SecurityError" || code === "storage_unavailable" ? "ブラウザが保存領域の利用を許可していません。"
      : "バックアップの保存処理でエラーが発生しました。";
    const size = (key) => {
      const result = storageGet(storage, key);
      return result.ok ? `${((result.value || "").length / 1024 / 1024).toFixed(2)} M文字` : "取得不可";
    };
    const attempted = Number.isFinite(error?.attemptedChars)
      ? `、保存予定 ${(error.attemptedChars / 1024 / 1024).toFixed(2)} M文字` : "";
    return `${reason} [backup-0929b/${code}${name ? `/${name}` : ""}] 主データ ${size(STORAGE_KEY)}、既存バックアップ ${size(AUTO_BACKUP_STORAGE_KEY)}${attempted}。`;
  }

  // Share unchanged records and images across snapshots without dropping history.
  // Each snapshot is still reconstructed as an independent plain JSON object.
  function encodeBackups(backups) {
    const values = [];
    const indices = new Map();
    const intern = (value) => {
      const json = serialize(value);
      if (!indices.has(json)) {
        indices.set(json, values.length);
        values.push(json);
      }
      return indices.get(json);
    };
    const entries = backups.map((backup) => ({
      ...backup,
      state: Object.fromEntries(Object.entries(backup.state).map(([field, value]) => [
        field, Array.isArray(value) ? [0, value.map(intern)] : [1, intern(value)],
      ])),
    }));
    const compact = serialize({ format: COMPACT_BACKUP_FORMAT, values, backups: entries });
    const legacy = serialize(backups);
    return compact.length < legacy.length ? compact : legacy;
  }

  function decodeBackups(parsed) {
    if (Array.isArray(parsed)) return parsed;
    if (!isPlainObject(parsed) || parsed.format !== COMPACT_BACKUP_FORMAT
      || !Array.isArray(parsed.values) || !Array.isArray(parsed.backups)) {
      throw new Error("自動バックアップの形式が不正です。原本は変更していません。");
    }
    const valueAt = (index) => {
      if (!Number.isInteger(index) || index < 0 || index >= parsed.values.length
        || typeof parsed.values[index] !== "string") throw new Error("バックアップの参照が不正です");
      return parse(parsed.values[index]);
    };
    return parsed.backups.map((backup) => {
      if (!isPlainObject(backup) || !isPlainObject(backup.state)) throw new Error("バックアップの状態が不正です");
      return {
        ...backup,
        state: Object.fromEntries(Object.entries(backup.state).map(([field, ref]) => {
          if (!Array.isArray(ref) || ref.length !== 2) throw new Error("バックアップの項目が不正です");
          if (ref[0] === 0 && Array.isArray(ref[1])) return [field, ref[1].map(valueAt)];
          if (ref[0] === 1) return [field, valueAt(ref[1])];
          throw new Error("バックアップの項目が不正です");
        })),
      };
    });
  }

  function readAutoBackups({ storage, key = AUTO_BACKUP_STORAGE_KEY, limit = AUTO_BACKUP_LIMIT }) {
    const result = storageGet(storage, key);
    if (!result.ok) return { ...result, backups: [] };
    if (!result.value) return { ok: true, backups: [] };
    try {
      const parsed = decodeBackups(parse(result.value));
      return {
        ok: true,
        backups: parsed.filter((backup) => backup && backup.id && backup.createdAt && backup.state).slice(0, limit),
      };
    } catch (error) {
      return { ok: false, backups: [], error: errorInfo("backup_parse_failed", "自動バックアップを読み込めませんでした。", error) };
    }
  }

  function writeAutoBackups({ storage, key = AUTO_BACKUP_STORAGE_KEY, backups, limit = AUTO_BACKUP_LIMIT }) {
    try {
      const raw = encodeBackups(backups.slice(0, limit));
      return storageSet(storage, key, raw);
    } catch (error) {
      return failed("backup_serialize_failed", "自動バックアップをJSONに変換できませんでした。", error);
    }
  }

  function createAutoBackup({
    storage,
    state,
    reason = "auto",
    force = false,
    now = new Date(),
    key = AUTO_BACKUP_STORAGE_KEY,
    limit = AUTO_BACKUP_LIMIT,
    bucketMs = AUTO_BACKUP_BUCKET_MS,
    idFactory = () => (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
    summary = null,
  }) {
    const current = readAutoBackups({ storage, key, limit });
    if (!current.ok) return { ok: false, warning: true, error: current.error, backups: current.backups || [] };
    const backups = current.backups || [];
    let rawState;
    let stateCopy;
    try {
      stateCopy = snapshot(state);
      rawState = serialize(stateCopy);
    } catch (error) {
      return { ok: false, warning: true, error: errorInfo("backup_serialize_failed", "自動バックアップを作成できませんでした。", error), backups };
    }
    const newest = backups[0];
    if (newest && !force) {
      try {
        if (serialize(newest.state) === rawState) return { ok: true, skipped: true, backups };
      } catch (error) {
        return { ok: false, warning: true, error: errorInfo("backup_compare_failed", "既存バックアップと比較できませんでした。", error), backups };
      }
    }
    const timestamp = now instanceof Date ? now : new Date(now);
    const snapshotEntry = {
      id: idFactory(),
      createdAt: timestamp.toISOString(),
      reason,
      protected: force || String(reason).startsWith("before-"),
      summary: typeof summary === "function" ? summary(stateCopy) : summary || {},
      state: stateCopy,
    };
    let next;
    const newestIsProtected = Boolean(newest?.protected) || String(newest?.reason || "").startsWith("before-");
    if (!force && newest && !newestIsProtected) {
      const newestTime = new Date(newest.createdAt).getTime();
      next = Number.isFinite(newestTime) && timestamp.getTime() - newestTime < bucketMs
        ? [{ ...snapshotEntry, id: newest.id }, ...backups.slice(1)]
        : [snapshotEntry, ...backups].slice(0, limit);
    } else {
      next = [snapshotEntry, ...backups].slice(0, limit);
    }
    const written = writeAutoBackups({ storage, key, backups: next, limit });
    if (!written.ok) {
      return {
        ok: false,
        warning: true,
        error: written.error,
        backups,
        preservedExisting: true,
        attemptedCount: next.length,
      };
    }
    return { ok: true, backups: next, created: true };
  }

  function exportEnvelope(state, exportedAt = new Date()) {
    return {
      format: EXPORT_FORMAT,
      schemaVersion: EXPORT_SCHEMA_VERSION,
      exportedAt: (exportedAt instanceof Date ? exportedAt : new Date(exportedAt)).toISOString(),
      state: snapshot(state),
    };
  }

  return {
    STORAGE_KEY,
    BACKUP_STORAGE_KEY,
    AUTO_BACKUP_STORAGE_KEY,
    AUTO_BACKUP_LIMIT,
    AUTO_BACKUP_BUCKET_MS,
    EXPORT_FORMAT,
    EXPORT_SCHEMA_VERSION,
    snapshot,
    snapshotState: snapshot,
    serialize,
    serializeJson: serialize,
    parse,
    parseJson: parse,
    storageGet,
    storageSet,
    storageRemove,
    get: storageGet,
    set: storageSet,
    remove: storageRemove,
    getStorage: storageGet,
    setStorage: storageSet,
    removeStorage: storageRemove,
    unwrapCandidate,
    validateState,
    validateCandidate: validateState,
    normalizeCandidate,
    loadState,
    savePrimary,
    readAutoBackups,
    writeAutoBackups,
    createAutoBackup,
    describeBackupFailure,
    exportEnvelope,
  };
});
