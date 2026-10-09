export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = { up: false, down: false, left: false, right: false };
    this.keyShoot = false;
    this.mouseShoot = false;
    this.mouseX = 0;
    this.mouseY = 0;

    this.onKeyDown = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') this.keys.up = true;
      if (k === 's' || e.key === 'ArrowDown') this.keys.down = true;
      if (k === 'a' || e.key === 'ArrowLeft') this.keys.left = true;
      if (k === 'd' || e.key === 'ArrowRight') this.keys.right = true;
      if (e.key === ' ') this.keyShoot = true;
    };

    this.onKeyUp = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') this.keys.up = false;
      if (k === 's' || e.key === 'ArrowDown') this.keys.down = false;
      if (k === 'a' || e.key === 'ArrowLeft') this.keys.left = false;
      if (k === 'd' || e.key === 'ArrowRight') this.keys.right = false;
      if (e.key === ' ') this.keyShoot = false;
    };

    this.onMouseMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    };

    this.onMouseDown = (e) => {
      if (e.button === 0) this.mouseShoot = true;
    };

    this.onMouseUp = (e) => {
      if (e.button === 0) this.mouseShoot = false;
    };

    this.touchLeftId = null;
    this.touchRightId = null;
    this.touchLeftStart = { x: 0, y: 0 };
    this.touchLeftCurrent = { x: 0, y: 0 };

    this.onTouchStart = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const midX = rect.width / 2;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const tx = t.clientX - rect.left;
        const ty = t.clientY - rect.top;

        if (tx < midX && this.touchLeftId === null) {
          // Left side: movement touch
          this.touchLeftId = t.identifier;
          this.touchLeftStart = { x: tx, y: ty };
          this.touchLeftCurrent = { x: tx, y: ty };
        } else if (tx >= midX && this.touchRightId === null) {
          // Right side: aim & shoot touch
          this.touchRightId = t.identifier;
          this.mouseX = tx;
          this.mouseY = ty;
          this.mouseShoot = true;
        }
      }
    };

    this.onTouchMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const tx = t.clientX - rect.left;
        const ty = t.clientY - rect.top;

        if (t.identifier === this.touchLeftId) {
          this.touchLeftCurrent = { x: tx, y: ty };
          const dx = tx - this.touchLeftStart.x;
          const dy = ty - this.touchLeftStart.y;
          const threshold = 15;
          this.keys.left = dx < -threshold;
          this.keys.right = dx > threshold;
          this.keys.up = dy < -threshold;
          this.keys.down = dy > threshold;
        } else if (t.identifier === this.touchRightId) {
          this.mouseX = tx;
          this.mouseY = ty;
        }
      }
    };

    this.onTouchEnd = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === this.touchLeftId) {
          this.touchLeftId = null;
          this.keys.left = false;
          this.keys.right = false;
          this.keys.up = false;
          this.keys.down = false;
        } else if (t.identifier === this.touchRightId) {
          this.touchRightId = null;
          this.mouseShoot = false;
        }
      }
    };

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('mouseup', this.onMouseUp);
    this.canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.onTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.onTouchEnd);
    this.canvas.addEventListener('touchcancel', this.onTouchEnd);
  }

  getInput() {
    const cw = this.canvas.clientWidth / 2;
    const ch = this.canvas.clientHeight / 2;
    
    const aimAngle = Math.atan2(this.mouseX - cw, -(this.mouseY - ch));

    return {
      up: this.keys.up,
      down: this.keys.down,
      left: this.keys.left,
      right: this.keys.right,
      shoot: this.keyShoot || this.mouseShoot,
      aimAngle: aimAngle
    };
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
    this.canvas.removeEventListener('touchstart', this.onTouchStart);
    this.canvas.removeEventListener('touchmove', this.onTouchMove);
    this.canvas.removeEventListener('touchend', this.onTouchEnd);
    this.canvas.removeEventListener('touchcancel', this.onTouchEnd);
  }
}
