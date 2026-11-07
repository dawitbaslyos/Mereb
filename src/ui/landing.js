/**
 * Mereb Cloud - Official Landing Page
 * Serverless multiplayer for web games with serverless WebRTC P2P netcode and edge matchmaking.
 */
import * as THREE from 'three';
import { auth } from './auth.js';

const PROMPT = 'Add real-time multiplayer to this game using Mereb. First read https://mereb.cloud/llms.txt. Then look at my project and work out which engine or framework it uses (Unity, Godot, Three.js, Phaser or similar) and follow the matching Mereb setup. Create a room with a join code, sync player positions, and show connected players. Read the project key from the MEREB_KEY environment variable and never hard-code it. Only change files inside the game folder, and when you finish list every file you changed and every package you installed.';

export class LandingUI {
  constructor({ onLaunchGame, onNavigateDashboard }) {
    this.onLaunchGame = onLaunchGame;
    this.onNavigateDashboard = onNavigateDashboard;
    this.element = document.createElement('div');
    this.element.className = 'landing-root';

    // Animation & 3D state
    this._rafId = null;
    this._stageRafId = null;
    this._resizeObserver = null;
    this._intersectionObserver = null;
    this._threeRenderer = null;
    this._threeScene = null;
    this._threeCamera = null;
    this._fishList = [];
    this._isHeroVisible = true;
    this._cleanupHandlers = [];

    auth.onChange(() => {
      this.render();
    });

    this.render();
  }

  destroy() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    if (this._stageRafId) {
      cancelAnimationFrame(this._stageRafId);
      this._stageRafId = null;
    }
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this._intersectionObserver) {
      this._intersectionObserver.disconnect();
      this._intersectionObserver = null;
    }

    this._cleanupHandlers.forEach(fn => fn());
    this._cleanupHandlers = [];

    if (this._threeRenderer) {
      this._threeRenderer.dispose();
      this._threeRenderer = null;
    }
    this._threeScene = null;
    this._threeCamera = null;
    this._fishList = [];
  }

  render() {
    this.destroy();

    const isSigned = auth.isSignedIn();
    const docsUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? '/docs' : 'https://docs.mereb.cloud';

    this.element.innerHTML = `
      <nav>
        <div class="wrap">
          <a class="logo" href="#top"><i></i>mereb</a>
          <div class="links">
            <a href="#flow">How it works</a>
            <a href="#p2p">Peer-to-peer</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <a href="${docsUrl}" target="_blank">Docs</a>
          </div>
          ${isSigned
            ? `<button class="btn" id="btn-nav-action">Console →</button>`
            : `<button class="btn" id="btn-nav-action">Start free</button>`
          }
        </div>
      </nav>

      <main id="top">
        <div class="space">
          <canvas id="fx" aria-hidden="true"></canvas>
          <div class="wrap hero">
            <h1>Make your game multiplayer in <em>one paste</em>.</h1>
            <p class="sub">Copy a prompt, hand it to your AI helper, and your friends can play together. Free for your first game.</p>

            <div class="cta-row">
              ${isSigned
                ? `<button class="btn big" id="btn-hero-primary">Open Console →</button>`
                : `<a class="btn big" href="#pricing" id="btn-hero-primary">Start free</a>`
              }
              <button class="btn big ghost" id="btn-hero-play">▶ Play 3D Demo</button>
            </div>

            <div class="promptbar" id="start">
              <span class="pt">Using an AI helper? <b>Paste one prompt</b> and it adds multiplayer for you.</span>
              <button class="btn" id="copy" aria-live="polite">Copy prompt</button>
            </div>

            <div class="stage" id="stage" aria-label="Interactive demo: simulated players moving cursors in one room">
              <span class="hint">Move your mouse or finger to join in. The others are demo players.</span>
              <span class="pill" style="right:16px;top:14px"><i class="dot"></i><span id="net">3 players here</span></span>
              <button class="btn play" id="play">▶ Play 3D Demo</button>
            </div>
          </div>
        </div>

        <div class="wrap proof">
          <p>Works with</p>
          <div>
            <span>Unity WebGL</span>
            <span>Godot 4</span>
            <span>Three.js</span>
            <span>Phaser</span>
            <span>PixiJS</span>
          </div>
        </div>

        <section id="flow" style="padding-bottom:0">
          <div class="wrap feat">
            <div class="txt">
              <h2>From prompt to playing in one paste.</h2>
              <p>Copy a prompt, paste it into your agent, and open the room link it hands back. The prompt tells your helper exactly what to install and what to leave alone.</p>
              <ol class="steps">
                <li><b>Copy</b> the prompt.</li>
                <li><b>Paste</b> it into your agent.</li>
                <li><b>Play</b> in the room link it returns.</li>
              </ol>
            </div>
            <div class="viz tr mono" aria-hidden="true">
              <div>
                <span class="m">you</span>Add multiplayer with Mereb<br>
                <span class="m">agent</span>reading mereb.cloud/llms.txt<br>
                <span class="m">agent</span><span class="ok">+</span> npm i @mereb/sdk<br>
                <span class="m">agent</span><span class="ok">+</span> src/net.ts<br>
                <span class="m">agent</span>room ready: K7QX
              </div>
            </div>
          </div>
        </section>

        <section id="p2p">
          <div class="wrap feat">
            <div class="txt">
              <h2>Players talk to each other, not to your server.</h2>
              <p>Mereb opens <b>WebRTC data channels</b> between players and keeps game traffic off your bill. Input and state flow browser to browser, with a fast unreliable channel for movement and a reliable one for events.</p>
              <a class="more" href="#faq">Common questions →</a>
            </div>
            <div class="viz" aria-hidden="true">
              <svg viewBox="0 0 400 300">
                <g stroke="currentColor" stroke-opacity=".25" stroke-width="2" fill="none">
                  <path d="M90 80L310 80M90 80L200 230M310 80L200 230"/>
                </g>
              </svg>
              <div class="node" style="left:62px;top:52px;background:var(--acc)">P1</div>
              <div class="node" style="right:62px;top:52px;background:var(--blue)">P2</div>
              <div class="node" style="left:calc(50% - 28px);bottom:42px;background:var(--green)">P3</div>
              <span class="pill" style="left:50%;top:60px;transform:translateX(-50%)">direct · ~20 ms</span>
            </div>
          </div>
        </section>

        <section id="match" style="padding-top:0">
          <div class="wrap feat rev">
            <div class="txt">
              <h2>Matchmaking that runs at the edge.</h2>
              <p>A lightweight room service on <b>Durable Objects</b> introduces players, then steps aside. Rooms, codes and quick-match work out of the box, with no regions to pick and no servers to babysit.</p>
              <a class="more" href="#stage">See it in the demo →</a>
            </div>
            <div class="viz" aria-hidden="true">
              <svg viewBox="0 0 400 300">
                <g stroke="currentColor" stroke-opacity=".25" stroke-width="2" stroke-dasharray="5 6" fill="none">
                  <path d="M200 120L90 220M200 120L310 220"/>
                </g>
              </svg>
              <div class="node srv" style="left:calc(50% - 28px);top:52px">edge</div>
              <div class="node" style="left:62px;bottom:50px;background:var(--acc)">P1</div>
              <div class="node" style="right:62px;bottom:50px;background:var(--blue)">P2</div>
              <span class="pill" style="left:50%;bottom:20px;transform:translateX(-50%)">room: K7QX</span>
            </div>
          </div>
        </section>

        <section id="sdk" style="padding-top:0">
          <div class="wrap feat">
            <div class="txt">
              <h2>Drop into the engine you already use.</h2>
              <p>One protocol, thin bindings. Join a room, send an event, and listen for peers in a few lines, whether you ship Unity WebGL, Godot 4 or a Three.js prototype.</p>
              <a class="more" href="#start">Copy the prompt →</a>
            </div>
            <div class="viz" style="place-items:center start;padding:28px;aspect-ratio:auto;min-height:280px">
              <pre class="mono" style="font-size:13px;line-height:1.8;overflow-x:auto;max-width:100%"><span style="color:var(--mut)">// join a room, then talk</span>
const room = await mereb.join("K7QX");
room.on("peer", p =&gt; spawn(p.id));
room.send("move", { x, y });</pre>
            </div>
          </div>
        </section>

        <section style="padding-top:0">
          <div class="wrap center">
            <h2>Honest about what the server sees.</h2>
            <p>Peer-to-peer isn’t magic, so here is what to expect.</p>
            <div class="grid3 g2">
              <div class="box">
                <h3>Signaling only</h3>
                <p>Mereb sees room codes and connection setup. Gameplay data goes straight between players.</p>
              </div>
              <div class="box">
                <h3>Relay fallback</h3>
                <p>Some networks block direct links. When a relay is needed, it is metered and capped, never a surprise.</p>
              </div>
              <div class="box">
                <h3>Trust your peers?</h3>
                <p>P2P has no authoritative server, so it suits co-op, party and casual games better than ranked competition.</p>
              </div>
              <div class="box">
                <h3>What the prompt will do</h3>
                <p>The prompt tells your AI helper to read our docs, add the SDK and touch only your game folder. Keys come from an environment variable, never from code.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" style="padding-top:0">
          <div class="wrap center">
            <h2>Free for your first game.</h2>
            <p>Pay only when you ship more.</p>
            <div class="toggle" role="group" aria-label="Billing period">
              <button aria-pressed="true" id="toggle-yearly" data-b="y">Yearly</button>
              <button aria-pressed="false" id="toggle-monthly" data-b="m">Monthly</button>
            </div>
            <p class="fine" id="save">Yearly is 2 months free.</p>
            <div class="grid3">
              <div class="box">
                <h3>Free</h3>
                <div class="price">$0</div>
                <p>One game, no card needed.</p>
                <ul>
                  <li>Unlimited peer-to-peer play</li>
                  <li>Rooms and quick-match</li>
                  <li>All engine SDKs</li>
                  <li>Community support</li>
                </ul>
                <button class="btn ghost" id="btn-pricing-free">${isSigned ? 'Open Console' : 'Start free'}</button>
              </div>
              <div class="box pro">
                <h3>Studio</h3>
                <div class="price"><span id="p1">$15</span><small> a month</small></div>
                <p>For indie teams with several games.</p>
                <ul>
                  <li>Everything in Free</li>
                  <li>Up to 5 games</li>
                  <li>Capped relay allowance</li>
                  <li class="soon">Analytics (coming soon)</li>
                </ul>
                <button class="btn" id="btn-pricing-studio">Get Studio</button>
              </div>
              <div class="box">
                <h3>Team</h3>
                <div class="price"><span id="p2">$40</span><small> a month</small></div>
                <p>For studios that ship often.</p>
                <ul>
                  <li>Everything in Team</li>
                  <li>Unlimited games</li>
                  <li>Roles and shared projects</li>
                  <li class="soon">SSO (coming next)</li>
                </ul>
                <button class="btn ghost" id="btn-pricing-team">Get Team</button>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" style="padding-top:0">
          <div class="wrap" style="max-width:760px">
            <div class="center" style="margin-bottom:24px"><h2>Questions, answered.</h2></div>
            <details><summary>What is Mereb?</summary><p>A multiplayer backend for web games. Players connect directly over WebRTC, and an edge service handles matchmaking and room discovery.</p></details>
            <details><summary>Is it really free?</summary><p>Your first game is free, with peer-to-peer play and matchmaking included. Paid plans add more games and a capped relay allowance.</p></details>
            <details><summary>What if two players can’t connect directly?</summary><p>Strict networks can block direct links. Mereb falls back to a relay for those players, and the usage is metered against a cap so your bill stays predictable.</p></details>
            <details><summary>Can players cheat?</summary><p>Without an authoritative server, a determined player can tamper with their own client. Mereb is best for co-op, party and casual games.</p></details>
            <details><summary>How many players per room?</summary><p>Mesh P2P works best with small rooms. Larger sessions are better served by a host-peer model.</p></details>
            <details><summary>Do I need an account?</summary><p>No account is needed to try the demo. Sign in to publish a game and manage rooms in the developer console.</p></details>
          </div>
        </section>

        <div class="wrap final">
          <h2>Press play.</h2>
          <div class="cta-row">
            ${isSigned
              ? `<button class="btn big" id="btn-final-action">Open Console →</button>`
              : `<button class="btn big" id="btn-final-action">Start free</button>`
            }
          </div>
          <p class="fine">Free forever for your first game.</p>
        </div>
      </main>

      <footer>
        <div class="wrap">
          <div class="fcols">
            <div>
              <a class="logo" href="#top" style="color:var(--fg)"><i></i>mereb</a>
              <p style="margin-top:10px">Multiplayer for web games.</p>
            </div>
            <div>
              <h4>Product</h4>
              <a href="#flow">How it works</a>
              <a href="#p2p">Peer-to-peer</a>
              <a href="#match">Matchmaking</a>
              <a href="#pricing">Pricing</a>
            </div>
            <div>
              <h4>Resources</h4>
              <a href="/llms.txt" target="_blank">llms.txt</a>
              <a href="${docsUrl}" target="_blank">Documentation</a>
              <a href="https://github.com/dawitbaslyos/Mereb" target="_blank">GitHub</a>
              <a href="#faq">FAQ</a>
            </div>
            <div>
              <h4>Legal</h4>
              <a href="/terms.html">Terms of Service</a>
              <a href="/privacy.html">Privacy Policy</a>
            </div>
          </div>
          <div class="legal">
            <span>© 2026 Mereb</span>
            <span>Zero-Cost Serverless WebRTC Multiplayer</span>
          </div>
        </div>
      </footer>
    `;

    this._bindEvents();
    this._initPromptCopy();
    this._initPricingToggle();
    this._initStageDemo();
    this._initHeroThree();
  }

  _bindEvents() {
    const handleAuthOrConsole = () => {
      if (auth.isSignedIn()) {
        if (this.onNavigateDashboard) this.onNavigateDashboard();
      } else {
        auth.loginWithGithub();
      }
    };

    // Nav action
    this.element.querySelector('#btn-nav-action')?.addEventListener('click', handleAuthOrConsole);

    // Hero buttons
    this.element.querySelector('#btn-hero-primary')?.addEventListener('click', (e) => {
      if (auth.isSignedIn()) {
        e.preventDefault();
        if (this.onNavigateDashboard) this.onNavigateDashboard();
      }
    });

    this.element.querySelector('#btn-hero-play')?.addEventListener('click', () => {
      if (this.onLaunchGame) this.onLaunchGame();
    });

    // Stage play button
    this.element.querySelector('#play')?.addEventListener('click', () => {
      if (this.onLaunchGame) this.onLaunchGame();
    });

    // Pricing buttons
    this.element.querySelector('#btn-pricing-free')?.addEventListener('click', handleAuthOrConsole);
    this.element.querySelector('#btn-pricing-studio')?.addEventListener('click', handleAuthOrConsole);
    this.element.querySelector('#btn-pricing-team')?.addEventListener('click', handleAuthOrConsole);

    // Final CTA
    this.element.querySelector('#btn-final-action')?.addEventListener('click', handleAuthOrConsole);
  }

  _initPromptCopy() {
    const btn = this.element.querySelector('#copy');
    if (!btn) return;

    let timeout = null;
    const done = (msg) => {
      btn.textContent = msg;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        btn.textContent = 'Copy prompt';
      }, 2600);
    };

    btn.addEventListener('click', () => {
      if (!navigator.clipboard) {
        done('Couldn’t copy. Try again');
        return;
      }
      navigator.clipboard.writeText(PROMPT).then(
        () => done('Copied! Paste into your AI helper'),
        () => done('Couldn’t copy. Try again')
      );
    });
  }

  _initPricingToggle() {
    const toggleButtons = this.element.querySelectorAll('.toggle button');
    const p1 = this.element.querySelector('#p1');
    const p2 = this.element.querySelector('#p2');
    const save = this.element.querySelector('#save');
    const rates = {
      y: ['$15', '$40', 'Yearly is 2 months free.'],
      m: ['$18', '$48', 'Billed monthly.']
    };

    toggleButtons.forEach((b) => {
      b.addEventListener('click', () => {
        toggleButtons.forEach((o) => o.setAttribute('aria-pressed', (o === b).toString()));
        const val = rates[b.dataset.b];
        if (p1 && p2 && save && val) {
          p1.textContent = val[0];
          p2.textContent = val[1];
          save.textContent = val[2];
        }
      });
    });
  }

  _initStageDemo() {
    const stage = this.element.querySelector('#stage');
    const net = this.element.querySelector('#net');
    if (!stage) return;

    const peersData = [
      ['Ada', '#ff5b3a'],
      ['Kofi', '#3a7bff'],
      ['Mina', '#1fa971']
    ];

    const peers = peersData.map((p, i) => {
      const el = document.createElement('div');
      el.className = 'cur';
      el.innerHTML = `<svg viewBox="0 0 20 20"><path d="M2 2l14 6-6 2-2 6z" fill="${p[1]}"/></svg><span style="background:${p[1]}">${p[0]}</span>`;
      stage.appendChild(el);
      return { el, t: i * 2, s: 0.6 + i * 0.25 };
    });

    const me = document.createElement('div');
    me.className = 'cur';
    me.style.transition = 'none';
    me.style.opacity = '0';
    me.innerHTML = `<svg viewBox="0 0 20 20"><path d="M2 2l14 6-6 2-2 6z" fill="currentColor"/></svg><span style="background:var(--fg);color:var(--bg)">You</span>`;
    stage.appendChild(me);

    const onPointerMove = (e) => {
      const r = stage.getBoundingClientRect();
      me.style.opacity = '1';
      me.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px)`;
    };

    const onPointerEnter = () => {
      if (net) net.textContent = '4 players here';
    };

    const onPointerLeave = () => {
      me.style.opacity = '0';
      if (net) net.textContent = '3 players here';
    };

    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerenter', onPointerEnter);
    stage.addEventListener('pointerleave', onPointerLeave);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const tickStage = () => {
      const w = stage.clientWidth - 90;
      const h = stage.clientHeight - 70;
      peers.forEach((p) => {
        p.t += 0.012 * p.s;
        const x = w / 2 + Math.cos(p.t * 1.1) * w * 0.42;
        const y = h / 2 + Math.sin(p.t * 1.7) * h * 0.38;
        p.el.style.transform = `translate(${x}px, ${y}px)`;
      });

      if (!reduceMotion) {
        this._stageRafId = requestAnimationFrame(tickStage);
      }
    };

    tickStage();
  }

  _initHeroThree() {
    const canvas = this.element.querySelector('#fx');
    if (!canvas) return;

    const container = canvas.parentNode;
    let webglProbe = null;
    try {
      webglProbe = document.createElement('canvas').getContext('webgl');
    } catch (e) {}

    if (!webglProbe || !THREE) return;

    try {
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this._threeRenderer = renderer;

      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x050607, 7, 17);
      this._threeScene = scene;

      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
      camera.position.z = 8;
      this._threeCamera = camera;

      scene.add(new THREE.HemisphereLight(0xfff1dc, 0x182030, 0.85));
      const key = new THREE.DirectionalLight(0xffffff, 2.2);
      key.position.set(2, 3, 4);
      scene.add(key);

      const rim = new THREE.DirectionalLight(0x6f9bff, 1.7);
      rim.position.set(-3, 1, -3);
      scene.add(rim);

      const warm = new THREE.PointLight(0xff7a4d, 1.3, 14);
      warm.position.set(3, -2, 3);
      scene.add(warm);

      // Body geometry
      const bodyG = new THREE.SphereGeometry(1, 48, 32);
      const bp = bodyG.attributes.position;
      for (let i = 0; i < bp.count; i++) {
        const x = bp.getX(i);
        const y = bp.getY(i);
        const z = bp.getZ(i);
        const t = (x + 1) / 2;
        const s = 0.36 + 0.64 * Math.min(1, t * 1.45);
        bp.setXYZ(i, x * 1.5, y * 0.8 * s, z * 0.55 * s);
      }
      bodyG.computeVertexNormals();

      function ext(shape, depth) {
        const g = new THREE.ExtrudeGeometry(shape, {
          depth,
          bevelEnabled: true,
          bevelThickness: 0.06,
          bevelSize: 0.06,
          bevelSegments: 4,
          curveSegments: 8
        });
        g.translate(0, 0, -depth / 2);
        return g;
      }

      const ts = new THREE.Shape();
      ts.moveTo(0, 0);
      ts.quadraticCurveTo(-0.5, 0.2, -0.95, 0.8);
      ts.quadraticCurveTo(-0.68, 0, -0.95, -0.8);
      ts.quadraticCurveTo(-0.5, -0.2, 0, 0);

      const ds = new THREE.Shape();
      ds.moveTo(0.45, 0);
      ds.quadraticCurveTo(0.2, 0.6, -0.4, 0.72);
      ds.quadraticCurveTo(-0.2, 0.3, -0.55, 0);
      ds.closePath();

      const tailG = ext(ts, 0.07);
      const dorG = ext(ds, 0.07);
      const finG = new THREE.SphereGeometry(1, 16, 12);
      finG.scale(0.36, 0.1, 0.2);

      const eyeG = new THREE.SphereGeometry(0.13, 14, 10);
      const pupG = new THREE.SphereGeometry(0.075, 10, 8);

      const IV = 0xefe7d4;
      const pal = [
        [IV, 0xff5b3a],
        [IV, 0x3a7bff],
        [IV, 0x1fa971],
        [IV, 0xf2b632],
        [0x17191c, IV],
        [0xff5b3a, IV],
        [0x3a7bff, IV]
      ];

      function mat(c) {
        return new THREE.MeshPhysicalMaterial({
          color: c,
          roughness: 0.32,
          metalness: 0,
          clearcoat: 1,
          clearcoatRoughness: 0.18
        });
      }

      const whiteMat = new THREE.MeshPhysicalMaterial({ color: 0xfaf8f0, roughness: 0.2, clearcoat: 1 });
      const inkMat = new THREE.MeshBasicMaterial({ color: 0x0a0b0d });

      function createFish(p) {
        const g = new THREE.Group();
        const bm = mat(p[0]);
        const fm = mat(p[1]);
        g.add(new THREE.Mesh(bodyG, bm));

        const tail = new THREE.Group();
        tail.position.set(-1.38, 0, 0);
        tail.add(new THREE.Mesh(tailG, fm));
        g.add(tail);

        const d = new THREE.Mesh(dorG, fm);
        d.position.set(0.1, 0.58, 0);
        g.add(d);

        [1, -1].forEach((sz) => {
          const f = new THREE.Mesh(finG, fm);
          f.position.set(0.3, -0.22, sz * 0.42);
          f.rotation.z = -0.5;
          f.rotation.y = sz * 0.5;
          g.add(f);

          const e = new THREE.Mesh(eyeG, whiteMat);
          e.position.set(0.95, 0.17, sz * 0.36);
          g.add(e);

          const q = new THREE.Mesh(pupG, inkMat);
          q.position.set(1.02, 0.17, sz * 0.41);
          g.add(q);
        });

        scene.add(g);
        return { g, tail };
      }

      const TA = Math.tan(20 * Math.PI / 180);
      let aspect = 1;
      let kk = 1;
      const fs = [];
      const N = 9;

      function hw(z) {
        return TA * (8 - z) * aspect * 1.12;
      }

      for (let n = 0; n < N; n++) {
        const z = -7 + Math.random() * 10;
        const f = createFish(pal[n % pal.length]);
        f.z = z;
        f.size = 0.38 + Math.random() * 0.42;
        f.dir = Math.random() < 0.5 ? 1 : -1;
        f.sp = 0.15 + Math.random() * 0.25;
        f.ph = Math.random() * 6.28;
        f.amp = 0.2 + Math.random() * 0.35;
        f.x = (Math.random() * 2 - 1) * hw(z);
        if (z > -1 && Math.abs(f.x) < hw(z) * 0.5) {
          f.x = (f.x < 0 ? -1 : 1) * hw(z) * (0.55 + Math.random() * 0.4);
        }
        f.y = (Math.random() * 2 - 1) * TA * (8 - z) * 0.85;
        fs.push(f);
      }
      this._fishList = fs;

      const handleResize = () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        aspect = w / h;
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
        kk = Math.min(1, 0.55 + aspect * 0.3);
      };

      handleResize();

      if (window.ResizeObserver) {
        this._resizeObserver = new ResizeObserver(handleResize);
        this._resizeObserver.observe(container);
      } else {
        window.addEventListener('resize', handleResize);
        this._cleanupHandlers.push(() => window.removeEventListener('resize', handleResize));
      }

      let mx = 0;
      let my = 0;
      let lastTime = performance.now();
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const onPointerMove = (e) => {
        mx = (e.clientX / window.innerWidth) * 2 - 1;
        my = (e.clientY / window.innerHeight) * 2 - 1;
      };
      window.addEventListener('pointermove', onPointerMove);
      this._cleanupHandlers.push(() => window.removeEventListener('pointermove', onPointerMove));

      if (window.IntersectionObserver) {
        this._intersectionObserver = new IntersectionObserver((entries) => {
          this._isHeroVisible = entries[0].isIntersecting;
        });
        this._intersectionObserver.observe(container);
      }

      const animate = (now) => {
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        const t = now / 1000;
        lastTime = now;

        if (this._isHeroVisible) {
          fs.forEach((f) => {
            if (!reduceMotion) {
              f.x += f.dir * f.sp * dt;
              const b = hw(f.z);
              if (f.dir > 0 && f.x > b) f.x = -b;
              else if (f.dir < 0 && f.x < -b) f.x = b;
            }
            f.g.position.set(f.x, f.y + Math.sin(t * 0.8 + f.ph) * 0.18, f.z);
            f.g.scale.setScalar(f.size * kk);
            f.g.rotation.y = (f.dir > 0 ? 0 : Math.PI) + Math.sin(t * 0.5 + f.ph) * f.amp;
            f.g.rotation.z = Math.sin(t * 0.7 + f.ph) * 0.09 * f.dir;
            f.tail.rotation.y = Math.sin(t * 3 + f.ph) * 0.45;
          });

          camera.position.x += (mx * 0.6 - camera.position.x) * 0.04;
          camera.position.y += (-my * 0.35 - camera.position.y) * 0.04;
          camera.lookAt(0, 0, 0);

          renderer.render(scene, camera);
        }

        this._rafId = requestAnimationFrame(animate);
      };

      this._rafId = requestAnimationFrame(animate);
    } catch (err) {
      console.warn('Hero 3D fish canvas unavailable:', err);
    }
  }

  getElement() {
    return this.element;
  }
}
