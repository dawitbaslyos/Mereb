/**
 * Mereb Cloud - Mesmerizing Lightweight Flock of Fishes (Boids Algorithm)
 * Ultra-smooth, 60fps canvas simulation of schooling bioluminescent fish.
 * Features:
 * - Fluid Reynolds Boids: Separation, Alignment, Cohesion
 * - Gentle ambient wandering & smooth mouse avoidance
 * - Depth parallax with multi-scale translucent silhouettes & glowing light trails
 * - Zero external dependencies, pure lightweight 2D canvas
 */

export class FlockCanvas {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.fishes = [];
    this.mouse = { x: -1000, y: -1000, active: false, radius: 120 };
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.animId = null;
    this.lastTime = performance.now();

    this.fishCount = Math.min(80, Math.max(45, Math.floor(window.innerWidth / 20)));

    this.colors = [
      { body: 'rgba(56, 189, 248, 0.85)', fin: 'rgba(56, 189, 248, 0.4)', glow: 'rgba(56, 189, 248, 0.25)' }, // Cyan
      { body: 'rgba(129, 140, 248, 0.85)', fin: 'rgba(129, 140, 248, 0.4)', glow: 'rgba(129, 140, 248, 0.25)' }, // Indigo
      { body: 'rgba(52, 211, 153, 0.85)', fin: 'rgba(52, 211, 153, 0.4)', glow: 'rgba(52, 211, 153, 0.25)' }, // Emerald
      { body: 'rgba(167, 139, 250, 0.85)', fin: 'rgba(167, 139, 250, 0.4)', glow: 'rgba(167, 139, 250, 0.25)' }, // Purple
    ];

    this._initFishes();
    this._bindEvents();
    this.start();
  }

  _initFishes() {
    this.resize();
    this.fishes = [];
    for (let i = 0; i < this.fishCount; i++) {
      const scale = 0.55 + Math.random() * 0.75; // Depth scale
      const colorScheme = this.colors[Math.floor(Math.random() * this.colors.length)];
      this.fishes.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        scale,
        length: 16 * scale,
        width: 6.5 * scale,
        maxSpeed: (2.2 + Math.random() * 1.4) * (scale * 0.9 + 0.3),
        maxForce: 0.08,
        color: colorScheme,
        tailAngle: Math.random() * Math.PI * 2,
        tailSpeed: 0.15 + Math.random() * 0.1,
      });
    }
  }

  _bindEvents() {
    this.onResize = () => this.resize();
    this.onMouseMove = (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.active = true;
    };
    this.onMouseLeave = () => {
      this.mouse.active = false;
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    };

    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseleave', this.onMouseLeave);
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    if (this.canvas) {
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }
  }

  start() {
    if (this.animId) return;
    const loop = (time) => {
      this.animId = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (time - this.lastTime) / 1000);
      this.lastTime = time;
      this.update(dt);
      this.draw();
    };
    this.animId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseleave', this.onMouseLeave);
  }

  update(_dt) {
    const visualRange = 120;
    const minDistance = 28;

    for (let i = 0; i < this.fishes.length; i++) {
      const f1 = this.fishes[i];
      let sepX = 0, sepY = 0;
      let alignX = 0, alignY = 0;
      let cohX = 0, cohY = 0;
      let neighbors = 0;

      for (let j = 0; j < this.fishes.length; j++) {
        if (i === j) continue;
        const f2 = this.fishes[j];
        const dx = f2.x - f1.x;
        const dy = f2.y - f1.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0 && dist < visualRange) {
          neighbors++;
          alignX += f2.vx;
          alignY += f2.vy;
          cohX += f2.x;
          cohY += f2.y;

          if (dist < minDistance) {
            sepX -= (dx / dist) * (minDistance - dist) * 1.5;
            sepY -= (dy / dist) * (minDistance - dist) * 1.5;
          }
        }
      }

      if (neighbors > 0) {
        alignX = (alignX / neighbors) * 0.05;
        alignY = (alignY / neighbors) * 0.05;
        cohX = ((cohX / neighbors) - f1.x) * 0.003;
        cohY = ((cohY / neighbors) - f1.y) * 0.003;

        f1.vx += alignX + cohX + sepX * 0.08;
        f1.vy += alignY + cohY + sepY * 0.08;
      }

      // Mouse gentle scattering
      if (this.mouse.active) {
        const mdx = f1.x - this.mouse.x;
        const mdy = f1.y - this.mouse.y;
        const mDist = Math.hypot(mdx, mdy);
        if (mDist < this.mouse.radius && mDist > 0) {
          const repelForce = (1 - mDist / this.mouse.radius) * 3.5;
          f1.vx += (mdx / mDist) * repelForce;
          f1.vy += (mdy / mDist) * repelForce;
        }
      }

      // Subtle edge avoidance & screen wrap
      const margin = 80;
      const turnSpeed = 0.35;
      if (f1.x < margin) f1.vx += turnSpeed;
      if (f1.x > this.width - margin) f1.vx -= turnSpeed;
      if (f1.y < margin) f1.vy += turnSpeed;
      if (f1.y > this.height - margin) f1.vy -= turnSpeed;

      // Wrap around seamlessly
      if (f1.x < -30) f1.x = this.width + 30;
      if (f1.x > this.width + 30) f1.x = -30;
      if (f1.y < -30) f1.y = this.height + 30;
      if (f1.y > this.height + 30) f1.y = -30;

      // Speed clamp
      const speed = Math.hypot(f1.vx, f1.vy);
      if (speed > f1.maxSpeed) {
        f1.vx = (f1.vx / speed) * f1.maxSpeed;
        f1.vy = (f1.vy / speed) * f1.maxSpeed;
      } else if (speed < 0.8) {
        f1.vx = (f1.vx / (speed || 1)) * 1.2;
        f1.vy = (f1.vy / (speed || 1)) * 1.2;
      }

      f1.x += f1.vx;
      f1.y += f1.vy;
      f1.tailAngle += f1.tailSpeed * (speed * 0.8 + 0.5);
    }
  }

  draw() {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.fishes.length; i++) {
      const f = this.fishes[i];
      const angle = Math.atan2(f.vy, f.vx);
      const wiggle = Math.sin(f.tailAngle) * 0.28;

      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(angle);

      // Ambient bioluminescent glow
      ctx.shadowColor = f.color.glow;
      ctx.shadowBlur = 14 * f.scale;

      // Sleek Fish Body
      ctx.fillStyle = f.color.body;
      ctx.beginPath();
      ctx.moveTo(f.length, 0); // Nose tip
      ctx.bezierCurveTo(
        f.length * 0.35, f.width,
        -f.length * 0.4, f.width * 0.8,
        -f.length * 0.75, 0 // Tail base
      );
      ctx.bezierCurveTo(
        -f.length * 0.4, -f.width * 0.8,
        f.length * 0.35, -f.width,
        f.length, 0
      );
      ctx.closePath();
      ctx.fill();

      // Tail Fin (swaying with wiggle)
      ctx.fillStyle = f.color.fin;
      ctx.beginPath();
      const tailX = -f.length * 0.75;
      const finSpread = f.width * 1.4;
      ctx.moveTo(tailX, 0);
      ctx.quadraticCurveTo(
        tailX - f.length * 0.3, wiggle * 15,
        tailX - f.length * 0.6, -finSpread + wiggle * 8
      );
      ctx.lineTo(tailX - f.length * 0.45, wiggle * 6);
      ctx.lineTo(tailX - f.length * 0.6, finSpread + wiggle * 8);
      ctx.closePath();
      ctx.fill();

      // Translucent pectoral side fins
      ctx.fillStyle = f.color.fin;
      ctx.beginPath();
      ctx.ellipse(0, f.width * 0.7, f.length * 0.28, f.width * 0.4, 0.4 + wiggle * 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(0, -f.width * 0.7, f.length * 0.28, f.width * 0.4, -0.4 - wiggle * 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(f.length * 0.55, -f.width * 0.28, 1.2 * f.scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }
}
