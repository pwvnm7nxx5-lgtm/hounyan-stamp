const STORAGE_KEY = "renrakucho-maker-v1";

const defaultState = {
  month: "",
  day: "",
  weekday: "",
  body: "",
  opacity: 34,
  fontWeight: 400,
  letterSpacing: 4,
  circleTemplates: [
    { id: "circle-shi", name: "し○", token: "[丸:し]" },
    { id: "circle-te", name: "て○", token: "[丸:て]" },
  ],
  textTemplates: [],
};

const elements = {
  month: document.querySelector("#monthInput"),
  day: document.querySelector("#dayInput"),
  weekday: document.querySelector("#weekdayInput"),
  body: document.querySelector("#bodyInput"),
  opacity: document.querySelector("#opacityInput"),
  fontWeight: document.querySelector("#fontWeightInput"),
  letterSpacing: document.querySelector("#letterSpacingInput"),
  previewMonth: document.querySelector("#previewMonth"),
  previewDay: document.querySelector("#previewDay"),
  previewWeekday: document.querySelector("#previewWeekday"),
  previewText: document.querySelector("#previewText"),
  printPage: document.querySelector("#printPage"),
  printButton: document.querySelector("#printButton"),
  circleChar: document.querySelector("#circleCharInput"),
  insertCircle: document.querySelector("#insertCircleButton"),
  circleTemplateName: document.querySelector("#circleTemplateName"),
  saveCircleTemplate: document.querySelector("#saveCircleTemplateButton"),
  circleTemplateList: document.querySelector("#circleTemplateList"),
  squareNumber: document.querySelector("#squareNumberInput"),
  insertSquareNumber: document.querySelector("#insertSquareNumberButton"),
  rangeStart: document.querySelector("#rangeStartInput"),
  rangeEnd: document.querySelector("#rangeEndInput"),
  insertRange: document.querySelector("#insertRangeButton"),
  circledNumberList: document.querySelector("#circledNumberList"),
  textTemplateName: document.querySelector("#textTemplateName"),
  saveTextTemplate: document.querySelector("#saveTextTemplateButton"),
  textTemplateList: document.querySelector("#textTemplateList"),
};

let state = loadState();

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(defaultState));
}

function makeId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return cloneDefaultState();
  }

  try {
    const parsed = JSON.parse(saved);
    return {
      ...cloneDefaultState(),
      ...parsed,
      circleTemplates: parsed.circleTemplates?.length
        ? parsed.circleTemplates
        : cloneDefaultState().circleTemplates,
      textTemplates: parsed.textTemplates || [],
    };
  } catch {
    return cloneDefaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function syncInputs() {
  elements.month.value = state.month;
  elements.day.value = state.day;
  elements.weekday.value = state.weekday;
  elements.body.value = state.body;
  elements.opacity.value = state.opacity;
  elements.fontWeight.value = state.fontWeight;
  elements.letterSpacing.value = state.letterSpacing;
}

function render() {
  elements.previewMonth.textContent = state.month;
  elements.previewDay.textContent = state.day;
  elements.previewWeekday.textContent = state.weekday;
  elements.previewText.replaceChildren(...parseBody(state.body));
  elements.previewText.style.setProperty("--preview-opacity", Number(state.opacity) / 100);
  elements.previewText.style.setProperty("--preview-weight", state.fontWeight);
  elements.previewText.style.setProperty("--preview-spacing", `${state.letterSpacing}px`);
  renderCircleTemplates();
  renderNumberButtons();
  renderTextTemplates();
  saveState();
}

function parseBody(text) {
  const nodes = [];
  const tokenPattern = /\[(丸|四角):([^\]]{1,2})\]/g;
  let lastIndex = 0;
  let match;

  while ((match = tokenPattern.exec(text)) !== null) {
    appendPlainText(nodes, text.slice(lastIndex, match.index));
    const span = document.createElement("span");
    span.className = match[1] === "丸" ? "circled-char" : "square-number";
    span.textContent = match[2];
    nodes.push(span);
    lastIndex = tokenPattern.lastIndex;
  }

  appendPlainText(nodes, text.slice(lastIndex));
  return nodes.length ? nodes : [document.createTextNode("")];
}

function appendPlainText(nodes, text) {
  if (!text) {
    return;
  }
  nodes.push(document.createTextNode(text));
}

function renderCircleTemplates() {
  elements.circleTemplateList.replaceChildren();
  state.circleTemplates.forEach((template) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.dataset.id = template.id;

    const action = document.createElement("button");
    action.className = "chip-action";
    action.type = "button";

    const label = document.createElement("span");
    label.textContent = template.name;
    action.append(label);
    action.addEventListener("click", () => insertAtCursor(template.token));
    chip.append(action);

    const remove = document.createElement("button");
    remove.className = "delete-button";
    remove.type = "button";
    remove.textContent = "×";
    remove.ariaLabel = `${template.name}を削除`;
    remove.addEventListener("click", () => {
      state.circleTemplates = state.circleTemplates.filter((item) => item.id !== template.id);
      render();
    });

    chip.append(remove);
    elements.circleTemplateList.append(chip);
  });
}

function renderNumberButtons() {
  const circledNumbers = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];
  elements.circledNumberList.replaceChildren();

  circledNumbers.forEach((number) => {
    const button = document.createElement("button");
    button.className = "symbol-button";
    button.type = "button";
    button.textContent = number;
    button.addEventListener("click", () => insertAtCursor(number));
    elements.circledNumberList.append(button);
  });
}

function renderTextTemplates() {
  elements.textTemplateList.replaceChildren();

  if (!state.textTemplates.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "未保存";
    elements.textTemplateList.append(empty);
    return;
  }

  state.textTemplates.forEach((template) => {
    const chip = document.createElement("div");
    chip.className = "template-chip";

    const action = document.createElement("button");
    action.className = "chip-action";
    action.type = "button";

    const label = document.createElement("span");
    label.textContent = template.name;
    action.append(label);
    action.addEventListener("click", () => {
      state.body = template.body;
      elements.body.value = state.body;
      render();
    });
    chip.append(action);

    const remove = document.createElement("button");
    remove.className = "delete-button";
    remove.type = "button";
    remove.textContent = "×";
    remove.ariaLabel = `${template.name}を削除`;
    remove.addEventListener("click", () => {
      state.textTemplates = state.textTemplates.filter((item) => item.id !== template.id);
      render();
    });

    chip.append(remove);
    elements.textTemplateList.append(chip);
  });
}

function insertAtCursor(text) {
  const input = elements.body;
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  const before = input.value.slice(0, start);
  const after = input.value.slice(end);

  input.value = `${before}${text}${after}`;
  input.focus();
  input.selectionStart = start + text.length;
  input.selectionEnd = start + text.length;
  state.body = input.value;
  render();
}

function makeCircleToken(characters) {
  const clean = characters.trim();
  if (!clean) {
    return "";
  }
  return `[丸:${Array.from(clean).slice(0, 2).join("")}]`;
}

function makeSquareNumberToken(value) {
  const clean = String(value).replace(/\D/g, "").slice(0, 2);
  if (!clean) {
    return "";
  }
  return `[四角:${clean}]`;
}

function circledNumber(value) {
  const number = Number.parseInt(value, 10);
  const circledNumbers = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];
  return circledNumbers[number - 1] || "";
}

function addCircleTemplate() {
  const token = makeCircleToken(elements.circleChar.value);
  if (!token) {
    return;
  }

  const displayChar = token.match(/\[丸:([^\]]+)\]/)?.[1] || elements.circleChar.value.trim();
  const name = elements.circleTemplateName.value.trim() || `${displayChar}○`;
  state.circleTemplates = [
    ...state.circleTemplates.filter((item) => item.name !== name),
    { id: makeId("circle"), name, token },
  ];
  elements.circleTemplateName.value = "";
  render();
}

function insertSquareNumber() {
  const token = makeSquareNumberToken(elements.squareNumber.value);
  if (token) {
    insertAtCursor(token);
  }
}

function insertRange() {
  const start = circledNumber(elements.rangeStart.value);
  const end = circledNumber(elements.rangeEnd.value);
  if (start && end) {
    insertAtCursor(`${start}～${end}`);
  }
}

function addTextTemplate() {
  const name = elements.textTemplateName.value.trim();
  const body = elements.body.value;
  if (!name || !body.trim()) {
    return;
  }

  state.textTemplates = [
    ...state.textTemplates.filter((item) => item.name !== name),
    { id: makeId("text"), name, body },
  ];
  elements.textTemplateName.value = "";
  render();
}

function bindInputs() {
  [
    ["month", "month"],
    ["day", "day"],
    ["weekday", "weekday"],
    ["body", "body"],
    ["opacity", "opacity"],
    ["fontWeight", "fontWeight"],
    ["letterSpacing", "letterSpacing"],
  ].forEach(([key, elementKey]) => {
    elements[elementKey].addEventListener("input", (event) => {
      state[key] = event.target.value;
      render();
    });
  });

  elements.insertCircle.addEventListener("click", () => {
    const token = makeCircleToken(elements.circleChar.value);
    if (token) {
      insertAtCursor(token);
    }
  });

  elements.saveCircleTemplate.addEventListener("click", addCircleTemplate);
  elements.insertSquareNumber.addEventListener("click", insertSquareNumber);
  elements.insertRange.addEventListener("click", insertRange);
  elements.saveTextTemplate.addEventListener("click", addTextTemplate);
  elements.printButton.addEventListener("click", () => window.print());
}

syncInputs();
bindInputs();
render();
