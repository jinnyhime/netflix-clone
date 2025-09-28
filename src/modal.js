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
    

    document.addEventListener('keydown', this._onDocKeydown);
    
  }

  register(selector, cfg) {
    const trigger = document.querySelector(selector);
    if (!trigger) return;

    const config = { trigger: 'hover', role: 'dialog', ...cfg };
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
      panel.innerHTML =
        typeof config.render === 'function' ? config.render() : (config.render || '');
      panel.hidden = true; 
      document.body.appendChild(panel);

      panel.addEventListener('mouseenter', () => clearTimeout(state.timers.close));
      panel.addEventListener('mouseleave', () => this._queueClose(state));
    }
    state.panel = panel;
  }

  _queueOpen(s) {
    clearTimeout(s.timers.close);
    s.timers.open = setTimeout(() => this._open(s), this.options.hoverDelayOpen);
  }
  _queueClose(s) {
    clearTimeout(s.timers.open);
    s.timers.close = setTimeout(() => this._close(s), this.options.hoverDelayClose);
  }

  _open(state) {
  if (this.current && this.current !== state) this._close(this.current);
  this._ensurePanel(state);

  const { trigger, panel, config } = state;
  const rect = trigger.getBoundingClientRect();
  const scrollX = window.scrollX || document.documentElement.scrollLeft;
  const scrollY = window.scrollY || document.documentElement.scrollTop;

  panel.removeAttribute('hidden');

  const top = Math.round(rect.bottom + this.options.offset + scrollY);
  const baseLeft = Math.round(rect.right + scrollX); 

  Object.assign(panel.style, {
    position: 'absolute',
    top: `${top}px`,
    left: `${baseLeft}px`,
    display: 'block',
    zIndex: 1000,
  });

  // 배치
  const placement = config.placement || 'bottom-start';
  panel.style.transform = 'translateX(-100%)';
  panel.style.transformOrigin = 'top right';
  trigger.setAttribute('aria-expanded', 'true');
  this.current = state;
}

  _close(state) {
    const { trigger, panel } = state;
    if (panel) panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (this.current === state) this.current = null;
  }

  _onDocKeydown(e) {
    if (e.key === 'Escape' && this.current) {
      this._close(this.current);
      this.current.trigger.focus();
    }
  }
}
