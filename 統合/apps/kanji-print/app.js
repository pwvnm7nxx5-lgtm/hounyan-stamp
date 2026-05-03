const els = {
  sourceText: document.querySelector("#sourceText"),
  studentName: document.querySelector("#studentName"),
  worksheetDate: document.querySelector("#worksheetDate"),
  cols: document.querySelector("#cols"),
  rows: document.querySelector("#rows"),
  fontSize: document.querySelector("#fontSize"),
  smallFontSize: document.querySelector("#smallFontSize"),
  punctuationScale: document.querySelector("#punctuationScale"),
  fontFamily: document.querySelector("#fontFamily"),
  fontWeight: document.querySelector("#fontWeight"),
  letterSpacing: document.querySelector("#letterSpacing"),
  opacity: document.querySelector("#opacity"),
  stripSpaces: document.querySelector("#stripSpaces"),
  lineBreakColumn: document.querySelector("#lineBreakColumn"),
  pages: document.querySelector("#pages"),
  pageTemplate: document.querySelector("#pageTemplate"),
  pageCount: document.querySelector("#pageCount"),
  printBtn: document.querySelector("#printBtn"),
  copyLinkBtn: document.querySelector("#copyLinkBtn"),
  clearBtn: document.querySelector("#clearBtn"),
  templateName: document.querySelector("#templateName"),
  templateSelect: document.querySelector("#templateSelect"),
  saveTemplateBtn: document.querySelector("#saveTemplateBtn"),
  applyTemplateBtn: document.querySelector("#applyTemplateBtn"),
  deleteTemplateBtn: document.querySelector("#deleteTemplateBtn"),
  status: document.querySelector("#status"),
};

const punctuation = new Set(["。", "、", "，", "．", ".", ",", "」", "』", "）", ")", "】", "〕"]);
const verticalMarks = new Set(["ー", "－", "−", "―", "～", "〜"]);
const smallKana = new Set([
  "ぁ", "ぃ", "ぅ", "ぇ", "ぉ", "っ", "ゃ", "ゅ", "ょ", "ゎ", "ゕ", "ゖ",
  "ァ", "ィ", "ゥ", "ェ", "ォ", "ッ", "ャ", "ュ", "ョ", "ヮ", "ヵ", "ヶ",
]);
let statusTimer;
const stateStorageKey = "kanji-tracing-print";
const templateStorageKey = "kanji-tracing-templates";
const fontStacks = {
  kyokasho: '"UD Digi Kyokasho N-R", "UD デジタル 教科書体 N-R", "BIZ UDPGothic", "Yu Gothic", sans-serif',
  gothic: '"BIZ UDPGothic", "Yu Gothic", "Meiryo", "Noto Sans JP", sans-serif',
  mincho: '"Yu Mincho", "BIZ UDMincho", "MS Mincho", "Noto Serif JP", serif',
  maru: '"Yu Gothic", "Hiragino Maru Gothic ProN", "Meiryo", "Noto Sans JP", sans-serif',
};

function getDirection() {
  return document.querySelector('input[name="direction"]:checked')?.value || "ltr";
}

function getTraceFontStack() {
  return fontStacks[els.fontFamily.value] || fontStacks.kyokasho;
}

function setStatus(message) {
  window.clearTimeout(statusTimer);
  els.status.textContent = message;
  statusTimer = window.setTimeout(() => {
    els.status.textContent = "";
  }, 2800);
}

function normalizeText(text, cols, rows) {
  const columnBreak = "\uE000";
  let source = text.replace(/\r\n?/g, "\n");

  if (els.stripSpaces.checked) {
    source = source.replace(/[ \t　]/g, "");
  }

  if (els.lineBreakColumn.checked) {
    source = source.replace(/\n+/g, columnBreak);
  } else {
    source = source.replace(/\n+/g, "");
  }

  const chars = [];
  let position = 0;
  for (const char of Array.from(source)) {
    if (char === columnBreak) {
      const remainder = position % rows;
      if (remainder !== 0) {
        const blanks = rows - remainder;
        for (let i = 0; i < blanks; i += 1) {
          chars.push("");
          position += 1;
        }
      }
      continue;
    }

    chars.push(char);
    position += 1;
  }

  const perPage = cols * rows;
  const pages = [];
  for (let i = 0; i < Math.max(chars.length, 1); i += perPage) {
    pages.push(chars.slice(i, i + perPage));
  }
  return pages;
}

function makeReadingMarks(cols, direction) {
  return Array.from({ length: cols }, (_, index) => {
    const number = direction === "rtl" ? cols - index : index + 1;
    return String(number);
  });
}

function render() {
  const cols = clampNumber(els.cols.value, 6, 14, 10);
  const rows = clampNumber(els.rows.value, 8, 20, 14);
  const fontSize = clampNumber(els.fontSize.value, 18, 72, 34);
  const smallFontSize = clampNumber(els.smallFontSize.value, 14, 56, 30);
  const punctuationScale = clampNumber(els.punctuationScale.value, 35, 90, 58);
  const fontWeight = clampNumber(els.fontWeight.value, 300, 700, 500);
  const letterSpacing = clampNumber(els.letterSpacing.value, -2, 6, 0);
  const opacity = clampNumber(els.opacity.value, 8, 45, 24) / 100;
  const direction = getDirection();
  const pageData = normalizeText(els.sourceText.value, cols, rows);
  const pageTotal = pageData.length;
  const layout = calculateSheetLayout(cols, rows);

  document.documentElement.style.setProperty("--cols", cols);
  document.documentElement.style.setProperty("--rows", rows);
  document.documentElement.style.setProperty("--cell-w", `${layout.cellSize}mm`);
  document.documentElement.style.setProperty("--cell-h", `${layout.cellSize}mm`);
  document.documentElement.style.setProperty("--ruby-w", `${layout.rubyWidth}mm`);
  document.documentElement.style.setProperty("--grid-width", `${layout.gridWidth}mm`);
  document.documentElement.style.setProperty("--grid-height", `${layout.gridHeight}mm`);
  document.documentElement.style.setProperty("--trace-size", `${fontSize}px`);
  document.documentElement.style.setProperty("--small-trace-size", `${smallFontSize}px`);
  document.documentElement.style.setProperty("--punctuation-size", `${Math.round(fontSize * punctuationScale) / 100}px`);
  document.documentElement.style.setProperty("--trace-font-family", getTraceFontStack());
  document.documentElement.style.setProperty("--trace-font-weight", fontWeight);
  document.documentElement.style.setProperty("--letter-spacing", `${letterSpacing}px`);
  document.documentElement.style.setProperty("--trace-opacity", opacity.toFixed(2));

  els.pages.textContent = "";
  pageData.forEach((chars, pageIndex) => {
    const page = els.pageTemplate.content.firstElementChild.cloneNode(true);
    page.querySelector("[data-name]").textContent = els.studentName.value;
    page.querySelector("[data-date]").textContent = els.worksheetDate.value;
    page.querySelector("[data-page-number]").textContent = `${pageIndex + 1} / ${pageTotal}`;

    const readings = page.querySelector("[data-readings]");
    makeReadingMarks(cols, direction).forEach((mark) => {
      const div = document.createElement("div");
      div.className = "reading-mark";
      div.style.gridColumn = `${readings.children.length * 2 + 1}`;
      div.textContent = mark;
      readings.append(div);
    });

    const grid = page.querySelector("[data-grid]");
    const cells = Array.from({ length: cols * rows }, () => "");
    chars.forEach((char, index) => {
      const col = Math.floor(index / rows);
      const row = index % rows;
      const visualCol = direction === "rtl" ? cols - 1 - col : col;
      cells[row * cols + visualCol] = char;
    });

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        grid.append(createTextCell(cells[row * cols + col]));
        grid.append(createRubyCell());
      }
    }

    els.pages.append(page);
  });

  els.pageCount.textContent = `${pageTotal}枚`;
  saveState();
}

function calculateSheetLayout(cols, rows) {
  const pageWidth = 210;
  const pageHeight = 297;
  const horizontalPadding = 4;
  const verticalPadding = 5;
  const headerAndMarks = 22;
  const rubyWidth = 3.6;
  const availableWidth = pageWidth - horizontalPadding * 2;
  const availableHeight = pageHeight - verticalPadding * 2 - headerAndMarks;
  const widthLimitedSize = (availableWidth - cols * rubyWidth) / cols;
  const heightLimitedSize = availableHeight / rows;
  const cellSize = Math.max(10, Math.min(widthLimitedSize, heightLimitedSize));

  return {
    cellSize: roundMm(cellSize),
    rubyWidth,
    gridWidth: roundMm(cols * (cellSize + rubyWidth)),
    gridHeight: roundMm(rows * cellSize),
  };
}

function roundMm(value) {
  return Math.round(value * 1000) / 1000;
}

function createTextCell(char) {
  const cell = document.createElement("div");
  cell.className = "cell text-cell";
  if (punctuation.has(char)) {
    cell.classList.add("punctuation-mark");
  } else if (verticalMarks.has(char)) {
    cell.classList.add("vertical-mark");
  } else if (smallKana.has(char)) {
    cell.classList.add("small-kana");
  }
  if (char) {
    const span = document.createElement("span");
    span.className = "trace-char";
    span.textContent = char;
    cell.append(span);
  }
  return cell;
}

function createRubyCell() {
  const cell = document.createElement("div");
  cell.className = "ruby-cell";
  return cell;
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}

function getState() {
  return {
    text: els.sourceText.value,
    name: els.studentName.value,
    date: els.worksheetDate.value,
    cols: els.cols.value,
    rows: els.rows.value,
    fontSize: els.fontSize.value,
    smallFontSize: els.smallFontSize.value,
    punctuationScale: els.punctuationScale.value,
    fontFamily: els.fontFamily.value,
    fontWeight: els.fontWeight.value,
    letterSpacing: els.letterSpacing.value,
    opacity: els.opacity.value,
    stripSpaces: els.stripSpaces.checked,
    lineBreakColumn: els.lineBreakColumn.checked,
    direction: getDirection(),
  };
}

function getTemplateSettings() {
  return {
    cols: els.cols.value,
    rows: els.rows.value,
    fontSize: els.fontSize.value,
    smallFontSize: els.smallFontSize.value,
    punctuationScale: els.punctuationScale.value,
    fontFamily: els.fontFamily.value,
    fontWeight: els.fontWeight.value,
    letterSpacing: els.letterSpacing.value,
    opacity: els.opacity.value,
    stripSpaces: els.stripSpaces.checked,
    lineBreakColumn: els.lineBreakColumn.checked,
    direction: getDirection(),
  };
}

function applyState(state) {
  if (!state || typeof state !== "object") {
    return;
  }

  const assignments = [
    ["sourceText", "text"],
    ["studentName", "name"],
    ["worksheetDate", "date"],
    ["cols", "cols"],
    ["rows", "rows"],
    ["fontSize", "fontSize"],
    ["smallFontSize", "smallFontSize"],
    ["punctuationScale", "punctuationScale"],
    ["fontFamily", "fontFamily"],
    ["fontWeight", "fontWeight"],
    ["letterSpacing", "letterSpacing"],
    ["opacity", "opacity"],
  ];
  assignments.forEach(([elementKey, stateKey]) => {
    if (state[stateKey] !== undefined) {
      els[elementKey].value = state[stateKey];
    }
  });

  if (Number(state.fontWeight) > 700) {
    els.fontWeight.value = "700";
  }

  if (state.stripSpaces !== undefined) {
    els.stripSpaces.checked = Boolean(state.stripSpaces);
  }
  if (state.lineBreakColumn !== undefined) {
    els.lineBreakColumn.checked = Boolean(state.lineBreakColumn);
  }
  if (state.direction) {
    const direction = document.querySelector(`input[name="direction"][value="${state.direction}"]`);
    if (direction) {
      direction.checked = true;
    }
  }
}

function encodeState(state) {
  const json = JSON.stringify(state);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeState(value) {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

function saveState() {
  try {
    localStorage.setItem(stateStorageKey, JSON.stringify(getState()));
  } catch {
    // Local storage can be disabled; the app still works without it.
  }
}

function loadInitialState() {
  const hash = window.location.hash.replace(/^#data=/, "");
  if (hash) {
    const decoded = decodeState(hash);
    if (decoded) {
      applyState(decoded);
      return;
    }
  }

  try {
    const saved = localStorage.getItem(stateStorageKey);
    if (saved) {
      applyState(JSON.parse(saved));
    }
  } catch {
    // Ignore broken saved state.
  }
}

function loadTemplates() {
  try {
    const saved = localStorage.getItem(templateStorageKey);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveTemplates(templates) {
  localStorage.setItem(templateStorageKey, JSON.stringify(templates));
}

function refreshTemplateList(selectedName = "") {
  const templates = loadTemplates();
  const names = Object.keys(templates).sort((a, b) => a.localeCompare(b, "ja"));
  els.templateSelect.textContent = "";

  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = names.length ? "選択してください" : "保存されたテンプレートはありません";
  els.templateSelect.append(empty);

  names.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    els.templateSelect.append(option);
  });

  if (selectedName && templates[selectedName]) {
    els.templateSelect.value = selectedName;
  }
}

function saveTemplate() {
  const name = els.templateName.value.trim();
  if (!name) {
    setStatus("保存名を入力してください。");
    els.templateName.focus();
    return;
  }

  const templates = loadTemplates();
  templates[name] = getTemplateSettings();
  saveTemplates(templates);
  refreshTemplateList(name);
  setStatus("テンプレートを保存しました。");
}

function applyTemplate() {
  const name = els.templateSelect.value;
  const templates = loadTemplates();
  if (!name || !templates[name]) {
    setStatus("テンプレートを選んでください。");
    return;
  }

  applyState(templates[name]);
  render();
  setStatus("テンプレートを適用しました。");
}

function deleteTemplate() {
  const name = els.templateSelect.value;
  const templates = loadTemplates();
  if (!name || !templates[name]) {
    setStatus("削除するテンプレートを選んでください。");
    return;
  }

  if (!window.confirm(`テンプレート「${name}」を削除しますか？`)) {
    return;
  }

  delete templates[name];
  saveTemplates(templates);
  refreshTemplateList();
  setStatus("テンプレートを削除しました。");
}

async function copyShareUrl() {
  const encoded = encodeState(getState());
  const base = `${window.location.origin}${window.location.pathname}`;
  const url = `${base}#data=${encoded}`;

  try {
    await navigator.clipboard.writeText(url);
    setStatus("共有URLをコピーしました。");
  } catch {
    window.location.hash = `data=${encoded}`;
    setStatus("URL欄に共有用データを入れました。");
  }
}

function bindEvents() {
  const controls = [
    els.sourceText,
    els.studentName,
    els.worksheetDate,
    els.cols,
    els.rows,
    els.fontSize,
    els.smallFontSize,
    els.punctuationScale,
    els.fontFamily,
    els.fontWeight,
    els.letterSpacing,
    els.opacity,
    els.stripSpaces,
    els.lineBreakColumn,
    ...document.querySelectorAll('input[name="direction"]'),
  ];

  controls.forEach((control) => {
    control.addEventListener("input", render);
    control.addEventListener("change", render);
  });

  els.printBtn.addEventListener("click", () => {
    render();
    window.print();
  });

  els.copyLinkBtn.addEventListener("click", copyShareUrl);
  els.saveTemplateBtn.addEventListener("click", saveTemplate);
  els.applyTemplateBtn.addEventListener("click", applyTemplate);
  els.deleteTemplateBtn.addEventListener("click", deleteTemplate);
  els.templateSelect.addEventListener("change", () => {
    if (els.templateSelect.value) {
      els.templateName.value = els.templateSelect.value;
    }
  });

  els.clearBtn.addEventListener("click", () => {
    els.sourceText.value = "";
    render();
    els.sourceText.focus();
  });
}

loadInitialState();
bindEvents();
refreshTemplateList();
render();
