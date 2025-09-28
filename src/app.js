// src/app.js
import { ModalHover } from './modal.js';
import { Slider } from './slider.js';

// 휘발성 좋아요 상태 (새로고침/서버 재시작 시 초기화)
const likes = new Set();

// 하트 버튼 템플릿 (테두리 → 클릭시 채움)
const likeBtn = (pressed) => `
  <button class="card__like" data-like aria-pressed="${pressed ? 'true' : 'false'}" title="${pressed ? '좋아요 취소' : '좋아요'}" aria-label="좋아요">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s-6.7-4.35-9.33-7.24C.5 11.38.5 8.5 2.34 6.66c1.83-1.83 4.68-1.83 6.5 0L12 9.82l3.16-3.16c1.83-1.83 4.68-1.83 6.5 0 1.84 1.84 1.84 4.72 0 6.46C18.7 16.65 12 21 12 21z"></path>
    </svg>
  </button>
`;

// 카드/로우 템플릿
const card = (it) => `
  <li class="card" data-id="${it.id}">
    <a href="#" class="card__link" aria-label="${it.title}">
      <img src="${it.img}" alt="${it.alt || it.title}">
    </a>
    ${likeBtn(likes.has(it.id))}
  </li>
`;

const row = (r) => `
  <section class="row" data-visible="${r.visible ?? 6}" data-step="${r.step ?? r.visible ?? 6}" aria-labelledby="row-${r.id}-title">
    <h2 id="row-${r.id}-title" class="row__title">${r.title}</h2>
    <ul class="cards">${r.items.map(card).join('')}</ul>
  </section>
`;

async function start() {
  // 1) 데이터 가져오기
  const res = await fetch('/data/home.json', { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('home.json fetch failed');
  const data = await res.json();

  // 2) Hero 채우기
  const heroImg = document.getElementById('hero-img');
  const heroTitle = document.getElementById('hero-title');
  const heroDesc = document.getElementById('hero-desc');
  heroImg.src = data.hero.image;
  heroImg.alt = data.hero.alt || data.hero.title;
  heroTitle.textContent = data.hero.title;
  heroDesc.textContent = data.hero.desc;

  // 3) Rows 채우기
  const rowsMount = document.getElementById('rows');
  rowsMount.innerHTML = data.rows.map(row).join('');

  // 4) 좋아요: 이벤트 위임 (클릭/키보드)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-like]');
    if (!btn) return;

    e.preventDefault(); // a 클릭 방지
    e.stopPropagation();

    const cardEl = btn.closest('.card');
    const id = cardEl?.dataset.id;
    if (!id) return;

    const on = likes.has(id) ? (likes.delete(id), false) : (likes.add(id), true);
    btn.setAttribute('aria-pressed', String(on));
    btn.title = on ? '좋아요 취소' : '좋아요';
    cardEl.classList.toggle('is-liked', on);
  });

  document.addEventListener('keydown', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.matches('[data-like]')) return;
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    target.click();
  });

  // 5) 슬라이더 초기화 
  document.querySelectorAll('.row').forEach((rowEl, idx) => {
    const list = rowEl.querySelector('.cards');
    if (!list) return;
    const visible = Number(rowEl.dataset.visible || 6);
    const step = Number(rowEl.dataset.step || visible);
    rowEl.style.setProperty('--cols', String(visible));
    new Slider(list, {
      visible,
      step,
      infinite: true,
      duration: 300,
      easing: 'ease',
      label: `row-${idx + 1}`,
    });
  });

  // 6) 모달/메뉴 (이미지 경로 절대경로로 수정)
  const modal = new ModalHover({
    offset: 10,
    hoverDelayOpen: 80,
    hoverDelayClose: 120,
    closeOnOutsideClick: false,
  });

  modal.register('#btn-noti', {
    id: 'noti-popover',
    role: 'dialog',
    trigger: 'hover',
    className: 'popover--panel',
    placement: 'bottom-end',
    render: () => `
      <div class="popover">
        <div class="popover__header">알림</div>
        <ul class="popover__list">
          <li class="notif">
            <img src="/images/card-01.jpg" alt="">
            <div><p>넷플릭스 '신규 콘텐츠 가이드'</p><small>2주 전</small></div>
          </li>
          <li class="notif">
            <img src="/images/card-03.jpg" alt="">
            <div><p>대한민국의 TOP 10 시리즈</p><small>3주 전</small></div>
          </li>
        </ul>
      </div>
    `,
  });

  modal.register('#btn-profile', {
    id: 'profile-menu',
    role: 'menu',
    trigger: 'hover',
    className: 'popover--menu',
    placement: 'bottom-end',
    render: () => `
      <div class="popover" role="menu">
        <button role="menuitem" class="menuitem">
          <img class="avatar" src="/images/profile.jpg" alt="" aria-hidden="true"> 원진1234
        </button>
        <button role="menuitem" class="menuitem">프로필 관리</button>
        <button role="menuitem" class="menuitem">프로필 이전</button>
        <button role="menuitem" class="menuitem">계정</button>
        <button role="menuitem" class="menuitem">고객 센터</button>
        <hr class="sep"/>
        <button role="menuitem" class="menuitem">넷플릭스에서 로그아웃</button>
      </div>
    `,
  });
}

// DOM 준비 후 시작
document.addEventListener('DOMContentLoaded', () => {
  start().catch((err) => {
    console.error(err);
    const mount = document.getElementById('rows');
    if (mount) mount.innerHTML = `<p role="alert">데이터를 불러오지 못했습니다.</p>`;
  });
});
