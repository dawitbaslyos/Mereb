/**
 * Mereb TouchControls - Universal Mobile Dual Virtual Joystick & Action Buttons
 * High-performance, tactile, zero-dependency touch input system for web games.
 * Built for CrazyGames, Poki, and mobile browsers.
 */

export class TouchControls {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.forceShow = options.forceShow || false;
    this.onMove = options.onMove || null; // ({ x, y, up, down, left, right, angle, active })
    this.onAim = options.onAim || null;   // ({ x, y, angle, active })
    this.onFire = options.onFire || null; // (isFiring: boolean)

    this.isTouchDevice = this.forceShow || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    this.maxRadius = options.maxRadius || 55;
    this.deadzone = options.deadzone || 0.15;

    // State
    this.state = {
      move: { x: 0, y: 0, up: false, down: false, left: false, right: false, angle: 0, active: false },
      aim: { x: 0, y: 0, angle: 0, active: false },
      fire: false
    };

    // Touch tracking
    this.leftTouchId = null;
    this.leftCenter = { x: 0, y: 0 };
    
    this.rightTouchId = null;
    this.rightCenter = { x: 0, y: 0 };

    this.dom = null;
    if (this.isTouchDevice) {
      this._buildDOM();
      this._attachEvents();
    }
  }

  _buildDOM() {
    this._injectStyles();

    this.dom = document.createElement('div');
    this.dom.className = 'mereb-touch-overlay';

    // Left zone (Movement)
    this.leftZone = document.createElement('div');
    this.leftZone.className = 'mereb-touch-zone left-zone';
    
    this.leftBase = document.createElement('div');
    this.leftBase.className = 'mereb-joystick-base left-base';
    this.leftKnob = document.createElement('div');
    this.leftKnob.className = 'mereb-joystick-knob left-knob';
    this.leftBase.appendChild(this.leftKnob);
    this.leftZone.appendChild(this.leftBase);

    // Right zone (Aiming + Fire)
    this.rightZone = document.createElement('div');
    this.rightZone.className = 'mereb-touch-zone right-zone';

    // Right Aim Joystick
    this.rightBase = document.createElement('div');
    this.rightBase.className = 'mereb-joystick-base right-base';
    this.rightKnob = document.createElement('div');
    this.rightKnob.className = 'mereb-joystick-knob right-knob';
    this.rightBase.appendChild(this.rightKnob);
    this.rightZone.appendChild(this.rightBase);

    // Big Tactile Fire Button
    this.fireBtn = document.createElement('button');
    this.fireBtn.className = 'mereb-fire-btn';
    this.fireBtn.innerHTML = `
      <span class="fire-icon">💥</span>
      <span class="fire-text">FIRE</span>
    `;
    this.rightZone.appendChild(this.fireBtn);

    this.dom.appendChild(this.leftZone);
    this.dom.appendChild(this.rightZone);
    this.container.appendChild(this.dom);
  }

  _injectStyles() {
    if (document.getElementById('mereb-touch-styles')) return;

    const style = document.createElement('style');
    style.id = 'mereb-touch-styles';
    style.textContent = `
      .mereb-touch-overlay {
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none;
        z-index: 25;
        user-select: none;
        -webkit-user-select: none;
        touch-action: none;
      }
      .mereb-touch-zone {
        position: absolute;
        top: 25%;
        bottom: 0;
        width: 50%;
        pointer-events: auto;
        touch-action: none;
      }
      .left-zone {
        left: 0;
      }
      .right-zone {
        right: 0;
      }

      /* Joystick Base */
      .mereb-joystick-base {
        position: absolute;
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.4) 100%);
        border: 2px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 0 15px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.05);
        pointer-events: none;
        opacity: 0.45;
        transition: opacity 0.15s ease, border-color 0.15s ease;
        margin-left: -60px;
        margin-top: -60px;
      }
      .mereb-joystick-base.active {
        opacity: 0.9;
        border-color: #38bdf8;
        box-shadow: 0 0 20px rgba(56, 189, 248, 0.4), inset 0 0 15px rgba(56, 189, 248, 0.2);
      }

      .left-base {
        left: 80px;
        bottom: 80px;
      }
      .right-base {
        right: 170px;
        bottom: 80px;
      }

      /* Joystick Knob */
      .mereb-joystick-knob {
        position: absolute;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: linear-gradient(135deg, #38bdf8, #0284c7);
        border: 2px solid #ffffff;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
        left: 35px;
        top: 35px;
        pointer-events: none;
        transition: transform 0.06s cubic-bezier(0.1, 0.9, 0.2, 1);
      }
      .right-knob {
        background: linear-gradient(135deg, #f87171, #dc2626);
      }

      /* Fire Button (Chunky Arcade 3D) */
      .mereb-fire-btn {
        position: absolute;
        right: 28px;
        bottom: 50px;
        width: 90px;
        height: 90px;
        border-radius: 50%;
        background: linear-gradient(180deg, #ef4444 0%, #b91c1c 100%);
        border: 3px solid #fecaca;
        border-bottom: 6px solid #7f1d1d;
        color: #ffffff;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 20px rgba(239, 68, 68, 0.45);
        font-family: 'Fredoka', system-ui, sans-serif;
        font-weight: 700;
        cursor: pointer;
        pointer-events: auto;
        touch-action: none;
        user-select: none;
        transition: transform 0.05s, border-bottom-width 0.05s, box-shadow 0.05s;
        z-index: 30;
      }
      .mereb-fire-btn .fire-icon {
        font-size: 24px;
        line-height: 1;
        pointer-events: none;
      }
      .mereb-fire-btn .fire-text {
        font-size: 13px;
        letter-spacing: 0.5px;
        pointer-events: none;
      }
      .mereb-fire-btn:active, .mereb-fire-btn.pressed {
        transform: translateY(4px);
        border-bottom-width: 2px;
        box-shadow: 0 2px 10px rgba(239, 68, 68, 0.6);
        background: #dc2626;
      }
    `;
    document.head.appendChild(style);
  }

  _attachEvents() {
    const handleTouchStart = (e) => {
      e.preventDefault();
      const rect = this.container.getBoundingClientRect();
      const midX = rect.left + rect.width / 2;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const tx = touch.clientX;
        const ty = touch.clientY;

        // Check if fire button was pressed directly
        const fireRect = this.fireBtn.getBoundingClientRect();
        if (
          tx >= fireRect.left && tx <= fireRect.right &&
          ty >= fireRect.top && ty <= fireRect.bottom
        ) {
          this.state.fire = true;
          this.fireBtn.classList.add('pressed');
          if (this.onFire) this.onFire(true);
          continue;
        }

        // Left half: Move Joystick
        if (tx < midX && this.leftTouchId === null) {
          this.leftTouchId = touch.identifier;
          this.leftCenter = { x: tx - rect.left, y: ty - rect.top };
          this.leftBase.style.left = `${this.leftCenter.x}px`;
          this.leftBase.style.top = `${this.leftCenter.y}px`;
          this.leftBase.style.bottom = 'auto';
          this.leftBase.classList.add('active');
          this.state.move.active = true;
        } 
        // Right half: Aim Joystick
        else if (tx >= midX && this.rightTouchId === null) {
          this.rightTouchId = touch.identifier;
          this.rightCenter = { x: tx - rect.left, y: ty - rect.top };
          this.rightBase.style.left = `${this.rightCenter.x}px`;
          this.rightBase.style.top = `${this.rightCenter.y}px`;
          this.rightBase.style.right = 'auto';
          this.rightBase.style.bottom = 'auto';
          this.rightBase.classList.add('active');
          this.state.aim.active = true;
        }
      }
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      const rect = this.container.getBoundingClientRect();

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const tx = touch.clientX - rect.left;
        const ty = touch.clientY - rect.top;

        // Left Move Joystick Update
        if (touch.identifier === this.leftTouchId) {
          const dx = tx - this.leftCenter.x;
          const dy = ty - this.leftCenter.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          const clampedDist = Math.min(dist, this.maxRadius);
          const normDist = clampedDist / this.maxRadius;

          const knobX = Math.cos(angle) * clampedDist;
          const knobY = Math.sin(angle) * clampedDist;
          this.leftKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

          if (normDist > this.deadzone) {
            const nx = (dx / dist) * normDist;
            const ny = (dy / dist) * normDist;
            this.state.move.x = nx;
            this.state.move.y = ny;
            this.state.move.angle = angle;
            this.state.move.left = nx < -0.3;
            this.state.move.right = nx > 0.3;
            this.state.move.up = ny < -0.3;
            this.state.move.down = ny > 0.3;
          } else {
            this.state.move.x = 0;
            this.state.move.y = 0;
            this.state.move.left = false;
            this.state.move.right = false;
            this.state.move.up = false;
            this.state.move.down = false;
          }

          if (this.onMove) this.onMove(this.state.move);
        }

        // Right Aim Joystick Update
        if (touch.identifier === this.rightTouchId) {
          const dx = tx - this.rightCenter.x;
          const dy = ty - this.rightCenter.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dx, -dy); // 0 = up, matching Three.js top-down

          const clampedDist = Math.min(dist, this.maxRadius);
          const normDist = clampedDist / this.maxRadius;

          const knobX = Math.sin(angle) * clampedDist;
          const knobY = -Math.cos(angle) * clampedDist;
          this.rightKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

          if (normDist > this.deadzone) {
            this.state.aim.x = Math.sin(angle) * normDist;
            this.state.aim.y = -Math.cos(angle) * normDist;
            this.state.aim.angle = angle;
            // Twin-stick shooter feel: auto-fire when pulled outward
            if (normDist > 0.4) {
              this.state.fire = true;
            }
          }

          if (this.onAim) this.onAim(this.state.aim);
        }
      }
    };

    const handleTouchEnd = (e) => {
      const rect = this.container.getBoundingClientRect();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const tx = touch.clientX;
        const ty = touch.clientY;

        // Release fire button if touched
        const fireRect = this.fireBtn.getBoundingClientRect();
        if (
          tx >= fireRect.left && tx <= fireRect.right &&
          ty >= fireRect.top && ty <= fireRect.bottom
        ) {
          this.state.fire = false;
          this.fireBtn.classList.remove('pressed');
          if (this.onFire) this.onFire(false);
        }

        // Left Move Released
        if (touch.identifier === this.leftTouchId) {
          this.leftTouchId = null;
          this.leftKnob.style.transform = `translate(0px, 0px)`;
          this.leftBase.classList.remove('active');
          this.state.move = { x: 0, y: 0, up: false, down: false, left: false, right: false, angle: 0, active: false };
          if (this.onMove) this.onMove(this.state.move);
        }

        // Right Aim Released
        if (touch.identifier === this.rightTouchId) {
          this.rightTouchId = null;
          this.rightKnob.style.transform = `translate(0px, 0px)`;
          this.rightBase.classList.remove('active');
          this.state.aim.active = false;
          // If fire was only active from the aim joystick pull, release fire
          if (!this.fireBtn.classList.contains('pressed')) {
            this.state.fire = false;
          }
          if (this.onAim) this.onAim(this.state.aim);
        }
      }
    };

    // Attach listeners
    this.dom.addEventListener('touchstart', handleTouchStart, { passive: false });
    this.dom.addEventListener('touchmove', handleTouchMove, { passive: false });
    this.dom.addEventListener('touchend', handleTouchEnd, { passive: false });
    this.dom.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    // Explicit fire button handlers
    this.fireBtn.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.state.fire = true;
      this.fireBtn.classList.add('pressed');
      if (this.onFire) this.onFire(true);
    }, { passive: false });

    const stopFire = (e) => {
      e.stopPropagation();
      this.state.fire = false;
      this.fireBtn.classList.remove('pressed');
      if (this.onFire) this.onFire(false);
    };
    this.fireBtn.addEventListener('touchend', stopFire);
    this.fireBtn.addEventListener('touchcancel', stopFire);
  }

  show() {
    if (this.dom) this.dom.style.display = 'block';
  }

  hide() {
    if (this.dom) this.dom.style.display = 'none';
  }

  getState() {
    return {
      move: { ...this.state.move },
      aim: { ...this.state.aim },
      fire: this.state.fire
    };
  }

  destroy() {
    if (this.dom && this.dom.parentNode) {
      this.dom.parentNode.removeChild(this.dom);
    }
  }
}
