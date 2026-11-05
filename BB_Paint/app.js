/**
 * 쁘니 페인터즈 (Ppeuni Painters)
 * 모바일 4인 P2P 3D Turf Battle 게임
 * 
 * - Three.js (ES Module): 30x30 InstancedMesh 타일 바닥, 완전한 3D 캐릭터 모델, 파티클
 * - PeerJS: WebRTC DataChannel 기반 서버리스 P2P 동기화 (Authoritative Host)
 * - Canvas Confetti & Web Audio API
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

/* ========================================================
   1. 상수 및 캐릭터 메타데이터 정의
   ======================================================== */
const GRID_SIZE = 30; // 30x30 타일 (총 900개)
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;
const TILE_SIZE = 1.0;
const TILE_HALF = (GRID_SIZE * TILE_SIZE) / 2; // 15
const PAINT_RADIUS = 1.35; // 칠하기 반경
const GAME_DURATION = 60; // 60초

// 캐릭터 4종 정의 (빨강: 말랑쁘니, 파랑: 강아지쁘니, 노랑: 시크릿쁘니, 핑크: 돼지쁘니)
const CHARACTERS = [
  {
    id: 1,
    name: '말랑쁘니',
    colorName: '빨강',
    hex: '#FF4D4D',
    threeColor: new THREE.Color(0xFF4D4D),
    image: 'assets/player_1.png',
    spawn: { x: -10, z: -10 }
  },
  {
    id: 2,
    name: '강아지쁘니',
    colorName: '파랑',
    hex: '#2E86DE',
    threeColor: new THREE.Color(0x2E86DE),
    image: 'assets/player_2.png',
    spawn: { x: 10, z: 10 }
  },
  {
    id: 3,
    name: '시크릿쁘니',
    colorName: '노랑',
    hex: '#F1C40F',
    threeColor: new THREE.Color(0xF1C40F),
    image: 'assets/player_3.png',
    spawn: { x: 10, z: -10 }
  },
  {
    id: 4,
    name: '돼지쁘니',
    colorName: '핑크',
    hex: '#FF6EA7',
    threeColor: new THREE.Color(0xFF6EA7),
    image: 'assets/player_4.png',
    spawn: { x: -10, z: 10 }
  }
];

const NEUTRAL_COLOR = new THREE.Color(0xEDEFF2);

/* ========================================================
   2. Web Audio API 절차적 사운드 매니저
   ======================================================== */
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.lastPopTime = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  // 타일 색칠 퐁퐁 효과음 (버블/잉크 튐)
  playPaintPop(playerIndex = 1) {
    if (!this.enabled || !this.ctx) return;
    const now = performance.now();
    if (now - this.lastPopTime < 45) return;
    this.lastPopTime = now;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const baseFreq = [520, 640, 780, 920][(playerIndex - 1) % 4] || 600;
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq + Math.random() * 80, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch (e) {}
  }

  // 카운트다운 삑 소리
  playBeep(isHigh = false) {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isHigh ? 880 : 440, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.21);
    } catch (e) {}
  }

  // 승리 팡파레
  playFanfare() {
    if (!this.enabled || !this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.42);
        }, idx * 110);
      });
    } catch (e) {}
  }
}

const sounds = new SoundManager();

/* ========================================================
   3. Fallback 캐릭터 캔버스 생성기
   ======================================================== */
function createFallbackTexture(colorHex, name) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 256, 256);

  ctx.save();
  ctx.beginPath();
  ctx.arc(128, 140, 90, 0, Math.PI * 2);
  ctx.fillStyle = colorHex;
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#FFFFFF';
  ctx.stroke();

  // 귀
  ctx.beginPath();
  ctx.arc(70, 65, 34, 0, Math.PI * 2);
  ctx.arc(186, 65, 34, 0, Math.PI * 2);
  ctx.fillStyle = colorHex;
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 8;
  ctx.stroke();

  // 볼터치
  ctx.beginPath();
  ctx.arc(80, 160, 16, 0, Math.PI * 2);
  ctx.arc(176, 160, 16, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 100, 150, 0.4)';
  ctx.fill();

  // 눈
  ctx.beginPath();
  ctx.arc(95, 130, 12, 0, Math.PI * 2);
  ctx.arc(161, 130, 12, 0, Math.PI * 2);
  ctx.fillStyle = '#222222';
  ctx.fill();

  // 눈 하이라이트
  ctx.beginPath();
  ctx.arc(98, 126, 4, 0, Math.PI * 2);
  ctx.arc(164, 126, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  // 입
  ctx.beginPath();
  ctx.arc(128, 150, 14, 0, Math.PI);
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#222222';
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#222222';
  ctx.fillText(name, 128, 245);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/* ========================================================
   4. 파티클 시스템 (발밑 잉크 튀김 효과)
   ======================================================== */
class InkParticleSystem {
  constructor(scene, count = 140) {
    this.scene = scene;
    this.count = count;
    this.particles = [];

    const geom = new THREE.SphereGeometry(0.14, 6, 6);
    this.instancedMesh = new THREE.InstancedMesh(
      geom,
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
      count
    );
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
    this.scene.add(this.instancedMesh);

    this.dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      this.particles.push({
        active: false,
        x: 0, y: -99, z: 0,
        vx: 0, vy: 0, vz: 0,
        scale: 1,
        life: 0,
        maxLife: 0.5,
        color: new THREE.Color()
      });
      this.dummy.position.set(0, -99, 0);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.nextIdx = 0;
  }

  emit(x, y, z, color) {
    const p = this.particles[this.nextIdx];
    p.active = true;
    p.x = x + (Math.random() - 0.5) * 0.4;
    p.y = y + 0.1;
    p.z = z + (Math.random() - 0.5) * 0.4;
    const speed = 1.2 + Math.random() * 2.0;
    const angle = Math.random() * Math.PI * 2;
    p.vx = Math.cos(angle) * speed;
    p.vy = 2.0 + Math.random() * 2.5;
    p.vz = Math.sin(angle) * speed;
    p.scale = 0.8 + Math.random() * 0.5;
    p.life = 0;
    p.maxLife = 0.35 + Math.random() * 0.25;
    p.color.copy(color);

    this.instancedMesh.setColorAt(this.nextIdx, p.color);
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }

    this.nextIdx = (this.nextIdx + 1) % this.count;
  }

  update(dt) {
    let changed = false;
    for (let i = 0; i < this.count; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        this.dummy.position.set(0, -99, 0);
        this.dummy.scale.set(1, 1, 1);
        this.dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
        changed = true;
        continue;
      }

      p.vy -= 9.8 * dt; // 중력
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;

      if (p.y < 0.1) {
        p.y = 0.1;
        p.vy = -p.vy * 0.3;
      }

      const progress = p.life / p.maxLife;
      const curScale = p.scale * (1 - progress);

      this.dummy.position.set(p.x, p.y, p.z);
      this.dummy.scale.set(curScale, curScale, curScale);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
      changed = true;
    }
    if (changed) {
      this.instancedMesh.instanceMatrix.needsUpdate = true;
    }
  }
}

/* ========================================================
   5. 3D 캐릭터 빌더 함수 (말랑이 & 쁘니 페인터즈 3D 피규어 모델)
   ======================================================== */
function build3DCharacterModel(charConfig) {
  const root = new THREE.Group();

  // 재질 정의 (부드러운 클레이 피규어 텍스처)
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xFFE0D2, // 뽀얗고 생기 있는 살구빛 찹쌀떡 피부
    roughness: 0.38,
    metalness: 0.02
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x613E28, // 부드러운 웜 초콜릿 브라운 (버섯갓/초코송이 느낌 탈피!)
    roughness: 0.45,
    metalness: 0.04
  });

  // ----------------------------------------------------
  // 1. 머리 (귀여운 단발머리 Bob Hair & 'ㅅ' 형태의 시그니처 앞머리)
  // * 눈, 코, 입, 볼 표시 등 모든 이목구비 표시가 깔끔하게 정돈된 사랑스러운 찹쌀떡 피규어 페이스
  // ----------------------------------------------------
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.05;

  // 뽀얗고 통통한 찹쌀떡 얼굴 (볼살이 사랑스러운 베이비 페이스)
  const faceGeom = new THREE.SphereGeometry(0.52, 28, 28);
  faceGeom.scale(1.14, 1.02, 1.0);
  const faceMesh = new THREE.Mesh(faceGeom, skinMat);
  faceMesh.castShadow = true;
  headGroup.add(faceMesh);

  // 귀여운 단발머리 정수리/두상 쉘 (앞머리 없이 둥근 이마와 두상을 감싸는 볼륨)
  const hairShellGeom = new THREE.SphereGeometry(0.55, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.58);
  hairShellGeom.scale(1.15, 1.04, 1.05);
  const hairShell = new THREE.Mesh(hairShellGeom, hairMat);
  hairShell.position.set(0, 0.05, -0.05);
  headGroup.add(hairShell);

  // 뒤통수 단발머리 (초코송이처럼 밖으로 퍼지지 않고, 목덜미 안쪽으로 부드럽게 감겨 들어가는 형태)
  const backBottomGeom = new THREE.CylinderGeometry(0.53, 0.44, 0.36, 20);
  backBottomGeom.scale(1.12, 1.0, 0.85);
  const backBottomHair = new THREE.Mesh(backBottomGeom, hairMat);
  backBottomHair.position.set(0, -0.14, -0.12);
  headGroup.add(backBottomHair);

  // 양옆 사랑스러운 단발 C컬 볼륨 (뺨을 둥글게 안쪽으로 감싸며 얼굴을 갸름하고 귀엽게 연출)
  const sideBobGeom = new THREE.CapsuleGeometry(0.13, 0.32, 8, 14);
  sideBobGeom.scale(1.0, 1.15, 1.25);

  const leftSideBob = new THREE.Mesh(sideBobGeom, hairMat);
  leftSideBob.position.set(-0.50, -0.06, 0.10);
  leftSideBob.rotation.set(0.08, 0.18, -0.12); // 안쪽으로 부드럽게 감김
  headGroup.add(leftSideBob);

  const rightSideBob = new THREE.Mesh(sideBobGeom, hairMat);
  rightSideBob.position.set(0.50, -0.06, 0.10);
  rightSideBob.rotation.set(0.08, -0.18, 0.12); // 안쪽으로 부드럽게 감김
  headGroup.add(rightSideBob);

  // 단발머리 사이로 살포시 드러나는 귀여운 아기 귀
  const earGeom = new THREE.SphereGeometry(0.09, 10, 10);
  earGeom.scale(0.5, 0.85, 0.75);
  const leftEar = new THREE.Mesh(earGeom, skinMat);
  leftEar.position.set(-0.52, -0.05, 0.02);
  headGroup.add(leftEar);

  const rightEar = new THREE.Mesh(earGeom, skinMat);
  rightEar.position.set(0.52, -0.05, 0.02);
  headGroup.add(rightEar);

  // ----------------------------------------------------
  // 2. 캐릭터별 고유 머리 장식 (헤어밴드 & 헤어핀)
  // * 눈, 코, 입, 볼터치는 모두 제거하여 심플하고 세련된 피규어 비주얼 완성
  // ----------------------------------------------------
  if (charConfig.id === 2) {
    // [강아지쁘니] 베이지색 강아지 귀 머리띠 (코 제거)
    const dogEarMat = new THREE.MeshStandardMaterial({ color: 0xC89D6D, roughness: 0.4 });
    const leftDogEar = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.36, 6, 10), dogEarMat);
    leftDogEar.position.set(-0.52, 0.32, 0.05);
    leftDogEar.rotation.z = 0.55;
    headGroup.add(leftDogEar);

    const rightDogEar = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.36, 6, 10), dogEarMat);
    rightDogEar.position.set(0.52, 0.32, 0.05);
    rightDogEar.rotation.z = -0.55;
    headGroup.add(rightDogEar);

  } else if (charConfig.id === 4) {
    // [돼지쁘니] 핑크 돼지 귀 머리띠 (코 제거)
    const pigPinkMat = new THREE.MeshStandardMaterial({ color: 0xFFB3C6, roughness: 0.35 });
    const earGeom = new THREE.ConeGeometry(0.18, 0.28, 8);

    const leftPigEar = new THREE.Mesh(earGeom, pigPinkMat);
    leftPigEar.position.set(-0.38, 0.50, 0);
    leftPigEar.rotation.z = -0.25;
    headGroup.add(leftPigEar);

    const rightPigEar = new THREE.Mesh(earGeom, pigPinkMat);
    rightPigEar.position.set(0.38, 0.50, 0);
    rightPigEar.rotation.z = 0.25;
    headGroup.add(rightPigEar);

  } else if (charConfig.id === 3) {
    // [시크릿쁘니] 노란색 헤어핀 & 꽃 장식
    const yellowPinMat = new THREE.MeshStandardMaterial({ color: 0xFEE140, roughness: 0.2 });
    const pinGeom = new THREE.CapsuleGeometry(0.03, 0.12, 6, 8);

    const pin1 = new THREE.Mesh(pinGeom, yellowPinMat);
    pin1.position.set(-0.34, 0.30, 0.46);
    pin1.rotation.z = 0.8;
    headGroup.add(pin1);

    const pin2 = new THREE.Mesh(pinGeom, yellowPinMat);
    pin2.position.set(-0.40, 0.24, 0.45);
    pin2.rotation.z = 0.8;
    headGroup.add(pin2);

    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshStandardMaterial({ color: 0xFF6584 }));
    flower.position.set(0.38, 0.46, 0.24);
    headGroup.add(flower);

  } else if (charConfig.id === 1) {
    // [말랑쁘니] 사랑스러운 미니 데이지 헤어핀
    const hairpinMat = new THREE.MeshStandardMaterial({ color: 0xFEE140, roughness: 0.25 });
    const hairFlower = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), hairpinMat);
    hairFlower.position.set(-0.36, 0.28, 0.40);
    headGroup.add(hairFlower);

    const hairFlowerCenter = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
    hairFlowerCenter.position.set(-0.37, 0.29, 0.44);
    headGroup.add(hairFlowerCenter);
  }

  root.add(headGroup);

  // ----------------------------------------------------
  // 4. 몸통 및 의상 (초코송이 막대기 탈피 ➔ 포근하고 통통한 아기 바디)
  // ----------------------------------------------------
  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = 0.56;

  // 캐릭터별 소매 색상
  let sleeveColor = 0xFF3838; // 말랑쁘니 레드 상의 소매

  if (charConfig.id === 1) {
    // === [말랑쁘니] 사랑스럽고 또렷한 붉은색 상의 (Red Top & Floral Vest) ===
    sleeveColor = 0xFF3838;
    const redShirtMat = new THREE.MeshStandardMaterial({ color: 0xFF3838, roughness: 0.35 }); // 생생한 붉은색 셔츠
    const redVestMat = new THREE.MeshStandardMaterial({ color: 0xC02636, roughness: 0.32 }); // 입체감을 주는 딥 체리레드 조끼
    const creamCollarMat = new THREE.MeshStandardMaterial({ color: 0xFFF7F0, roughness: 0.3 }); // 깔끔한 크림 화이트 카라깃
    const daisyMatY = new THREE.MeshBasicMaterial({ color: 0xFEE140 }); // 노란 꽃단추
    const daisyMatW = new THREE.MeshBasicMaterial({ color: 0xFFFFFF }); // 화이트 플라워 포인트

    // 포근하고 통통한 붉은색 상의 몸통 베이스
    const torsoGeom = new THREE.SphereGeometry(0.38, 20, 20);
    torsoGeom.scale(1.15, 1.0, 0.85);
    const torsoMesh = new THREE.Mesh(torsoGeom, redShirtMat);
    bodyGroup.add(torsoMesh);

    // 붉은색 조끼 겉옷 (몸통을 볼륨감 있게 감쌈)
    const vestGeom = new THREE.SphereGeometry(0.395, 20, 20);
    vestGeom.scale(1.18, 0.98, 0.88);
    const vestMesh = new THREE.Mesh(vestGeom, redVestMat);
    bodyGroup.add(vestMesh);

    // 단정한 화이트/크림 목깃 (카라)
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.038, 6, 16, Math.PI), creamCollarMat);
    collar.position.set(0, 0.28, 0.18);
    collar.rotation.x = 0.9;
    collar.rotation.z = Math.PI;
    bodyGroup.add(collar);

    // 가운데 크림 골드 지퍼선
    const zipper = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.44, 0.04), new THREE.MeshBasicMaterial({ color: 0xFFF0D6 }));
    zipper.position.set(0, 0, 0.34);
    bodyGroup.add(zipper);

    // 사랑스러운 꽃 장식들
    const f1 = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), daisyMatY);
    f1.position.set(-0.18, 0.08, 0.32);
    bodyGroup.add(f1);

    const f2 = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), daisyMatW);
    f2.position.set(0.18, 0.06, 0.32);
    bodyGroup.add(f2);

    const f3 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), daisyMatW);
    f3.position.set(-0.16, -0.08, 0.34);
    bodyGroup.add(f3);

    const f4 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), daisyMatY);
    f4.position.set(0.16, -0.08, 0.34);
    bodyGroup.add(f4);

  } else if (charConfig.id === 2) {
    // [강아지쁘니] 카키 티 & 데님 오버롤
    sleeveColor = 0x8D9A65;
    const khakiMat = new THREE.MeshStandardMaterial({ color: 0x8D9A65, roughness: 0.4 });
    const denimMat = new THREE.MeshStandardMaterial({ color: 0x466995, roughness: 0.35 });

    const torsoGeom = new THREE.SphereGeometry(0.38, 20, 20);
    torsoGeom.scale(1.15, 1.0, 0.85);
    const torsoMesh = new THREE.Mesh(torsoGeom, khakiMat);
    bodyGroup.add(torsoMesh);

    const bibGeom = new THREE.SphereGeometry(0.395, 20, 20);
    bibGeom.scale(1.18, 0.95, 0.88);
    const bibMesh = new THREE.Mesh(bibGeom, denimMat);
    bodyGroup.add(bibMesh);

  } else if (charConfig.id === 4) {
    // [돼지쁘니] 핑크 원피스
    sleeveColor = 0xFF9FB9;
    const dressMat = new THREE.MeshStandardMaterial({ color: 0xFF9FB9, roughness: 0.35 });
    const dressGeom = new THREE.ConeGeometry(0.46, 0.55, 18);
    const dressMesh = new THREE.Mesh(dressGeom, dressMat);
    dressMesh.position.y = -0.04;
    bodyGroup.add(dressMesh);

  } else if (charConfig.id === 3) {
    // [시크릿쁘니] 옐로우 원피스
    sleeveColor = 0xFDD835;
    const dressMat = new THREE.MeshStandardMaterial({ color: 0xFDD835, roughness: 0.35 });
    const dressGeom = new THREE.ConeGeometry(0.46, 0.55, 18);
    const dressMesh = new THREE.Mesh(dressGeom, dressMat);
    dressMesh.position.y = -0.04;
    bodyGroup.add(dressMesh);
  }

  root.add(bodyGroup);

  // ----------------------------------------------------
  // 5. 양 다리 (아장아장 짧고 통통한 귀여운 2등신 다리)
  // ----------------------------------------------------
  const legsGroup = new THREE.Group();

  let pantsColor = 0x2D3436; // 말랑이 체크 바지 (블랙/차콜)
  let shoeColor = 0x9B8BE8;  // 말랑이 연보라 슈즈

  if (charConfig.id === 2) {
    pantsColor = 0x466995;
    shoeColor = 0x8C6B4B;
  } else if (charConfig.id === 4) {
    pantsColor = 0xFFE0D2;
    shoeColor = 0xFF769B;
  } else if (charConfig.id === 3) {
    pantsColor = 0xFFE0D2;
    shoeColor = 0xF1C40F;
  }

  const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.5 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: shoeColor, roughness: 0.3 });

  // 왼쪽 다리 & 신발
  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.16, 0.24, 0);

  const leftPants = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.22, 12), pantsMat);
  leftLegGroup.add(leftPants);

  const leftFoot = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 14), shoeMat);
  leftFoot.scale.set(0.95, 0.65, 1.35);
  leftFoot.position.set(0, -0.12, 0.04);
  leftLegGroup.add(leftFoot);
  legsGroup.add(leftLegGroup);

  // 오른쪽 다리 & 신발
  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.16, 0.24, 0);

  const rightPants = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.22, 12), pantsMat);
  rightLegGroup.add(rightPants);

  const rightFoot = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 14), shoeMat);
  rightFoot.scale.set(0.95, 0.65, 1.35);
  rightFoot.position.set(0, -0.12, 0.04);
  rightLegGroup.add(rightFoot);
  legsGroup.add(rightLegGroup);

  root.add(legsGroup);

  // ----------------------------------------------------
  // 6. 양손과 페인트 롤러 / 브러시
  // ----------------------------------------------------
  const armGeom = new THREE.CapsuleGeometry(0.08, 0.24, 6, 10);
  const sleeveMat = new THREE.MeshStandardMaterial({ color: sleeveColor, roughness: 0.35 });
  const sleeveGeom = new THREE.CylinderGeometry(0.10, 0.10, 0.12, 10);

  // 왼손 및 소매
  const leftHand = new THREE.Mesh(armGeom, skinMat);
  leftHand.position.set(-0.40, 0.58, 0);
  leftHand.rotation.z = 0.35;

  const leftSleeve = new THREE.Mesh(sleeveGeom, sleeveMat);
  leftSleeve.position.set(0, 0.08, 0);
  leftHand.add(leftSleeve);
  root.add(leftHand);

  // 오른손 및 소매 (도구를 들고 살짝 앞으로)
  const rightHandGroup = new THREE.Group();
  rightHandGroup.position.set(0.40, 0.58, 0.10);
  rightHandGroup.rotation.set(-0.35, 0, -0.35);

  const rightArm = new THREE.Mesh(armGeom, skinMat);
  const rightSleeve = new THREE.Mesh(sleeveGeom, sleeveMat);
  rightSleeve.position.set(0, 0.08, 0);
  rightArm.add(rightSleeve);
  rightHandGroup.add(rightArm);

  const toolGroup = new THREE.Group();
  toolGroup.position.set(0, 0.14, 0.12);

  if (charConfig.id === 2) {
    // 강아지쁘니: 페인트 브러시
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.34, 8), new THREE.MeshStandardMaterial({ color: 0x2C3E50 }));
    handle.rotation.x = Math.PI / 3;
    toolGroup.add(handle);

    const brushTip = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.18, 10), new THREE.MeshStandardMaterial({ color: 0x2E86DE, roughness: 0.2 }));
    brushTip.position.set(0, 0.16, 0.12);
    brushTip.rotation.x = Math.PI / 3;
    toolGroup.add(brushTip);

  } else {
    // 페인트 롤러 (Paint Roller)
    const handleMat = new THREE.MeshStandardMaterial({ color: charConfig.threeColor, roughness: 0.3 });
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.26, 8), handleMat);
    handle.position.set(0, 0, 0);
    handle.rotation.x = 0.35;
    toolGroup.add(handle);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0xBDC3C7, metalness: 0.85, roughness: 0.2 });
    const wire1 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.20, 6), frameMat);
    wire1.position.set(0, 0.14, 0.06);
    toolGroup.add(wire1);

    const wire2 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.16, 6), frameMat);
    wire2.position.set(0.08, 0.22, 0.06);
    wire2.rotation.z = Math.PI / 2;
    toolGroup.add(wire2);

    const rollerMat = new THREE.MeshStandardMaterial({
      color: charConfig.threeColor,
      roughness: 0.25,
      metalness: 0.05
    });
    const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.30, 16), rollerMat);
    roller.position.set(0.09, 0.29, 0.06);
    roller.rotation.z = Math.PI / 2;
    toolGroup.add(roller);
  }

  rightHandGroup.add(toolGroup);
  root.add(rightHandGroup);

  // 애니메이션 데이터 바인딩
  root.userData.leftFoot = leftLegGroup;
  root.userData.rightFoot = rightLegGroup;
  root.userData.leftHand = leftHand;
  root.userData.rightHand = rightHandGroup;
  root.userData.head = headGroup;

  return root;
}

/* ----------------------------------------------------
   인게임 3D 캐릭터 실시간 오프스크린 스냅샷 생성기
   - 2D 일러스트 대신 실제 3D 모델(단발머리, 붉은색 상의, 도구)을
     캐릭터 선택창 및 슬롯 아바타 이미지로 자동 렌더링
   ---------------------------------------------------- */
function generate3DCharacterSnapshots() {
  const size = 320;
  const offCanvas = document.createElement('canvas');
  offCanvas.width = size;
  offCanvas.height = size;

  let offRenderer;
  try {
    offRenderer = new THREE.WebGLRenderer({
      canvas: offCanvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
  } catch (e) {
    console.warn('Offscreen WebGLRenderer 초기화 실패:', e);
    return null;
  }

  offRenderer.setSize(size, size);
  offRenderer.setClearColor(0x000000, 0);

  const offScene = new THREE.Scene();

  // 입체감과 찹쌀떡 피부, 선명한 의상을 돋보이게 하는 스튜디오 조명
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xb0c4de, 1.4);
  offScene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
  keyLight.position.set(2.5, 4, 3.5);
  offScene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xfff0e6, 0.8);
  fillLight.position.set(-2.5, 2, 2.5);
  offScene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.7);
  rimLight.position.set(0, 3, -3);
  offScene.add(rimLight);

  const offCam = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  // 단발머리, 윙크 표정, 붉은색 상의와 페인트 롤러가 한눈에 잘 보이는 최적의 프레이밍
  offCam.position.set(0, 0.88, 2.65);
  offCam.lookAt(0, 0.82, 0);

  const snapshots = {};
  CHARACTERS.forEach((cfg) => {
    const model = build3DCharacterModel(cfg);
    model.rotation.y = -0.16; // 사랑스러운 3/4 얼짱 각도
    offScene.add(model);
    offRenderer.render(offScene, offCam);
    snapshots[cfg.id] = offCanvas.toDataURL('image/png');
    offScene.remove(model);
  });

  offRenderer.dispose();
  return snapshots;
}

/* ========================================================
   6. 메인 게임 클래스
   ======================================================== */
class PpeuniPaintersGame {
  constructor() {
    this.container = document.getElementById('game-container');
    
    // 네트워크 및 역할 상태
    this.isHost = false;
    this.mySlotIndex = 0; // 0, 1, 2, 3 (슬롯 위치)
    this.mySelectedCharId = 1; // 1: 말랑쁘니, 2: 강아지쁘니, 3: 시크릿쁘니, 4: 돼지쁘니
    this.roomCode = null;
    this.peer = null;
    this.connections = {}; // { slotIdx: DataConnection }
    this.hostConn = null;
    this.networkTickTimer = null;
    this.snapshotTimer = null;

    // 게임 상태
    this.gameState = 'LOBBY'; // LOBBY, WAITING, PLAYING, ENDED
    this.timeLeft = GAME_DURATION;
    this.timerInterval = null;
    this.maxPlayers = 4; // 참가 인원수 (2, 3, 4)

    // 인게임 3D 캐릭터 스냅샷 생성 및 메타데이터 주입
    this.characterSnapshots = generate3DCharacterSnapshots();
    if (this.characterSnapshots) {
      CHARACTERS.forEach((c) => {
        if (this.characterSnapshots[c.id]) {
          c.image = this.characterSnapshots[c.id];
        }
      });
    }

    // 타일 상태 (0: 중립, 1~4: 캐릭터 색상 ID)
    this.tileOwners = new Uint8Array(TOTAL_TILES);
    this.tileScales = new Float32Array(TOTAL_TILES);
    for (let i = 0; i < TOTAL_TILES; i++) this.tileScales[i] = 1.0;
    this.changedTilesBuffer = [];

    // 플레이어 4명 상태 (슬롯 0~3)
    this.players = [];
    for (let i = 0; i < 4; i++) {
      const cfg = CHARACTERS[i];
      const charImg = (this.characterSnapshots && this.characterSnapshots[cfg.id]) ? this.characterSnapshots[cfg.id] : cfg.image;
      this.players.push({
        slotIndex: i,
        slotType: (i === 0) ? 'USER' : 'AI', // 1P: USER, 2~4P: 기본 AI (원클릭 토글 가능)
        charId: cfg.id, // 선택된 캐릭터 ID
        name: cfg.name,
        colorHex: cfg.hex,
        threeColor: cfg.threeColor,
        image: charImg,
        connected: (i === 0), // 실제 유저 접속 여부
        isAI: (i !== 0),
        x: cfg.spawn.x,
        z: cfg.spawn.z,
        vx: 0,
        vz: 0,
        targetX: cfg.spawn.x,
        targetZ: cfg.spawn.z,
        facingAngle: 0,
        walkTime: 0,
        isMoving: false,
        modelGroup: null,
        shadow: null
      });
    }

    // 입력 상태
    this.inputVector = { x: 0, z: 0 };
    this.keyState = { w: false, a: false, s: false, d: false };
    this.keyVector = { x: 0, z: 0 };

    // Three.js 리소스
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.instancedMesh = null;
    this.tileMatrixDummy = new THREE.Object3D();
    this.particles = null;
    this.textures = {};

    // 로딩 및 초기화 (지연 없이 즉각 실행)
    this.initThree();
    this.initTiles();
    this.init3DCharacters();
    this.loadCharacterTextures();
    this.initEnvironment();
    this.initInputControls();
    this.initLobbyUI();
    this.updateCharPickerUI();
    this.updateRoomSlotsUI();
    this.updateMyBadgeUI();
    this.setScreen('TITLE');

    // 애니메이션 루프
    this.lastTime = performance.now();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    window.addEventListener('resize', () => this.onWindowResize());
  }

  /* ----------------------------------------------------
     3D 씬 및 렌더러 설정
     ---------------------------------------------------- */
  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xA5D8FF);
    this.scene.fog = new THREE.FogExp2(0xA5D8FF, 0.015);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(0, 18, 14);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.container.appendChild(this.renderer.domElement);

    // 화사한 조명 세팅 (앰비언트 + 메인 디렉셔널 + 3D 윤곽 림 라이트)
    const hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0x8CB8E8, 0.9);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.95);
    dirLight.position.set(15, 30, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 70;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    this.scene.add(dirLight);

    // 캐릭터 윤곽을 입체적으로 강조하는 림 라이트 (역광)
    const rimLight = new THREE.DirectionalLight(0xFFEDD5, 0.65);
    rimLight.position.set(-18, 22, -18);
    this.scene.add(rimLight);

    this.particles = new InkParticleSystem(this.scene, 140);
  }

  /* ----------------------------------------------------
     30x30 InstancedMesh 바닥 타일 생성
     ---------------------------------------------------- */
  initTiles() {
    const tileGeom = new THREE.BoxGeometry(0.96, 0.2, 0.96);
    const tileMat = new THREE.MeshStandardMaterial({
      roughness: 0.35,
      metalness: 0.1
    });

    this.instancedMesh = new THREE.InstancedMesh(tileGeom, tileMat, TOTAL_TILES);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.instancedMesh.receiveShadow = true;

    const colorArray = new Float32Array(TOTAL_TILES * 3);
    let idx = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const x = (c - GRID_SIZE / 2 + 0.5) * TILE_SIZE;
        const z = (r - GRID_SIZE / 2 + 0.5) * TILE_SIZE;

        this.tileMatrixDummy.position.set(x, -0.1, z);
        this.tileMatrixDummy.scale.set(1, 1, 1);
        this.tileMatrixDummy.updateMatrix();
        this.instancedMesh.setMatrixAt(idx, this.tileMatrixDummy.matrix);

        colorArray[idx * 3] = NEUTRAL_COLOR.r;
        colorArray[idx * 3 + 1] = NEUTRAL_COLOR.g;
        colorArray[idx * 3 + 2] = NEUTRAL_COLOR.b;

        idx++;
      }
    }

    this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(colorArray, 3);
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.instancedMesh);
  }

  /* ----------------------------------------------------
     캐릭터 텍스처 로딩 & Fallback
     ---------------------------------------------------- */
  loadCharacterTextures(onComplete) {
    const loader = new THREE.TextureLoader();
    let loadedCount = 0;

    CHARACTERS.forEach((c) => {
      loader.load(
        c.image,
        (tex) => {
          tex.minFilter = THREE.LinearFilter;
          tex.magFilter = THREE.LinearFilter;
          this.textures[c.id] = tex;
          loadedCount++;
          if (loadedCount === CHARACTERS.length && onComplete) onComplete();
        },
        undefined,
        () => {
          const fallbackTex = createFallbackTexture(c.hex, c.name);
          this.textures[c.id] = fallbackTex;
          loadedCount++;
          if (loadedCount === CHARACTERS.length && onComplete) onComplete();
        }
      );
    });
  }

  /* ----------------------------------------------------
     3D 캐릭터 모델 인스턴스화
     ---------------------------------------------------- */
  init3DCharacters() {
    this.players.forEach((p, idx) => {
      this.rebuildPlayer3DModel(p);
    });
  }

  rebuildPlayer3DModel(player) {
    if (player.modelGroup) {
      this.scene.remove(player.modelGroup);
    }
    if (player.shadow) {
      this.scene.remove(player.shadow);
    }

    const charCfg = CHARACTERS.find((c) => c.id === player.charId) || CHARACTERS[0];

    // 완전한 3D 피규어 모델 그룹 생성 (종이 스티커 완전 제거)
    const group = build3DCharacterModel(charCfg);
    group.position.set(player.x, 0, player.z);
    this.scene.add(group);
    player.modelGroup = group;

    // 발밑 원형 그림자
    const shadowGeom = new THREE.CircleGeometry(0.75, 18);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x1E272E,
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(player.x, 0.015, player.z);
    this.scene.add(shadowMesh);
    player.shadow = shadowMesh;
  }

  /* ----------------------------------------------------
     경기장 외곽 가드레일 & 장식 배경
     ---------------------------------------------------- */
  initEnvironment() {
    const baseGeom = new THREE.BoxGeometry(GRID_SIZE + 0.6, 1.0, GRID_SIZE + 0.6);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0xD2DAE2,
      roughness: 0.6
    });
    const baseMesh = new THREE.Mesh(baseGeom, baseMat);
    baseMesh.position.set(0, -0.65, 0);
    this.scene.add(baseMesh);

    const fenceMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.1
    });

    const fenceLength = GRID_SIZE + 0.4;
    const fenceThickness = 0.4;
    const fenceHeight = 0.8;

    const northFence = new THREE.Mesh(new THREE.BoxGeometry(fenceLength, fenceHeight, fenceThickness), fenceMat);
    northFence.position.set(0, fenceHeight / 2, -TILE_HALF);
    this.scene.add(northFence);

    const southFence = new THREE.Mesh(new THREE.BoxGeometry(fenceLength, fenceHeight, fenceThickness), fenceMat);
    southFence.position.set(0, fenceHeight / 2, TILE_HALF);
    this.scene.add(southFence);

    const westFence = new THREE.Mesh(new THREE.BoxGeometry(fenceThickness, fenceHeight, fenceLength), fenceMat);
    westFence.position.set(-TILE_HALF, fenceHeight / 2, 0);
    this.scene.add(westFence);

    const eastFence = new THREE.Mesh(new THREE.BoxGeometry(fenceThickness, fenceHeight, fenceLength), fenceMat);
    eastFence.position.set(TILE_HALF, fenceHeight / 2, 0);
    this.scene.add(eastFence);
  }

  /* ----------------------------------------------------
     모바일 조이스틱 & 키보드 조작
     ---------------------------------------------------- */
  initInputControls() {
    const joystickZone = document.getElementById('joystick-zone');
    const joystickBase = document.getElementById('joystick-base');
    const joystickStick = document.getElementById('joystick-stick');

    let touchId = null;
    let basePos = { x: 0, y: 0 };
    const maxRadius = 45;

    const handleTouchStart = (e) => {
      if (this.gameState !== 'PLAYING') return;
      if (touchId !== null) return;
      sounds.init();

      const touch = e.changedTouches ? e.changedTouches[0] : e;
      touchId = touch.identifier !== undefined ? touch.identifier : 1;

      basePos.x = touch.clientX;
      basePos.y = touch.clientY;

      joystickBase.style.left = `${basePos.x}px`;
      joystickBase.style.top = `${basePos.y}px`;
      joystickStick.style.transform = `translate(0px, 0px)`;
      joystickBase.classList.remove('hidden');
    };

    const handleTouchMove = (e) => {
      if (touchId === null) return;
      let touch = null;
      if (e.changedTouches) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchId) {
            touch = e.changedTouches[i];
            break;
          }
        }
      } else {
        touch = e;
      }
      if (!touch) return;

      const dx = touch.clientX - basePos.x;
      const dy = touch.clientY - basePos.y;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);

      const clampedDist = Math.min(dist, maxRadius);
      const stickX = Math.cos(angle) * clampedDist;
      const stickY = Math.sin(angle) * clampedDist;

      joystickStick.style.transform = `translate(${stickX}px, ${stickY}px)`;
      this.inputVector.x = stickX / maxRadius;
      this.inputVector.z = stickY / maxRadius;
    };

    const handleTouchEnd = (e) => {
      if (touchId === null) return;
      let matched = false;
      if (e.changedTouches) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchId) {
            matched = true;
            break;
          }
        }
      } else {
        matched = true;
      }

      if (matched) {
        touchId = null;
        this.inputVector.x = 0;
        this.inputVector.z = 0;
        joystickBase.classList.add('hidden');
        joystickStick.style.transform = `translate(0px, 0px)`;
      }
    };

    joystickZone.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    let isMouseDown = false;
    joystickZone.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isMouseDown = true;
      handleTouchStart(e);
    });
    window.addEventListener('mousemove', (e) => {
      if (!isMouseDown) return;
      handleTouchMove(e);
    });
    window.addEventListener('mouseup', (e) => {
      if (!isMouseDown) return;
      isMouseDown = false;
      handleTouchEnd(e);
    });

    window.addEventListener('keydown', (e) => {
      sounds.init();
      const key = e.key.toLowerCase();
      if (['w', 'arrowup'].includes(key)) this.keyState.w = true;
      if (['s', 'arrowdown'].includes(key)) this.keyState.s = true;
      if (['a', 'arrowleft'].includes(key)) this.keyState.a = true;
      if (['d', 'arrowright'].includes(key)) this.keyState.d = true;
      this.updateKeyboardVector();
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (['w', 'arrowup'].includes(key)) this.keyState.w = false;
      if (['s', 'arrowdown'].includes(key)) this.keyState.s = false;
      if (['a', 'arrowleft'].includes(key)) this.keyState.a = false;
      if (['d', 'arrowright'].includes(key)) this.keyState.d = false;
      this.updateKeyboardVector();
    });
  }

  updateKeyboardVector() {
    let kx = 0;
    let kz = 0;
    if (this.keyState.w) kz -= 1;
    if (this.keyState.s) kz += 1;
    if (this.keyState.a) kx -= 1;
    if (this.keyState.d) kx += 1;

    if (kx !== 0 && kz !== 0) {
      const len = Math.hypot(kx, kz);
      kx /= len;
      kz /= len;
    }

    if (this.inputVector.x === 0 && this.inputVector.z === 0) {
      this.keyVector = { x: kx, z: kz };
    } else {
      this.keyVector = { x: 0, z: 0 };
    }
  }

  /* ----------------------------------------------------
     화면 전환 시스템 (TITLE > MODE > ROOM > GAME > RESULT)
     ---------------------------------------------------- */
  setScreen(screenName) {
    const titleScreen = document.getElementById('title-screen');
    const modeScreen = document.getElementById('mode-screen');
    const roomScreen = document.getElementById('room-screen');
    const hudLayer = document.getElementById('hud-layer');
    const resultLayer = document.getElementById('result-layer');

    if (titleScreen) titleScreen.classList.toggle('hidden', screenName !== 'TITLE');
    if (modeScreen) modeScreen.classList.toggle('hidden', screenName !== 'MODE');
    if (roomScreen) roomScreen.classList.toggle('hidden', screenName !== 'ROOM');
    if (hudLayer) hudLayer.classList.toggle('hidden', screenName !== 'GAME');
    if (resultLayer && screenName !== 'RESULT') resultLayer.classList.add('hidden');

    if (screenName === 'TITLE') {
      this.gameState = 'TITLE';
    } else if (screenName === 'MODE') {
      this.gameState = 'MODE';
    } else if (screenName === 'ROOM') {
      this.gameState = 'WAITING';
      this.updateRoomActionButtons();
    } else if (screenName === 'GAME') {
      this.gameState = 'PLAYING';
    } else if (screenName === 'RESULT') {
      this.gameState = 'ENDED';
    }
  }

  /* ----------------------------------------------------
     로비 UI 및 화면 이벤트 바인딩
     ---------------------------------------------------- */
  initLobbyUI() {
    // 1) 타이틀 화면 액션
    const btnTitleStart = document.getElementById('btn-title-start');
    const btnTitleQuickJoin = document.getElementById('btn-title-quick-join');
    const btnHowToPlay = document.getElementById('btn-how-to-play');
    const btnCloseHowtoplay = document.getElementById('btn-close-howtoplay');
    const btnConfirmHowtoplay = document.getElementById('btn-confirm-howtoplay');
    const howtoModal = document.getElementById('howtoplay-modal');

    if (btnTitleStart) {
      btnTitleStart.addEventListener('click', () => {
        sounds.init();
        sounds.playBeep(true);
        this.setScreen('MODE');
      });
    }

    if (btnTitleQuickJoin) {
      btnTitleQuickJoin.addEventListener('click', () => {
        sounds.init();
        sounds.playBeep(true);
        this.setScreen('MODE');
        setTimeout(() => {
          const input = document.getElementById('input-room-code');
          if (input) input.focus();
        }, 150);
      });
    }

    if (btnHowToPlay) {
      btnHowToPlay.addEventListener('click', () => {
        sounds.init();
        if (howtoModal) howtoModal.classList.remove('hidden');
      });
    }

    if (btnCloseHowtoplay) {
      btnCloseHowtoplay.addEventListener('click', () => {
        if (howtoModal) howtoModal.classList.add('hidden');
      });
    }

    if (btnConfirmHowtoplay) {
      btnConfirmHowtoplay.addEventListener('click', () => {
        sounds.init();
        if (howtoModal) howtoModal.classList.add('hidden');
      });
    }

    // 2) 모드 선택 화면 액션
    const btnModeBackTitle = document.getElementById('btn-mode-back-title');
    const btnCreateRoom = document.getElementById('btn-create-room');
    const btnJoinRoom = document.getElementById('btn-join-room');
    const inputRoomCode = document.getElementById('input-room-code');
    const btnQuickAiPlay = document.getElementById('btn-quick-ai-play');

    if (btnModeBackTitle) {
      btnModeBackTitle.addEventListener('click', () => {
        sounds.init();
        this.setScreen('TITLE');
      });
    }

    if (btnCreateRoom) {
      btnCreateRoom.addEventListener('click', () => {
        sounds.init();
        this.createRoom();
      });
    }

    if (btnJoinRoom) {
      btnJoinRoom.addEventListener('click', () => {
        sounds.init();
        const code = inputRoomCode ? inputRoomCode.value.trim() : '';
        if (code.length < 4) {
          this.showToast('4자리 숫자를 입력해주세요!');
          return;
        }
        this.joinRoom(code);
      });
    }

    // 원클릭 빠른 AI 난투 매치 (솔로 풀배틀)
    if (btnQuickAiPlay) {
      btnQuickAiPlay.addEventListener('click', () => {
        sounds.init();
        this.showToast('⚡ 빠른 AI 난투 경기장에 입장합니다!');
        this.startQuickAiMatch();
      });
    }

    // 3) 대기실(ROOM) 화면 액션
    const btnRoomBackMode = document.getElementById('btn-room-back-mode');
    const btnLeaveRoom = document.getElementById('btn-leave-room');
    const btnCopyCode = document.getElementById('btn-copy-code');
    const btnStartGame = document.getElementById('btn-start-game');

    const handleLeaveRoom = () => {
      sounds.init();
      this.cleanupNetwork();
      this.setScreen('MODE');
      this.showToast('대기실에서 나왔습니다.');
    };

    if (btnRoomBackMode) btnRoomBackMode.addEventListener('click', handleLeaveRoom);
    if (btnLeaveRoom) btnLeaveRoom.addEventListener('click', handleLeaveRoom);

    if (btnCopyCode) {
      btnCopyCode.addEventListener('click', () => {
        if (this.roomCode) {
          navigator.clipboard.writeText(this.roomCode).then(() => {
            this.showToast('방 코드가 복사되었습니다! 친구에게 공유하세요.');
          }).catch(() => {
            this.showToast(`방 코드: ${this.roomCode}`);
          });
        }
      });
    }

    if (btnStartGame) {
      btnStartGame.addEventListener('click', () => {
        if (!this.isHost) {
          this.showToast('방장만 게임을 시작할 수 있습니다.');
          return;
        }
        sounds.init();
        this.startGame();
      });
    }

    // 인원수 선택 버튼 이벤트 (2, 3, 4인)
    document.querySelectorAll('.btn-count').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!this.isHost) return;
        sounds.init();
        const count = parseInt(btn.getAttribute('data-count'), 10);
        this.setMaxPlayers(count);
      });
    });

    // 슬롯별 참가원 타입(AI ↔ User) 토글 버튼 이벤트
    [1, 2, 3].forEach((slotIdx) => {
      const toggleBtn = document.getElementById(`btn-toggle-slot-${slotIdx + 1}`);
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          if (!this.isHost) return;
          sounds.init();
          this.toggleSlotType(slotIdx);
        });
      }
    });

    // 캐릭터 선택 아이템 클릭 이벤트
    const pickerItems = document.querySelectorAll('.picker-item');
    pickerItems.forEach((item) => {
      item.addEventListener('click', () => {
        sounds.init();
        const charId = parseInt(item.getAttribute('data-char-id'), 10);
        this.selectCharacter(charId);
      });
    });

    // 4) 통합 사운드 버튼 토글 (어느 화면에서 눌러도 전체 동기화)
    const soundBtns = [
      document.getElementById('btn-title-sound'),
      document.getElementById('btn-mode-sound'),
      document.getElementById('btn-room-sound'),
      document.getElementById('btn-sound')
    ];

    soundBtns.forEach((b) => {
      if (b) {
        b.addEventListener('click', () => {
          const on = sounds.toggle();
          soundBtns.forEach((targetBtn) => {
            if (!targetBtn) return;
            const textEl = targetBtn.querySelector('.pill-text');
            if (textEl) {
              textEl.textContent = on ? '사운드' : '음소거';
            }
            const iconEl = targetBtn.querySelector('.pill-icon');
            if (iconEl) {
              iconEl.textContent = on ? '🔊' : '🔇';
            } else {
              targetBtn.textContent = on ? '🔊' : '🔇';
            }
          });
        });
      }
    });

    // 5) 결과 화면 버튼
    const btnPlayAgain = document.getElementById('btn-play-again');
    const btnResultRoom = document.getElementById('btn-result-room');
    const btnResultLobby = document.getElementById('btn-result-lobby');

    if (btnPlayAgain) {
      btnPlayAgain.addEventListener('click', () => {
        if (this.isHost) {
          this.resetGameRound();
          this.broadcast({ type: 'RESTART' });
        }
      });
    }

    if (btnResultRoom) {
      btnResultRoom.addEventListener('click', () => {
        sounds.init();
        document.getElementById('result-layer').classList.add('hidden');
        this.setScreen('ROOM');
      });
    }

    if (btnResultLobby) {
      btnResultLobby.addEventListener('click', () => {
        sounds.init();
        this.cleanupNetwork();
        document.getElementById('result-layer').classList.add('hidden');
        this.setScreen('TITLE');
      });
    }

    // 6) 인게임 상단 '나가기' 버튼 액션
    const btnInGameExit = document.getElementById('btn-ingame-exit');
    if (btnInGameExit) {
      btnInGameExit.addEventListener('click', () => {
        if (!confirm('현재 경기를 중단하고 타이틀 화면으로 나가시겠습니까?')) return;
        sounds.init();
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.networkTickTimer) clearInterval(this.networkTickTimer);
        if (this.snapshotTimer) clearInterval(this.snapshotTimer);

        if (this.isHost) {
          this.broadcast({ type: 'HOST_LEFT', message: '방장이 경기를 종료했습니다.' });
        } else if (this.hostConn && this.hostConn.open) {
          this.hostConn.send({ type: 'GUEST_LEFT', slotIndex: this.mySlotIndex });
        }
        this.cleanupNetwork();
        this.setScreen('TITLE');
        this.showToast('경기를 종료하고 타이틀 화면으로 이동했습니다.');
      });
    }

    // 캐릭터 선택창(대전 모드)에 인게임 3D 렌더 스냅샷 적용 (타이틀 화면은 원래 일러스트 유지)
    if (this.characterSnapshots) {
      document.querySelectorAll('.picker-item').forEach((item) => {
        const charId = parseInt(item.getAttribute('data-char-id'), 10);
        const img = item.querySelector('.char-avatar-box img');
        if (img && this.characterSnapshots[charId]) {
          img.src = this.characterSnapshots[charId];
        }
      });
    }
  }

  // 슬롯별 캐릭터 설정 헬퍼
  setSlotCharacter(slotIndex, charId) {
    const p = this.players[slotIndex];
    if (!p) return;
    const charCfg = CHARACTERS.find((c) => c.id === charId) || CHARACTERS[0];
    p.charId = charCfg.id;
    p.name = charCfg.name;
    p.colorHex = charCfg.hex;
    p.threeColor = charCfg.threeColor;
    p.image = charCfg.image;
    this.rebuildPlayer3DModel(p);
  }

  // 중복 참가 방지: 모든 활성 참가원(유저 & AI)의 캐릭터 고유성 100% 보장
  ensureUniqueCharacters() {
    const usedCharIds = new Set();
    const allIds = [1, 2, 3, 4];

    // 1. 내 캐릭터 최우선 등록
    const myPlayer = this.players[this.mySlotIndex];
    if (myPlayer) {
      usedCharIds.add(myPlayer.charId);
    }

    // 2. 다른 실제 접속 유저 등록
    this.players.forEach((p, idx) => {
      if (idx !== this.mySlotIndex && !p.isAI && p.connected) {
        usedCharIds.add(p.charId);
      }
    });

    // 3. 중복된 슬롯이나 AI 슬롯에 남은 고유 캐릭터 배정
    this.players.forEach((p, idx) => {
      if (idx === this.mySlotIndex) return;
      if (usedCharIds.has(p.charId)) {
        // 이미 다른 플레이어가 사용 중이면 미사용 캐릭터 중 하나로 자동 변경
        const availableId = allIds.find((id) => !usedCharIds.has(id));
        if (availableId) {
          this.setSlotCharacter(idx, availableId);
          usedCharIds.add(availableId);
        }
      } else {
        usedCharIds.add(p.charId);
      }
    });
  }

  // 원클릭 빠른 AI 매치
  startQuickAiMatch() {
    this.isHost = true;
    this.mySlotIndex = 0;
    this.roomCode = Math.floor(1000 + Math.random() * 9000).toString();
    this.maxPlayers = 4;

    const userCharId = this.mySelectedCharId || 1;
    this.setSlotCharacter(0, userCharId);
    this.players[0].slotType = 'USER';
    this.players[0].isAI = false;
    this.players[0].connected = true;

    // AI 봇 3명에게 남은 3개의 캐릭터를 1명씩 고유 배정 (절대 중복 없음)
    const availableCharIds = [1, 2, 3, 4].filter((id) => id !== userCharId);
    for (let i = 1; i < 4; i++) {
      const p = this.players[i];
      p.slotType = 'AI';
      p.isAI = true;
      p.connected = true;
      this.setSlotCharacter(i, availableCharIds[i - 1]);
    }

    this.ensureUniqueCharacters();
    this.startGame();
  }

  // 캐릭터 선택 로직 (중복 불가 & 자동 맞교환)
  selectCharacter(charId) {
    const myPlayer = this.players[this.mySlotIndex];
    if (!myPlayer) return;
    const oldCharId = myPlayer.charId;
    if (oldCharId === charId) return;

    this.mySelectedCharId = charId;

    // 내가 고른 캐릭터를 이미 사용 중인 다른 슬롯이 있다면 맞교환(Swap)
    const duplicateSlotIdx = this.players.findIndex((p, idx) => idx !== this.mySlotIndex && p.charId === charId);
    if (duplicateSlotIdx !== -1) {
      this.setSlotCharacter(duplicateSlotIdx, oldCharId);
    }
    this.setSlotCharacter(this.mySlotIndex, charId);

    // 전체 중복 검증 및 정리
    this.ensureUniqueCharacters();

    // UI 하이라이트 업데이트
    this.updateCharPickerUI();
    this.updateRoomSlotsUI();
    this.updateMyBadgeUI();

    // 멀티플레이 중이면 변경 사항 알림
    if (this.isHost) {
      this.broadcast({
        type: 'ROOM_UPDATE',
        players: this.getPlayersMeta()
      });
    } else if (this.hostConn && this.hostConn.open) {
      this.hostConn.send({
        type: 'CHANGE_CHAR',
        slotIndex: this.mySlotIndex,
        charId: charId
      });
    }

    const selectedCfg = CHARACTERS.find((c) => c.id === charId);
    this.showToast(`[${selectedCfg.name}] 캐릭터를 선택했습니다!`);
  }

  updateCharPickerUI() {
    document.querySelectorAll('.picker-item').forEach((el) => {
      const cid = parseInt(el.getAttribute('data-char-id'), 10);
      const isSelected = (cid === this.mySelectedCharId);
      el.classList.toggle('selected', isSelected);

      const isOccupiedByOther = this.players.some((p, idx) => idx !== this.mySlotIndex && !p.isAI && p.connected && p.charId === cid);
      el.classList.toggle('occupied', isOccupiedByOther);

      // 인게임 3D 캐릭터 스냅샷 실시간 반영
      const img = el.querySelector('.char-avatar-box img');
      if (img && this.characterSnapshots && this.characterSnapshots[cid]) {
        img.src = this.characterSnapshots[cid];
      }
    });
  }

  // 참가 인원수 설정 (2, 3, 4명)
  setMaxPlayers(count) {
    this.maxPlayers = count;

    // 인원수 버튼 액티브 스타일 갱신
    document.querySelectorAll('.btn-count').forEach((b) => {
      if (parseInt(b.getAttribute('data-count'), 10) === count) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    this.ensureUniqueCharacters();
    this.updateRoomSlotsUI();
    this.showToast(`참가 인원수를 [${count}인 대전]으로 설정했습니다.`);

    if (this.isHost) {
      this.broadcast({
        type: 'ROOM_UPDATE',
        maxPlayers: this.maxPlayers,
        players: this.getPlayersMeta()
      });
    }
  }

  // 슬롯 타입 토글 (AI ↔ User)
  toggleSlotType(slotIdx) {
    const p = this.players[slotIdx];
    if (!p) return;

    if (p.slotType === 'AI') {
      p.slotType = 'USER';
      p.isAI = false;
      this.showToast(`${slotIdx + 1}P 슬롯: [👤 플레이어 대기]로 변경`);
    } else {
      p.slotType = 'AI';
      p.isAI = true;
      this.showToast(`${slotIdx + 1}P 슬롯: [🤖 AI 쁘니]로 변경`);
    }

    this.updateRoomSlotsUI();

    if (this.isHost) {
      this.broadcast({
        type: 'ROOM_UPDATE',
        maxPlayers: this.maxPlayers,
        players: this.getPlayersMeta()
      });
    }
  }

  /* ----------------------------------------------------
     P2P 네트워크 매니저 (PeerJS WebRTC)
     ---------------------------------------------------- */
  createRoom() {
    this.isHost = true;
    this.mySlotIndex = 0;
    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    this.roomCode = randomCode;

    // 호스트 캐릭터 반영 및 전원 중복 방지 배정
    this.setSlotCharacter(0, this.mySelectedCharId || 1);
    this.ensureUniqueCharacters();

    // [대기실 화면으로 즉시 전환]
    const displayCode = document.getElementById('display-room-code');
    const hudCode = document.getElementById('hud-room-code');
    if (displayCode) displayCode.textContent = this.roomCode;
    if (hudCode) hudCode.textContent = this.roomCode;

    this.updateRoomSlotsUI();
    this.setScreen('ROOM');
    this.updateRoomActionButtons();

    const statusDot = document.getElementById('connection-status-dot');
    if (statusDot) {
      statusDot.className = 'status-dot';
      statusDot.textContent = 'P2P 연결 준비 중...';
    }

    const peerId = `TC-${this.roomCode}`;
    this.initPeer(peerId, true);
  }

  joinRoom(code) {
    this.isHost = false;
    this.roomCode = code.padStart(4, '0');

    const hudCode = document.getElementById('hud-room-code');
    const displayCode = document.getElementById('display-room-code');
    if (hudCode) hudCode.textContent = this.roomCode;
    if (displayCode) displayCode.textContent = this.roomCode;

    this.setScreen('ROOM');
    this.updateRoomActionButtons();

    const statusDot = document.getElementById('connection-status-dot');
    if (statusDot) {
      statusDot.className = 'status-dot';
      statusDot.textContent = '호스트 연결 중...';
    }

    this.showToast(`TC-${this.roomCode} 방에 연결 시도 중...`);

    const guestPeerId = `TC-GUEST-${Math.floor(Math.random() * 999999)}`;
    this.initPeer(guestPeerId, false);
  }

  initPeer(peerId, isHost) {
    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }

    if (typeof Peer === 'undefined') {
      console.warn('PeerJS library not loaded.');
      const statusDot = document.getElementById('connection-status-dot');
      if (statusDot) {
        statusDot.className = 'status-dot';
        statusDot.textContent = '오프라인 (AI 모드)';
      }
      this.showToast('P2P 라이브러리 로드 대기 중 (AI 대전 바로 가능)');
      return;
    }

    try {
      this.peer = new Peer(peerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });
    } catch (e) {
      console.warn('Peer creation error:', e);
      const statusDot = document.getElementById('connection-status-dot');
      if (statusDot) {
        statusDot.className = 'status-dot';
        statusDot.textContent = '로컬 모드';
      }
      return;
    }

    this.peer.on('open', (id) => {
      const statusDot = document.getElementById('connection-status-dot');
      if (statusDot) {
        statusDot.className = 'status-dot online';
        statusDot.textContent = isHost ? '온라인 (입장 가능)' : '호스트와 연결됨';
      }

      if (isHost) {
        this.updateRoomSlotsUI();
      } else {
        const hostPeerId = `TC-${this.roomCode}`;
        const conn = this.peer.connect(hostPeerId, { reliable: true });
        this.setupGuestConnection(conn);
      }
    });

    if (isHost) {
      this.peer.on('connection', (conn) => {
        this.setupHostConnection(conn);
      });
    }

    this.peer.on('error', (err) => {
      console.warn('Peer error:', err);
      const statusDot = document.getElementById('connection-status-dot');

      if (err.type === 'unavailable-id') {
        if (isHost) {
          // ID 중복 시 새 코드로 자동 갱신
          const newCode = Math.floor(1000 + Math.random() * 9000).toString();
          this.roomCode = newCode;
          document.getElementById('display-room-code').textContent = this.roomCode;
          document.getElementById('hud-room-code').textContent = this.roomCode;
          this.initPeer(`TC-${this.roomCode}`, true);
          return;
        }
      }

      if (statusDot) {
        statusDot.className = 'status-dot';
        statusDot.textContent = '오프라인 (AI 모드)';
      }
      this.showToast(`P2P 상태: ${err.type || '오프라인'} (AI 대전 바로 가능)`);
    });
  }

  setupHostConnection(conn) {
    let assignedSlot = -1;
    // 1순위: maxPlayers 범위 내에서 slotType이 'USER'이고 아직 접속하지 않은 슬롯
    for (let i = 1; i < this.maxPlayers; i++) {
      if (this.players[i].slotType === 'USER' && !this.players[i].connected) {
        assignedSlot = i;
        break;
      }
    }
    // 2순위: USER 슬롯이 없더라도 maxPlayers 내에 AI 슬롯이 있으면 USER로 전환하여 수용
    if (assignedSlot === -1) {
      for (let i = 1; i < this.maxPlayers; i++) {
        if (!this.players[i].connected) {
          assignedSlot = i;
          this.players[i].slotType = 'USER';
          break;
        }
      }
    }

    if (assignedSlot === -1) {
      conn.on('open', () => {
        conn.send({ type: 'ROOM_FULL' });
        setTimeout(() => conn.close(), 500);
      });
      return;
    }

    conn.on('open', () => {
      this.connections[assignedSlot] = conn;
      this.players[assignedSlot].connected = true;
      this.players[assignedSlot].isAI = false;

      conn.send({
        type: 'WELCOME',
        assignedSlot: assignedSlot,
        roomCode: this.roomCode,
        players: this.getPlayersMeta()
      });

      this.updateRoomSlotsUI();
      this.showToast(`${this.players[assignedSlot].name} 님이 참가했습니다!`);

      this.broadcast({
        type: 'ROOM_UPDATE',
        players: this.getPlayersMeta()
      });
    });

    conn.on('data', (data) => {
      this.handleHostReceivedData(assignedSlot, data);
    });

    conn.on('close', () => {
      if (this.connections[assignedSlot]) {
        delete this.connections[assignedSlot];
      }
      this.players[assignedSlot].connected = false;
      this.updateRoomSlotsUI();
      this.broadcast({
        type: 'ROOM_UPDATE',
        players: this.getPlayersMeta()
      });
      this.showToast(`${this.players[assignedSlot].name} 님이 퇴장했습니다.`);
    });
  }

  setupGuestConnection(conn) {
    this.hostConn = conn;

    conn.on('open', () => {
      const hudCode = document.getElementById('hud-room-code');
      const displayCode = document.getElementById('display-room-code');
      if (hudCode) hudCode.textContent = this.roomCode;
      if (displayCode) displayCode.textContent = this.roomCode;
      this.setScreen('ROOM');
      this.updateRoomActionButtons();
    });

    conn.on('data', (data) => {
      this.handleGuestReceivedData(data);
    });

    conn.on('close', () => {
      this.showToast('호스트와의 연결이 끊어졌습니다.');
      this.cleanupNetwork();
      this.setScreen('MODE');
    });

    conn.on('error', () => {
      this.showToast('호스트 연결에 실패했습니다. 코드를 확인해주세요.');
      this.cleanupNetwork();
      this.setScreen('MODE');
    });
  }

  handleHostReceivedData(senderSlot, data) {
    if (data.type === 'MOVE') {
      const p = this.players[senderSlot];
      if (p && p.connected) {
        p.vx = data.vx;
        p.vz = data.vz;
        p.x = data.x;
        p.z = data.z;
        p.facingAngle = data.facingAngle;

        if (this.gameState === 'PLAYING') {
          this.paintTilesAround(p.x, p.z, p.charId);
        }
      }
    } else if (data.type === 'CHANGE_CHAR') {
      const p = this.players[senderSlot];
      if (p) {
        const targetCharId = data.charId;
        const oldCharId = p.charId;

        // 다른 슬롯이 이 캐릭터를 사용 중이라면 맞교환 (중복 방지)
        const duplicateSlot = this.players.findIndex((other, idx) => idx !== senderSlot && other.charId === targetCharId);
        if (duplicateSlot !== -1) {
          this.setSlotCharacter(duplicateSlot, oldCharId);
        }
        this.setSlotCharacter(senderSlot, targetCharId);
        this.ensureUniqueCharacters();
        this.updateRoomSlotsUI();
        this.broadcast({
          type: 'ROOM_UPDATE',
          players: this.getPlayersMeta()
        });
      }
    } else if (data.type === 'GUEST_LEFT') {
      const p = this.players[senderSlot];
      if (p) {
        p.connected = false;
        p.isAI = true;
        p.slotType = 'AI';
        this.showToast(`[${p.name}] 플레이어가 경기를 나가 AI로 전환되었습니다.`);
        this.broadcast({
          type: 'ROOM_UPDATE',
          players: this.getPlayersMeta()
        });
      }
    }
  }

  handleGuestReceivedData(data) {
    if (data.type === 'WELCOME') {
      this.mySlotIndex = data.assignedSlot;
      this.applyPlayersMeta(data.players);
      const myP = this.players[this.mySlotIndex];
      this.mySelectedCharId = myP.charId;
      this.updateMyBadgeUI();
      this.updateRoomSlotsUI();
      this.showToast(`환영합니다! 당신은 [${myP.name}] 입니다.`);
    } else if (data.type === 'ROOM_UPDATE') {
      this.applyPlayersMeta(data.players);
      this.updateRoomSlotsUI();
    } else if (data.type === 'START_GAME') {
      this.applyGameStart(data);
    } else if (data.type === 'STATE') {
      this.timeLeft = data.timeLeft;
      this.updateTimerUI();

      if (data.changedTiles && data.changedTiles.length > 0) {
        data.changedTiles.forEach(([tileIdx, charId]) => {
          this.applyTileColor(tileIdx, charId);
        });
        this.updateHUDProgress();
      }

      if (data.players) {
        data.players.forEach((pData) => {
          if (pData.slotIndex !== this.mySlotIndex) {
            const p = this.players[pData.slotIndex];
            if (p) {
              p.targetX = pData.x;
              p.targetZ = pData.z;
              p.vx = pData.vx;
              p.vz = pData.vz;
              p.facingAngle = pData.facingAngle;
            }
          }
        });
      }
    } else if (data.type === 'FULL_SYNC') {
      this.timeLeft = data.timeLeft;
      this.updateTimerUI();
      for (let i = 0; i < TOTAL_TILES; i++) {
        if (this.tileOwners[i] !== data.tiles[i]) {
          this.applyTileColor(i, data.tiles[i]);
        }
      }
      this.updateHUDProgress();
    } else if (data.type === 'GAME_OVER') {
      this.handleGameOver(data.results);
    } else if (data.type === 'RESTART') {
      this.resetGameRound();
    } else if (data.type === 'ROOM_FULL') {
      this.showToast('방이 이미 꽉 찼습니다!');
      this.cleanupNetwork();
      this.setScreen('MODE');
    } else if (data.type === 'HOST_LEFT') {
      this.showToast('방장이 경기를 종료하고 나갔습니다.');
      this.cleanupNetwork();
      this.setScreen('TITLE');
    }
  }

  broadcast(data) {
    Object.values(this.connections).forEach((conn) => {
      if (conn && conn.open) {
        conn.send(data);
      }
    });
  }

  getPlayersMeta() {
    return {
      maxPlayers: this.maxPlayers,
      list: this.players.map((p) => ({
        slotIndex: p.slotIndex,
        slotType: p.slotType,
        charId: p.charId,
        name: p.name,
        connected: p.connected,
        isAI: p.isAI
      }))
    };
  }

  applyPlayersMeta(metaData) {
    if (!metaData) return;
    const metaList = Array.isArray(metaData) ? metaData : metaData.list;
    if (metaData.maxPlayers) {
      this.maxPlayers = metaData.maxPlayers;
    }
    if (metaList) {
      metaList.forEach((m) => {
        const p = this.players[m.slotIndex];
        if (p) {
          p.connected = m.connected;
          p.isAI = m.isAI;
          p.slotType = m.slotType;
          if (p.charId !== m.charId) {
            const cfg = CHARACTERS.find((c) => c.id === m.charId) || CHARACTERS[0];
            p.charId = cfg.id;
            p.name = cfg.name;
            p.colorHex = cfg.hex;
            p.threeColor = cfg.threeColor;
            p.image = cfg.image;
            this.rebuildPlayer3DModel(p);
          }
        }
      });
    }
  }

  updateRoomSlotsUI() {
    // 1. 상단 인원수 텍스트 및 버튼 상태 갱신
    const maxDisplay = document.getElementById('max-player-display');
    if (maxDisplay) maxDisplay.textContent = this.maxPlayers;

    document.querySelectorAll('.btn-count').forEach((b) => {
      const c = parseInt(b.getAttribute('data-count'), 10);
      b.classList.toggle('active', c === this.maxPlayers);
      b.style.pointerEvents = this.isHost ? 'auto' : 'none';
      b.style.opacity = this.isHost ? '1' : '0.6';
    });

    let activeCount = 0;
    this.players.forEach((p, idx) => {
      const slotEl = document.getElementById(`slot-${idx + 1}`);
      const statusEl = document.getElementById(`slot-status-${idx + 1}`);
      const imgEl = document.getElementById(`slot-img-${idx + 1}`);
      const nameEl = document.getElementById(`slot-name-${idx + 1}`);
      const toggleBtn = document.getElementById(`btn-toggle-slot-${idx + 1}`);

      if (imgEl) imgEl.src = p.image;
      if (nameEl) nameEl.textContent = p.name;
      if (!slotEl) return;

      const isClosed = (idx >= this.maxPlayers);

      if (isClosed) {
        slotEl.className = 'slot-card closed';
        if (statusEl) statusEl.textContent = '🔒 미참가';
        if (toggleBtn) toggleBtn.style.display = 'none';
      } else {
        activeCount++;
        slotEl.className = `slot-card p${p.charId}-theme active`;

        if (idx === 0) {
          if (statusEl) statusEl.textContent = '방장 (준비됨)';
        } else if (toggleBtn) {
          toggleBtn.style.display = 'inline-flex';
          toggleBtn.style.pointerEvents = this.isHost ? 'auto' : 'none';

          if (p.connected) {
            toggleBtn.className = 'slot-toggle-btn btn-user';
            toggleBtn.textContent = '👤 유저 참가됨';
            toggleBtn.style.pointerEvents = 'none';
            if (statusEl) statusEl.textContent = '접속 완료';
          } else if (p.slotType === 'AI') {
            toggleBtn.className = 'slot-toggle-btn btn-ai';
            toggleBtn.textContent = '🤖 AI 쁘니';
            if (statusEl) statusEl.textContent = 'AI 봇 대기';
          } else {
            toggleBtn.className = 'slot-toggle-btn btn-user';
            toggleBtn.textContent = '👤 플레이어 대기';
            if (statusEl) statusEl.textContent = '친구 접속 대기 중...';
          }
        }
      }
    });

    const countEl = document.getElementById('player-count');
    if (countEl) countEl.textContent = activeCount;

    // 참가원/방장 여부에 따른 하단 게임시작 버튼 비활성화 상태 실시간 동기화
    this.updateRoomActionButtons();
  }

  // 방 참가자(비방장) 게임시작 버튼 비활성화 & 안내 문구 처리
  updateRoomActionButtons() {
    const btnStart = document.getElementById('btn-start-game');
    const guestMsg = document.getElementById('guest-waiting-msg');
    if (!btnStart) return;

    if (this.isHost) {
      btnStart.disabled = false;
      btnStart.classList.remove('btn-disabled-guest');
      btnStart.title = '게임을 시작합니다!';
      btnStart.innerHTML = `
        <span class="btn-shine"></span>
        <svg class="ui-icon" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-3c-.83 0-1.5-.67-1.5-1.5S17.67 9 18.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
        <span class="btn-text">게임 시작하기!</span>
      `;
      if (guestMsg) guestMsg.classList.add('hidden');
    } else {
      btnStart.disabled = true;
      btnStart.classList.add('btn-disabled-guest');
      btnStart.title = '방장만 게임을 시작할 수 있습니다.';
      btnStart.innerHTML = `
        <svg class="ui-icon" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
        </svg>
        <span class="btn-text">방장 시작 대기 중...</span>
      `;
      if (guestMsg) guestMsg.classList.remove('hidden');
    }
  }

  updateMyBadgeUI() {
    const myPlayer = this.players[this.mySlotIndex];
    if (!myPlayer) return;
    document.getElementById('my-badge-img').src = myPlayer.image;
    document.getElementById('my-badge-name').textContent = myPlayer.name;
    document.getElementById('my-player-badge').className = `my-badge ${'p' + myPlayer.charId + '-theme'}`;
  }

  cleanupNetwork() {
    if (this.networkTickTimer) clearInterval(this.networkTickTimer);
    if (this.snapshotTimer) clearInterval(this.snapshotTimer);
    if (this.timerInterval) clearInterval(this.timerInterval);

    if (this.hostConn) {
      this.hostConn.close();
      this.hostConn = null;
    }
    Object.values(this.connections).forEach((conn) => conn.close());
    this.connections = {};

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    this.isHost = false;
    this.mySlotIndex = 0;
    this.players.forEach((p, idx) => {
      p.connected = (idx === 0);
      p.isAI = false;
    });
  }

  /* ----------------------------------------------------
     게임 시작 & 라운드 리셋 & 타이머 구동
     ---------------------------------------------------- */
  startGame() {
    // 0 ~ maxPlayers - 1 슬롯 활성화 처리 (미참가 슬롯은 완전 숨김)
    for (let i = 0; i < 4; i++) {
      const p = this.players[i];
      if (i < this.maxPlayers) {
        if (!p.connected) {
          p.connected = true;
          p.isAI = true;
        }
      } else {
        p.connected = false;
        p.isAI = false;
        if (p.modelGroup) p.modelGroup.visible = false;
        if (p.shadow) p.shadow.visible = false;
      }
    }

    this.resetGameRound();

    this.broadcast({
      type: 'START_GAME',
      maxPlayers: this.maxPlayers,
      players: this.getPlayersMeta(),
      tiles: Array.from(this.tileOwners),
      timeLeft: this.timeLeft
    });
  }

  applyGameStart(data) {
    if (data.maxPlayers) this.maxPlayers = data.maxPlayers;
    if (data.players) this.applyPlayersMeta(data.players);
    this.resetGameRound();
  }

  resetGameRound() {
    this.timeLeft = GAME_DURATION;

    // UI 전환 (인게임 HUD 활성화)
    this.setScreen('GAME');
    this.updateMyBadgeUI();
    this.updateTimerUI();

    // 타일 초기화
    for (let i = 0; i < TOTAL_TILES; i++) {
      this.tileOwners[i] = 0;
      this.tileScales[i] = 1.0;
      this.instancedMesh.setColorAt(i, NEUTRAL_COLOR);
    }
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }

    // 플레이어 위치 초기 스폰 위치로 리셋 (참가 인원만 가시화)
    this.players.forEach((p, idx) => {
      const cfg = CHARACTERS[idx];
      p.x = cfg.spawn.x;
      p.z = cfg.spawn.z;
      p.targetX = cfg.spawn.x;
      p.targetZ = cfg.spawn.z;
      p.vx = 0;
      p.vz = 0;
      p.facingAngle = 0;

      const isParticipant = (idx < this.maxPlayers && p.connected);
      if (p.modelGroup) {
        p.modelGroup.position.set(p.x, 0, p.z);
        p.modelGroup.visible = isParticipant;
      }
      if (p.shadow) {
        p.shadow.position.set(p.x, 0.015, p.z);
        p.shadow.visible = isParticipant;
      }
    });

    this.updateHUDProgress();
    sounds.playBeep(true);

    // [핵심 버그 수정]: 호스트 타이머 루프에서 매 초마다 this.updateTimerUI()를 확실히 호출
    if (this.isHost) {
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => {
        if (this.gameState !== 'PLAYING') return;

        this.timeLeft--;
        this.updateTimerUI(); // 화면 타이머 숫자 즉각 갱신!

        if (this.timeLeft <= 10 && this.timeLeft > 0) {
          sounds.playBeep(false);
        }
        if (this.timeLeft <= 0) {
          this.timeLeft = 0;
          this.updateTimerUI();
          this.endGame();
        }
      }, 1000);

      // 20Hz 상태 동기화 루프
      if (this.networkTickTimer) clearInterval(this.networkTickTimer);
      this.networkTickTimer = setInterval(() => {
        if (this.gameState !== 'PLAYING') return;

        const playersData = this.players.map((p) => ({
          slotIndex: p.slotIndex,
          charId: p.charId,
          x: Number(p.x.toFixed(2)),
          z: Number(p.z.toFixed(2)),
          vx: Number(p.vx.toFixed(2)),
          vz: Number(p.vz.toFixed(2)),
          facingAngle: Number(p.facingAngle.toFixed(2))
        }));

        this.broadcast({
          type: 'STATE',
          timeLeft: this.timeLeft,
          changedTiles: [...this.changedTilesBuffer],
          players: playersData
        });
        this.changedTilesBuffer.length = 0;
      }, 50);

      // 3초 주기 전체 타일 스냅샷 보정
      if (this.snapshotTimer) clearInterval(this.snapshotTimer);
      this.snapshotTimer = setInterval(() => {
        if (this.gameState !== 'PLAYING') return;
        this.broadcast({
          type: 'FULL_SYNC',
          timeLeft: this.timeLeft,
          tiles: Array.from(this.tileOwners)
        });
      }, 3000);
    } else {
      // 게스트의 20Hz 이동 전송 루프
      if (this.networkTickTimer) clearInterval(this.networkTickTimer);
      this.networkTickTimer = setInterval(() => {
        if (this.gameState !== 'PLAYING' || !this.hostConn || !this.hostConn.open) return;
        const myP = this.players[this.mySlotIndex];
        this.hostConn.send({
          type: 'MOVE',
          slotIndex: this.mySlotIndex,
          x: Number(myP.x.toFixed(2)),
          z: Number(myP.z.toFixed(2)),
          vx: Number(myP.vx.toFixed(2)),
          vz: Number(myP.vz.toFixed(2)),
          facingAngle: Number(myP.facingAngle.toFixed(2))
        });
      }, 50);
    }
  }

  /* ----------------------------------------------------
     게임 종료 및 결과 연출
     ---------------------------------------------------- */
  endGame() {
    this.gameState = 'ENDED';
    if (this.timerInterval) clearInterval(this.timerInterval);

    // 최종 타일 점유율 집계 (1: 말랑, 2: 강아지, 3: 시크릿, 4: 돼지)
    const counts = [0, 0, 0, 0, 0];
    for (let i = 0; i < TOTAL_TILES; i++) {
      counts[this.tileOwners[i]]++;
    }

    const results = [];
    const activeCharIds = new Set();
    for (let i = 0; i < this.maxPlayers; i++) {
      if (this.players[i] && this.players[i].connected) {
        activeCharIds.add(this.players[i].charId);
      }
    }

    activeCharIds.forEach((cId) => {
      const charCfg = CHARACTERS[cId - 1];
      const count = counts[cId];
      const pct = ((count / TOTAL_TILES) * 100).toFixed(1);
      results.push({
        id: charCfg.id,
        name: charCfg.name,
        colorHex: charCfg.hex,
        image: charCfg.image,
        count: count,
        percent: parseFloat(pct)
      });
    });

    results.sort((a, b) => b.count - a.count);

    this.broadcast({
      type: 'GAME_OVER',
      results: results
    });

    this.handleGameOver(results);
  }

  handleGameOver(results) {
    this.gameState = 'ENDED';
    sounds.playFanfare();

    // 내 캐릭터 정보 및 순위 계산
    const myPlayer = this.players[this.mySlotIndex];
    const myCharId = myPlayer ? myPlayer.charId : this.mySelectedCharId;
    const myRankIdx = results.findIndex((r) => r.id === myCharId);
    const myRank = myRankIdx !== -1 ? (myRankIdx + 1) : 4;
    const myResult = (myRankIdx !== -1) ? results[myRankIdx] : {
      id: myCharId,
      name: myPlayer ? myPlayer.name : '나',
      colorHex: myPlayer ? myPlayer.colorHex : '#FF4757',
      image: (myPlayer && myPlayer.image) ? myPlayer.image : 'assets/player_1.png',
      count: 0,
      percent: 0
    };

    if (typeof confetti === 'function' && results.length > 0) {
      const winner = results[0];
      confetti({
        particleCount: (myRank === 1) ? 140 : 80,
        spread: 90,
        origin: { y: 0.6 },
        colors: [winner.colorHex, '#FFD32A', '#2ED573', '#FFFFFF']
      });
    }

    const resultLayer = document.getElementById('result-layer');
    const winnerText = document.getElementById('result-winner-text');
    const myBanner = document.getElementById('my-result-banner');
    const rankingList = document.getElementById('ranking-list');
    const btnPlayAgain = document.getElementById('btn-play-again');
    const guestWaitingMsg = document.getElementById('result-guest-msg');

    if (results.length > 0) {
      if (myRank === 1) {
        winnerText.textContent = `🎉 축하합니다! 내가 1위로 승리했습니다! (${myResult.percent}%)`;
        winnerText.style.color = '#FFA502';
      } else {
        winnerText.textContent = `👑 우승: ${results[0].name} (${results[0].percent}%) | 나의 결과: ${myRank}위 (${myResult.percent}%)`;
        winnerText.style.color = '#2E86DE';
      }
    }

    // 1) 내 결과 전용 스포트라이트 배너 렌더링 (내가 몇위인지 한눈에 바로 파악)
    if (myBanner) {
      let rankTitle = `나의 최종 순위: ${myRank}위`;
      let bannerRankClass = `my-rank-${myRank}`;

      if (myRank === 1) {
        rankTitle = '내가 1등! 챔피언 등극!';
      } else if (myRank === 2) {
        rankTitle = '아쉬운 2위! 멋진 준우승 플레이!';
      } else if (myRank === 3) {
        rankTitle = '3위 달성! 다음엔 1등 도전!';
      } else {
        rankTitle = '4위 완주! 다음 판에 분발해보아요!';
      }

      myBanner.className = `my-result-banner ${bannerRankClass}`;
      myBanner.innerHTML = `
        <div class="my-result-header">
          <span class="my-result-rank-tag">MY SCORE</span>
          <span class="my-result-rank-title">${rankTitle}</span>
        </div>
        <div class="my-result-body">
          <img class="my-result-avatar" src="${myResult.image}" alt="${myResult.name}">
          <div class="my-result-info">
            <div class="my-result-name-row">
              <span class="my-result-name">${myResult.name}</span>
              <span class="my-result-badge-you">나 (YOU)</span>
            </div>
            <div class="my-result-stats">
              <span class="stat-item">🎨 점유율 <strong>${myResult.percent}%</strong></span>
              <span class="stat-divider">•</span>
              <span class="stat-item">🧱 <strong>${myResult.count}칸</strong> 칠함</span>
            </div>
          </div>
          <div class="my-result-rank-number">
            <span class="num">${myRank}</span>
            <span class="unit">위</span>
          </div>
        </div>
      `;
    }

    // 2) 순위 리스트 내 본인 항목 하이라이트
    rankingList.innerHTML = '';

    results.forEach((r, idx) => {
      const isMe = (r.id === myCharId);
      const item = document.createElement('div');
      item.className = `rank-item ${idx === 0 ? 'first-place' : ''} ${isMe ? 'my-rank' : ''}`;
      item.innerHTML = `
        <span class="rank-badge rank-${idx + 1}">${idx + 1}위</span>
        <img class="rank-avatar" src="${r.image}" alt="${r.name}">
        <div class="rank-info">
          <div class="rank-name">
            ${r.name}
            ${isMe ? '<span class="rank-my-tag">YOU (나)</span>' : ''}
          </div>
          <div class="rank-tiles">${r.count} 칸 칠함 (${r.percent}%)</div>
        </div>
        <div class="rank-percent" style="color: ${r.colorHex}">${r.percent}%</div>
      `;
      rankingList.appendChild(item);
    });

    if (this.isHost) {
      btnPlayAgain.classList.remove('hidden');
      guestWaitingMsg.classList.add('hidden');
    } else {
      btnPlayAgain.classList.add('hidden');
      guestWaitingMsg.classList.remove('hidden');
    }

    resultLayer.classList.remove('hidden');
  }

  /* ----------------------------------------------------
     타일 색칠 로직 & 팝업 애니메이션
     ---------------------------------------------------- */
  paintTilesAround(x, z, charId) {
    const colCenter = Math.floor((x + TILE_HALF) / TILE_SIZE);
    const rowCenter = Math.floor((z + TILE_HALF) / TILE_SIZE);
    const range = Math.ceil(PAINT_RADIUS);
    let paintedAny = false;

    for (let r = rowCenter - range; r <= rowCenter + range; r++) {
      if (r < 0 || r >= GRID_SIZE) continue;
      for (let c = colCenter - range; c <= colCenter + range; c++) {
        if (c < 0 || c >= GRID_SIZE) continue;

        const tileX = (c - GRID_SIZE / 2 + 0.5) * TILE_SIZE;
        const tileZ = (r - GRID_SIZE / 2 + 0.5) * TILE_SIZE;
        const dist = Math.hypot(x - tileX, z - tileZ);

        if (dist <= PAINT_RADIUS) {
          const tileIdx = r * GRID_SIZE + c;
          if (this.tileOwners[tileIdx] !== charId) {
            this.tileOwners[tileIdx] = charId;
            this.applyTileColor(tileIdx, charId);
            this.tileScales[tileIdx] = 1.55;
            paintedAny = true;

            if (this.isHost) {
              this.changedTilesBuffer.push([tileIdx, charId]);
            }
          }
        }
      }
    }

    if (paintedAny) {
      this.updateHUDProgress();
      if (charId === this.mySelectedCharId) {
        sounds.playPaintPop(charId);
      }
    }
  }

  applyTileColor(tileIdx, charId) {
    this.tileOwners[tileIdx] = charId;
    const color = (charId === 0) ? NEUTRAL_COLOR : (CHARACTERS.find((c) => c.id === charId)?.threeColor || NEUTRAL_COLOR);
    this.instancedMesh.setColorAt(tileIdx, color);
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
    this.tileScales[tileIdx] = 1.45;
  }

  /* ----------------------------------------------------
     HUD 게이지 바 및 타이머 갱신
     ---------------------------------------------------- */
  updateHUDProgress() {
    const counts = [0, 0, 0, 0, 0];
    for (let i = 0; i < TOTAL_TILES; i++) {
      counts[this.tileOwners[i]]++;
    }

    // 현재 참가 중인 슬롯들의 캐릭터 ID 추적
    const activeCharIds = new Set();
    for (let i = 0; i < this.maxPlayers; i++) {
      if (this.players[i] && this.players[i].connected) {
        activeCharIds.add(this.players[i].charId);
      }
    }

    for (let cId = 1; cId <= 4; cId++) {
      const barEl = document.getElementById(`bar-p${cId}`);
      if (!barEl) continue;

      if (activeCharIds.has(cId)) {
        barEl.style.display = 'flex';
        const pct = ((counts[cId] / TOTAL_TILES) * 100).toFixed(1);
        barEl.style.width = `${Math.max(parseFloat(pct), 8)}%`;
        const charCfg = CHARACTERS[cId - 1];
        const textEl = barEl.querySelector('.bar-text');
        if (textEl) textEl.textContent = `${charCfg.name.substring(0, 3)} ${pct}%`;
      } else {
        barEl.style.display = 'none';
      }
    }
  }

  updateTimerUI() {
    const timerText = document.getElementById('timer-text');
    const timerBadge = document.getElementById('timer-badge');
    if (!timerText || !timerBadge) return;

    timerText.textContent = this.timeLeft;

    if (this.timeLeft <= 10) {
      timerBadge.classList.add('urgent');
    } else {
      timerBadge.classList.remove('urgent');
    }
  }

  /* ----------------------------------------------------
     AI 봇 자율 주행 로직
     ---------------------------------------------------- */
  updateAIBots(dt) {
    if (!this.isHost || this.gameState !== 'PLAYING') return;

    this.players.forEach((p) => {
      if (!p.connected || !p.isAI) return;

      if (!p.aiTarget || Math.hypot(p.aiTarget.x - p.x, p.aiTarget.z - p.z) < 1.2) {
        p.aiTarget = {
          x: (Math.random() - 0.5) * (GRID_SIZE - 4),
          z: (Math.random() - 0.5) * (GRID_SIZE - 4)
        };
      }

      const dx = p.aiTarget.x - p.x;
      const dz = p.aiTarget.z - p.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.05) {
        const speed = 7.0;
        p.vx = (dx / dist) * speed;
        p.vz = (dz / dist) * speed;
        p.facingAngle = Math.atan2(p.vx, p.vz);
      } else {
        p.vx = 0;
        p.vz = 0;
      }

      p.x += p.vx * dt;
      p.z += p.vz * dt;

      const limit = TILE_HALF - 0.8;
      p.x = Math.max(-limit, Math.min(limit, p.x));
      p.z = Math.max(-limit, Math.min(limit, p.z));

      this.paintTilesAround(p.x, p.z, p.charId);
    });
  }

  /* ----------------------------------------------------
     메인 렌더 및 3D 물리 애니메이션 루프
     ---------------------------------------------------- */
  animate() {
    requestAnimationFrame(this.animate);

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (this.gameState === 'PLAYING') {
      // 1. 내 로컬 캐릭터 이동 (Client-side Prediction)
      const myP = this.players[this.mySlotIndex];
      const moveSpeed = 8.5;

      let mx = this.inputVector.x;
      let mz = this.inputVector.z;
      if (mx === 0 && mz === 0 && this.keyVector) {
        mx = this.keyVector.x;
        mz = this.keyVector.z;
      }

      myP.vx = mx * moveSpeed;
      myP.vz = mz * moveSpeed;
      myP.x += myP.vx * dt;
      myP.z += myP.vz * dt;

      const bound = TILE_HALF - 0.8;
      myP.x = Math.max(-bound, Math.min(bound, myP.x));
      myP.z = Math.max(-bound, Math.min(bound, myP.z));

      if (Math.hypot(myP.vx, myP.vz) > 0.1) {
        myP.facingAngle = Math.atan2(myP.vx, myP.vz);
      }

      if (this.isHost) {
        this.paintTilesAround(myP.x, myP.z, myP.charId);
        this.updateAIBots(dt);
      } else {
        this.paintTilesAround(myP.x, myP.z, myP.charId);
      }

      if (!this.isHost) {
        this.players.forEach((p) => {
          if (p.slotIndex !== this.mySlotIndex && p.connected) {
            p.x += (p.targetX - p.x) * 0.25;
            p.z += (p.targetZ - p.z) * 0.25;
          }
        });
      }
    }

    // 2. 3D 캐릭터 모델 모션 및 애니메이션
    this.players.forEach((p) => {
      if (!p.modelGroup || !p.connected) {
        if (p.modelGroup) p.modelGroup.visible = false;
        if (p.shadow) p.shadow.visible = false;
        return;
      }
      p.modelGroup.visible = true;
      if (p.shadow) p.shadow.visible = true;

      const speed = Math.hypot(p.vx, p.vz);
      p.isMoving = (speed > 0.3);

      if (p.isMoving) {
        p.walkTime += dt * 14;
        if (this.gameState === 'PLAYING' && Math.random() < 0.35) {
          this.particles.emit(p.x, 0, p.z, p.threeColor);
        }
      } else {
        p.walkTime = 0;
      }

      // 3D 통통 튀는 바운스
      const bounceY = p.isMoving ? Math.abs(Math.sin(p.walkTime)) * 0.35 : 0;
      p.modelGroup.position.set(p.x, bounceY, p.z);

      // 이동 방향을 향해 3D 회전 (부드러운 각도 보간)
      if (p.isMoving) {
        let diff = p.facingAngle - p.modelGroup.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        p.modelGroup.rotation.y += diff * 0.25;

        // 이동 중 살짝 좌우 갸우뚱 틸팅
        p.modelGroup.rotation.z = Math.sin(p.walkTime) * 0.12;
      } else {
        p.modelGroup.rotation.z *= 0.8;
      }

      // 3D 보행 및 페인팅 애니메이션
      const { leftFoot, rightFoot, leftHand, rightHand, head } = p.modelGroup.userData;
      if (leftFoot && rightFoot) {
        if (p.isMoving) {
          // 다리 교차 보행 애니메이션
          leftFoot.rotation.x = Math.sin(p.walkTime) * 0.55;
          rightFoot.rotation.x = -Math.sin(p.walkTime) * 0.55;
        } else {
          leftFoot.rotation.x *= 0.8;
          rightFoot.rotation.x *= 0.8;
        }
      }

      // 양손 및 페인트 롤러 슥삭슥삭 페인팅 애니메이션
      if (leftHand && rightHand) {
        if (p.isMoving) {
          leftHand.rotation.x = -Math.sin(p.walkTime) * 0.5;
          // 오른손 페인트 롤러 롤링 모션 (바닥을 슥삭슥삭 칠하는 역동적인 움직임)
          rightHand.rotation.x = -0.35 + Math.sin(p.walkTime * 1.4) * 0.28;
          rightHand.rotation.z = -0.35 + Math.cos(p.walkTime) * 0.08;
        } else {
          leftHand.rotation.x *= 0.8;
          rightHand.rotation.x = -0.35;
          rightHand.rotation.z = -0.35;
        }
      }

      // 걸을 때 갸우뚱거리는 귀여운 머리 모션
      if (head) {
        if (p.isMoving) {
          head.rotation.z = Math.sin(p.walkTime) * 0.08;
        } else {
          head.rotation.z *= 0.8;
        }
      }

      // 그림자
      if (p.shadow) {
        p.shadow.position.set(p.x, 0.015, p.z);
        const shadowScale = 1.0 - bounceY * 0.35;
        p.shadow.scale.set(shadowScale, shadowScale, 1);
      }
    });

    // 3. 카메라 lerp 추적
    const activePlayer = this.players[this.mySlotIndex];
    if (activePlayer) {
      const targetCamX = activePlayer.x;
      const targetCamZ = activePlayer.z + 14;
      const targetCamY = 18;

      this.camera.position.x += (targetCamX - this.camera.position.x) * 0.08;
      this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.08;
      this.camera.position.y += (targetCamY - this.camera.position.y) * 0.08;
      this.camera.lookAt(activePlayer.x, 0.5, activePlayer.z);
    }

    // 4. 타일 팝업 탄성 애니메이션 복원
    let matrixUpdated = false;
    for (let i = 0; i < TOTAL_TILES; i++) {
      if (this.tileScales[i] > 1.005) {
        this.tileScales[i] += (1.0 - this.tileScales[i]) * 0.15;
        const c = i % GRID_SIZE;
        const r = Math.floor(i / GRID_SIZE);
        const tx = (c - GRID_SIZE / 2 + 0.5) * TILE_SIZE;
        const tz = (r - GRID_SIZE / 2 + 0.5) * TILE_SIZE;

        this.tileMatrixDummy.position.set(tx, -0.1 + (this.tileScales[i] - 1.0) * 0.15, tz);
        this.tileMatrixDummy.scale.set(1.0, this.tileScales[i], 1.0);
        this.tileMatrixDummy.updateMatrix();
        this.instancedMesh.setMatrixAt(i, this.tileMatrixDummy.matrix);
        matrixUpdated = true;
      }
    }
    if (matrixUpdated) {
      this.instancedMesh.instanceMatrix.needsUpdate = true;
    }

    // 5. 파티클 시스템 갱신
    this.particles.update(dt);

    // 6. 3D 렌더
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  showToast(msg) {
    const toast = document.getElementById('toast-msg');
    toast.textContent = msg;
    toast.classList.remove('hidden');
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.add('hidden');
    }, 2800);
  }
}

// 애플리케이션 시작 (이미 DOM이 로드된 경우 즉시 실행)
function initGame() {
  if (window.gameApp) return;
  try {
    window.gameApp = new PpeuniPaintersGame();
    console.log('쁘니 페인터즈 정상 초기화 완료!');
  } catch (err) {
    console.error('게임 엔진 초기화 실패:', err);
    // 화면에 직관적인 에러 안내 표시
    const errorBanner = document.createElement('div');
    errorBanner.style.cssText = 'position:fixed;top:10px;left:10px;right:10px;padding:14px;background:#FF4757;color:#FFF;border-radius:12px;z-index:99999;font-weight:bold;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
    errorBanner.textContent = `초기화 오류: ${err.message || err}. (브라우저 콘솔을 확인해주세요)`;
    document.body.appendChild(errorBanner);
  }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initGame();
} else {
  window.addEventListener('DOMContentLoaded', initGame);
  window.addEventListener('load', initGame);
}
