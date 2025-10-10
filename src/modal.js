export class ModalHover {
  constructor(opts = {}) {
    this.options = {
      hoverDelayOpen: 80,
      hoverDelayClose: 120,
      offset: 8,
      closeOnOutsideClick: false,
      ...opts,
    };
    this.registry = new Map();
    this.current = null;

    this._onDocKeydown = this._onDocKeydown.bind(this);
    this._onScrollResize = this._onScrollResize.bind(this);

    document.addEventListener('keydown', this._onDocKeydown);
  }

  register(selector, cfg) {
    const trigger = document.querySelector(selector);
    if (!trigger) return;

    const config = { trigger: 'hover', role: 'dialog', fixed: false, ...cfg };

    const state = { trigger, config, timers: { open: null, close: null }, panel: null };
    this.registry.set(trigger, state);

    trigger.setAttribute('aria-haspopup', config.role);
    trigger.setAttribute('aria-expanded', 'false');
    if (config.id) trigger.setAttribute('aria-controls', config.id);

    trigger.addEventListener('mouseenter', () => this._queueOpen(state));
    trigger.addEventListener('mouseleave', () => this._queueClose(state));
    trigger.addEventListener('focus', () => this._open(state));
    trigger.addEventListener('blur', () => this._queueClose(state));
  }

  _ensurePanel(state) {
    const { config } = state;
    let panel = document.getElementById(config.id);
    if (!panel) {
      panel = document.createElement('div');
      panel.id = config.id;
      panel.className = `popover-container ${config.className || ''}`.trim();
      panel.setAttribute('role', config.role);
      panel.hidden = true;
      panel.innerHTML =
        typeof config.render === 'function' ? config.render() : (config.render || '');
      document.body.appendChild(panel);

      panel.addEventListener('mouseenter', () => clearTimeout(state.timers.close));
      panel.addEventListener('mouseleave', () => this._queueClose(state));
    }
    state.panel = panel;
  }

  _queueOpen(s) { clearTimeout(s.timers.close); s.timers.open  = setTimeout(() => this._open(s),  this.options.hoverDelayOpen); }
  _queueClose(s){ clearTimeout(s.timers.open);  s.timers.close = setTimeout(() => this._close(s), this.options.hoverDelayClose); }

  // 위치 재계산(스크롤/리사이즈에서 호출)
  _reposition(state) {
    if (!state?.panel || state.panel.hidden) return;
    const { trigger, panel, config } = state;
    const rect = trigger.getBoundingClientRect();
    const offset = this.options.offset;

    // fixed 모드: 뷰포트 좌표 그대로 사용(스크롤 보정 불필요)
    if (config.fixed) {
      const top = Math.round(rect.bottom + offset);
      const left = Math.round(rect.right);
      Object.assign(panel.style, {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
      });
    } else {
      // absolute 모드(기존 동작)
      const scrollX = window.scrollX || document.documentElement.scrollLeft;
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const top = Math.round(rect.bottom + offset + scrollY);
      const left = Math.round(rect.right + scrollX);
      Object.assign(panel.style, {
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
      });
    }

    // 배치 방향(간단히 우측 맞춤)
    panel.style.transform = 'translateX(-100%)';
    panel.style.transformOrigin = 'top right';
  }

  _open(state) {
    if (this.current && this.current !== state) this._close(this.current);
    this._ensurePanel(state);

    const { panel, trigger } = state;
    panel.removeAttribute('hidden');
    Object.assign(panel.style, { display: 'block', zIndex: 1000 });

    this._reposition(state); // 최초 위치 계산

    // 스크롤/리사이즈에 반응하도록 리스너 추가
    window.addEventListener('scroll', this._onScrollResize, { passive: true });
    window.addEventListener('resize', this._onScrollResize, { passive: true });

    trigger.setAttribute('aria-expanded', 'true');
    this.current = state;
  }

  _close(state) {
    const { trigger, panel } = state;
    if (panel) panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (this.current === state) this.current = null;

    window.removeEventListener('scroll', this._onScrollResize);
    window.removeEventListener('resize', this._onScrollResize);
  }

  _onScrollResize() {
    if (this.current) this._reposition(this.current);
  }

  _onDocKeydown(e) {
    if (e.key === 'Escape' && this.current) {
      this._close(this.current);
      this.current.trigger.focus();
    }
  }
}
