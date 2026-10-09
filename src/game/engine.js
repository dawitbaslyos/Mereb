import * as THREE from 'three';
import { Tank, Bullet } from './entities.js';
import { InputManager } from './input.js';
import { 
  ARENA_WIDTH, ARENA_HEIGHT, TANK_SPEED, TANK_ROTATION_SPEED,
  BULLET_SPEED, TANK_RADIUS, BULLET_RADIUS, MAX_HEALTH,
  BULLET_DAMAGE, SCORE_TO_WIN, TICK_RATE, SHOOT_COOLDOWN,
  RESPAWN_TIME, SPAWN_POSITIONS, DC 
} from '../network/protocol.js';
import { SnapshotInterpolator } from '../sdk/index.js';
import { TankBinaryProtocol } from './TankBinary.js';

export class GameEngine {
  constructor(container) {
    this.container = container;
    
    // Set up Three.js
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a1a);
    
    this.camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.camera.position.set(0, 18, 10);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x4488ff, 0.3);
    pointLight.position.set(0, 5, 0);
    this.scene.add(pointLight);

    // Handle resize
    this.onWindowResize = () => {
      this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    };
    window.addEventListener('resize', this.onWindowResize);

    // Create arena
    const groundGeom = new THREE.PlaneGeometry(ARENA_WIDTH, ARENA_HEIGHT);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const gridHelper = new THREE.GridHelper(ARENA_WIDTH, 20, 0x2a2a4e, 0x2a2a4e);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x374151 });
    const wallHGeom = new THREE.BoxGeometry(ARENA_WIDTH + 1, 0.8, 0.5);
    const wallVGeom = new THREE.BoxGeometry(0.5, 0.8, ARENA_HEIGHT);

    const northWall = new THREE.Mesh(wallHGeom, wallMat);
    northWall.position.set(0, 0.4, -ARENA_HEIGHT / 2);
    northWall.castShadow = true;
    this.scene.add(northWall);

    const southWall = new THREE.Mesh(wallHGeom, wallMat);
    southWall.position.set(0, 0.4, ARENA_HEIGHT / 2);
    southWall.castShadow = true;
    this.scene.add(southWall);

    const eastWall = new THREE.Mesh(wallVGeom, wallMat);
    eastWall.position.set(ARENA_WIDTH / 2, 0.4, 0);
    eastWall.castShadow = true;
    this.scene.add(eastWall);

    const westWall = new THREE.Mesh(wallVGeom, wallMat);
    westWall.position.set(-ARENA_WIDTH / 2, 0.4, 0);
    westWall.castShadow = true;
    this.scene.add(westWall);

    // Initialize state
    this.tanks = {};
    this.bullets = [];
    this.localId = null;
    this.remoteId = null;
    this.hostPlayerId = null;
    this.isHost = false;
    this.running = false;
    this.inputManager = null;

    // Host-specific
    this.playerStates = {};
    this.bulletStates = [];
    this.pendingInputs = {};
    this.tickInterval = null;
    this.nextBulletId = 0;

    // Client-specific
    this.inputSeq = 0;

    // Callbacks
    this.onGameState = null;
    this.onBinaryState = null;
    this.onInput = null;
    this.onMatchEnd = null;

    // Netcode: Snapshot Interpolator & Binary Protocol
    this.interpolator = new SnapshotInterpolator({ bufferTime: 80 });
    this.binaryProtocol = new TankBinaryProtocol();

    // Render loop
    this.animate = this.animate.bind(this);
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  startMatch(localId, remoteId, isHost) {
    this.localId = localId;
    this.remoteId = remoteId;
    this.isHost = isHost;
    this.hostPlayerId = isHost ? localId : remoteId;
    this.interpolator.clear();

    this.inputManager = new InputManager(this.renderer.domElement);

    const localSpawn = isHost ? SPAWN_POSITIONS.host : SPAWN_POSITIONS.client;
    const remoteSpawn = isHost ? SPAWN_POSITIONS.client : SPAWN_POSITIONS.host;

    this.tanks[localId] = new Tank(this.scene, 0x3b82f6, localId);
    this.tanks[remoteId] = new Tank(this.scene, 0xef4444, remoteId);
    this.tanks[localId].setPosition(localSpawn.x, localSpawn.z);
    this.tanks[remoteId].setPosition(remoteSpawn.x, remoteSpawn.z);

    if (this.isHost) {
      this.playerStates[localId] = {
        x: localSpawn.x, z: localSpawn.z, rotation: 0, turretRotation: 0,
        health: MAX_HEALTH, score: 0, lastShoot: 0, respawnUntil: 0
      };
      this.playerStates[remoteId] = {
        x: remoteSpawn.x, z: remoteSpawn.z, rotation: 0, turretRotation: 0,
        health: MAX_HEALTH, score: 0, lastShoot: 0, respawnUntil: 0
      };

      this.hostTick = this.hostTick.bind(this);
      this.tickInterval = setInterval(this.hostTick, TICK_RATE);
    }

    this.running = true;
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate);
    
    if (this.running) {
      this.processLocalInput();
      if (!this.isHost) {
        if (this.inputManager) {
          const input = this.inputManager.getInput();
          this.predictLocalMovement(input);
        }

        // Smoothly interpolate remote entity from snapshot buffer!
        const smoothEntities = this.interpolator.getInterpolated();
        const remoteSmooth = smoothEntities[this.remoteId];
        if (remoteSmooth && this.tanks[this.remoteId]) {
          this.tanks[this.remoteId].setPosition(remoteSmooth.x, remoteSmooth.z);
          this.tanks[this.remoteId].setBodyRotation(remoteSmooth.rotation);
          this.tanks[this.remoteId].setTurretRotation(remoteSmooth.turretRotation);
        }
      }
      
      // Update client bullet visuals if not host (host does it in tick)
      if (!this.isHost) {
        const dt = 1/60; // approximate
        for (const b of this.bulletStates) {
          b.x += b.dx * dt;
          b.z += b.dz * dt;
        }
        for (const b of this.bullets) {
          const bs = this.bulletStates.find(s => s.id === b.id);
          if (bs) {
             b.mesh.position.set(bs.x, 0.3, bs.z);
          }
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  hostTick() {
    const now = Date.now();
    const dt = TICK_RATE / 1000;

    for (const [id, input] of Object.entries(this.pendingInputs)) {
      const ps = this.playerStates[id];
      if (!ps || now < ps.respawnUntil) continue;

      let dx = 0, dz = 0;
      if (input.up) dz -= 1;
      if (input.down) dz += 1;
      if (input.left) dx -= 1;
      if (input.right) dx += 1;

      const len = Math.sqrt(dx * dx + dz * dz);
      if (len > 0) {
        dx = (dx / len) * TANK_SPEED * dt;
        dz = (dz / len) * TANK_SPEED * dt;
        ps.x += dx;
        ps.z += dz;
        ps.rotation = Math.atan2(dx, -dz);
      }

      const margin = TANK_RADIUS;
      ps.x = Math.max(-ARENA_WIDTH / 2 + margin, Math.min(ARENA_WIDTH / 2 - margin, ps.x));
      ps.z = Math.max(-ARENA_HEIGHT / 2 + margin, Math.min(ARENA_HEIGHT / 2 - margin, ps.z));

      ps.turretRotation = input.aimAngle || 0;

      if (input.shoot && now - ps.lastShoot >= SHOOT_COOLDOWN) {
        ps.lastShoot = now;
        const angle = ps.turretRotation;
        const bulletDx = Math.sin(angle) * BULLET_SPEED;
        const bulletDz = -Math.cos(angle) * BULLET_SPEED;
        const spawnDist = TANK_RADIUS + BULLET_RADIUS + 0.3;
        this.bulletStates.push({
          id: this.nextBulletId++,
          x: ps.x + Math.sin(angle) * spawnDist,
          z: ps.z - Math.cos(angle) * spawnDist,
          dx: bulletDx,
          dz: bulletDz,
          ownerId: id
        });
      }
    }

    for (const b of this.bulletStates) {
      b.x += b.dx * dt;
      b.z += b.dz * dt;
    }

    this.bulletStates = this.bulletStates.filter(b =>
      Math.abs(b.x) <= ARENA_WIDTH / 2 && Math.abs(b.z) <= ARENA_HEIGHT / 2
    );

    this.bulletStates = this.bulletStates.filter(b => {
      for (const [id, ps] of Object.entries(this.playerStates)) {
        if (id === b.ownerId) continue;
        if (now < ps.respawnUntil) continue;
        const distSq = (b.x - ps.x) ** 2 + (b.z - ps.z) ** 2;
        const hitDist = TANK_RADIUS + BULLET_RADIUS;
        if (distSq < hitDist * hitDist) {
          ps.health -= BULLET_DAMAGE;
          if (ps.health <= 0) {
            const killer = this.playerStates[b.ownerId];
            if (killer) killer.score++;
            if (killer && killer.score >= SCORE_TO_WIN) {
              this.endMatch(b.ownerId);
              return false;
            }
            const isHostPlayer = (id === this.hostPlayerId);
            const respawnPos = isHostPlayer ? SPAWN_POSITIONS.host : SPAWN_POSITIONS.client;
            ps.x = respawnPos.x;
            ps.z = respawnPos.z;
            ps.health = MAX_HEALTH;
            ps.respawnUntil = now + RESPAWN_TIME;
          }
          return false;
        }
      }
      return true;
    });

    this.syncVisualsFromState();

    // Compact binary broadcast (~40 bytes)
    const binaryPacket = this.binaryProtocol.encodeState(
      this.playerStates,
      this.bulletStates,
      now,
      this.localId,
      this.remoteId
    );
    if (this.onBinaryState) this.onBinaryState(binaryPacket);

    const state = {
      type: DC.GAME_STATE,
      players: { ...this.playerStates },
      bullets: [...this.bulletStates],
      tick: now
    };
    if (this.onGameState) this.onGameState(state);
  }

  processLocalInput() {
    if (!this.inputManager) return;
    const input = this.inputManager.getInput();
    this.pendingInputs[this.localId] = input;
    if (!this.isHost && this.onInput) {
      input.seq = this.inputSeq++;
      input.timestamp = Date.now();
      this.onInput({ type: DC.INPUT, ...input });
    }
  }

  applyRemoteInput(input) {
    this.pendingInputs[this.remoteId] = input;
  }

  applyBinaryState(arrayBuffer) {
    if (!this.running) return;
    const state = this.binaryProtocol.decodeState(arrayBuffer, this.remoteId, this.localId);
    if (!state) return;

    // Push remote state into snapshot interpolator for silky-smooth rendering
    const remote = state.players[this.remoteId];
    if (remote) {
      this.interpolator.pushSnapshot(state.tick, {
        [this.remoteId]: remote
      });
      if (this.playerStates[this.remoteId]) {
        this.playerStates[this.remoteId].health = remote.health;
        this.playerStates[this.remoteId].score = remote.score;
        this.tanks[this.remoteId]?.setInvulnerable(remote.isInvuln);
      } else {
        this.playerStates[this.remoteId] = { ...remote };
      }
    }

    // Local player health/score authoritative confirmation
    const local = state.players[this.localId];
    if (local && this.playerStates[this.localId]) {
      this.playerStates[this.localId].health = local.health;
      this.playerStates[this.localId].score = local.score;
      this.tanks[this.localId]?.setInvulnerable(local.isInvuln);
    }

    this.bulletStates = state.bullets || [];
    this.syncBulletVisuals();
  }

  applyGameState(state) {
    if (!this.running) return;
    for (const [id, ps] of Object.entries(state.players)) {
      if (id === this.localId) {
        const current = this.playerStates[id];
        if (current) {
          current.x += (ps.x - current.x) * 0.3;
          current.z += (ps.z - current.z) * 0.3;
          current.health = ps.health;
          current.score = ps.score;
          current.respawnUntil = ps.respawnUntil;
        } else {
          this.playerStates[id] = { ...ps };
        }
      } else {
        this.playerStates[id] = { ...ps };
        // Also push to interpolator
        this.interpolator.pushSnapshot(state.tick || Date.now(), {
          [id]: ps
        });
      }
    }
    this.bulletStates = state.bullets || [];
    this.syncBulletVisuals();
  }

  syncBulletVisuals() {
    const stateIds = new Set(this.bulletStates.map(b => b.id));
    this.bullets = this.bullets.filter(b => {
      if (!stateIds.has(b.id)) {
        b.destroy();
        return false;
      }
      return true;
    });

    for (const bs of this.bulletStates) {
      const existing = this.bullets.find(b => b.id === bs.id);
      if (existing) {
        existing.mesh.position.set(bs.x, 0.3, bs.z);
      } else {
        const ownerIsLocal = bs.ownerId === this.localId;
        const color = ownerIsLocal ? 0x60a5fa : 0xf87171;
        const bullet = new Bullet(this.scene, bs.id, bs.x, bs.z, bs.dx, bs.dz, bs.ownerId, color);
        this.bullets.push(bullet);
      }
    }
  }

  syncVisualsFromState() {
    for (const [id, ps] of Object.entries(this.playerStates)) {
      const tank = this.tanks[id];
      if (tank) {
        tank.setPosition(ps.x, ps.z);
        tank.setBodyRotation(ps.rotation);
        tank.setTurretRotation(ps.turretRotation);
        const isInvuln = Date.now() < (ps.respawnUntil || 0);
        tank.setInvulnerable(isInvuln);
      }
    }
    this.syncBulletVisuals();
  }

  predictLocalMovement(input) {
    const ps = this.playerStates[this.localId];
    if (!ps || Date.now() < ps.respawnUntil) return;
    const dt = 1 / 60;
    let dx = 0, dz = 0;
    if (input.up) dz -= 1;
    if (input.down) dz += 1;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len > 0) {
      dx = (dx / len) * TANK_SPEED * dt;
      dz = (dz / len) * TANK_SPEED * dt;
      ps.x += dx;
      ps.z += dz;
      ps.rotation = Math.atan2(dx, -dz);
    }
    const margin = TANK_RADIUS;
    ps.x = Math.max(-ARENA_WIDTH / 2 + margin, Math.min(ARENA_WIDTH / 2 - margin, ps.x));
    ps.z = Math.max(-ARENA_HEIGHT / 2 + margin, Math.min(ARENA_HEIGHT / 2 - margin, ps.z));
    ps.turretRotation = input.aimAngle || 0;
  }

  endMatch(winnerId) {
    this.running = false;
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    const scores = {};
    for (const [id, ps] of Object.entries(this.playerStates)) {
      scores[id] = ps.score;
    }
    if (this.onMatchEnd) this.onMatchEnd(winnerId, scores);
  }

  stopMatch() {
    this.running = false;
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    for (const tank of Object.values(this.tanks)) tank.destroy();
    for (const bullet of this.bullets) bullet.destroy();
    this.tanks = {};
    this.bullets = [];
    this.bulletStates = [];
    this.playerStates = {};
    if (this.inputManager) {
      this.inputManager.destroy();
      this.inputManager = null;
    }
  }

  dispose() {
    this.stopMatch();
    window.removeEventListener('resize', this.onWindowResize);
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
