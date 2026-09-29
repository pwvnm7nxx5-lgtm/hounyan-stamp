(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.HounyanBackupStore = factory;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBackupStore({ indexedDB, storage, service }) {
  const key = service.AUTO_BACKUP_STORAGE_KEY;
  let cache = { ok: false, backups: [], error: { code: "backup_loading" } };
  let db;
  const failure = (error) => ({ ok: false, error: { code: "backup_database_failed", errorName: error?.name || "Error" } });
  const adapter = (raw) => ({ getItem: () => raw, setItem: (_, value) => { raw = value; } });

  function transact(transform) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction("backups", "readwrite");
      const store = tx.objectStore("backups");
      let result;
      let nextRaw;
      const request = store.get(key);
      request.onsuccess = () => {
        try {
          let raw = request.result;
          if (raw === undefined) {
            const legacy = service.storageGet(storage, key);
            if (!legacy.ok) { result = legacy; tx.abort(); return; }
            raw = legacy.value;
          }
          const memory = adapter(raw);
          const current = service.readAutoBackups({ storage: memory });
          if (!current.ok) { result = current; tx.abort(); return; }
          result = transform ? transform(memory) : current;
          if (!result.ok) { tx.abort(); return; }
          nextRaw = memory.getItem(key) || "[]";
          store.put(nextRaw, key);
        } catch (error) { result = failure(error); tx.abort(); }
      };
      tx.oncomplete = () => {
        cache = service.readAutoBackups({ storage: adapter(nextRaw) });
        resolve(result);
      };
      tx.onabort = () => resolve(result?.ok === false ? result : failure(tx.error));
      tx.onerror = () => {};
    });
  }

  const ready = new Promise((resolve, reject) => {
    const request = indexedDB.open("hounyan-stamp-backups-v1", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("backups");
    request.onsuccess = () => { db = request.result; db.onversionchange = () => db.close(); resolve(); };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Database blocked"));
  }).then(() => transact()).catch(failure).then((result) => {
    if (!result.ok) cache = result;
    return result;
  });
  let queue = ready;
  function enqueue(transform) {
    const job = queue.then(async () => {
      const opened = await ready;
      if (!opened.ok) return opened;
      return transact(transform);
    }).catch(failure);
    queue = job;
    return job;
  }
  return {
    ready,
    read: () => service.snapshot(cache),
    create: (options) => {
      const captured = service.snapshot(options.state);
      return enqueue((memory) => service.createAutoBackup({ ...options, state: captured, storage: memory }));
    },
    write: (backups) => {
      const captured = service.snapshot(backups);
      return enqueue((memory) => service.writeAutoBackups({ storage: memory, backups: captured }));
    },
    close: () => db?.close(),
  };
});
