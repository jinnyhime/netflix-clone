import { ModalHover } from './modal.js';
import { Slider } from './slider.js';

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
          <img src="images/card-01.jpg" alt="">
          <div><p>넷플릭스 '신규 콘텐츠 가이드'</p><small>2주 전</small></div>
        </li>
        <li class="notif">
          <img src="images/card-03.jpg" alt="">
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
        <img class="avatar" src="images/profile.jpg" alt="" aria-hidden="true"> 원진1234
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


document.querySelectorAll('.row').forEach((row, idx) => {
  const list = row.querySelector('.cards');
  if (!list) return;

  const visible = Number(row.dataset.visible || 6);
  const step = Number(row.dataset.step || visible);
  row.style.setProperty('--cols', String(visible));
  const slider = new Slider(list, {
    visible,
    step,
    infinite: true,
    duration: 300,
    easing: 'ease',
    label: `row-${idx + 1}`,
  });
});
