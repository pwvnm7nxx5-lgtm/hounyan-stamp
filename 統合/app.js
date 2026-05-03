const apps = Array.isArray(window.INTEGRATED_APPS) ? window.INTEGRATED_APPS : [];

const elements = {
  appCount: document.querySelector("#appCount"),
  appGrid: document.querySelector("#appGrid"),
  emptyState: document.querySelector("#emptyState"),
  searchInput: document.querySelector("#searchInput"),
  categoryFilters: document.querySelector("#categoryFilters"),
};

let selectedCategory = "all";

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function getCategories() {
  return ["all", ...new Set(apps.map((app) => app.category).filter(Boolean))];
}

function matchesApp(app, query) {
  if (!query) {
    return true;
  }

  const searchable = [
    app.title,
    app.description,
    app.category,
    ...(Array.isArray(app.tags) ? app.tags : []),
  ].join(" ");

  return normalizeText(searchable).includes(query);
}

function makeCategoryButton(category) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "filter-button";
  button.dataset.category = category;
  button.textContent = category === "all" ? "すべて" : category;
  button.setAttribute("aria-pressed", String(category === selectedCategory));
  button.addEventListener("click", () => {
    selectedCategory = category;
    render();
  });
  return button;
}

function makeAppCard(app) {
  const article = document.createElement("article");
  article.className = "app-card";
  article.style.setProperty("--accent", app.accent || "#2f6f8f");

  const mark = document.createElement("div");
  mark.className = "app-mark";
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = app.title.slice(0, 1);

  const body = document.createElement("div");
  body.className = "app-card-body";

  const meta = document.createElement("div");
  meta.className = "meta-row";

  const category = document.createElement("span");
  category.className = "category";
  category.textContent = app.category || "その他";
  meta.append(category);

  const status = document.createElement("span");
  status.className = "ready";
  status.textContent = app.status === "ready" ? "利用可" : app.status || "";
  if (status.textContent) {
    meta.append(status);
  }

  const title = document.createElement("h2");
  title.textContent = app.title;

  const description = document.createElement("p");
  description.textContent = app.description;

  const tags = document.createElement("div");
  tags.className = "tag-row";
  (app.tags || []).forEach((tag) => {
    const span = document.createElement("span");
    span.textContent = tag;
    tags.append(span);
  });

  const link = document.createElement("a");
  link.className = "launch-link";
  link.href = app.href;
  link.textContent = app.actionLabel || "開く";

  body.append(meta, title, description, tags, link);
  article.append(mark, body);
  return article;
}

function getVisibleApps() {
  const query = normalizeText(elements.searchInput.value);
  return apps.filter((app) => {
    const categoryMatches = selectedCategory === "all" || app.category === selectedCategory;
    return categoryMatches && matchesApp(app, query);
  });
}

function renderCategories() {
  elements.categoryFilters.replaceChildren(...getCategories().map(makeCategoryButton));
}

function renderApps() {
  const visibleApps = getVisibleApps();
  elements.appCount.textContent = String(apps.length);
  elements.appGrid.replaceChildren(...visibleApps.map(makeAppCard));
  elements.emptyState.hidden = visibleApps.length > 0;
}

function render() {
  renderCategories();
  renderApps();
}

elements.searchInput.addEventListener("input", renderApps);
render();
