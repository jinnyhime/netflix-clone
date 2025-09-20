export class Slider {
  constructor(listEl, options = {}) {
    this.listEl = listEl;
    this.options = {
      visible: 6,
      step: options.step || options.visible || 6,
      infinite: true,
      duration: 300,
      easing: 'ease',
      label: 'slider',
      ...options,
    };

    this._setupDOM();
    this._measure();
    this._cloneForInfinite();
    this._buildControls();
    this._goTo(0, { immediate: true });
    this._bind();
  }

  _setupDOM() {
    this.viewport = document.createElement('div');
    this.viewport.className = 'slider-viewport';
    this.track = document.createElement('div');
    this.track.className = 'slider-track';

    const items = Array.from(this.listEl.children);
    this.items = items;
    items.forEach(li => {
      const wrap = document.createElement('div');
      wrap.className = 'slider-item';
      wrap.appendChild(li);
      this.track.appendChild(wrap);
    });

    this.listEl.replaceWith(this.viewport);
    this.viewport.appendChild(this.track);

    Object.assign(this.viewport.style, {
      overflow: 'hidden',
      position: 'relative',
      width: '100%',
    });
    Object.assign(this.track.style, {
      display: 'flex',
      willChange: 'transform',
      transition: `transform ${this.options.duration}ms ${this.options.easing}`,
    });

    // 키보드 포커스 가능(←/→ 제어)
    this.viewport.tabIndex = 0;
  }

  _measure() {
    const visible = this.options.visible;
    this.itemWidthPercent = 100 / visible;
    Array.from(this.track.children).forEach(it => {
      it.style.flex = `0 0 ${this.itemWidthPercent}%`;
      it.style.maxWidth = `${this.itemWidthPercent}%`;
    });

    this.total = this.items.length;
    this.pageSize = this.options.step;
    this.pageCount = Math.ceil(this.total / this.pageSize);
    this.index = 0;
  }

  _cloneForInfinite() {
    if (!this.options.infinite) return;

    const headClones = [];
    const tailClones = [];
    const children = Array.from(this.track.children);
    const visible = this.options.visible;

    for (let i = 0; i < Math.min(visible, children.length); i++) {
      const tailSrc = children[i].cloneNode(true);
      tailClones.push(tailSrc);
      const headSrc = children[children.length - 1 - i].cloneNode(true);
      headClones.unshift(headSrc);
    }

    headClones.forEach(node => this.track.insertBefore(node, this.track.firstChild));
    tailClones.forEach(node => this.track.appendChild(node));

    this.cloneHeadCount = headClones.length;
    this.cloneTailCount = tailClones.length;
  }

  _buildControls() {
    // 화살표 버튼 (양쪽)
    this.btnPrev = document.createElement('button');
    this.btnNext = document.createElement('button');
    this.btnPrev.className = 'slider-nav slider-prev';
    this.btnNext.className = 'slider-nav slider-next';
    this.btnPrev.setAttribute('aria-label', `${this.options.label} 이전`);
    this.btnNext.setAttribute('aria-label', `${this.options.label} 다음`);
    this.btnPrev.type = 'button';
    this.btnNext.type = 'button';
    this.btnPrev.textContent = '‹';
    this.btnNext.textContent = '›';
    this.viewport.appendChild(this.btnPrev);
    this.viewport.appendChild(this.btnNext);

    // 페이지 인디케이터
    this.indicator = document.createElement('div');
    this.indicator.className = 'slider-indicator';
    const rowEl = this.viewport.parentElement;   // .row
  rowEl.appendChild(this.indicator);
    this._updateIndicator();
  }

  _bind() {
    this.btnPrev.addEventListener('click', () => this.prev());
    this.btnNext.addEventListener('click', () => this.next());

    this.track.addEventListener('transitionend', () => this._onTransitionEnd());

    window.addEventListener('resize', () => {
      const idx = this.index;
      this._measure();
      this._goTo(idx, { immediate: true });
    });

    // 키보드 내비게이션
    this.viewport.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); this.prev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); this.next(); }
    });
  }

  _onTransitionEnd() {
    if (!this.options.infinite) return;

    const maxIndex = Math.ceil(this.total / this.pageSize) - 1;
    if (this.index < 0) {
      this.index = maxIndex;
      this._goTo(this.index, { immediate: true });
    } else if (this.index > maxIndex) {
      this.index = 0;
      this._goTo(this.index, { immediate: true });
    }
  }

  _goTo(pageIndex, { immediate = false } = {}) {
    const step = this.pageSize;
    const headOffsetItems = this.options.infinite ? this.cloneHeadCount : 0;
    const startItemIndex = headOffsetItems + pageIndex * step;
    const translatePercent = -(startItemIndex * this.itemWidthPercent);

    if (immediate) {
      const prev = this.track.style.transition;
      this.track.style.transition = 'none';
      this.track.style.transform = `translateX(${translatePercent}%)`;
      void this.track.offsetWidth;
      this.track.style.transition = prev;
    } else {
      this.track.style.transform = `translateX(${translatePercent}%)`;
    }

    this.index = pageIndex;
    this._updateIndicator();
  }

  next() { this._goTo(this.index + 1); }
  prev() { this._goTo(this.index - 1); }

    _updateIndicator() {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < this.pageCount; i++) {
      const dot = document.createElement('span');
      dot.className = 'dot' + (i === this.index ? ' is-active' : '');
      frag.appendChild(dot);
    }
    this.indicator.replaceChildren(frag);
  }

}
