// ===== util: debounce =====
function debounce(fn, delay = 500) {
  let t = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

// ===== recent keywords (localStorage) =====
const RECENT_KEY = "recent_keywords";
const RECENT_LIMIT = 5;
const loadRecent = () => { try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch { return []; } };
const saveRecent = (list) => localStorage.setItem(RECENT_KEY, JSON.stringify(list));
function upsertRecent(k) {
  const key = (k || "").trim();
  if (!key) return loadRecent();
  const list = loadRecent().filter(v => v !== key);
  list.unshift(key);
  const trimmed = list.slice(0, RECENT_LIMIT);
  saveRecent(trimmed);
  return trimmed;
}

// ===== API =====
const API_BASE = "http://localhost:3001"; // 프록시 쓰면 "" 로
async function searchTitles(q) {
  if (!q) return { items: [], total: 0 };
  const r = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(q)}`);
  if (!r.ok) throw new Error("Search failed");
  return r.json();
}

// ===== view helpers =====
const card = (it) => `
  <li class="card" data-id="${it.id || ''}">
    <a href="#" class="card__link" aria-label="${it.name}">
      <img src="${it.image}" alt="${it.alt || it.name}">
    </a>
  </li>
`;

function renderList(ul, items) {
  ul.innerHTML = items.map(card).join("");
}

function renderRecent(layer, list) {
  layer.innerHTML = list.length
    ? list.map(k => `<li class="recent-item" data-k="${k}">${k}</li>`).join("")
    : `<li class="recent-empty">최근 검색어가 없습니다</li>`;
}

function setExpanded(wrapper, on) {
  wrapper.classList.toggle("expanded", on);
}

function showSearchPage({ items }) {
  const page = document.getElementById("search-results");
  const ul   = page.querySelector(".search-cards");
  const empty= page.querySelector(".search-empty");

  renderList(ul, items);
  empty.hidden = items.length !== 0;

  page.hidden = false;
  // 메인 컨텐츠 숨김
  const hero = document.querySelector(".hero");
  const rows = document.getElementById("rows");
  if (hero) hero.hidden = true;
  if (rows) rows.hidden = true;
}

function hideSearchPage() {
  const page = document.getElementById("search-results");
  if (page) page.hidden = true;
  const hero = document.querySelector(".hero");
  const rows = document.getElementById("rows");
  if (hero) hero.hidden = false;
  if (rows) rows.hidden = false;
}

// ===== controller =====
export function initSearch() {
  const wrap   = document.querySelector(".search-wrap");
  if (!wrap) return;

  const input   = wrap.querySelector("input[type='search']");
  const form    = wrap.querySelector("form");
  const recent  = wrap.querySelector(".recent-layer");
  const magBtn  = document.querySelector("#btn-search");
  const resultsPage = document.getElementById("search-results");

  // 접힘 시 입력도 비울지 여부 (원하면 true로)
  const CLEAR_INPUT_ON_COLLAPSE = false;

  // 최근검색 초기 렌더
  renderRecent(recent, loadRecent());

  const run = debounce(async () => {
    const q = input.value.trim();
    if (!q) {
      hideSearchPage();
      return;
    }
    try {
      const data = await searchTitles(q);
      showSearchPage(data);
    } catch (err) {
      console.error(err);
    }
  }, 500);

  function expandSearch() {
    setExpanded(wrap, true);
  }

  function collapseSearch() {
    setExpanded(wrap, false);
    recent.hidden = true;
    if (CLEAR_INPUT_ON_COLLAPSE) input.value = "";
    // 검색 페이지 숨김(입력 비우지 않았을 때도 원복하도록)
    hideSearchPage();
  }

  // --- Handlers ---
  function onMagnifier() {
    expandSearch();
    input.focus();
  }

  function onInput() { run(); }

  function onFocus() {
    renderRecent(recent, loadRecent());
    recent.hidden = false;
  }

  function onBlur() {
    // 최근검색 레이어 클릭 선택 여유
    setTimeout(() => { recent.hidden = true; }, 150);
  }

  function onSubmit(e){
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    upsertRecent(q);
    renderRecent(recent, loadRecent());
    // 즉시 검색
    (async () => {
      try {
        const data = await searchTitles(q);
        showSearchPage(data);
      } catch (err) { console.error(err); }
    })();
  }

  // 결과 카드 클릭: 예시로 Hero 교체
  resultsPage?.addEventListener("click", (e) => {
    const li = e.target.closest(".card");
    if (!li) return;
    e.preventDefault();
    const img = li.querySelector("img");
    const name = img?.alt || "";
    const heroImg   = document.getElementById("hero-img");
    const heroTitle = document.getElementById("hero-title");
    if (heroImg && img) heroImg.src = img.src;
    if (heroTitle) heroTitle.textContent = name;
  });

  // --- Outside click to collapse ---
  document.addEventListener("click", (e) => {
    const t = e.target;
    const clickedInsideSearch = wrap.contains(t);
    const clickedButton = t.closest?.("#btn-search");
    if (!clickedInsideSearch && !clickedButton) {
      collapseSearch();
    }
  });

  // --- ESC to collapse ---
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      collapseSearch();
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  });

  // --- Bindings ---
  magBtn?.addEventListener("click", onMagnifier);
  input.addEventListener("input", onInput);
  input.addEventListener("focus", onFocus);
  input.addEventListener("blur", onBlur);
  form.addEventListener("submit", onSubmit);
}
