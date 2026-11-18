import { branches } from "./data.js";

const branchSelect = document.querySelector("#menu-branch");
const menuTitle = document.querySelector("#menu-title");
const menuSource = document.querySelector("#menu-source");
const queryInput = document.querySelector("#menu-query");
const search = queryInput.closest(".menu-search");
const filters = document.querySelector("#category-filters");
const results = document.querySelector("#menu-results");
const status = document.querySelector("#menu-status");
const branchResults = document.querySelector("#branch-results");
const priceFormat = new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 2 });

let selectedCategory = "featured";
let items = [];

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
  if (item.imageReference) body.append(element("p", "image-reference", "صورة مرجعية للصنف من فرع آخر"));
  card.append(body);
  return card;
}

function renderMenu() {
  if (items.length === 0) return;

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
  status.textContent = "عدد الأصناف المعروضة: " + priceFormat.format(visibleItems.length);
}

function renderFilters(categories) {
  const options = [{ id: "featured", title: "مختارات" }, ...categories];
  const buttons = options.map(option => {
    const button = element("button", "filter", option.title);
    button.type = "button";
    button.dataset.category = option.id;
    button.setAttribute("aria-pressed", String(option.id === selectedCategory));
    return button;
  });
  filters.replaceChildren(...buttons);
  filters.scrollLeft = 0;
}

function renderPhotoMenu(branch) {
  const photo = element("img");
  photo.alt = "صورة قائمة " + branch.name;
  photo.loading = "lazy";
  photo.decoding = "async";
  photo.addEventListener("error", () => { photo.hidden = true; }, { once: true });
  photo.src = branch.menu.image;

  const link = element("a", "button branch-menu-link", "افتح صورة القائمة بالحجم الكامل");
  link.href = branch.menu.image;
  const caption = element("figcaption");
  caption.append(link);
  const figure = element("figure", "photo-menu");
  figure.append(photo, caption);
  results.replaceChildren(figure);
  status.textContent = "صورة قائمة " + branch.name;
}

function renderBranchMenu(branch) {
  const { menu } = branch;
  menuTitle.textContent = "قائمة " + branch.name;
  branchSelect.value = branch.id;
  document.getElementById("current-branch").textContent = branch.name;
  document.querySelectorAll("[data-branch-choice]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.branchChoice===branch.id)));
  queryInput.value = "";
  selectedCategory = "featured";
  items = (menu.categories ?? []).flatMap(category => category.items.map(item => ({
    ...item,
    categoryId: category.id,
    categoryTitle: category.title
  })));
  const hasCatalog = items.length > 0;
  search.hidden = !hasCatalog;
  filters.hidden = !hasCatalog;
  document.querySelector("#filter-strip").hidden = !hasCatalog;

  const message = branch.id==="hail" ? "قائمة جزئية وأسعار توصيل مرجعية؛ بعض الصور من أصناف مطابقة في فروع أخرى. " : hasCatalog
    ? "الأسعار والتوفّر بحسب قائمة التوصيل المنشورة لهذا الفرع. "
    : "صورة نشرها زائر. للاستفسار عن الأسعار الحالية، اتصل بالفرع. ";
  const source = element("a", "", menu.sourceLabel + " ↗");
  source.href = menu.source;
  menuSource.replaceChildren(document.createTextNode(message), source);
  menuSource.hidden = false;

  if (hasCatalog) {
    renderFilters(menu.categories);
    renderMenu();
  } else {
    filters.replaceChildren();
    renderPhotoMenu(branch);
  }
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
  const menu = element("a", "button branch-menu-link", "عرض المنيو");
  menu.href = "?branch=" + encodeURIComponent(branch.id) + "#menu";
  menu.setAttribute("aria-label", "عرض قائمة " + branch.name);
  actions.append(menu, map);
  if (branch.phone) actions.append(call);
  card.append(
    icon,
    element("p", "branch-type", branch.type),
    element("h3", "", branch.name),
    element("address", "", branch.address),
    actions
  );
  return card;
}

for (const branch of branches) {
  const option = element("option", "", branch.name);
  option.value = branch.id;
  branchSelect.append(option);
}

branchSelect.addEventListener("change", () => {
  const branch = branches.find(entry => entry.id === branchSelect.value);
  const url = new URL(window.location.href);
  url.searchParams.set("branch", branch.id);
  window.history.replaceState(null, "", url);
  renderBranchMenu(branch);
});

const branchId = new URL(window.location.href).searchParams.get("branch");
const initialBranch = branches.find(branch => branch.id === branchId) ?? branches[0];
renderBranchMenu(initialBranch);
branchSelect.closest(".branch-picker").hidden = false;
branchResults.replaceChildren(...branches.map(renderBranch));

// Physical arrows work with RTL scroll coordinates; touch scrolling is native.
for (const [id, direction] of [["scroll-right",1],["scroll-left",-1]]) document.getElementById(id).addEventListener("click",()=>filters.scrollBy({left:direction*Math.max(120,filters.clientWidth*0.65),behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"}));
const locate=document.getElementById("locate-branch"), locStatus=document.getElementById("location-status");
let manualChoice=false;branchSelect.addEventListener("change",()=>{manualChoice=true});
const cityPoints=[{id:"hail",lat:27.5114,lon:41.7208},{id:"buhayrah",lat:24.0683919,lon:38.0944172}];
const distance=(lat,lon,p)=>{const r=Math.PI/180,a=Math.sin((p.lat-lat)*r/2)**2+Math.cos(lat*r)*Math.cos(p.lat*r)*Math.sin((p.lon-lon)*r/2)**2;return 6371*2*Math.asin(Math.min(1,Math.sqrt(a)))};
function locateBranch(auto=false){if(!navigator.geolocation){locStatus.textContent="الموقع غير مدعوم؛ اختر الفرع يدوياً.";return}locate.disabled=true;locStatus.textContent="جارٍ تحديد المدينة…";navigator.geolocation.getCurrentPosition(pos=>{locate.disabled=false;if(auto&&manualChoice){locStatus.textContent="تم الاحتفاظ باختيارك.";return}const {latitude,longitude}=pos.coords;const nearest=cityPoints.map(p=>({...p,km:distance(latitude,longitude,p)})).sort((a,b)=>a.km-b.km)[0];if(nearest.km>100){locStatus.textContent="أنت خارج نطاق المدن الحالية؛ اختر الفرع يدوياً.";return}const chosen=branches.find(b=>b.id===nearest.id);branchSelect.value=chosen.id;const u=new URL(location.href);u.searchParams.set("branch",chosen.id);history.replaceState(null,"",u);renderBranchMenu(chosen);locStatus.textContent=nearest.id==="hail"?"تم اختيار حائل حسب موقعك.":"تم اختيار ينبع (البحيرة افتراضياً؛ اختر فرعك داخل المدينة).";if(!auto)document.getElementById("menu").scrollIntoView({block:"start"});},()=>{locate.disabled=false;locStatus.textContent="تعذر تحديد الموقع؛ يمكنك اختيار الفرع يدوياً.";},{enableHighAccuracy:false,timeout:8000,maximumAge:300000})}
locate.addEventListener("click",()=>locateBranch());if(!branchId&&navigator.permissions)navigator.permissions.query({name:"geolocation"}).then(p=>{if(p.state==="granted"&&!manualChoice)locateBranch(true)}).catch(()=>{});

const trigger=document.getElementById("branch-trigger"), options=document.getElementById("branch-options"), manual=document.getElementById("manual-branches");
function togglePicker(open){options.hidden=!open;trigger.setAttribute("aria-expanded",String(open));}
trigger.addEventListener("click",()=>togglePicker(options.hidden));
for(const branch of branches){const b=element("button","branch-choice");b.type="button";b.dataset.branchChoice=branch.id;b.setAttribute("aria-pressed",String(branchSelect.value===branch.id));const pin=element("span","pin-icon");pin.setAttribute("aria-hidden","true");b.append(pin,element("span","",branch.name));b.addEventListener("click",()=>{manualChoice=true;branchSelect.value=branch.id;branchSelect.dispatchEvent(new Event("change"));togglePicker(false);trigger.focus();});manual.append(b);}
document.addEventListener("click",e=>{if(!e.target.closest(".header-picker"))togglePicker(false)});document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!options.hidden){togglePicker(false);trigger.focus()}});
