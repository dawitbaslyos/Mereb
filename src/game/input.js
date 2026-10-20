import { TouchControls } from '../sdk/controls/TouchControls.js';

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = { up: false, down: false, left: false, right: false };
    this.keyShoot = false;
    this.mouseShoot = false;
    this.mouseX = (canvas.clientWidth || window.innerWidth) / 2;
    this.mouseY = 0;
    this.lastAimAngle = 0;

    // Attach Mobile Dual Virtual Joystick overlay
    this.touch = new TouchControls({
      container: document.getElementById('ui-layer') || canvas.parentElement || document.body
    });

    this.onKeyDown = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') this.keys.up = true;
      if (k === 's' || e.key === 'ArrowDown') this.keys.down = true;
      if (k === 'a' || e.key === 'ArrowLeft') this.keys.left = true;
      if (k === 'd' || e.key === 'ArrowRight') this.keys.right = true;
      if (e.key === ' ') {
        e.preventDefault();
        this.keyShoot = true;
      }
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

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
  }

  getInput() {
    // 1. Mobile Touch Joystick Priority
    const ts = this.touch?.getState();
    const isTouchActive = ts && (ts.move.active || ts.aim.active || ts.fire);

    if (isTouchActive) {
      if (ts.aim.active) {
        this.lastAimAngle = ts.aim.angle;
      } else if (ts.move.active) {
        // If aiming stick isn't touched, aim in movement direction
        this.lastAimAngle = Math.atan2(ts.move.x, -ts.move.y);
      }

      return {
        up: ts.move.up,
        down: ts.move.down,
        left: ts.move.left,
        right: ts.move.right,
        shoot: ts.fire,
        aimAngle: this.lastAimAngle
      };
    }

    // 2. Desktop Keyboard & Mouse Fallback
    const cw = (this.canvas.clientWidth || window.innerWidth) / 2;
    const ch = (this.canvas.clientHeight || window.innerHeight) / 2;
    const aimAngle = Math.atan2(this.mouseX - cw, -(this.mouseY - ch));
    this.lastAimAngle = aimAngle;

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
    if (this.touch) {
      this.touch.destroy();
      this.touch = null;
    }
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
  }
}
