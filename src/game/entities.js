import * as THREE from 'three';
import { BULLET_RADIUS } from '../network/protocol.js';

// Pre-allocated static geometry and materials for 0-allocation bullet spawning
const sharedBulletGeometry = new THREE.SphereGeometry(BULLET_RADIUS, 10, 10);
const sharedBulletMaterials = {
  blue: new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
  red: new THREE.MeshBasicMaterial({ color: 0xf87171 })
};

export class Tank {
  constructor(scene, color, id) {
    this.scene = scene;
    this.id = id;

    this.group = new THREE.Group();
    
    // 1. Tank Chassis (Main Body)
    const bodyGeom = new THREE.BoxGeometry(0.85, 0.28, 1.05);
    this.bodyMat = new THREE.MeshStandardMaterial({ 
      color: color,
      transparent: true,
      opacity: 1.0,
      roughness: 0.4,
      metalness: 0.2
    });
    this.bodyMesh = new THREE.Mesh(bodyGeom, this.bodyMat);
    this.bodyMesh.position.y = 0.18;
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.group.add(this.bodyMesh);

    // 2. Tank Treads (Left & Right)
    const treadGeom = new THREE.BoxGeometry(0.18, 0.22, 1.15);
    const treadMat = new THREE.MeshStandardMaterial({ 
      color: 0x1f2937, 
      roughness: 0.9 
    });
    
    const leftTread = new THREE.Mesh(treadGeom, treadMat);
    leftTread.position.set(-0.44, 0.13, 0);
    leftTread.castShadow = true;
    this.group.add(leftTread);

    const rightTread = new THREE.Mesh(treadGeom, treadMat);
    rightTread.position.set(0.44, 0.13, 0);
    rightTread.castShadow = true;
    this.group.add(rightTread);

    // 3. Turret Group (Independent rotation)
    this.turretGroup = new THREE.Group();
    this.turretGroup.position.y = 0.38;
    
    // Turret Dome
    const baseGeom = new THREE.CylinderGeometry(0.26, 0.28, 0.22, 10);
    this.baseMat = new THREE.MeshStandardMaterial({ 
      color: color,
      transparent: true,
      opacity: 1.0,
      roughness: 0.3
    });
    const baseMesh = new THREE.Mesh(baseGeom, this.baseMat);
    baseMesh.castShadow = true;
    this.turretGroup.add(baseMesh);

    // Cannon Barrel
    const barrelGeom = new THREE.BoxGeometry(0.12, 0.12, 0.85);
    const barrelColor = new THREE.Color(color).lerp(new THREE.Color(0x000000), 0.35);
    this.barrelMat = new THREE.MeshStandardMaterial({ 
      color: barrelColor,
      transparent: true,
      opacity: 1.0,
      metalness: 0.5,
      roughness: 0.3
    });
    const barrelMesh = new THREE.Mesh(barrelGeom, this.barrelMat);
    barrelMesh.position.z = 0.55;
    barrelMesh.castShadow = true;
    this.turretGroup.add(barrelMesh);

    // Muzzle tip accent
    const tipGeom = new THREE.BoxGeometry(0.14, 0.14, 0.1);
    const tipMat = new THREE.MeshStandardMaterial({ color: 0x111827 });
    const tipMesh = new THREE.Mesh(tipGeom, tipMat);
    tipMesh.position.z = 0.95;
    this.turretGroup.add(tipMesh);

    this.group.add(this.turretGroup);
    this.scene.add(this.group);
  }

  setInvulnerable(isInvuln) {
    const opacity = isInvuln ? 0.35 : 1.0;
    this.bodyMat.opacity = opacity;
    this.baseMat.opacity = opacity;
    this.barrelMat.opacity = opacity;
  }

  setPosition(x, z) {
    this.group.position.set(x, 0, z);
  }

  setBodyRotation(angle) {
    this.group.rotation.y = angle;
  }

  setTurretRotation(angle) {
    this.turretGroup.rotation.y = angle - this.group.rotation.y;
  }

  getPosition() {
    return { x: this.group.position.x, z: this.group.position.z };
  }

  destroy() {
    this.scene.remove(this.group);
    this.bodyMat.dispose();
    this.baseMat.dispose();
    this.barrelMat.dispose();
    this.group.traverse((child) => {
      if (child.isMesh && child.geometry) {
        child.geometry.dispose();
      }
    });
  }
}

export class Bullet {
  constructor(scene, id, x, z, dx, dz, ownerId, colorHex) {
    this.scene = scene;
    this.id = id;
    this.dx = dx;
    this.dz = dz;
    this.ownerId = ownerId;

    // Use zero-allocation shared glowing materials (NO dynamic PointLights)
    const isBlue = colorHex === 0x60a5fa || colorHex === 0x38bdf8 || colorHex === 0x3b82f6;
    const mat = isBlue ? sharedBulletMaterials.blue : sharedBulletMaterials.red;
    
    this.mesh = new THREE.Mesh(sharedBulletGeometry, mat);
    this.mesh.position.set(x, 0.3, z);
    this.scene.add(this.mesh);
  }

  update(dt) {
    this.mesh.position.x += this.dx * dt;
    this.mesh.position.z += this.dz * dt;
  }

  getPosition() {
    return { x: this.mesh.position.x, z: this.mesh.position.z };
  }

  isOutOfBounds(width, height) {
    const p = this.getPosition();
    return Math.abs(p.x) > width / 2 || Math.abs(p.z) > height / 2;
  }

  destroy() {
    this.scene.remove(this.mesh);
  }
}
