import { branches, categories } from "./data.js";

const queryInput = document.querySelector("#menu-query");
const filters = document.querySelector("#category-filters");
const results = document.querySelector("#menu-results");
const status = document.querySelector("#menu-status");
const branchResults = document.querySelector("#branch-results");
const items = categories.flatMap(category => category.items.map(entry => ({
  ...(typeof entry === "string" ? { name: entry } : entry),
  categoryId: category.id,
  categoryTitle: category.title
})));

const priceFormat = new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 2 });

let selectedCategory = "featured";

function element(tag, className, label) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (label) node.textContent = label;
  return node;
}

function normalize(value) {
  return value.toLowerCase()
    .replace(/[\u0640\u064b-\u065f\u0670]/gu, "")
    .replace(/[أإآٱ]/gu, "ا")
    .replace(/ى/gu, "ي")
    .replace(/ة/gu, "ه")
    .trim();
}

function renderItem(item) {
  const card = element("article", "menu-card");
  if (item.image) {
    const photo = element("img");
    photo.alt = "";
    photo.loading = "lazy";
    photo.decoding = "async";
    photo.addEventListener("error", () => { photo.hidden = true; }, { once: true });
    photo.src = item.image;
    card.append(photo);
  }
  const body = element("div", "menu-card-body");
  const details = element("div", "menu-card-details");
  const price = item.price == null ? "السعر غير متاح" : priceFormat.format(item.price) + " ر.س";
  details.append(
    element("p", "category-name", item.categoryTitle),
    element("p", item.price == null ? "menu-price unavailable" : "menu-price", price)
  );
  body.append(details, element("h3", "", item.name));
  if (item.description) body.append(element("p", "", item.description));
  card.append(body);
  return card;
}

function renderMenu() {
  const query = normalize(queryInput.value);
  const words = query ? query.split(/\s+/u) : [];
  const visibleItems = items.filter(item => {
    if (selectedCategory !== "featured" && item.categoryId !== selectedCategory) return false;
    if (!words.length) return selectedCategory !== "featured" || item.featured;
    const searchable = normalize([item.name, item.categoryTitle, item.description ?? ""].join(" "));
    return words.every(word => searchable.includes(word));
  });

  if (visibleItems.length === 0) {
    const message = "لم نجد نتائج. جرّب كلمة أخرى أو اختر قسمًا مختلفًا.";
    results.replaceChildren(element("p", "empty-state", message));
    status.textContent = message;
    return;
  }

  const grid = element("div", "menu-grid");
  grid.append(...visibleItems.map(renderItem));
  results.replaceChildren(grid);
  status.textContent = "عدد الأصناف المعروضة: " + new Intl.NumberFormat("ar-SA").format(visibleItems.length);
}

const filterOptions = [{ id: "featured", title: "مختارات" }, ...categories];
for (const option of filterOptions) {
  const button = element("button", "filter", option.title);
  button.type = "button";
  button.dataset.category = option.id;
  button.setAttribute("aria-pressed", String(option.id === selectedCategory));
  filters.append(button);
}

filters.addEventListener("click", event => {
  const button = event.target.closest("button[data-category]");
  if (!button || button.dataset.category === selectedCategory) return;

  filters.querySelector('[aria-pressed="true"]').setAttribute("aria-pressed", "false");
  selectedCategory = button.dataset.category;
  button.setAttribute("aria-pressed", "true");
  renderMenu();
});
queryInput.addEventListener("input", renderMenu);

function renderBranch(branch) {
  const card = element("article", "branch-card");
  const icon = element("span", "branch-mark", "⌖");
  icon.setAttribute("aria-hidden", "true");

  const map = element("a", "button map-link", "عرض على الخريطة");
  map.href = branch.map;
  map.setAttribute("aria-label", branch.name + " على الخريطة");
  const call = element("a", "call-link", "اتصال");
  call.href = "tel:" + branch.phone;
  call.setAttribute("aria-label", "اتصل بـ" + branch.name);

  const actions = element("div", "branch-actions");
  actions.append(map, call);
  card.append(
    icon,
    element("p", "branch-type", branch.type),
    element("h3", "", branch.name),
    element("address", "", branch.address),
    actions
  );
  return card;
}

renderMenu();
branchResults.replaceChildren(...branches.map(renderBranch));
filters.hidden = false;
queryInput.closest(".menu-search").hidden = false;
