(function (root) {
  "use strict";

  function escape(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[char]);
  }

  function buildDocument(studentName, sheets, baseUrl) {
    if (!sheets.length || sheets.some((sheet) => sheet.stamps.length !== 20)) {
      throw new Error("完成した20個のスタンプシートを選んでください");
    }
    return `<!doctype html><html lang="ja"><head><meta charset="utf-8">
      <base href="${escape(baseUrl)}"><title>ほうにゃん がんばりシート</title>
      <style>
        @page { size: A4 portrait; margin: 12mm; }
        * { box-sizing: border-box; }
        body { margin: 0; color: #183b2b; background: white; font-family: "Yu Gothic", "Meiryo", sans-serif; }
        .sheet { width: 186mm; height: 270mm; display: flex; flex-direction: column; gap: 4mm; break-after: page; page-break-after: always; }
        .sheet:last-child { break-after: auto; page-break-after: auto; }
        header { min-height: 25mm; display: flex; align-items: start; justify-content: space-between; gap: 5mm; }
        h1 { margin: 0 0 2mm; font-size: 19pt; letter-spacing: 0; }
        .name { margin: 0; font-size: 15pt; font-weight: bold; overflow-wrap: anywhere; }
        .identity { min-width: 0; flex: 1; }
        .meta { flex: 0 0 49mm; text-align: right; font-size: 10pt; line-height: 1.7; }
        .meta strong { display: block; font-size: 15pt; }
        .grid { min-height: 0; flex: 1; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-template-rows: repeat(5, minmax(0, 1fr)); gap: 2mm; }
        .stamp { min-height: 0; border: .3mm solid #9caf9f; padding: 1.5mm; display: flex; align-items: center; justify-content: center; }
        img { display: block; width: 100%; height: 100%; object-fit: contain; }
        footer { height: 8mm; flex-shrink: 0; text-align: center; font-size: 12pt; font-weight: bold; }
        @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
      </style></head><body>${sheets.map((sheet) => `
      <section class="sheet">
        <header><div class="identity"><h1>ほうにゃん がんばりシート</h1><p class="name">${escape(studentName)}</p></div>
          <div class="meta"><strong>${escape(sheet.number)}まいめ</strong>完成：${escape(sheet.completedAt)}</div></header>
        <div class="grid">${sheet.stamps.map((stamp) => `<div class="stamp"><img src="${escape(stamp.src)}" alt="${escape(stamp.name)}"></div>`).join("")}</div>
        <footer>20こ あつまったね！</footer>
      </section>`).join("")}</body></html>`;
  }

  let frame = null;
  let preparing = false;

  async function printSheets(studentName, sheets) {
    if (preparing) return;
    preparing = true;
    let current = null;
    let timeout;
    try {
      const html = buildDocument(studentName, sheets, document.baseURI);
      frame?.remove();
      current = document.createElement("iframe");
      frame = current;
      current.title = "スタンプシート印刷";
      current.setAttribute("aria-hidden", "true");
      current.style.cssText = "position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0;pointer-events:none";
      // Keep the document mounted until afterprint; early removal can blank preview.
      const ready = new Promise((resolve, reject) => {
        current.addEventListener("load", async () => {
          try {
            const doc = current.contentDocument;
            await Promise.all([...doc.images].map((img) => img.decode()));
            await doc.fonts.ready;
            resolve();
          } catch {
            reject(new Error("スタンプ画像を読み込めませんでした。画像を確認して、もう一度印刷してください"));
          }
        }, { once: true });
      });
      current.srcdoc = html;
      document.body.append(current);
      await Promise.race([ready, new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error("印刷の準備が間に合いませんでした。もう一度お試しください")), 20000);
      })]);
      clearTimeout(timeout);
      current.contentWindow.addEventListener("afterprint", () => current.remove(), { once: true });
      current.contentWindow.focus();
      current.contentWindow.print();
    } catch (error) {
      current?.remove();
      throw error;
    } finally {
      clearTimeout(timeout);
      preparing = false;
    }
  }

  const api = { buildDocument, printSheets };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.HounyanSheetPrint = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
