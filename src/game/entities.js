import * as THREE from 'three';
import { BULLET_RADIUS } from '../network/protocol.js';

export class Tank {
  constructor(scene, color, id) {
    this.scene = scene;
    this.id = id;

    this.group = new THREE.Group();
    
    // Body: BoxGeometry(0.9, 0.3, 1.1)
    const bodyGeom = new THREE.BoxGeometry(0.9, 0.3, 1.1);
    this.bodyMat = new THREE.MeshStandardMaterial({ 
      color: color,
      transparent: true,
      opacity: 1.0
    });
    const bodyMesh = new THREE.Mesh(bodyGeom, this.bodyMat);
    bodyMesh.position.y = 0.15;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    this.group.add(bodyMesh);

    this.turretGroup = new THREE.Group();
    this.turretGroup.position.y = 0.4;
    
    // Turret base
    const baseGeom = new THREE.CylinderGeometry(0.25, 0.25, 0.2, 8);
    this.baseMat = new THREE.MeshStandardMaterial({ 
      color: color,
      transparent: true,
      opacity: 1.0
    });
    const baseMesh = new THREE.Mesh(baseGeom, this.baseMat);
    baseMesh.castShadow = true;
    this.turretGroup.add(baseMesh);

    // Barrel
    const barrelGeom = new THREE.BoxGeometry(0.12, 0.12, 0.8);
    const barrelColor = new THREE.Color(color).lerp(new THREE.Color(0x000000), 0.3);
    this.barrelMat = new THREE.MeshStandardMaterial({ 
      color: barrelColor,
      transparent: true,
      opacity: 1.0
    });
    const barrelMesh = new THREE.Mesh(barrelGeom, this.barrelMat);
    barrelMesh.position.z = 0.5;
    barrelMesh.castShadow = true;
    this.turretGroup.add(barrelMesh);

    this.group.add(this.turretGroup);
    this.scene.add(this.group);
  }

  setInvulnerable(isInvuln) {
    const opacity = isInvuln ? 0.4 : 1.0;
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
      if (child.isMesh) {
        child.geometry.dispose();
      }
    });
  }
}

export class Bullet {
  constructor(scene, id, x, z, dx, dz, ownerId, color) {
    this.scene = scene;
    this.id = id;
    this.dx = dx;
    this.dz = dz;
    this.ownerId = ownerId;

    const geom = new THREE.SphereGeometry(BULLET_RADIUS, 8, 8);
    this.mat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.5
    });
    this.mesh = new THREE.Mesh(geom, this.mat);
    this.mesh.position.set(x, 0.3, z);
    this.mesh.castShadow = true;
    
    this.light = new THREE.PointLight(color, 0.5, 2);
    this.mesh.add(this.light);

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
    this.mat.dispose();
    this.mesh.geometry.dispose();
    this.light.dispose();
  }
}
