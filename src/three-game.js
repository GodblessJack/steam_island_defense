import * as THREE from "../vendor/three.module.js";

const canvas = document.querySelector("#world");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7fcfdf);
scene.fog = new THREE.Fog(0x7fcfdf, 30, 76);
const cartoonOutlineMaterial = new THREE.MeshBasicMaterial({
  color: 0x183349,
  side: THREE.BackSide,
});

const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
camera.position.set(10.5, 10.5, 12);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(0, 0);
const clock = new THREE.Clock();
const root = new THREE.Group();
const ghost = new THREE.Group();
const CAMERA_DISTANCE = {
  initial: 14.8,
  min: 8.4,
  max: 30,
  overview: 21,
};
const pickPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 80),
  new THREE.MeshBasicMaterial({ visible: false }),
);

pickPlane.rotation.x = -Math.PI / 2;
scene.add(root, ghost, pickPlane);

const ui = {
  fps: document.querySelector("#fps"),
  level: document.querySelector("#level"),
  coreHp: document.querySelector("#coreHp"),
  stars: document.querySelector("#stars"),
  learningEnergy: document.querySelector("#learningEnergy"),
  timer: document.querySelector("#timer"),
  sprites: document.querySelector("#sprites"),
  mpm: document.querySelector("#mpm"),
  waveWarn: document.querySelector("#waveWarn"),
  selectedName: document.querySelector("#selectedName"),
  selectedDesc: document.querySelector("#selectedDesc"),
  statusText: document.querySelector("#statusText"),
  towerMenu: document.querySelector("#towerMenu"),
  towerMenuTitle: document.querySelector("#towerMenuTitle"),
  towerMenuMeta: document.querySelector("#towerMenuMeta"),
  towerMenuUpgrade: document.querySelector("#towerMenuUpgrade"),
  towerMenuSell: document.querySelector("#towerMenuSell"),
  towerMenuCancel: document.querySelector("#towerMenuCancel"),
  miniPreview: document.querySelector("#miniPreview"),
  partLabel: document.querySelector("#partLabel"),
  towerCost: document.querySelector("#towerCost"),
  customColor: document.querySelector("#customColor"),
  commitBuilding: document.querySelector("#commitBuilding"),
  resetBuilding: document.querySelector("#resetBuilding"),
  upgradeNearest: document.querySelector("#upgradeNearest"),
  sellNearest: document.querySelector("#sellNearest"),
  practiceNow: document.querySelector("#practiceNow"),
  lightningBtn: document.querySelector("#lightningBtn"),
  attackBtn: document.querySelector("#attackBtn"),
  waveBtn: document.querySelector("#waveBtn"),
  quizBtn: document.querySelector("#quizBtn"),
  audioBtn: document.querySelector("#audioBtn"),
  joystick: document.querySelector("#joystick"),
  joystickStick: document.querySelector(".joystick__stick"),
  quizOverlay: document.querySelector("#quizOverlay"),
  quizTitle: document.querySelector("#quizTitle"),
  quizProgress: document.querySelector("#quizProgress"),
  quizQuestion: document.querySelector("#quizQuestion"),
  quizChoices: document.querySelector("#quizChoices"),
  quizClose: document.querySelector("#quizClose"),
};

const savedLevel = loadProgress();

const state = {
  mode: "place",
  cameraMode: "free",
  cameraControl: "pan",
  cameraYaw: Math.atan2(10.5, 12),
  cameraPitch: 0.58,
  cameraDistance: CAMERA_DISTANCE.initial,
  cameraPan: new THREE.Vector3(0, 0, 0),
  cameraDrag: {
    active: false,
    pointerId: null,
    button: 0,
    lastX: 0,
    lastY: 0,
    startX: 0,
    startY: 0,
    mode: "pan",
    moved: false,
  },
  touchPointers: new Map(),
  pinch: {
    active: false,
    moved: false,
    distance: 0,
    angle: 0,
    centerX: 0,
    centerY: 0,
  },
  selectedPreset: null,
  selectedPart: "base",
  selectedColor: "#27b7ff",
  rotation: 0,
  pointerWorld: new THREE.Vector3(2, 0, 2),
  pointerReady: false,
  playerTarget: null,
  pendingBuild: null,
  playerAction: null,
  selectedTower: null,
  nearbyTower: null,
  buildPreview: { canBuild: false, reason: "右侧选炮台后，再点草地、沙滩或浅海建造。" },
  frameCount: 0,
  fpsTime: 0,
  fps: 60,
  level: savedLevel,
  coreHp: 15,
  stars: 250,
  timer: getLevelTimer(savedLevel, 0),
  prep: 30,
  waveActive: false,
  waveQuota: 0,
  spawned: 0,
  waveKills: 0,
  nextSpawn: 1,
  lightningCooldown: 0,
  playerAttackCooldown: 0,
  spriteHealTimer: 10,
  quizActive: false,
  quizReason: null,
  quizSolved: 0,
  currentQuestion: null,
  learningEnergy: 0,
  learningElapsed: 0,
  learningCooldown: 0,
  learningPending: false,
  waveCompletionsSinceQuiz: 0,
  questionDeck: [],
  recentQuestionKeys: [],
  joystick: {
    active: false,
    pointerId: null,
    vector: new THREE.Vector2(0, 0),
    power: 0,
  },
  audio: {
    enabled: true,
    ctx: null,
    master: null,
    music: null,
    sfx: null,
    nextNoteTime: 0,
    noteIndex: 0,
  },
  keys: new Set(),
  parts: {
    base: true,
    core: true,
    barrel: true,
    coil: true,
    crystal: true,
    aura: false,
  },
  placed: [],
  towers: [],
  buildPads: [],
  enemies: [],
  candies: [],
  sprites: [],
  bullets: [],
  effects: [],
};

const MUSIC_NOTES = [392, 523.25, 659.25, 587.33, 523.25, 440, 392, 329.63];
const MUSIC_BASS = [130.81, 146.83, 164.81, 196];
const BUILD_RULES = {
  islandRadiusX: 8.7,
  islandRadiusZ: 6.8,
  buildRadiusX: 13.9,
  buildRadiusZ: 11.0,
  walkRadiusX: 13.25,
  walkRadiusZ: 10.45,
  shoreRadiusX: 9.45,
  shoreRadiusZ: 7.55,
  coreMin: 2.35,
  towerMin: 1.55,
  towerTap: 2.05,
  captainWork: 1.35,
  towerAction: 2.35,
  buildSeconds: 0.8,
};

const LEARNING_RULES = {
  maxEnergy: 100,
  passiveGain: 0,
  waveGain: 0,
  guaranteeSeconds: 240,
  questionsPerQuiz: 5,
  skipEnergy: 18,
  postWaveGain: 30,
  waveCompletionsRequired: 2,
  readyEnergy: 90,
  recentQuestionLimit: 36,
};

const TOWER_DEFS = {
  spark: {
    name: "电炮台",
    desc: "快速射击",
    cost: 70,
    range: 5.2,
    damage: 18,
    rate: 0.34,
    projectile: 0x62dfff,
    color: "#27b7ff",
  },
  frost: {
    name: "寒冰塔",
    desc: "减速怪物",
    cost: 95,
    range: 5.0,
    damage: 13,
    rate: 1.35,
    projectile: 0xcdfbff,
    slow: 0.46,
    slowTime: 2.8,
    color: "#80d7ff",
  },
  wall: {
    name: "藤蔓陷阱",
    desc: "范围减速",
    cost: 45,
    range: 2.4,
    damage: 0,
    rate: 99,
    slow: 0.68,
    slowTime: 0.35,
    projectile: 0xf6c33f,
    color: "#f6c33f",
  },
  cookie: {
    name: "饼干炮",
    desc: "范围爆炸",
    cost: 120,
    range: 4.7,
    damage: 24,
    rate: 1.05,
    splash: 1.6,
    projectile: 0xffb15d,
    color: "#ff8f5f",
    unlock: 4,
  },
};

const ENEMY_DEFS = {
  blob: { hp: 100, shield: 0, speed: 1.22, damage: 1, reward: 16, color: 0x58d886 },
  shield: { hp: 95, shield: 60, speed: 0.98, damage: 2, reward: 24, color: 0x55b6ff },
  turtle: { hp: 245, shield: 0, speed: 0.52, damage: 3, reward: 38, color: 0x69a95c },
  bat: { hp: 25, shield: 0, speed: 2.08, damage: 1, reward: 12, color: 0x8e6cff },
  boss: { hp: 500, shield: 120, speed: 0.45, damage: 5, reward: 120, color: 0xd7d9ec },
};

const PART_NAMES = {
  base: "底座",
  core: "能量核心",
  barrel: "炮筒",
  coil: "线圈",
  crystal: "宝石",
  aura: "光环",
};

const STATIC_QUESTIONS = [
  ["春眠不觉晓，处处闻____。", "啼鸟", ["花香", "白云", "小雨"]],
  ["两个黄鹂鸣翠柳，一行____上青天。", "白鹭", ["小船", "星星", "飞鸟"]],
  ["日照香炉生紫烟，遥看瀑布挂____。", "前川", ["山边", "天边", "小岛"]],
  ["小时不识月，呼作____盘。", "白玉", ["金子", "太阳", "云朵"]],
  ["谁知盘中餐，粒粒皆____。", "辛苦", ["香甜", "漂亮", "开心"]],
  ["举头望明月，低头思____。", "故乡", ["大海", "森林", "朋友"]],
  ["water 的中文意思是？", "水", ["树", "星星", "糖果"]],
  ["sun 的中文意思是？", "太阳", ["月亮", "雨", "冰"]],
  ["green monster 里的 green 是？", "绿色", ["蓝色", "红色", "黄色"]],
  ["apple 的中文意思是？", "苹果", ["香蕉", "面包", "铅笔"]],
  ["book 的中文意思是？", "书", ["门", "鱼", "花"]],
  ["happy 的中文意思是？", "开心", ["寒冷", "安静", "快速"]],
  ["cat 的中文意思是？", "猫", ["狗", "鸟", "船"]],
  ["blue sky 里的 blue 是？", "蓝色", ["绿色", "黑色", "白色"]],
  ["植物生长通常需要阳光、水和____。", "空气", ["石头", "沙发", "糖纸"]],
  ["一天有多少小时？", "24", ["12", "30", "60"]],
  ["一年通常有多少个月？", "12", ["10", "7", "24"]],
  ["彩虹常见有几种颜色？", "7", ["3", "5", "10"]],
  ["水加热到很热会变成____。", "水蒸气", ["石头", "沙子", "铁块"]],
  ["影子通常出现在光照物体的____。", "背光一侧", ["发光一侧", "正上方", "里面"]],
  ["用眼睛看书时，书离眼睛太近会____。", "伤眼睛", ["变更轻", "自己发光", "变甜"]],
  ["过马路要先看____。", "红绿灯", ["云朵", "书包", "铅笔"]],
  ["三角形有几条边？", "3", ["2", "4", "5"]],
  ["正方形有几个角？", "4", ["3", "5", "6"]],
  ["5 个十是____。", "50", ["15", "25", "100"]],
  ["100 里面有几个十？", "10", ["5", "20", "1"]],
  ["比 36 大 1 的数是？", "37", ["35", "46", "30"]],
  ["比 80 小 10 的数是？", "70", ["90", "8", "60"]],
  ["早上起床后应该先____。", "洗漱", ["睡觉", "吃糖纸", "关灯"]],
  ["遇到不会的题，可以先____。", "读清题目", ["随便选", "不看题", "撕书"]],
];

const material = {
  water: mat(0x32b9d0, { roughness: 0.58, metalness: 0.03 }),
  waterLine: mat(0xd7fbff, { roughness: 0.68, metalness: 0.01, transparent: true, opacity: 0.28 }),
  shallowWater: mat(0x9ee8dc, { roughness: 0.68, transparent: true, opacity: 0.42 }),
  island: mat(0x70c983, { roughness: 0.82, flatShading: true }),
  islandDark: mat(0x4fa267, { roughness: 0.84, flatShading: true }),
  grassLight: mat(0xa9df7d, { roughness: 0.86, flatShading: true }),
  sand: mat(0xf0dca4, { roughness: 0.88, flatShading: true }),
  foam: mat(0xeaffed, { roughness: 0.72, transparent: true, opacity: 0.56 }),
  pebble: mat(0xd8d0aa, { roughness: 0.88, flatShading: true }),
  dark: mat(0x081019, { roughness: 0.72 }),
  black: mat(0x02060b, { roughness: 0.6 }),
  steel: mat(0x6b7b87, { roughness: 0.5, metalness: 0.2 }),
  captainBlue: toonMat(0x2a9cff),
  captainWhite: toonMat(0xf8fdff),
  gold: toonMat(0xffcb36, { emissive: 0xa85c00, emissiveIntensity: 0.04 }),
  green: mat(0x58d886, { roughness: 0.72, flatShading: true }),
  trunk: mat(0x7b3d22, { roughness: 0.78, flatShading: true }),
  candy: mat(0xff8fbc, { roughness: 0.52, metalness: 0.04 }),
  skin: toonMat(0xffd3a6),
  cheek: toonMat(0xff94ad),
  cream: toonMat(0xfff0c8),
  leaf: toonMat(0x66d879),
  wing: mat(0xc7fbff, { roughness: 0.34, transparent: true, opacity: 0.58 }),
  cookieBrown: toonMat(0xd4934f),
  ghostGood: mat(0x55d8ff, { roughness: 0.4, metalness: 0.08, transparent: true, opacity: 0.45 }),
  ghostBad: mat(0xe75b65, { roughness: 0.45, transparent: true, opacity: 0.36 }),
  hp: mat(0xff5d6d, { roughness: 0.4 }),
  shield: mat(0x55b6ff, { roughness: 0.4 }),
};

const player = createCaptain();
const core = createIslandCore();
const cameraTarget = new THREE.Vector3();

setupLighting();
buildWorld();
root.add(player, core);
player.position.set(1.5, 0, 1.3);
core.position.set(0, 0, 0);
spawnCandies();
rebuildGhost();
updatePanel();
beginPrep();
resize();
bindEvents();
updateAudioButton();
renderer.setAnimationLoop(tick);

function setupLighting() {
  const hemi = new THREE.HemisphereLight(0xe6fbff, 0x4a8c68, 2.1);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff0c7, 3.0);
  sun.position.set(-9, 14, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -24;
  sun.shadow.camera.right = 24;
  sun.shadow.camera.top = 24;
  sun.shadow.camera.bottom = -24;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 42;
  scene.add(sun);

  const rim = new THREE.DirectionalLight(0x88f5ff, 0.85);
  rim.position.set(10, 6, -9);
  scene.add(rim);
}

function buildWorld() {
  const water = new THREE.Mesh(new THREE.BoxGeometry(58, 0.5, 48), material.water);
  water.position.y = -0.5;
  water.receiveShadow = true;
  root.add(water);

  for (let i = 0; i < 52; i += 1) {
    const lane = i % 13;
    const x = -27 + ((i * 9.7) % 54);
    const z = -21 + lane * 3.45 + Math.sin(i * 1.17) * 0.6;
    const nearIsland = Math.hypot(x * 0.9, z * 1.08) < 11.8;
    if (!nearIsland) addWaterRipple(x, z, rand(1.4, 3.9), rand(-0.08, 0.08));
  }

  const reef = new THREE.Mesh(organicCylinderGeometry(11.4, 11.9, 0.08, 72, 0.22), material.shallowWater);
  reef.position.y = -0.19;
  reef.scale.set(1.12, 1, 0.88);
  root.add(reef);

  const sandShelf = new THREE.Mesh(organicCylinderGeometry(10.1, 10.8, 0.58, 72, 0.15), material.sand);
  sandShelf.position.y = -0.08;
  sandShelf.scale.set(1.08, 1, 0.86);
  sandShelf.castShadow = true;
  sandShelf.receiveShadow = true;
  root.add(sandShelf);

  const island = new THREE.Mesh(organicCylinderGeometry(8.55, 9.15, 0.62, 72, 0.12), material.island);
  island.position.y = 0.16;
  island.scale.set(1.08, 1, 0.84);
  island.castShadow = true;
  island.receiveShadow = true;
  root.add(island);

  addMiniIslet(-7.2, -4.3, 2.7, 1.25);
  addMiniIslet(5.3, -5.0, 2.45, 1.1);
  addCoastPebbles(38);

  [
    [-4.8, 5.7, 2.25, 1.2],
    [4.7, 4.9, 2.15, 1.05],
    [-5.4, -4.6, 1.95, 0.95],
    [4.9, -5.2, 1.85, 0.92],
    [-0.4, -6.7, 2.35, 0.75],
  ].forEach(([x, z, sx, sz], index) => addGrassPatch(x, z, sx, sz, index));

  addPalm(-5.9, -4.5, 1.08);
  addPalm(6.2, -3.8, 0.84);
  addPalm(-7.6, 7.1, 0.72);
  addPalm(7.2, 6.1, 0.66);
  addFlowerPatch(-6.5, 6.8, 20);
  addFlowerPatch(5.9, -6.5, 18);
  addFlowerPatch(-1.3, 7.6, 12);
  addShells(-9.5, -3.2, 12);
  addShells(8.8, 4.4, 10);

  [
    [-13.4, 9.5],
    [13.8, 10.2],
    [-8.2, -12.7],
    [11.4, 13.8],
    [8.1, -11.3],
  ].forEach(([x, z]) => addRock(x, z));
}

function addGrassPatch(x, z, sx, sz, variant = 0) {
  const mesh = new THREE.Mesh(
    organicCylinderGeometry(1, 1, 0.06, 28, 0.18),
    variant % 2 ? material.grassLight : material.islandDark,
  );
  mesh.position.set(x, 0.5, z);
  mesh.scale.set(sx, 1, sz);
  mesh.rotation.y = rand(0, Math.PI);
  mesh.receiveShadow = true;
  root.add(mesh);
}

function addWaterRipple(x, z, width, rotation = 0) {
  const group = new THREE.Group();
  group.position.set(x, -0.17, z);
  group.rotation.y = rotation;
  const pieces = 2 + Math.floor(width / 1.4);
  for (let i = 0; i < pieces; i += 1) {
    const dash = new THREE.Mesh(
      new THREE.BoxGeometry(width / pieces * rand(0.42, 0.68), 0.018, 0.035),
      material.waterLine,
    );
    dash.position.x = (i - (pieces - 1) / 2) * (width / pieces) + rand(-0.08, 0.08);
    dash.position.z = Math.sin(i * 1.9) * 0.04;
    group.add(dash);
  }
  root.add(group);
}

function addMiniIslet(x, z, sx, sz) {
  const sand = new THREE.Mesh(organicCylinderGeometry(1.1, 1.18, 0.22, 28, 0.2), material.sand);
  sand.position.set(x, 0.34, z);
  sand.scale.set(sx, 1, sz);
  sand.rotation.y = rand(0, Math.PI);
  const grass = new THREE.Mesh(organicCylinderGeometry(0.72, 0.8, 0.12, 22, 0.2), material.grassLight);
  grass.position.set(x + rand(-0.18, 0.18), 0.52, z + rand(-0.12, 0.12));
  grass.scale.set(sx * 0.62, 1, sz * 0.62);
  grass.rotation.y = sand.rotation.y + 0.45;
  sand.castShadow = true;
  sand.receiveShadow = true;
  grass.receiveShadow = true;
  root.add(sand, grass);
}

function addCoastPebbles(count) {
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + rand(-0.04, 0.04);
    const radiusX = rand(9.25, 10.25);
    const radiusZ = rand(7.2, 8.35);
    const x = Math.cos(angle) * radiusX;
    const z = Math.sin(angle) * radiusZ;
    if (i % 4 === 0) addShells(x, z, 2);
    else {
      const pebble = new THREE.Mesh(new THREE.DodecahedronGeometry(rand(0.1, 0.22), 0), material.pebble);
      pebble.position.set(x, 0.42, z);
      pebble.scale.set(rand(1.0, 1.7), rand(0.3, 0.55), rand(0.8, 1.25));
      pebble.rotation.set(rand(0, 0.3), angle, rand(0, 0.3));
      pebble.castShadow = true;
      pebble.receiveShadow = true;
      root.add(pebble);
    }
  }
}

function addPalm(x, z, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, 0.18, z);
  group.scale.setScalar(scale);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 1.8, 6), material.trunk);
  trunk.position.y = 0.9;
  trunk.rotation.z = rand(-0.16, 0.16);
  trunk.castShadow = true;
  group.add(trunk);
  for (let i = 0; i < 6; i += 1) {
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 1.65), material.green);
    leaf.position.y = 1.86;
    leaf.rotation.y = (i / 6) * Math.PI * 2;
    leaf.rotation.x = 0.55;
    leaf.castShadow = true;
    group.add(leaf);
  }
  root.add(group);
}

function addRock(x, z) {
  const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.58, 0), mat(0x8a8b75, { roughness: 0.9, flatShading: true }));
  mesh.position.set(x, 0.35, z);
  mesh.rotation.set(rand(0, 2), rand(0, 2), rand(0, 2));
  mesh.scale.set(rand(0.85, 1.45), rand(0.55, 0.9), rand(0.75, 1.2));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);
}

function addFlowerPatch(cx, cz, count) {
  const colors = [0xff9ab8, 0xffd45f, 0xe9f7ff, 0x9fe275];
  for (let i = 0; i < count; i += 1) {
    const angle = i * 2.399;
    const radius = Math.sqrt(i) * 0.27;
    const x = cx + Math.cos(angle) * radius + rand(-0.08, 0.08);
    const z = cz + Math.sin(angle) * radius + rand(-0.08, 0.08);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.025, rand(0.22, 0.36), 5), material.green);
    stem.position.set(x, 0.58, z);
    const blossom = new THREE.Mesh(
      new THREE.IcosahedronGeometry(rand(0.055, 0.09), 0),
      mat(colors[i % colors.length], { roughness: 0.62, flatShading: true }),
    );
    blossom.position.set(x, 0.75, z);
    stem.castShadow = true;
    blossom.castShadow = true;
    root.add(stem, blossom);
  }
}

function addShells(cx, cz, count) {
  for (let i = 0; i < count; i += 1) {
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(rand(0.08, 0.16), 8, 6),
      mat(i % 2 ? 0xffe0d2 : 0xf5efca, { roughness: 0.72, flatShading: true }),
    );
    const angle = i * 2.1;
    const radius = Math.sqrt(i) * 0.32;
    shell.position.set(cx + Math.cos(angle) * radius, 0.42, cz + Math.sin(angle) * radius);
    shell.scale.set(1.2, 0.34, 0.75);
    shell.rotation.set(rand(0, 0.2), rand(0, Math.PI), rand(0, 0.2));
    shell.castShadow = true;
    shell.receiveShadow = true;
    root.add(shell);
  }
}

function addBuildPad(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0.52, z);
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.82, 0.92, 0.12, 18),
    mat(0xf5e6b8, { roughness: 0.78, flatShading: true }),
  );
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.045, 8, 28),
    mat(0x9ee8dc, { emissive: 0x4bd8cc, emissiveIntensity: 0.18, roughness: 0.48 }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.09;
  for (let i = 0; i < 6; i += 1) {
    const stone = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.14, 0),
      mat(i % 2 ? 0xb4b6a0 : 0xd9d2af, { roughness: 0.88, flatShading: true }),
    );
    const angle = (i / 6) * Math.PI * 2;
    stone.position.set(Math.cos(angle) * 0.46, 0.16, Math.sin(angle) * 0.46);
    stone.scale.set(1.2, 0.38, 0.9);
    stone.rotation.y = angle;
    group.add(stone);
  }
  const marker = createStarMesh(0.22, 0.1, 0.04, 0xffdf75);
  marker.position.y = 0.23;
  marker.rotation.x = -Math.PI / 2;
  group.add(base, ring, marker);
  group.traverse(enableShadows);
  root.add(group);
  state.buildPads.push({ group, occupied: false });
}

function addCrystalField(cx, cz, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = i * 2.399;
    const radius = Math.sqrt(i) * 0.32;
    const crystal = new THREE.Mesh(new THREE.ConeGeometry(rand(0.08, 0.16), rand(0.32, 0.72), 4), mat(0xd57e12, { roughness: 0.58, flatShading: true }));
    crystal.position.set(cx + Math.cos(angle) * radius, 0.28, cz + Math.sin(angle) * radius);
    crystal.rotation.y = rand(0, Math.PI);
    crystal.castShadow = true;
    root.add(crystal);
  }
}

function createIslandCore() {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.45, 0.44, 18), material.dark);
  base.position.y = 0.42;
  const glow = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.7, 0.08, 24), mat(0x48e4ff, { emissive: 0x1aa9d8, emissiveIntensity: 0.5, transparent: true, opacity: 0.55 }));
  glow.position.y = 0.68;
  const star = createStarMesh(1.0, 0.45, 0.18, 0xf8db5f);
  star.position.y = 1.32;
  star.rotation.y = Math.PI / 10;
  const light = new THREE.PointLight(0xffe680, 1.6, 9);
  light.position.y = 1.5;
  group.add(base, glow, star, light);
  applyCartoonOutlines(group, 0.046);
  group.traverse(enableShadows);
  return group;
}

function createCaptain() {
  const group = new THREE.Group();
  const legMat = material.captainBlue;
  const shoeMat = material.dark;
  const legs = [
    new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.58, 14), legMat),
    new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.58, 14), legMat),
  ];
  legs[0].position.set(-0.18, 0.38, 0);
  legs[1].position.set(0.18, 0.38, 0);

  const shoeA = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), shoeMat);
  const shoeB = shoeA.clone();
  shoeA.position.set(-0.18, 0.08, 0.08);
  shoeB.position.set(0.18, 0.08, 0.08);
  shoeA.scale.set(1.2, 0.38, 1.55);
  shoeB.scale.copy(shoeA.scale);

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.52, 20, 14), material.captainWhite);
  body.position.y = 1.05;
  body.scale.set(0.9, 1.12, 0.68);
  const vest = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 12), material.captainBlue);
  vest.position.set(0, 1.03, 0.08);
  vest.scale.set(0.82, 0.98, 0.54);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.035, 8, 24), material.gold);
  collar.position.set(0, 1.44, 0.03);
  collar.rotation.x = Math.PI / 2;

  const scarf = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.58, 3), mat(0xff6e83, { roughness: 0.68 }));
  scarf.position.set(-0.36, 1.16, -0.1);
  scarf.rotation.set(0.25, -0.55, 0.65);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.44, 24, 18), material.skin);
  head.position.y = 1.78;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.45, 18, 12), material.dark);
  hair.position.set(0, 1.92, -0.02);
  hair.scale.set(1.02, 0.56, 1.0);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.42, 0.16, 18), material.captainBlue);
  cap.position.y = 2.13;
  const brim = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), material.captainBlue);
  brim.position.set(0, 2.03, 0.34);
  brim.scale.set(1.65, 0.28, 0.72);
  const capStar = createStarMesh(0.12, 0.05, 0.025, 0xffe87b);
  capStar.position.set(0, 2.14, 0.37);
  capStar.rotation.x = -0.08;

  addCuteFace(group, 1.8, 0.39, 0.82, { smile: true });
  const handA = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), material.skin);
  const handB = handA.clone();
  handA.position.set(-0.52, 1.15, 0.12);
  handB.position.set(0.56, 1.15, 0.12);
  const armA = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.5, 10), material.captainWhite);
  const armB = armA.clone();
  armA.position.set(-0.4, 1.2, 0.08);
  armB.position.set(0.43, 1.2, 0.08);
  armA.rotation.z = -0.55;
  armB.rotation.z = 0.55;

  const baton = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.74, 10), material.gold);
  baton.position.set(0.69, 1.3, 0.16);
  baton.rotation.z = -0.42;
  const batonStar = createStarMesh(0.25, 0.11, 0.055, 0xffe87b);
  batonStar.position.set(0.86, 1.66, 0.16);
  group.add(...legs, shoeA, shoeB, body, vest, collar, scarf, head, hair, cap, brim, capStar, armA, armB, handA, handB, baton, batonStar);
  group.traverse(enableShadows);
  return group;
}

function buildStructure({ parts, color, ghosted, preset }) {
  const group = new THREE.Group();
  const palette = towerPalette(preset, color, ghosted);
  if (preset === "wall") createVineTrapTower(group, palette);
  else if (preset === "frost") createFrostTower(group, palette);
  else if (preset === "cookie") createCookieTower(group, palette);
  else createSparkTower(group, palette);

  if (parts.aura) {
    const aura = partMesh(new THREE.TorusGeometry(1.18, 0.04, 8, 32), palette.accent, "aura");
    aura.position.y = 0.14;
    aura.rotation.x = Math.PI / 2;
    group.add(aura);
  }

  if (!ghosted) applyCartoonOutlines(group, 0.04);

  group.traverse((child) => {
    if (child.isMesh) {
      if (child.userData.isOutline) {
        child.castShadow = false;
        child.receiveShadow = false;
        return;
      }
      child.castShadow = !ghosted;
      child.receiveShadow = true;
    }
  });
  return group;
}

function towerBase(group, parts, dark, main) {
  if (parts.base) {
    const base = partMesh(new THREE.CylinderGeometry(0.82, 1.02, 0.38, 18), dark, "base");
    base.position.y = 0.24;
    group.add(base);
  }
  if (parts.core) {
    const column = partMesh(new THREE.CylinderGeometry(0.38, 0.48, 0.95, 14), main, "core");
    column.position.y = 0.88;
    group.add(column);
  }
}

function towerPalette(preset, color, ghosted) {
  if (ghosted) {
    const ghostDark = mat(0x0c1620, { roughness: 0.62, transparent: true, opacity: 0.44 });
    return {
      main: material.ghostGood,
      dark: ghostDark,
      accent: material.ghostGood,
      white: material.ghostGood,
      soft: material.ghostGood,
    };
  }
  const projectile = TOWER_DEFS[preset]?.projectile || 0xf6c33f;
  return {
    main: toonMat(color),
    dark: material.dark,
    accent: toonMat(projectile, { emissive: projectile, emissiveIntensity: 0.12 }),
    white: material.captainWhite,
    soft: toonMat(0xfff0c8),
  };
}

function createSparkTower(group, palette) {
  addToyBase(group, palette.dark, palette.main);
  const body = partMesh(new THREE.SphereGeometry(0.45, 20, 14), palette.main, "core");
  body.position.y = 0.86;
  body.scale.set(1.0, 0.88, 1.0);
  const barrel = partMesh(new THREE.CylinderGeometry(0.15, 0.22, 0.92, 18), palette.dark, "barrel");
  barrel.position.set(0, 1.16, 0.56);
  barrel.rotation.x = Math.PI / 2;
  const muzzle = partMesh(new THREE.SphereGeometry(0.22, 16, 10), palette.accent, "crystal");
  muzzle.position.set(0, 1.16, 1.04);
  for (let i = 0; i < 3; i += 1) {
    const coil = partMesh(new THREE.TorusGeometry(0.37 + i * 0.04, 0.026, 8, 24), palette.accent, "coil");
    coil.position.y = 0.88 + i * 0.14;
    coil.rotation.x = Math.PI / 2;
    group.add(coil);
  }
  const star = createStarMesh(0.24, 0.11, 0.045, TOWER_DEFS.spark.projectile);
  star.position.set(0, 1.58, 0.12);
  group.add(body, barrel, muzzle, star);
}

function createFrostTower(group, palette) {
  addToyBase(group, palette.dark, palette.white);
  const snowBase = partMesh(new THREE.SphereGeometry(0.48, 18, 12), palette.white, "core");
  snowBase.position.y = 0.82;
  snowBase.scale.set(1.1, 0.7, 1.1);
  const crystal = partMesh(new THREE.ConeGeometry(0.46, 1.22, 6), palette.accent, "barrel");
  crystal.position.y = 1.46;
  crystal.rotation.y = Math.PI / 6;
  const cap = partMesh(new THREE.OctahedronGeometry(0.28, 0), palette.accent, "crystal");
  cap.position.y = 2.16;
  const ring = partMesh(new THREE.TorusGeometry(0.58, 0.035, 8, 28), palette.accent, "coil");
  ring.position.y = 1.0;
  ring.rotation.x = Math.PI / 2;
  addSnowflake(group, 1.38, 0.72, palette.white);
  group.add(snowBase, crystal, cap, ring);
}

function createCookieTower(group, palette) {
  addToyBase(group, palette.dark, material.cream);
  const cream = partMesh(new THREE.SphereGeometry(0.48, 18, 12), material.cream, "core");
  cream.position.y = 0.82;
  cream.scale.set(1.04, 0.64, 1.04);
  const barrel = partMesh(new THREE.CylinderGeometry(0.28, 0.36, 1.1, 18), material.cookieBrown, "barrel");
  barrel.position.set(0, 1.14, 0.55);
  barrel.rotation.x = Math.PI / 2;
  const cookie = partMesh(new THREE.CylinderGeometry(0.42, 0.42, 0.16, 24), material.cookieBrown, "crystal");
  cookie.position.set(0, 1.14, 1.16);
  cookie.rotation.x = Math.PI / 2;
  for (let i = 0; i < 5; i += 1) {
    const chip = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), mat(0x75451d, { roughness: 0.74 }));
    const angle = i * 2.2;
    chip.position.set(Math.cos(angle) * 0.18, 1.14 + Math.sin(angle) * 0.12, 1.25);
    chip.scale.set(1, 0.55, 1);
    group.add(chip);
  }
  group.add(cream, barrel, cookie);
}

function createVineTrapTower(group, palette) {
  const soil = partMesh(new THREE.CylinderGeometry(0.74, 0.9, 0.2, 20), mat(0x8d6b3f, { roughness: 0.86 }), "base");
  soil.position.y = 0.18;
  const vineRing = partMesh(new THREE.TorusGeometry(0.56, 0.07, 10, 32), palette.main, "coil");
  vineRing.position.y = 0.36;
  vineRing.rotation.x = Math.PI / 2;
  const bud = partMesh(new THREE.SphereGeometry(0.34, 16, 12), palette.main, "core");
  bud.position.y = 0.72;
  bud.scale.set(1.08, 0.82, 1.08);
  addLeaf(group, -0.38, 0.56, 0.1, 0.42, -0.8, palette.main);
  addLeaf(group, 0.38, 0.56, -0.08, 0.42, 0.8, palette.main);
  addLeaf(group, 0.0, 0.44, 0.4, 0.36, 0, palette.main);
  const glow = createStarMesh(0.16, 0.07, 0.035, 0xffe87b);
  glow.position.set(0, 0.9, 0.32);
  glow.scale.setScalar(0.86);
  group.add(soil, vineRing, bud, glow);
}

function addToyBase(group, dark, main) {
  const base = partMesh(new THREE.CylinderGeometry(0.78, 0.96, 0.3, 24), dark, "base");
  base.position.y = 0.2;
  const trim = partMesh(new THREE.TorusGeometry(0.72, 0.045, 8, 28), main, "base");
  trim.position.y = 0.38;
  trim.rotation.x = Math.PI / 2;
  group.add(base, trim);
}

function addSnowflake(group, y, z, matRef) {
  for (let i = 0; i < 6; i += 1) {
    const ray = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.026, 0.38, 6), matRef);
    ray.position.set(0, y, z);
    ray.rotation.z = (i / 6) * Math.PI * 2;
    ray.rotation.x = Math.PI / 2;
    group.add(ray);
  }
}

function addLeaf(group, x, y, z, scale, rotation, matRef = material.leaf) {
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 8), matRef);
  leaf.position.set(x, y, z);
  leaf.scale.set(scale * 1.45, scale * 0.34, scale * 0.72);
  leaf.rotation.y = rotation;
  leaf.rotation.z = 0.25;
  group.add(leaf);
  return leaf;
}

function hasBuildSelection() {
  return Boolean(state.selectedPreset && TOWER_DEFS[state.selectedPreset]);
}

function clearBuildSelection(statusText = "") {
  state.selectedPreset = null;
  state.buildPreview = { canBuild: false, position: state.pointerWorld.clone(), reason: "右侧选炮台后，再点地建造。" };
  ghost.clear();
  ghost.visible = false;
  if (statusText) setStatus(statusText);
}

function rebuildGhost() {
  ghost.clear();
  if (!hasBuildSelection()) {
    state.buildPreview = { canBuild: false, position: state.pointerWorld.clone(), reason: "右侧选炮台后，再点地建造。" };
    ghost.visible = false;
    return;
  }
  const preview = getBuildPreview(state.pointerWorld);
  const structure = buildStructure({
    parts: state.parts,
    color: preview.canBuild ? state.selectedColor : "#e75b65",
    ghosted: true,
    preset: state.selectedPreset,
  });
  if (!preview.canBuild) tintGhost(structure, material.ghostBad);
  ghost.add(structure);
  ghost.position.copy(state.pointerWorld);
  ghost.rotation.y = state.rotation;
  ghost.visible = state.mode === "place" && state.pointerReady && hasBuildSelection();
  state.buildPreview = preview;
}

function commitGhost(offset = new THREE.Vector3()) {
  if (!hasBuildSelection()) {
    setStatus("右侧先选一个炮台；不选炮台时点地图就是移动队长。");
    return;
  }
  requestBuildAt(ghost.position.clone().add(offset));
}

function requestBuildAt(position) {
  hideTowerMenu();
  if (!hasBuildSelection()) {
    setStatus("右侧先选一个炮台；不选炮台时点地图就是移动队长。");
    ghost.visible = false;
    return false;
  }
  const def = TOWER_DEFS[state.selectedPreset];
  if (isLocked(state.selectedPreset)) {
    setStatus(`${def.name} 第 ${def.unlock} 关解锁。`);
    return;
  }
  if (state.stars < def.cost) {
    setStatus(`星币不够：${def.name} 需要 ${def.cost} 星币。`);
    return;
  }
  const preview = getBuildPreview(position);
  state.buildPreview = preview;
  if (!preview.canBuild) {
    setStatus(preview.reason);
    rebuildGhost();
    return;
  }

  const buildPosition = preview.position.clone();
  const workPosition = getCaptainWorkSpot(buildPosition);
  state.pendingBuild = {
    preset: state.selectedPreset,
    color: state.selectedColor,
    position: buildPosition,
    workPosition,
  };
  state.playerTarget = workPosition;
  setStatus(`队长去那里建${def.name}。`);
  clearBuildSelection();
  updatePanel(false);
  return true;
}

function placeTowerAt(position, preset = state.selectedPreset, color = state.selectedColor) {
  const def = TOWER_DEFS[preset];
  if (!def) {
    setStatus("右侧先选一个炮台。");
    ghost.visible = false;
    return false;
  }
  if (state.stars < def.cost) {
    setStatus(`星币不够：${def.name} 需要 ${def.cost} 星币。`);
    return false;
  }
  const preview = getBuildPreview(position, preset);
  if (!preview.canBuild) {
    setStatus(preview.reason);
    return false;
  }
  const group = buildStructure({
    parts: state.parts,
    color,
    ghosted: false,
    preset,
  });
  group.position.copy(preview.position).setY(0);
  group.rotation.y = state.rotation;
  attachTowerInteractionHalo(group, def.projectile);
  root.add(group);

  state.stars -= def.cost;
  const tower = {
    kind: "tower",
    type: preset,
    group,
    level: 1,
    cooldown: rand(0.05, 0.35),
    color,
    pad: null,
  };
  state.towers.push(tower);
  state.placed.push(group);
  setStatus(`${def.name} 建好了！怪物来了会自动攻击。`);
  awardLearningEnergy(5);
  playSfx("build");
  rebuildGhost();
  return true;
}

function attachTowerInteractionHalo(group, color) {
  const halo = new THREE.Group();
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05, 1.05, 0.025, 42),
    mat(0xffdf75, { emissive: 0xffdf75, emissiveIntensity: 0.18, transparent: true, opacity: 0.16 }),
  );
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.92, 0.035, 8, 54),
    mat(color, { emissive: color, emissiveIntensity: 0.55, transparent: true, opacity: 0.76 }),
  );
  const glow = new THREE.PointLight(color, 0.8, 4.2);
  disc.position.y = 0.04;
  ring.position.y = 0.1;
  ring.rotation.x = Math.PI / 2;
  glow.position.y = 1.55;
  disc.userData.noOutline = true;
  ring.userData.noOutline = true;
  halo.add(disc, ring, glow);
  halo.visible = false;
  group.add(halo);
  group.userData.interactionHalo = halo;
}

function getBuildPreview(position, preset = state.selectedPreset) {
  const preview = validateBuildAt(position, preset);
  state.buildPreview = preview;
  return preview;
}

function validateBuildAt(position, preset = state.selectedPreset) {
  const point = snap(position).setY(0);
  const def = TOWER_DEFS[preset];
  if (!def) return { canBuild: false, position: point, reason: "右侧先选一个炮台；不选炮台时点地图就是移动队长。" };
  if (isLocked(preset)) return { canBuild: false, position: point, reason: `${def.name} 第 ${def.unlock} 关解锁。` };
  if (state.stars < def.cost) return { canBuild: false, position: point, reason: `星币不够：${def.name} 需要 ${def.cost} 星币。` };
  if (!isOnBuildableIsland(point)) {
    return { canBuild: false, position: point, reason: "这里水太深啦，换到草地、沙滩或浅海亮蓝色区域。" };
  }
  if (point.distanceTo(core.position) < BUILD_RULES.coreMin) {
    return { canBuild: false, position: point, reason: "离生命核心稍微远一点，给基地留出安全空间。" };
  }
  for (const tower of state.towers) {
    if (tower.group.position.distanceTo(point) < BUILD_RULES.towerMin) {
      return { canBuild: false, position: point, reason: "和别的炮塔挤在一起啦，旁边留点空地。" };
    }
  }
  for (const candy of state.candies) {
    if (candy.alive && candy.group.position.distanceTo(point) < 1.0) {
      return { canBuild: false, position: point, reason: "糖果旁边先留出来，打开奖励后再建。" };
    }
  }
  return { canBuild: true, position: point, reason: "可以建造。" };
}

function tintGhost(group, matRef) {
  group.traverse((child) => {
    if (child.isMesh) child.material = matRef;
  });
}

function updatePanel(writeStatus = true) {
  const def = state.selectedPreset ? TOWER_DEFS[state.selectedPreset] : null;
  if (state.selectedPreset && (!def || isLocked(state.selectedPreset))) {
    clearBuildSelection();
    return updatePanel(writeStatus);
  }
  ui.selectedName.textContent = def ? def.name : "未选炮台";
  ui.selectedDesc.textContent = def ? `${def.desc} · ${def.cost} 星币` : "点地图移动队长";
  ui.partLabel.value = PART_NAMES[state.selectedPart] || state.selectedPart;
  ui.towerCost.value = def ? `${def.cost} 星币` : "--";
  ui.customColor.value = state.selectedColor;
  ui.miniPreview.style.background = `
    radial-gradient(ellipse at 50% 74%, rgba(0,0,0,.48), transparent 35%),
    radial-gradient(circle at 50% 38%, ${state.selectedColor} 0 18%, rgba(255,255,255,.16) 19% 28%, transparent 29%),
    linear-gradient(90deg, #0b1018 0 18%, ${state.selectedColor} 18% 44%, #101928 44% 56%, ${state.selectedColor} 56% 82%, #0b1018 82% 100%)
  `;
  const modeText = {
    place: def
      ? `已选择${def.name}：点草地、沙滩或浅海建造；再点一次同款炮台取消。`
      : "点地图移动队长；右侧选炮台后再点地建造。",
    inspect: "移动模式：点地面让队长跑过去，点炮台可升级/回收。",
    route: "来袭模式：怪物会从随机海岸登岛。",
    squad: "精灵模式：小精灵会跟着队长打怪。",
  };
  if (writeStatus) ui.statusText.textContent = modeText[state.mode] || modeText.place;
  ghost.visible = state.mode === "place" && state.pointerReady && hasBuildSelection();

  document.querySelectorAll(".part").forEach((button) => {
    const part = button.dataset.part;
    button.classList.toggle("is-active", Boolean(state.parts[part]));
  });
  document.querySelectorAll(".preset").forEach((button) => {
    const preset = button.dataset.preset;
    button.classList.toggle("is-active", preset === state.selectedPreset);
    button.disabled = isLocked(preset);
    button.classList.toggle("preset--locked", isLocked(preset));
    button.title = preset === state.selectedPreset ? "再次点击取消建造" : "选择后点地图建造";
  });
  document.querySelectorAll(".swatch").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.color.toLowerCase() === state.selectedColor.toLowerCase());
  });
}

function bindEvents() {
  window.addEventListener("resize", resize);
  window.addEventListener("pointerdown", activateAudioFromGesture, { capture: true });
  window.addEventListener("touchstart", activateAudioFromGesture, { capture: true, passive: true });
  window.addEventListener("keydown", (event) => {
    activateAudioFromGesture();
    const key = event.key.toLowerCase();
    state.keys.add(key);
    if (key === "r") rotateGhost();
    if (key === "q") castLightning();
    if (key === " ") {
      event.preventDefault();
      captainAttack();
    }
  });
  window.addEventListener("keyup", (event) => state.keys.delete(event.key.toLowerCase()));

  canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  canvas.addEventListener("pointerdown", beginCanvasPointer);
  canvas.addEventListener("pointermove", dragCanvasPointer);
  canvas.addEventListener("pointerup", finishCanvasPointer);
  canvas.addEventListener("pointercancel", cancelCanvasPointer);
  canvas.addEventListener("wheel", zoomCamera, { passive: false });

  ui.joystick?.addEventListener("pointerdown", beginJoystick);
  ui.joystick?.addEventListener("pointermove", updateJoystick);
  ui.joystick?.addEventListener("pointerup", endJoystick);
  ui.joystick?.addEventListener("pointercancel", endJoystick);

  document.querySelectorAll(".part").forEach((button) => {
    button.addEventListener("click", () => {
      const part = button.dataset.part;
      state.selectedPart = part;
      state.parts[part] = !state.parts[part];
      if (!Object.values(state.parts).some(Boolean)) state.parts[part] = true;
      rebuildGhost();
      updatePanel();
    });
  });

  document.querySelectorAll(".preset").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = button.dataset.preset;
      if (isLocked(preset)) return;
      if (state.selectedPreset === preset) {
        clearBuildSelection("已取消建造，点地图移动队长。");
        updatePanel(false);
        return;
      }
      state.selectedPreset = preset;
      state.selectedColor = TOWER_DEFS[preset].color;
      hideTowerMenu();
      rebuildGhost();
      updatePanel();
    });
  });

  document.querySelectorAll(".swatch").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedColor = button.dataset.color;
      rebuildGhost();
      updatePanel();
    });
  });

  document.querySelectorAll(".command-bar button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".command-bar button").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      state.mode = button.id.replace("mode", "").toLowerCase();
      updatePanel();
    });
  });

  ui.customColor?.addEventListener("change", () => {
    state.selectedColor = normalizeHex(ui.customColor.value);
    rebuildGhost();
    updatePanel();
  });
  ui.commitBuilding?.addEventListener("click", commitGhost);
  ui.resetBuilding?.addEventListener("click", () => {
    state.parts = { base: true, core: true, barrel: true, coil: true, crystal: true, aura: false };
    rebuildGhost();
    updatePanel();
  });
  ui.upgradeNearest?.addEventListener("click", upgradeNearestTower);
  ui.sellNearest?.addEventListener("click", sellNearestTower);
  ui.practiceNow?.addEventListener("click", () => openQuiz("practice"));
  ui.quizBtn?.addEventListener("click", () => openQuiz("practice"));
  ui.lightningBtn?.addEventListener("click", castLightning);
  ui.attackBtn?.addEventListener("click", captainAttack);
  ui.waveBtn?.addEventListener("click", startWaveNow);
  ui.audioBtn?.addEventListener("click", toggleAudio);
  ui.towerMenuUpgrade?.addEventListener("click", () => queueTowerUpgrade(state.selectedTower));
  ui.towerMenuSell?.addEventListener("click", () => queueTowerSell(state.selectedTower));
  ui.towerMenuCancel?.addEventListener("click", hideTowerMenu);
  ui.quizClose?.addEventListener("click", () => closeQuiz(false));
}

function tick() {
  const dt = Math.min(clock.getDelta(), 0.045);
  updateFps(dt);
  if (!state.quizActive) {
    updateWave(dt);
    updatePlayer(dt);
    updateEnemies(dt);
    updateTowers(dt);
    updateBullets(dt);
    updateSprites(dt);
    updateEffects(dt);
    updateCandies(dt);
    updateBuildPads(dt);
    updateTowerInteraction(dt);
    updateLearning(dt);
  }
  updateCamera(dt);
  updateTowerMenuPosition();
  updateUi(dt);
  updateAudio();
  renderer.render(scene, camera);
}

function updateWave(dt) {
  if (state.lightningCooldown > 0) state.lightningCooldown = Math.max(0, state.lightningCooldown - dt);
  if (state.playerAttackCooldown > 0) state.playerAttackCooldown = Math.max(0, state.playerAttackCooldown - dt);

  if (!state.waveActive) {
    state.prep = Math.max(0, state.prep - dt);
    if (state.prep <= 0) launchWave();
    return;
  }

  state.timer = Math.max(0, state.timer - dt);
  if (state.timer <= 0) {
    state.waveActive = false;
    openQuiz("timeout");
    return;
  }

  state.nextSpawn -= dt;
  if (state.nextSpawn <= 0 && state.spawned < state.waveQuota) {
    spawnEnemy();
    state.spawned += 1;
    state.nextSpawn = getSpawnInterval();
  }

  if (state.spawned >= state.waveQuota && state.enemies.length === 0) {
    completeLevel();
  }
}

function beginPrep() {
  state.waveActive = false;
  state.prep = 30;
  state.waveQuota = getWaveQuota();
  state.spawned = 0;
  state.waveKills = 0;
  state.timer = getLevelTimer(state.level, totalTowerPower());
  setStatus(`第 ${state.level} 关：点地图移动队长；右侧选炮台后可建到草地、沙滩或浅海。`);
}

function launchWave() {
  state.waveActive = true;
  state.nextSpawn = 0.25;
  state.waveQuota = getWaveQuota();
  state.spawned = 0;
  state.timer = getLevelTimer(state.level, totalTowerPower());
  setStatus(`第 ${state.level} 关开始！怪物从随机岸边登岛，守住生命核心。`);
}

function startWaveNow() {
  if (state.waveActive) return;
  state.prep = 0;
  launchWave();
  playSfx("wave");
}

function completeLevel() {
  state.waveActive = false;
  state.stars += 90 + state.level * 10;
  awardLearningEnergy(LEARNING_RULES.postWaveGain);
  state.waveCompletionsSinceQuiz += 1;
  if (
    state.learningEnergy >= LEARNING_RULES.readyEnergy &&
    state.waveCompletionsSinceQuiz >= LEARNING_RULES.waveCompletionsRequired
  ) {
    state.learningPending = true;
  }
  state.coreHp = Math.min(15, state.coreHp + 3);
  state.level = Math.min(10, state.level + 1);
  saveProgress(state.level);
  if (state.level === 4) setStatus("饼干炮解锁了！第 4 关可以使用。");
  else setStatus(`通关成功！准备进入第 ${state.level} 关。`);
  beginPrep();
  updatePanel();
}

function spawnEnemy() {
  const type = chooseEnemyType();
  const stats = scaledEnemyStats(type);
  const route = createLandingRoute(type);
  const group = createEnemyMesh(type, stats);
  const enemy = {
    kind: "enemy",
    type,
    group,
    route,
    segment: 0,
    hp: stats.hp,
    maxHp: stats.hp,
    shield: stats.shield,
    maxShield: stats.shield,
    speed: stats.speed,
    damage: stats.damage,
    reward: stats.reward,
    barVisibleUntil: 0,
    slow: 0,
    slowFactor: 1,
    alive: true,
  };
  group.position.copy(route[0]);
  group.position.y = type === "bat" ? 0.9 : 0.36;
  root.add(group);
  state.enemies.push(enemy);
}

function createLandingRoute(type) {
  const angle = rand(0, Math.PI * 2);
  const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
  const tangent = new THREE.Vector3(-radial.z, 0, radial.x);
  const start = new THREE.Vector3(
    radial.x * rand(12.4, 16.6),
    0,
    radial.z * rand(9.7, 13.0),
  );
  const shore = new THREE.Vector3(
    radial.x * rand(9.0, 10.4),
    0,
    radial.z * rand(6.8, 8.25),
  );
  const wobble = type === "boss" ? 0.6 : 1;
  const p1 = shore.clone().multiplyScalar(rand(0.66, 0.78)).addScaledVector(tangent, rand(-1.75, 1.75) * wobble);
  const p2 = shore.clone().multiplyScalar(rand(0.38, 0.52)).addScaledVector(tangent, rand(-1.35, 1.35) * wobble);
  const p3 = shore.clone().multiplyScalar(rand(0.16, 0.28)).addScaledVector(tangent, rand(-0.55, 0.55) * wobble);
  return [start, shore, p1, p2, p3, v(0, 0)];
}

function chooseEnemyType() {
  if (state.level % 5 === 0 && state.spawned === state.waveQuota - 1) return "boss";
  const pool = ["blob", "blob", "bat"];
  if (state.level >= 2) pool.push("shield");
  if (state.level >= 3) pool.push("turtle");
  if (state.level >= 6) pool.push("shield", "bat");
  return pool[Math.floor(Math.random() * pool.length)];
}

function updateEnemies(dt) {
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    if (enemy.slow > 0) enemy.slow = Math.max(0, enemy.slow - dt);
    else enemy.slowFactor = 1;

    const target = enemy.route[enemy.segment + 1];
    if (!target) {
      damageCore(enemy.damage);
      enemy.alive = false;
      root.remove(enemy.group);
      continue;
    }

    const direction = target.clone().sub(enemy.group.position);
    direction.y = 0;
    const distance = direction.length();
    if (distance < 0.12) {
      enemy.segment += 1;
    } else {
      direction.normalize();
      enemy.group.position.addScaledVector(direction, dt * enemy.speed * enemy.slowFactor);
      enemy.group.rotation.y = Math.atan2(direction.x, direction.z);
    }

    for (const sprite of state.sprites) {
      if (sprite.alive && sprite.group.position.distanceTo(enemy.group.position) < 0.85) {
        sprite.hp -= dt * 8;
        if (sprite.hp <= 0) {
          sprite.alive = false;
          root.remove(sprite.group);
        }
      }
    }

    updateEnemyBars(enemy);
  }
  state.enemies = state.enemies.filter((enemy) => enemy.alive);
  state.sprites = state.sprites.filter((sprite) => sprite.alive);
}

function damageCore(amount) {
  state.coreHp = Math.max(0, state.coreHp - amount);
  pulseCore(0xe75b65);
  setStatus(`怪物碰到生命核心，生命减少 ${amount} 点。`);
  if (state.coreHp <= 0) {
    state.waveActive = false;
    openQuiz("core");
  }
}

function updateTowers(dt) {
  for (const tower of state.towers) {
    const def = TOWER_DEFS[tower.type];
    const stats = getTowerStats(tower);

    if (tower.type === "wall") {
      for (const enemy of state.enemies) {
        if (enemy.group.position.distanceTo(tower.group.position) <= stats.range) {
          enemy.slow = Math.max(enemy.slow, def.slowTime);
          enemy.slowFactor = Math.min(enemy.slowFactor, def.slow);
        }
      }
      continue;
    }

    tower.cooldown = Math.max(0, tower.cooldown - dt);
    const target = findTowerTarget(tower, stats.range);
    if (target) {
      const delta = target.group.position.clone().sub(tower.group.position);
      tower.group.rotation.y = Math.atan2(delta.x, delta.z);
    }
    if (target && tower.cooldown <= 0) {
      tower.cooldown = stats.rate;
      fireProjectile(tower, target, stats);
    }
  }
}

function findTowerTarget(tower, range) {
  let best = null;
  let bestDist = Infinity;
  for (const candy of state.candies) {
    if (!candy.alive) continue;
    const dist = candy.group.position.distanceTo(tower.group.position);
    if (dist <= range && dist < bestDist) {
      best = candy;
      bestDist = dist;
    }
  }
  if (best) return best;
  for (const enemy of state.enemies) {
    const dist = enemy.group.position.distanceTo(tower.group.position);
    if (dist <= range && dist < bestDist) {
      best = enemy;
      bestDist = dist;
    }
  }
  return best;
}

function fireProjectile(tower, target, stats) {
  const def = TOWER_DEFS[tower.type];
  const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 0), mat(def.projectile, { roughness: 0.35, emissive: def.projectile, emissiveIntensity: 0.35 }));
  mesh.position.copy(tower.group.position).add(new THREE.Vector3(0, 1.45, 0));
  root.add(mesh);
  state.bullets.push({
    mesh,
    target,
    type: tower.type,
    damage: stats.damage,
    slow: def.slow,
    slowTime: def.slowTime,
    splash: def.splash || 0,
    speed: 12,
    alive: true,
  });
}

function updateBullets(dt) {
  for (const bullet of state.bullets) {
    if (!bullet.alive) continue;
    if (!isTargetAlive(bullet.target)) {
      bullet.alive = false;
      root.remove(bullet.mesh);
      continue;
    }
    const targetPos = bullet.target.group.position.clone().add(new THREE.Vector3(0, bullet.target.kind === "enemy" ? 0.75 : 0.55, 0));
    const delta = targetPos.sub(bullet.mesh.position);
    const distance = delta.length();
    if (distance <= bullet.speed * dt) {
      applyHit(bullet);
      bullet.alive = false;
      root.remove(bullet.mesh);
    } else {
      bullet.mesh.position.addScaledVector(delta.normalize(), bullet.speed * dt);
    }
  }
  state.bullets = state.bullets.filter((bullet) => bullet.alive);
}

function applyHit(bullet) {
  const target = bullet.target;
  if (target.kind === "candy") {
    damageCandy(target, bullet.damage);
    return;
  }
  damageEnemy(target, bullet.damage, bullet.type, bullet.slow, bullet.slowTime);
  if (bullet.splash > 0) {
    for (const enemy of state.enemies) {
      if (enemy !== target && enemy.group.position.distanceTo(target.group.position) <= bullet.splash) {
        damageEnemy(enemy, bullet.damage * 0.55, bullet.type);
      }
    }
  }
}

function damageEnemy(enemy, amount, sourceType = "spark", slow = 0, slowTime = 0) {
  if (!enemy.alive) return;
  let remaining = amount;
  if (enemy.shield > 0) {
    const shieldHit = Math.min(enemy.shield, remaining);
    enemy.shield -= shieldHit;
    remaining -= shieldHit;
  }
  if (remaining > 0) enemy.hp -= remaining;
  if (sourceType === "frost" && slow) {
    enemy.slow = Math.max(enemy.slow, slowTime);
    enemy.slowFactor = Math.min(enemy.slowFactor, slow);
  }
  if (enemy.hp <= 0) killEnemy(enemy);
  else updateEnemyBars(enemy);
}

function killEnemy(enemy) {
  if (!enemy.alive) return;
  enemy.alive = false;
  root.remove(enemy.group);
  state.stars += enemy.reward;
  state.waveKills += 1;
  awardLearningEnergy(3);
  setStatus(`挡住怪物，获得 ${enemy.reward} 星币。`);
  playSfx("pop");
}

function updateSprites(dt) {
  state.spriteHealTimer -= dt;
  if (state.spriteHealTimer <= 0) {
    state.spriteHealTimer = 10;
    for (const sprite of state.sprites) sprite.hp = Math.min(sprite.maxHp, sprite.hp + 18 + state.level * 2);
  }

  for (const sprite of state.sprites) {
    if (!sprite.alive) continue;
    sprite.cooldown = Math.max(0, sprite.cooldown - dt);
    const target = nearestEnemy(sprite.group.position, 5.2);
    if (target) {
      moveToward(sprite.group, target.group.position, dt * 2.7);
      if (sprite.group.position.distanceTo(target.group.position) < 1.25 && sprite.cooldown <= 0) {
        sprite.cooldown = 0.72;
        damageEnemy(target, 12 + state.level * 1.5, "sprite");
        addBurst(target.group.position, 0x98e16f);
      }
    } else {
      const follow = player.position.clone().add(new THREE.Vector3(rand(-1.4, 1.4), 0, rand(-1.4, 1.4)));
      moveToward(sprite.group, follow, dt * 1.65);
    }
  }
}

function spawnCandies() {
  [
    [-4.6, -2.2],
    [5.8, -1.2],
    [-6.8, 5.8],
    [7.5, 5.7],
    [-0.9, -7.1],
    [2.8, 7.5],
  ].forEach(([x, z], index) => {
    const group = createCandy(index);
    group.position.set(x, 0.22, z);
    root.add(group);
    state.candies.push({ kind: "candy", group, hp: 64, maxHp: 64, alive: true });
  });
}

function createCandy(index) {
  const group = new THREE.Group();
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.95, 8), mat(0xf3f7ff, { roughness: 0.42 }));
  stick.position.y = 0.42;
  const sweet = new THREE.Mesh(
    index % 2 ? new THREE.SphereGeometry(0.36, 14, 12) : new THREE.CylinderGeometry(0.34, 0.34, 0.16, 18),
    index % 2 ? material.candy : mat(0xe6a256, { roughness: 0.68 }),
  );
  sweet.position.y = 1.02;
  if (index % 2 === 0) sweet.rotation.x = Math.PI / 2;
  const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.035, 8, 18), mat(0xf7f05a, { roughness: 0.52 }));
  stripe.position.y = 1.02;
  stripe.rotation.x = Math.PI / 2;
  group.add(stick, sweet, stripe);
  group.traverse(enableShadows);
  return group;
}

function damageCandy(candy, amount) {
  if (!candy.alive) return;
  candy.hp -= amount;
  candy.group.scale.setScalar(0.82 + Math.max(0, candy.hp / candy.maxHp) * 0.18);
  if (candy.hp <= 0) {
    candy.alive = false;
    root.remove(candy.group);
    spawnSprite(candy.group.position);
    state.stars += 25;
    awardLearningEnergy(8);
    setStatus("糖果打开了！一个小精灵加入队伍。");
    playSfx("sparkle");
  }
  state.candies = state.candies.filter((item) => item.alive);
}

function updateCandies(dt) {
  for (const candy of state.candies) {
    candy.group.rotation.y += dt * 0.9;
  }
}

function updateBuildPads(dt) {
  const time = performance.now() * 0.003;
  for (const pad of state.buildPads) {
    if (pad.occupied) continue;
    const pulse = 1 + Math.sin(time + pad.group.position.x) * 0.035;
    pad.group.scale.setScalar(pulse);
    pad.group.rotation.y += dt * 0.35;
  }
}

function updateTowerInteraction(dt) {
  const tower = nearestTower(player.position, BUILD_RULES.towerAction + 0.42);
  if (state.nearbyTower && state.nearbyTower !== tower) setTowerHighlight(state.nearbyTower, false);
  state.nearbyTower = tower;
  if (tower) setTowerHighlight(tower, true, dt);
  if (
    state.selectedTower &&
    (!state.towers.includes(state.selectedTower) ||
      player.position.distanceTo(state.selectedTower.group.position) > BUILD_RULES.towerAction + 1.2)
  ) {
    hideTowerMenu();
  }
}

function setTowerHighlight(tower, active, dt = 0) {
  const halo = tower?.group?.userData?.interactionHalo;
  if (!halo) return;
  halo.visible = active;
  if (!active) return;
  const pulse = 1 + Math.sin(performance.now() * 0.006) * 0.07;
  halo.scale.setScalar(pulse);
  halo.rotation.y += dt * 1.6;
}

function updateLearning(dt) {
  if (state.quizActive) return;
  if (state.learningCooldown > 0) state.learningCooldown = Math.max(0, state.learningCooldown - dt);
  state.learningElapsed += dt;
  const rate = state.waveActive ? LEARNING_RULES.waveGain : LEARNING_RULES.passiveGain;
  if (rate > 0) awardLearningEnergy(dt * rate, false);
  const energyReady = state.learningEnergy >= LEARNING_RULES.maxEnergy;
  const timeReady = state.learningElapsed >= LEARNING_RULES.guaranteeSeconds;
  const enoughWaves = state.waveCompletionsSinceQuiz >= LEARNING_RULES.waveCompletionsRequired;
  const towerMenuOpen = ui.towerMenu && !ui.towerMenu.hidden;
  if (energyReady && !state.waveActive && enoughWaves) state.learningPending = true;
  if (timeReady && !state.waveActive && enoughWaves) {
    state.learningPending = true;
  }
  if (state.waveActive || !state.learningPending || state.learningCooldown > 0 || state.playerAction || towerMenuOpen) {
    return;
  }
  if (state.prep <= 27) {
    openQuiz("energy");
  }
}

function awardLearningEnergy(amount, pulse = true) {
  state.learningEnergy = THREE.MathUtils.clamp(state.learningEnergy + amount, 0, LEARNING_RULES.maxEnergy);
  if (pulse && state.learningEnergy >= LEARNING_RULES.maxEnergy && !state.quizActive) {
    setStatus("学习能量准备好了，打完这一波后练习。");
  }
}

function resetLearningMeter(value = 0) {
  state.learningEnergy = THREE.MathUtils.clamp(value, 0, LEARNING_RULES.maxEnergy);
  state.learningElapsed = 0;
  state.learningPending = false;
}

function spawnSprite(position) {
  const group = new THREE.Group();
  const glow = new THREE.PointLight(0xa5ffca, 0.8, 3.5);
  glow.position.y = 0.78;
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12), material.leaf);
  body.position.y = 0.5;
  body.scale.set(0.9, 1.15, 0.86);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), mat(0xffd8a8, { roughness: 0.7 }));
  head.position.y = 0.86;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.3, 7), material.gold);
  cap.position.y = 1.12;
  const wingA = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), material.wing);
  const wingB = wingA.clone();
  wingA.position.set(-0.22, 0.66, -0.08);
  wingB.position.set(0.22, 0.66, -0.08);
  wingA.scale.set(0.55, 1.2, 0.12);
  wingB.scale.copy(wingA.scale);
  wingA.rotation.z = -0.45;
  wingB.rotation.z = 0.45;
  addCuteFace(group, 0.88, 0.18, 0.42, { smile: false });
  group.add(glow, body, head, cap, wingA, wingB);
  group.position.copy(position);
  applyCartoonOutlines(group, 0.035);
  group.traverse(enableShadows);
  root.add(group);
  state.sprites.push({ kind: "sprite", group, hp: 55, maxHp: 55, cooldown: 0, alive: true });
  addBurst(position, 0x98e16f);
}

function createEnemyMesh(type, stats) {
  const group = new THREE.Group();
  if (type === "bat") {
    const bodyMat = toonMat(0x9a77ff);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.36, 18, 12), bodyMat);
    body.position.y = 0.7;
    body.scale.set(0.92, 0.82, 0.82);
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), toonMat(0xd4c3ff));
    belly.position.set(0, 0.6, 0.3);
    belly.scale.set(1.05, 0.72, 0.35);
    const earA = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.26, 8), bodyMat);
    const earB = earA.clone();
    earA.position.set(-0.18, 1.0, 0);
    earB.position.set(0.18, 1.0, 0);
    earA.rotation.z = 0.3;
    earB.rotation.z = -0.3;
    const wingMat = toonMat(0x5c44b4);
    const wingA = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8), wingMat);
    const wingB = wingA.clone();
    wingA.position.set(-0.42, 0.67, -0.02);
    wingB.position.set(0.42, 0.67, -0.02);
    wingA.scale.set(1.45, 0.22, 0.82);
    wingB.scale.copy(wingA.scale);
    wingA.rotation.z = 0.42;
    wingB.rotation.z = -0.42;
    addCuteFace(group, 0.74, 0.31, 0.48, { smile: true, fang: true });
    group.add(body, belly, earA, earB, wingA, wingB);
  } else if (type === "turtle") {
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.58, 18, 12), toonMat(0x3f8b59));
    shell.scale.y = 0.55;
    shell.position.y = 0.26;
    const shellSpot = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 8), toonMat(0x78c66a));
    shellSpot.position.set(0, 0.36, 0.02);
    shellSpot.scale.set(0.9, 0.16, 0.7);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 14, 10), toonMat(0x91d46b));
    head.position.set(0, 0.34, 0.54);
    for (const [x, z] of [[-0.34, 0.25], [0.34, 0.25], [-0.3, -0.22], [0.3, -0.22]]) {
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), toonMat(0x91d46b));
      foot.position.set(x, 0.16, z);
      foot.scale.set(1.15, 0.5, 1);
      group.add(foot);
    }
    addCuteFace(group, 0.38, 0.75, 0.42, { smile: true });
    group.add(shell, shellSpot, head);
  } else if (type === "boss") {
    const moon = new THREE.Mesh(new THREE.SphereGeometry(0.82, 24, 18), toonMat(stats.color));
    moon.scale.set(1, 0.86, 1);
    moon.position.y = 0.48;
    const crater = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), toonMat(0x9ea2b5));
    crater.position.set(0.22, 0.65, 0.58);
    const craterB = crater.clone();
    craterB.position.set(-0.28, 0.42, 0.58);
    craterB.scale.setScalar(0.72);
    addCuteFace(group, 0.55, 0.74, 0.82, { smile: false, sleepy: true });
    group.add(moon, crater, craterB);
  } else {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.48, 20, 14), toonMat(stats.color));
    body.scale.set(type === "shield" ? 1.02 : 1.08, type === "shield" ? 1.1 : 0.92, 1.0);
    body.position.y = 0.44;
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 8), toonMat(0xa8f0b8));
    belly.position.set(0, 0.34, 0.38);
    belly.scale.set(1, 0.58, 0.32);
    addCuteFace(group, 0.54, 0.46, 0.58, { smile: true });
    group.add(body, belly);
    if (type === "shield") {
      const shield = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 10), material.shield);
      shield.position.set(0, 0.44, 0.52);
      shield.scale.set(1.08, 1.0, 0.18);
      const shieldStar = createStarMesh(0.16, 0.07, 0.025, 0xeaffff);
      shieldStar.position.set(0, 0.44, 0.64);
      group.add(shield, shieldStar);
    } else {
      const antennaA = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), material.leaf);
      const antennaB = antennaA.clone();
      antennaA.position.set(-0.2, 0.9, 0.05);
      antennaB.position.set(0.2, 0.9, 0.05);
      group.add(antennaA, antennaB);
    }
  }

  applyCartoonOutlines(group, type === "bat" ? 0.034 : 0.042);

  const hpBack = box(1.12, 0.07, 0.05, material.dark);
  const hpBar = box(1.12, 0.07, 0.055, material.hp);
  hpBack.userData.noOutline = true;
  hpBar.userData.noOutline = true;
  hpBack.position.set(0, 1.18, 0);
  hpBar.position.set(0, 1.19, 0.01);
  hpBack.visible = false;
  hpBar.visible = false;
  group.add(hpBack, hpBar);
  if (stats.shield > 0) {
    const shieldBar = box(1.12, 0.055, 0.055, material.shield);
    shieldBar.position.set(0, 1.31, 0.01);
    shieldBar.userData.noOutline = true;
    shieldBar.visible = false;
    group.add(shieldBar);
    group.userData.shieldBar = shieldBar;
  }
  group.userData.hpBack = hpBack;
  group.userData.hpBar = hpBar;
  group.traverse(enableShadows);
  return group;
}

function updateEnemyBars(enemy) {
  const hpRatio = THREE.MathUtils.clamp(enemy.hp / enemy.maxHp, 0, 1);
  const showBars = performance.now() < enemy.barVisibleUntil;
  const hpBack = enemy.group.userData.hpBack;
  if (hpBack) hpBack.visible = showBars;
  const hpBar = enemy.group.userData.hpBar;
  if (hpBar) {
    hpBar.scale.x = hpRatio;
    hpBar.position.x = -0.56 * (1 - hpRatio);
    hpBar.visible = showBars;
  }
  const shieldBar = enemy.group.userData.shieldBar;
  if (shieldBar && enemy.maxShield > 0) {
    const shieldRatio = THREE.MathUtils.clamp(enemy.shield / enemy.maxShield, 0, 1);
    shieldBar.scale.x = shieldRatio;
    shieldBar.position.x = -0.56 * (1 - shieldRatio);
    shieldBar.visible = showBars && shieldRatio > 0;
  }
}

function updatePlayer(dt) {
  if (state.playerAction) {
    updatePlayerAction(dt);
    return;
  }

  const input = new THREE.Vector2();
  if (state.keys.has("w") || state.keys.has("arrowup")) input.y += 1;
  if (state.keys.has("s") || state.keys.has("arrowdown")) input.y -= 1;
  if (state.keys.has("a") || state.keys.has("arrowleft")) input.x -= 1;
  if (state.keys.has("d") || state.keys.has("arrowright")) input.x += 1;
  const joystickMoving = state.joystick.power > 0.001;
  if (joystickMoving) input.add(state.joystick.vector);
  if (input.lengthSq() > 0) {
    const speedPower = joystickMoving ? Math.max(0.4, state.joystick.power) : 1;
    input.normalize();
    const forward = new THREE.Vector3(-Math.sin(state.cameraYaw), 0, -Math.cos(state.cameraYaw));
    const right = new THREE.Vector3(Math.cos(state.cameraYaw), 0, -Math.sin(state.cameraYaw));
    const direction = right.multiplyScalar(input.x).addScaledVector(forward, input.y).normalize();
    state.playerTarget = null;
    if (joystickMoving) {
      state.cameraMode = "follow";
      state.cameraPan.multiplyScalar(Math.pow(0.04, dt));
    }
    moveCaptain(direction, dt * 5.1 * speedPower);
    player.rotation.y = Math.atan2(direction.x, direction.z);
    animateCaptainWalk();
  } else if (state.playerTarget) {
    moveCaptainToward(state.playerTarget, dt * 4.7);
  }

  if (
    state.pendingBuild &&
    player.position.distanceTo(state.pendingBuild.workPosition || state.pendingBuild.position) <= BUILD_RULES.captainWork
  ) {
    startPlayerAction({ type: "build", ...state.pendingBuild });
    state.pendingBuild = null;
  }
}

function updatePlayerAction(dt) {
  const action = state.playerAction;
  action.elapsed += dt;
  const wobble = Math.sin(action.elapsed * 24) * 0.34;
  player.rotation.y += wobble * dt;
  const baton = player.children[player.children.length - 1];
  if (baton) baton.rotation.z = -0.42 + Math.sin(action.elapsed * 18) * 0.28;
  if (action.elapsed < action.duration) return;
  state.playerAction = null;
  if (baton) baton.rotation.z = 0;
  completePlayerAction(action);
}

function startPlayerAction(action) {
  state.playerTarget = null;
  state.playerAction = {
    duration: BUILD_RULES.buildSeconds,
    elapsed: 0,
    ...action,
  };
  addBurst(action.position || action.tower?.group.position || player.position, 0xffdf75);
  setStatus("队长正在挥星星棒。");
}

function completePlayerAction(action) {
  if (action.type === "build") {
    placeTowerAt(action.position, action.preset, action.color);
    return;
  }
  if (action.type === "upgrade") performTowerUpgrade(action.tower);
  if (action.type === "sell") performTowerSell(action.tower);
}

function moveCaptainToward(targetPosition, amount) {
  const delta = targetPosition.clone().sub(player.position);
  delta.y = 0;
  const distance = delta.length();
  if (distance < 0.12) {
    state.playerTarget = null;
    return;
  }
  moveCaptain(delta.normalize(), Math.min(amount, distance));
  player.rotation.y = Math.atan2(delta.x, delta.z);
  animateCaptainWalk();
}

function moveCaptain(direction, amount) {
  const steered = direction.clone();
  addAvoidance(steered, core.position, 1.8, 1.4);
  for (const tower of state.towers) addAvoidance(steered, tower.group.position, 1.15, 0.95);
  for (const enemy of state.enemies) addAvoidance(steered, enemy.group.position, 1.05, 0.9);
  if (steered.lengthSq() < 0.001) return;
  steered.normalize();
  const next = player.position.clone().addScaledVector(steered, amount);
  if (!isOnWalkableIsland(next)) {
    const tangent = new THREE.Vector3(-steered.z, 0, steered.x).normalize();
    const sideA = player.position.clone().addScaledVector(tangent, amount);
    const sideB = player.position.clone().addScaledVector(tangent, -amount);
    if (isOnWalkableIsland(sideA)) next.copy(sideA);
    else if (isOnWalkableIsland(sideB)) next.copy(sideB);
    else next.copy(clampToWalkableIsland(next));
  }
  player.position.copy(next);
}

function addAvoidance(direction, obstaclePosition, radius, strength) {
  const away = player.position.clone().sub(obstaclePosition);
  away.y = 0;
  const distance = away.length();
  if (distance <= 0.001 || distance >= radius) return;
  direction.addScaledVector(away.normalize(), (1 - distance / radius) * strength);
}

function animateCaptainWalk() {
  player.children.forEach((child, index) => {
    if (index < 2) child.rotation.x = Math.sin(performance.now() * 0.012 + index) * 0.18;
  });
}

function captainAttack() {
  if (state.playerAttackCooldown > 0) return;
  const target = nearestEnemy(player.position, 4.4);
  if (!target) {
    setStatus("附近没有怪物，队长暂时打不到。");
    return;
  }
  state.playerAttackCooldown = 0.55;
  damageEnemy(target, 20 + state.level * 2, "captain");
  addBurst(target.group.position, 0xf6c33f);
}

function castLightning() {
  if (state.lightningCooldown > 0) {
    setStatus(`闪电还在充能：${state.lightningCooldown.toFixed(1)} 秒。`);
    return;
  }
  state.lightningCooldown = 12;
  const center = state.pointerWorld.clone();
  let hits = 0;
  for (const enemy of state.enemies) {
    if (Math.abs(enemy.group.position.x - center.x) <= 1.5 && Math.abs(enemy.group.position.z - center.z) <= 1.5) {
      damageEnemy(enemy, 50, "lightning");
      hits += 1;
    }
  }
  for (const candy of state.candies) {
    if (Math.abs(candy.group.position.x - center.x) <= 1.5 && Math.abs(candy.group.position.z - center.z) <= 1.5) {
      damageCandy(candy, 50);
      hits += 1;
    }
  }
  addLightningEffect(center);
  setStatus(`闪电打中 3 x 3 区域，命中 ${hits} 个目标。`);
  playSfx("zap");
}

function updateEffects(dt) {
  for (const effect of state.effects) {
    effect.life -= dt;
    effect.group.scale.multiplyScalar(1 + dt * 1.8);
    effect.group.traverse((child) => {
      if (child.material?.transparent) child.material.opacity = Math.max(0, effect.life / effect.maxLife);
    });
    if (effect.life <= 0) {
      root.remove(effect.group);
      effect.alive = false;
    }
  }
  state.effects = state.effects.filter((effect) => effect.alive);
}

function addLightningEffect(position) {
  const group = new THREE.Group();
  group.position.copy(position);
  const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 4.2, 7), mat(0xf6ec68, { emissive: 0xf6ec68, emissiveIntensity: 0.65, transparent: true, opacity: 0.9 }));
  bolt.position.y = 2.1;
  const zone = new THREE.Mesh(new THREE.BoxGeometry(3, 0.04, 3), mat(0x56dcff, { emissive: 0x56dcff, emissiveIntensity: 0.3, transparent: true, opacity: 0.28 }));
  zone.position.y = 0.08;
  group.add(bolt, zone);
  root.add(group);
  state.effects.push({ group, life: 0.42, maxLife: 0.42, alive: true });
}

function addBurst(position, color) {
  const group = new THREE.Group();
  group.position.copy(position);
  for (let i = 0; i < 8; i += 1) {
    const shard = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.3), mat(color, { emissive: color, emissiveIntensity: 0.2, transparent: true, opacity: 0.82 }));
    shard.position.y = 0.7;
    shard.rotation.set(rand(0, Math.PI), (i / 8) * Math.PI * 2, rand(0, Math.PI));
    group.add(shard);
  }
  root.add(group);
  state.effects.push({ group, life: 0.35, maxLife: 0.35, alive: true });
}

function updateCamera(dt) {
  const baseTarget = state.cameraMode === "follow" ? player.position : new THREE.Vector3(0, 0, 0);
  const target = baseTarget.clone().add(state.cameraPan);
  const pitch = state.cameraMode === "overview" ? Math.max(state.cameraPitch, 0.9) : state.cameraPitch;
  const distance = state.cameraMode === "overview" ? Math.max(state.cameraDistance, CAMERA_DISTANCE.overview) : state.cameraDistance;
  const horizontal = Math.cos(pitch) * distance;
  const desired = new THREE.Vector3(
    target.x + Math.sin(state.cameraYaw) * horizontal,
    Math.sin(pitch) * distance,
    target.z + Math.cos(state.cameraYaw) * horizontal,
  );
  cameraTarget.lerp(target, 1 - Math.pow(0.001, dt));
  camera.position.lerp(desired, 1 - Math.pow(0.002, dt));
  camera.lookAt(cameraTarget.x, 0.75, cameraTarget.z);
}

function updateUi() {
  ui.level.textContent = String(state.level);
  ui.coreHp.textContent = String(Math.ceil(state.coreHp));
  ui.stars.textContent = String(Math.round(state.stars));
  ui.learningEnergy.textContent = `${Math.round(state.learningEnergy)}%`;
  ui.timer.textContent = String(Math.ceil(state.timer));
  ui.sprites.textContent = String(state.sprites.length);
  ui.mpm.textContent = state.waveActive ? String(Math.round(60 / getSpawnInterval())) : "0";
  if (state.waveActive) {
    ui.waveWarn.textContent = `第 ${state.level} 关 · 已出现 ${state.spawned}/${state.waveQuota}`;
  } else {
    ui.waveWarn.textContent = `${Math.ceil(state.prep)} 秒后怪物来袭`;
  }
  if (state.lightningCooldown > 0) {
    ui.lightningBtn.textContent = Math.ceil(state.lightningCooldown);
    ui.lightningBtn.classList.add("is-cooling");
  } else {
    ui.lightningBtn.textContent = "⚡";
    ui.lightningBtn.classList.remove("is-cooling");
  }
}

function updateFps(dt) {
  state.frameCount += 1;
  state.fpsTime += dt;
  if (state.fpsTime >= 0.5) {
    state.fps = Math.round(state.frameCount / state.fpsTime);
    state.frameCount = 0;
    state.fpsTime = 0;
    ui.fps.textContent = String(state.fps);
  }
}

async function toggleAudio() {
  if (state.audio.enabled) {
    if (state.audio.ctx?.state === "running") playSfx("off", true);
    state.audio.enabled = false;
    setStatus("音乐和音效已关闭。");
    updateAudioButton();
    return;
  }

  if (!ensureAudio()) {
    setStatus("这个浏览器暂时不能播放声音。");
    return;
  }
  if (state.audio.ctx.state === "suspended") await state.audio.ctx.resume();
  state.audio.enabled = true;
  state.audio.nextNoteTime = state.audio.ctx.currentTime + 0.02;
  playSfx("on", true);
  setStatus("音乐和音效已打开。");
  updateAudioButton();
}

async function activateAudioFromGesture() {
  if (!state.audio.enabled) return;
  if (!ensureAudio()) return;
  if (state.audio.ctx.state === "suspended") {
    try {
      await state.audio.ctx.resume();
    } catch {
      return;
    }
  }
  if (state.audio.ctx.state === "running" && state.audio.nextNoteTime <= state.audio.ctx.currentTime) {
    state.audio.nextNoteTime = state.audio.ctx.currentTime + 0.02;
  }
}

function ensureAudio() {
  if (state.audio.ctx) return true;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return false;
  const ctx = new AudioContextCtor();
  const master = ctx.createGain();
  const music = ctx.createGain();
  const sfx = ctx.createGain();
  master.gain.value = 0.72;
  music.gain.value = 0.5;
  sfx.gain.value = 0.95;
  music.connect(master);
  sfx.connect(master);
  master.connect(ctx.destination);
  state.audio.ctx = ctx;
  state.audio.master = master;
  state.audio.music = music;
  state.audio.sfx = sfx;
  return true;
}

function updateAudio() {
  const audio = state.audio;
  if (!audio.enabled || !audio.ctx || audio.ctx.state !== "running") return;
  const horizon = audio.ctx.currentTime + 0.55;
  while (audio.nextNoteTime < horizon) {
    scheduleMusicNote(audio.nextNoteTime, audio.noteIndex);
    audio.nextNoteTime += 0.42;
    audio.noteIndex += 1;
  }
}

function scheduleMusicNote(time, index) {
  const audio = state.audio;
  const ctx = audio.ctx;
  const note = MUSIC_NOTES[index % MUSIC_NOTES.length];
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(note, time);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.12, time + 0.035);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.34);
  osc.connect(gain);
  gain.connect(audio.music);
  osc.start(time);
  osc.stop(time + 0.38);

  if (index % 4 === 0) {
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.type = "sine";
    bass.frequency.setValueAtTime(MUSIC_BASS[Math.floor(index / 4) % MUSIC_BASS.length], time);
    bassGain.gain.setValueAtTime(0.0001, time);
    bassGain.gain.exponentialRampToValueAtTime(0.09, time + 0.04);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.5);
    bass.connect(bassGain);
    bassGain.connect(audio.music);
    bass.start(time);
    bass.stop(time + 0.54);
  }
}

function playSfx(kind, force = false) {
  const audio = state.audio;
  if (!audio.ctx || (!force && !audio.enabled) || audio.ctx.state !== "running") return;
  const ctx = audio.ctx;
  const presets = {
    on: [659, 0.16, "triangle", 0.16],
    off: [294, 0.12, "sine", 0.11],
    build: [523, 0.18, "triangle", 0.15],
    wave: [196, 0.26, "sawtooth", 0.11],
    sparkle: [880, 0.2, "triangle", 0.16],
    pop: [330, 0.09, "sine", 0.09],
    zap: [988, 0.2, "square", 0.12],
    right: [784, 0.12, "triangle", 0.14],
    wrong: [185, 0.16, "sawtooth", 0.09],
    upgrade: [698, 0.18, "triangle", 0.16],
  };
  const [freq, duration, type, volume] = presets[kind] || presets.pop;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (kind === "zap") osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + duration);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audio.sfx);
  osc.start();
  osc.stop(ctx.currentTime + duration + 0.03);
}

function updateAudioButton() {
  ui.audioBtn.textContent = state.audio.enabled ? "♫" : "♪";
  ui.audioBtn.title = state.audio.enabled ? "关闭音乐和音效" : "打开音乐和音效";
  ui.audioBtn.classList.toggle("is-on", state.audio.enabled);
  ui.audioBtn.setAttribute("aria-pressed", String(state.audio.enabled));
}

function beginJoystick(event) {
  event.preventDefault();
  event.stopPropagation();
  state.joystick.active = true;
  state.joystick.pointerId = event.pointerId;
  ui.joystick?.classList.add("is-active");
  ui.joystick?.setPointerCapture?.(event.pointerId);
  updateJoystick(event);
}

function updateJoystick(event) {
  if (!state.joystick.active || state.joystick.pointerId !== event.pointerId || !ui.joystick) return;
  event.preventDefault();
  event.stopPropagation();
  const rect = ui.joystick.getBoundingClientRect();
  const radius = Math.max(32, Math.min(rect.width, rect.height) * 0.34);
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const dx = event.clientX - centerX;
  const dy = event.clientY - centerY;
  const distance = Math.hypot(dx, dy);
  const clamped = Math.min(distance, radius);
  const deadzone = radius * 0.16;
  let stickX = 0;
  let stickY = 0;
  let power = 0;
  if (distance > deadzone) {
    stickX = (dx / distance) * clamped;
    stickY = (dy / distance) * clamped;
    power = THREE.MathUtils.clamp((clamped - deadzone) / (radius - deadzone), 0, 1);
    state.joystick.vector.set((dx / distance) * power, (-dy / distance) * power);
  } else {
    state.joystick.vector.set(0, 0);
  }
  state.joystick.power = power;
  ui.joystick.style.setProperty("--stick-x", `${stickX.toFixed(1)}px`);
  ui.joystick.style.setProperty("--stick-y", `${stickY.toFixed(1)}px`);
}

function endJoystick(event) {
  if (event && state.joystick.pointerId !== event.pointerId) return;
  event?.preventDefault();
  event?.stopPropagation();
  if (event?.pointerId != null) ui.joystick?.releasePointerCapture?.(event.pointerId);
  state.joystick.active = false;
  state.joystick.pointerId = null;
  state.joystick.vector.set(0, 0);
  state.joystick.power = 0;
  ui.joystick?.classList.remove("is-active");
  ui.joystick?.style.setProperty("--stick-x", "0px");
  ui.joystick?.style.setProperty("--stick-y", "0px");
}

function updatePointer(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObject(pickPlane)[0];
  if (!hit) return;
  const raw = hit.point.clone().setY(0);
  const snapped = snap(raw);
  state.pointerWorld.copy(snapped);
  ghost.position.copy(state.pointerWorld);
  state.pointerReady = true;
  if (state.mode === "place" && hasBuildSelection()) {
    rebuildGhost();
  } else {
    ghost.visible = false;
  }
}

function beginCanvasPointer(event) {
  updatePointer(event);
  if (event.pointerType === "touch") {
    state.touchPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (state.touchPointers.size >= 2) {
      beginPinchGesture();
      state.cameraDrag.active = false;
      state.cameraDrag.moved = true;
      canvas.setPointerCapture?.(event.pointerId);
      return;
    }
  }
  state.cameraDrag.active = true;
  state.cameraDrag.pointerId = event.pointerId;
  state.cameraDrag.button = event.button;
  state.cameraDrag.lastX = event.clientX;
  state.cameraDrag.lastY = event.clientY;
  state.cameraDrag.startX = event.clientX;
  state.cameraDrag.startY = event.clientY;
  state.cameraDrag.mode = getCameraDragMode(event);
  state.cameraDrag.moved = false;
  canvas.setPointerCapture?.(event.pointerId);
}

function dragCanvasPointer(event) {
  if (event.pointerType === "touch" && state.touchPointers.has(event.pointerId)) {
    state.touchPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (state.touchPointers.size >= 2) {
      updatePinchGesture();
      return;
    }
  }
  updatePointer(event);
  if (!state.cameraDrag.active || state.cameraDrag.pointerId !== event.pointerId) return;
  const dx = event.clientX - state.cameraDrag.lastX;
  const dy = event.clientY - state.cameraDrag.lastY;
  const totalDx = event.clientX - state.cameraDrag.startX;
  const totalDy = event.clientY - state.cameraDrag.startY;
  if (Math.hypot(totalDx, totalDy) > 5) state.cameraDrag.moved = true;
  if (!state.cameraDrag.moved) return;

  if (state.cameraDrag.mode === "orbit") {
    orbitCamera(dx, dy);
  } else {
    panCamera(dx, dy);
  }
  state.cameraMode = "free";
  state.cameraDrag.lastX = event.clientX;
  state.cameraDrag.lastY = event.clientY;
}

function finishCanvasPointer(event) {
  const wasPinch = event.pointerType === "touch" && (state.pinch.active || state.pinch.moved || state.touchPointers.size > 1);
  if (event.pointerType === "touch") {
    state.touchPointers.delete(event.pointerId);
    if (state.touchPointers.size < 2) state.pinch.active = false;
    if (state.touchPointers.size === 0 && wasPinch) state.pinch.moved = false;
  }
  updatePointer(event);
  const wasClick =
    state.cameraDrag.active &&
    state.cameraDrag.pointerId === event.pointerId &&
    !state.cameraDrag.moved &&
    state.cameraDrag.button === 0;
  cancelCanvasPointer(event);
  if (wasPinch) return;
  if (!wasClick) return;
  if (handleTowerTap()) return;
  if (revealEnemyAtPointer()) return;
  if (state.mode === "place") {
    if (hasBuildSelection()) {
      const preview = getBuildPreview(state.pointerWorld);
      if (preview.canBuild) requestBuildAt(preview.position);
      else setStatus(preview.reason);
    } else {
      ghost.visible = false;
      if (isOnWalkableIsland(state.pointerWorld)) moveCaptainTo(state.pointerWorld);
      else setStatus("队长不能走进深海；沙滩和浅海可以走。");
    }
    return;
  }
  if (state.mode === "inspect") inspectPointer();
  if (state.mode === "route") setStatus("没有固定道路，怪物会从随机岸边登岛。");
  if (state.mode === "squad") setStatus("小精灵会跟着队长，优先打附近怪物。");
  if (isOnWalkableIsland(state.pointerWorld)) moveCaptainTo(state.pointerWorld);
}

function cancelCanvasPointer(event) {
  if (event?.pointerId != null) canvas.releasePointerCapture?.(event.pointerId);
  if (event?.pointerType === "touch" && event.pointerId != null) {
    state.touchPointers.delete(event.pointerId);
    if (state.touchPointers.size < 2) state.pinch.active = false;
    if (state.touchPointers.size === 0) state.pinch.moved = false;
  }
  state.cameraDrag.active = false;
  state.cameraDrag.pointerId = null;
  state.cameraDrag.moved = false;
}

function beginPinchGesture() {
  const gesture = getPinchGesture();
  if (!gesture) return;
  state.pinch.active = true;
  state.pinch.moved = true;
  state.pinch.distance = gesture.distance;
  state.pinch.angle = gesture.angle;
  state.pinch.centerX = gesture.centerX;
  state.pinch.centerY = gesture.centerY;
}

function updatePinchGesture() {
  const gesture = getPinchGesture();
  if (!gesture) return;
  if (!state.pinch.active) beginPinchGesture();
  const dx = gesture.centerX - state.pinch.centerX;
  const dy = gesture.centerY - state.pinch.centerY;
  if (Math.abs(dx) + Math.abs(dy) > 0.2) panCamera(dx, dy);
  if (state.pinch.distance > 12 && gesture.distance > 12) {
    const ratio = THREE.MathUtils.clamp(gesture.distance / state.pinch.distance, 0.82, 1.22);
    state.cameraDistance = THREE.MathUtils.clamp(state.cameraDistance / ratio, CAMERA_DISTANCE.min, CAMERA_DISTANCE.max);
  }
  const twist = shortestAngleDelta(gesture.angle, state.pinch.angle);
  if (Math.abs(twist) > 0.002) {
    state.cameraYaw = THREE.MathUtils.euclideanModulo(state.cameraYaw - twist, Math.PI * 2);
  }
  state.cameraMode = "free";
  state.pinch.moved = true;
  state.pinch.distance = gesture.distance;
  state.pinch.angle = gesture.angle;
  state.pinch.centerX = gesture.centerX;
  state.pinch.centerY = gesture.centerY;
}

function getPinchGesture() {
  const points = [...state.touchPointers.values()];
  if (points.length < 2) return null;
  const [a, b] = points;
  return {
    distance: Math.hypot(a.x - b.x, a.y - b.y),
    angle: Math.atan2(b.y - a.y, b.x - a.x),
    centerX: (a.x + b.x) / 2,
    centerY: (a.y + b.y) / 2,
  };
}

function getCameraDragMode(event) {
  if (event.button === 2 || event.shiftKey) return "orbit";
  if (event.altKey) return "pan";
  return "pan";
}

function orbitCamera(dx, dy) {
  state.cameraYaw = THREE.MathUtils.euclideanModulo(state.cameraYaw - dx * 0.0085, Math.PI * 2);
  state.cameraPitch = THREE.MathUtils.clamp(state.cameraPitch + dy * 0.0045, 0.35, 1.18);
}

function shortestAngleDelta(next, previous) {
  return Math.atan2(Math.sin(next - previous), Math.cos(next - previous));
}

function panCamera(dx, dy) {
  const right = new THREE.Vector3(Math.cos(state.cameraYaw), 0, -Math.sin(state.cameraYaw));
  const forward = new THREE.Vector3(Math.sin(state.cameraYaw), 0, Math.cos(state.cameraYaw));
  const scale = state.cameraDistance * 0.0032;
  state.cameraPan.addScaledVector(right, -dx * scale);
  state.cameraPan.addScaledVector(forward, dy * scale);
  state.cameraPan.x = THREE.MathUtils.clamp(state.cameraPan.x, -9, 9);
  state.cameraPan.z = THREE.MathUtils.clamp(state.cameraPan.z, -8, 8);
}

function zoomCamera(event) {
  event.preventDefault();
  state.cameraMode = "free";
  const factor = event.deltaY > 0 ? 1.08 : 0.92;
  state.cameraDistance = THREE.MathUtils.clamp(state.cameraDistance * factor, CAMERA_DISTANCE.min, CAMERA_DISTANCE.max);
}

function inspectPointer() {
  const candidates = [...state.towers, ...state.enemies, ...state.candies, ...state.sprites];
  let best = null;
  let bestDist = 1.5;
  for (const item of candidates) {
    const dist = item.group.position.distanceTo(state.pointerWorld);
    if (dist < bestDist) {
      best = item;
      bestDist = dist;
    }
  }
  if (!best) {
    setStatus("这里没有可以查看的东西。");
    return;
  }
  if (best.kind === "tower") setStatus(`${TOWER_DEFS[best.type].name} · ${best.level} 级`);
  if (best.kind === "enemy") {
    revealEnemyBars(best);
    setStatus(`怪物 · 血量 ${Math.ceil(best.hp)} · 护盾 ${Math.ceil(best.shield)}`);
  }
  if (best.kind === "candy") setStatus(`糖果壳 · 血量 ${Math.ceil(best.hp)}`);
  if (best.kind === "sprite") setStatus(`小精灵 · 血量 ${Math.ceil(best.hp)}`);
}

function handleTowerTap() {
  const tower = nearestTower(state.pointerWorld, BUILD_RULES.towerTap);
  if (!tower) {
    hideTowerMenu();
    return false;
  }
  state.selectedTower = tower;
  const distance = player.position.distanceTo(tower.group.position);
  if (distance > BUILD_RULES.towerAction) {
    moveCaptainTo(getCaptainWorkSpot(tower.group.position));
    setStatus("队长先靠近这个炮台，到了再点它升级或回收。");
    hideTowerMenu();
    return true;
  }
  showTowerMenu(tower);
  return true;
}

function showTowerMenu(tower) {
  const def = TOWER_DEFS[tower.type];
  state.selectedTower = tower;
  ui.towerMenu.hidden = false;
  ui.towerMenuUpgrade.textContent = tower.level >= 5 ? "满级" : "升级";
  ui.towerMenuUpgrade.title = tower.level >= 5 ? `${def.name} 已满级` : `升级 ${55 + tower.level * 45} 星币`;
  ui.towerMenuSell.title = `回收 ${getTowerRefund(tower)} 星币`;
  ui.towerMenuUpgrade.disabled = tower.level >= 5;
  ui.towerMenuSell.disabled = false;
  positionTowerMenu(tower);
  setStatus(`${def.name}：可以升级或低价回收。`);
}

function hideTowerMenu() {
  if (ui.towerMenu) ui.towerMenu.hidden = true;
  state.selectedTower = null;
}

function updateTowerMenuPosition() {
  if (!state.selectedTower || ui.towerMenu.hidden) return;
  positionTowerMenu(state.selectedTower);
}

function positionTowerMenu(tower) {
  if (!tower?.group?.parent) return;
  const anchor = tower.group.position.clone().add(new THREE.Vector3(0, 2.05, 0));
  anchor.project(camera);
  const x = (anchor.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-anchor.y * 0.5 + 0.5) * window.innerHeight;
  const rect = ui.towerMenu.getBoundingClientRect();
  const width = rect.width || 164;
  const height = rect.height || 56;
  const preferRight = x < window.innerWidth - width - 34;
  const nextX = preferRight ? x + 18 : x - width - 18;
  const nextY = y - height * 0.55;
  const clampedX = THREE.MathUtils.clamp(nextX, 10, window.innerWidth - width - 10);
  const clampedY = THREE.MathUtils.clamp(nextY, 82, window.innerHeight - height - 88);
  ui.towerMenu.style.setProperty("--menu-x", `${clampedX}px`);
  ui.towerMenu.style.setProperty("--menu-y", `${clampedY}px`);
}

function moveCaptainTo(position) {
  if (!isOnWalkableIsland(position)) {
    setStatus("队长不能走到深海，点草地、沙滩或浅海。");
    return false;
  }
  hideTowerMenu();
  state.playerAction = null;
  state.pendingBuild = null;
  state.playerTarget = position.clone().setY(0);
  setStatus("队长出发。");
  return true;
}

function revealEnemyAtPointer() {
  const enemy = nearestEnemyAtPointer(1.25);
  if (!enemy) return false;
  revealEnemyBars(enemy);
  setStatus(`怪物 · 血量 ${Math.ceil(enemy.hp)} · 护盾 ${Math.ceil(enemy.shield)}`);
  return true;
}

function nearestEnemyAtPointer(maxDistance) {
  let best = null;
  let bestDist = maxDistance;
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    const dist = enemy.group.position.distanceTo(state.pointerWorld);
    if (dist < bestDist) {
      best = enemy;
      bestDist = dist;
    }
  }
  return best;
}

function revealEnemyBars(enemy, seconds = 3.5) {
  enemy.barVisibleUntil = performance.now() + seconds * 1000;
  updateEnemyBars(enemy);
}

function rotateGhost() {
  state.rotation += Math.PI / 2;
  ghost.rotation.y = state.rotation;
}

function upgradeNearestTower() {
  queueTowerUpgrade(state.nearbyTower || nearestTower(player.position, 3.6));
}

function sellNearestTower() {
  queueTowerSell(state.nearbyTower || nearestTower(player.position, 3.6));
}

function queueTowerUpgrade(tower) {
  if (!tower) {
    setStatus("让队长靠近炮台，再点升级。");
    return;
  }
  if (player.position.distanceTo(tower.group.position) > BUILD_RULES.towerAction) {
    moveCaptainTo(getCaptainWorkSpot(tower.group.position));
    setStatus("队长先靠近炮台，到了再点升级。");
    return;
  }
  if (tower.level >= 5) {
    setStatus("这个炮台已经 5 级了。");
    return;
  }
  const cost = 55 + tower.level * 45;
  if (state.stars < cost) {
    setStatus(`升级需要 ${cost} 星币。`);
    return;
  }
  hideTowerMenu();
  startPlayerAction({ type: "upgrade", tower, position: tower.group.position.clone() });
}

function performTowerUpgrade(tower) {
  if (!tower || !state.towers.includes(tower)) return;
  if (tower.level >= 5) return;
  const cost = 55 + tower.level * 45;
  if (state.stars < cost) {
    setStatus(`升级需要 ${cost} 星币。`);
    return;
  }
  tower.level += 1;
  state.stars -= cost;
  tower.group.scale.setScalar(1 + (tower.level - 1) * 0.09);
  addBurst(tower.group.position, TOWER_DEFS[tower.type].projectile);
  awardLearningEnergy(7);
  setStatus(`${TOWER_DEFS[tower.type].name} 升到 ${tower.level} 级！`);
  playSfx("upgrade");
}

function queueTowerSell(tower) {
  if (!tower) {
    setStatus("让队长靠近炮台，再点回收。");
    return;
  }
  if (player.position.distanceTo(tower.group.position) > BUILD_RULES.towerAction) {
    moveCaptainTo(getCaptainWorkSpot(tower.group.position));
    setStatus("队长先靠近炮台，到了再点回收。");
    return;
  }
  hideTowerMenu();
  startPlayerAction({ type: "sell", tower, position: tower.group.position.clone() });
}

function performTowerSell(tower) {
  if (!tower || !state.towers.includes(tower)) return;
  const refund = getTowerRefund(tower);
  state.stars += refund;
  root.remove(tower.group);
  if (tower.pad) {
    tower.pad.occupied = false;
    tower.pad.group.visible = true;
  }
  state.towers = state.towers.filter((item) => item !== tower);
  if (state.nearbyTower === tower) state.nearbyTower = null;
  setStatus(`回收炮台，返还 ${refund} 星币。`);
  awardLearningEnergy(4);
  playSfx("pop");
  rebuildGhost();
}

function getTowerRefund(tower) {
  let spent = TOWER_DEFS[tower.type].cost;
  for (let level = 1; level < tower.level; level += 1) spent += 55 + level * 45;
  return Math.floor(spent * 0.55);
}

function openQuiz(reason) {
  if (state.quizActive) return;
  state.quizActive = true;
  state.quizReason = reason;
  state.quizSolved = 0;
  hideTowerMenu();
  ui.quizOverlay.hidden = false;
  if (reason === "core") {
    setQuizTitle("答对 5 题，给生命补能量");
    setStatus("生命核心需要能量练习。");
  }
  if (reason === "timeout") {
    setQuizTitle("答对 5 题，稳住下一波");
    setStatus("时间到了，答 5 题给生命充能。");
  }
  if (reason === "practice") {
    setQuizTitle("答对 5 题，获得练习奖励");
    setStatus("开始一次主动练习。");
  }
  if (reason === "energy") {
    state.learningPending = false;
    setQuizTitle("战斗复盘：答对 5 题拿星币");
    setStatus("一波结束，做 5 题拿星币奖励。");
  }
  nextQuestion();
}

function nextQuestion() {
  state.currentQuestion = generateQuestion(state.level);
  ui.quizProgress.textContent = `${state.quizSolved + 1} / ${LEARNING_RULES.questionsPerQuiz}`;
  ui.quizQuestion.textContent = state.currentQuestion.prompt;
  ui.quizChoices.innerHTML = "";
  state.currentQuestion.choices.forEach((choice) => {
    const button = document.createElement("button");
    button.textContent = choice;
    button.addEventListener("click", () => answerQuestion(button, choice));
    ui.quizChoices.appendChild(button);
  });
}

function answerQuestion(button, choice) {
  const correct = choice === state.currentQuestion.answer;
  button.classList.add(correct ? "is-right" : "is-wrong");
  playSfx(correct ? "right" : "wrong");
  if (!correct) return;
  state.quizSolved += 1;
  if (state.quizSolved >= LEARNING_RULES.questionsPerQuiz) {
    window.setTimeout(() => closeQuiz(true), 360);
  } else {
    window.setTimeout(nextQuestion, 360);
  }
}

function closeQuiz(success) {
  ui.quizOverlay.hidden = true;
  state.quizActive = false;
  const reason = state.quizReason;
  state.quizReason = null;
  resetLearningMeter(success ? 0 : LEARNING_RULES.skipEnergy);
  state.learningCooldown = success ? 22 : 38;
  state.waveCompletionsSinceQuiz = 0;
  if (success) {
    const rescueQuiz = reason === "core" || reason === "timeout";
    state.coreHp = Math.min(15, state.coreHp + (rescueQuiz ? 5 : 2));
    state.stars += rescueQuiz ? 120 : 80;
    if (rescueQuiz) {
      clearEnemies();
      beginPrep();
      setStatus("练习完成！生命补能量，并获得 120 星币。");
    } else {
      setStatus("练习完成！获得 80 星币，学习能量重新开始。");
    }
  }
}

function setQuizTitle(text) {
  if (ui.quizTitle) ui.quizTitle.textContent = text;
}

function generateQuestion(level) {
  if (state.questionDeck.length === 0) state.questionDeck = buildQuestionDeck(level);
  let item = state.questionDeck.shift();
  const recent = new Set(state.recentQuestionKeys);
  if (item && recent.has(questionKey(item)) && state.questionDeck.length > 0) {
    const freshIndex = state.questionDeck.findIndex((candidate) => !recent.has(questionKey(candidate)));
    if (freshIndex >= 0) {
      const fresh = state.questionDeck.splice(freshIndex, 1)[0];
      state.questionDeck.push(item);
      item = fresh;
    }
  }
  rememberQuestion(item);
  return withChoices(item[0], item[1], item[2]);
}

function buildQuestionDeck(level) {
  const seen = new Set();
  const deck = [];
  const add = (item) => {
    const key = questionKey(item);
    if (seen.has(key)) return;
    seen.add(key);
    deck.push(item);
  };
  STATIC_QUESTIONS.forEach(add);
  for (let i = 0; i < 80; i += 1) add(generateMathQuestion(level));
  return shuffle(deck);
}

function generateMathQuestion(level) {
  const grade = Math.max(2, Math.min(6, level + 1));
  const type = Math.floor(Math.random() * 9);
  if (type === 0) {
    const a = randInt(18, 42 + grade * 9);
    const b = randInt(16, 38 + grade * 8);
    const answer = a + b;
    return [`${a} + ${b} = ?`, answer, [answer + 9, answer - 7, answer + 12]];
  }
  if (type === 1) {
    const b = randInt(18, 36 + grade * 7);
    const answer = randInt(16, 54 + grade * 8);
    const a = answer + b;
    return [`${a} - ${b} = ?`, answer, [answer + 8, answer - 6, b]];
  }
  if (type === 2) {
    const a = randInt(6, Math.min(12, 7 + grade));
    const b = randInt(4, 12);
    const answer = a * b;
    return [`${a} x ${b} = ?`, answer, [answer + a, answer - b, a + b]];
  }
  if (type === 3) {
    const divisor = randInt(3, Math.min(12, 7 + grade));
    const answer = randInt(4, 12);
    const total = divisor * answer;
    return [`${total} ÷ ${divisor} = ?`, answer, [answer + 2, Math.max(1, answer - 2), divisor]];
  }
  if (type === 4) {
    const missing = randInt(12, 36 + grade * 8);
    const b = randInt(8, 30 + grade * 5);
    const total = missing + b;
    return [`□ + ${b} = ${total}，□ 是多少？`, missing, [missing + 5, Math.max(1, missing - 4), total - missing + 2]];
  }
  if (type === 5) {
    const a = randInt(4, Math.min(10, 5 + grade));
    const b = randInt(3, 9);
    const c = randInt(12, 30 + grade * 4);
    const answer = a * b + c;
    return [`${a} x ${b} + ${c} = ?`, answer, [answer + a, answer - b, a * (b + c)]];
  }
  if (type === 6) {
    const a = randInt(8, 22 + grade * 2);
    const b = randInt(5, 18 + grade * 2);
    const c = randInt(2, Math.min(6, grade + 1));
    const answer = (a + b) * c;
    return [`(${a} + ${b}) x ${c} = ?`, answer, [answer + c, answer - c * 2, a + b * c]];
  }
  if (type === 7) {
    const unit = randInt(4, 12);
    const count = randInt(4, 10 + grade);
    const paid = unit * count + randInt(8, 26);
    const answer = paid - unit * count;
    return [`每个 ${unit} 星币，买 ${count} 个，付 ${paid} 星币，找回多少？`, answer, [answer + unit, Math.max(0, answer - 3), unit * count]];
  }
  const a = randInt(2, Math.min(9, grade + 4));
  const b = randInt(11, 19 + grade * 2);
  const answer = a * b;
  if (grade >= 4) return [`${a} x ${b} = ?`, answer, [answer + a * 2, answer - b, a + b]];
  const tens = randInt(3, 9) * 10;
  const ones = randInt(2, 9);
  return [`${tens} + ${ones} = ?`, tens + ones, [tens - ones, tens + ones + 10, tens + ones - 1]];
}

function questionKey(item) {
  return `${item?.[0] || ""}|${item?.[1] || ""}`;
}

function rememberQuestion(item) {
  state.recentQuestionKeys.push(questionKey(item));
  while (state.recentQuestionKeys.length > LEARNING_RULES.recentQuestionLimit) {
    state.recentQuestionKeys.shift();
  }
}

function withChoices(prompt, answer, distractors) {
  const normalizedAnswer = String(answer);
  const choices = [];
  const addChoice = (value) => {
    const text = String(value);
    if (!text || choices.includes(text)) return;
    choices.push(text);
  };
  addChoice(normalizedAnswer);
  distractors.forEach(addChoice);
  const numericAnswer = Number(normalizedAnswer);
  if (Number.isFinite(numericAnswer)) {
    const offsets = shuffle([-15, -12, -9, -6, -4, -3, -2, 2, 3, 4, 6, 9, 12, 15]);
    for (const offset of offsets) {
      if (choices.length >= 4) break;
      addChoice(Math.max(0, numericAnswer + offset));
    }
  }
  while (choices.length < 4) addChoice(`${normalizedAnswer}${choices.length}`);
  return { prompt, answer: normalizedAnswer, choices: shuffle(choices.slice(0, 4)) };
}

function clearEnemies() {
  for (const enemy of state.enemies) root.remove(enemy.group);
  for (const bullet of state.bullets) root.remove(bullet.mesh);
  state.enemies = [];
  state.bullets = [];
}

function pulseCore(color) {
  addBurst(core.position.clone().add(new THREE.Vector3(0, 0.8, 0)), color);
}

function nearestEnemy(position, range) {
  let best = null;
  let bestDist = range;
  for (const enemy of state.enemies) {
    const dist = enemy.group.position.distanceTo(position);
    if (dist < bestDist) {
      best = enemy;
      bestDist = dist;
    }
  }
  return best;
}

function nearestTower(position, range) {
  let best = null;
  let bestDist = range;
  for (const tower of state.towers) {
    const dist = tower.group.position.distanceTo(position);
    if (dist < bestDist) {
      best = tower;
      bestDist = dist;
    }
  }
  return best;
}

function nearestBuildPad(position, range) {
  let best = null;
  let bestDist = range;
  for (const pad of state.buildPads) {
    const dist = pad.group.position.distanceTo(position);
    if (dist < bestDist) {
      best = pad;
      bestDist = dist;
    }
  }
  return best;
}

function isOnBuildableIsland(point) {
  const x = point.x / BUILD_RULES.buildRadiusX;
  const z = point.z / BUILD_RULES.buildRadiusZ;
  return x * x + z * z <= 1;
}

function isOnWalkableIsland(point) {
  const x = point.x / BUILD_RULES.walkRadiusX;
  const z = point.z / BUILD_RULES.walkRadiusZ;
  return x * x + z * z <= 1 && point.distanceTo(core.position) > 1.25;
}

function clampToWalkableIsland(point) {
  const next = point.clone().setY(0);
  const x = next.x / BUILD_RULES.walkRadiusX;
  const z = next.z / BUILD_RULES.walkRadiusZ;
  const radius = Math.hypot(x, z);
  if (radius > 1) {
    next.x /= radius;
    next.z /= radius;
  }
  if (next.distanceTo(core.position) < 1.25) {
    const outward = next.clone().sub(core.position).setY(0);
    if (outward.lengthSq() < 0.01) outward.set(1, 0, 0);
    next.copy(core.position).addScaledVector(outward.normalize(), 1.25);
  }
  return next;
}

function getCaptainWorkSpot(targetPosition) {
  const outward = targetPosition.clone().sub(core.position).setY(0);
  if (outward.lengthSq() < 0.05) outward.set(1, 0, 0);
  outward.normalize();
  const tangent = new THREE.Vector3(-outward.z, 0, outward.x);
  const candidates = [
    targetPosition.clone().addScaledVector(outward, -0.9),
    targetPosition.clone().addScaledVector(outward, -1.35),
    targetPosition.clone().addScaledVector(outward, -1.8),
    targetPosition.clone().addScaledVector(outward, -2.35),
    targetPosition.clone().addScaledVector(tangent, 1.05),
    targetPosition.clone().addScaledVector(tangent, -1.05),
  ];
  return candidates.find(isOnWalkableIsland) || clampToWalkableIsland(targetPosition);
}

function moveToward(group, targetPosition, amount) {
  const delta = targetPosition.clone().sub(group.position);
  delta.y = 0;
  const distance = delta.length();
  if (distance < 0.08) return;
  group.position.addScaledVector(delta.normalize(), Math.min(amount, distance));
  group.rotation.y = Math.atan2(delta.x, delta.z);
}

function getTowerStats(tower) {
  const def = TOWER_DEFS[tower.type];
  return {
    range: def.range + (tower.level - 1) * 0.32,
    damage: def.damage * (1 + (tower.level - 1) * 0.36),
    rate: Math.max(0.16, def.rate / (1 + (tower.level - 1) * 0.16)),
  };
}

function totalTowerPower() {
  return state?.towers?.reduce((sum, tower) => sum + tower.level, 0) || 0;
}

function getLevelTimer(level, power) {
  return Math.max(45, 82 - (level - 1) * 3 - Math.min(18, Math.floor(power * 1.4)));
}

function getWaveQuota() {
  return 13 + state.level * 4 + (state.level % 5 === 0 ? 1 : 0);
}

function getSpawnInterval() {
  return Math.max(0.55, 1.45 - state.level * 0.07);
}

function scaledEnemyStats(type) {
  const base = ENEMY_DEFS[type];
  const scale = 1 + (state.level - 1) * 0.13;
  return {
    ...base,
    hp: Math.round(base.hp * scale),
    shield: Math.round(base.shield * (1 + (state.level - 1) * 0.1)),
    reward: Math.round(base.reward * (1 + (state.level - 1) * 0.06)),
    speed: base.speed * (1 + Math.min(0.22, (state.level - 1) * 0.025)),
  };
}

function isTargetAlive(target) {
  return target && target.alive !== false && target.group?.parent;
}

function isLocked(preset) {
  const unlock = TOWER_DEFS[preset]?.unlock || 1;
  return state.level < unlock;
}

function setStatus(text) {
  ui.statusText.textContent = text;
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

function snap(point) {
  return new THREE.Vector3(Math.round(point.x * 2) / 2, 0, Math.round(point.z * 2) / 2);
}

function normalizeHex(value) {
  const text = String(value || "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(text)) return text;
  return state.selectedColor;
}

function addCuteFace(group, y, z, scale = 1, options = {}) {
  const eyeMat = material.black;
  const eyeGeo = new THREE.SphereGeometry(0.045 * scale, 10, 8);
  const eyeA = new THREE.Mesh(eyeGeo, eyeMat);
  const eyeB = eyeA.clone();
  eyeA.position.set(-0.13 * scale, y + 0.04 * scale, z);
  eyeB.position.set(0.13 * scale, y + 0.04 * scale, z);
  if (options.sleepy) {
    eyeA.scale.set(1.65, 0.28, 0.5);
    eyeB.scale.copy(eyeA.scale);
  }
  const shineA = new THREE.Mesh(new THREE.SphereGeometry(0.013 * scale, 8, 6), material.captainWhite);
  const shineB = shineA.clone();
  shineA.position.set(-0.145 * scale, y + 0.058 * scale, z + 0.025 * scale);
  shineB.position.set(0.115 * scale, y + 0.058 * scale, z + 0.025 * scale);
  const cheekA = new THREE.Mesh(new THREE.SphereGeometry(0.04 * scale, 8, 6), material.cheek);
  const cheekB = cheekA.clone();
  cheekA.position.set(-0.23 * scale, y - 0.07 * scale, z - 0.01 * scale);
  cheekB.position.set(0.23 * scale, y - 0.07 * scale, z - 0.01 * scale);
  cheekA.scale.set(1.2, 0.75, 0.35);
  cheekB.scale.copy(cheekA.scale);
  [eyeA, eyeB, shineA, shineB, cheekA, cheekB].forEach((mesh) => {
    mesh.userData.noOutline = true;
  });
  group.add(eyeA, eyeB, shineA, shineB, cheekA, cheekB);

  if (options.smile) {
    const smile = new THREE.Mesh(new THREE.SphereGeometry(0.055 * scale, 8, 6), eyeMat);
    smile.position.set(0, y - 0.09 * scale, z + 0.015 * scale);
    smile.scale.set(1.75, 0.32, 0.28);
    smile.userData.noOutline = true;
    group.add(smile);
  }
  if (options.fang) {
    const fangA = new THREE.Mesh(new THREE.ConeGeometry(0.026 * scale, 0.08 * scale, 6), material.captainWhite);
    const fangB = fangA.clone();
    fangA.position.set(-0.055 * scale, y - 0.13 * scale, z + 0.035 * scale);
    fangB.position.set(0.055 * scale, y - 0.13 * scale, z + 0.035 * scale);
    fangA.rotation.x = Math.PI;
    fangB.rotation.x = Math.PI;
    fangA.userData.noOutline = true;
    fangB.userData.noOutline = true;
    group.add(fangA, fangB);
  }
}

function organicCylinderGeometry(topRadius, bottomRadius, height, segments, noise = 0.12) {
  const geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments, 1);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const radius = Math.hypot(x, z);
    if (radius < 0.01) continue;
    const angle = Math.atan2(z, x);
    const wobble =
      1 +
      Math.sin(angle * 3.0 + 0.7) * noise * 0.52 +
      Math.sin(angle * 5.0 - 1.4) * noise * 0.34 +
      Math.cos(angle * 7.0 + 0.9) * noise * 0.22;
    position.setX(i, x * wobble);
    position.setZ(i, z * wobble);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function createStarMesh(radius, innerRadius, depth, color) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i += 1) {
    const angle = Math.PI / 2 + i * Math.PI / 5;
    const r = i % 2 === 0 ? radius : innerRadius;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: depth * 0.24,
    bevelThickness: depth * 0.2,
    bevelSegments: 1,
  });
  geometry.center();
  const mesh = new THREE.Mesh(geometry, toonMat(color, { emissive: color, emissiveIntensity: 0.1 }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function partMesh(geometry, matRef, id) {
  const mesh = new THREE.Mesh(geometry, matRef);
  mesh.userData.partId = id;
  return mesh;
}

function box(w, h, d, matOrColor) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toMaterial(matOrColor));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function mat(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, ...options });
}

function toonMat(color, options = {}) {
  const { roughness, metalness, envMapIntensity, ...toonOptions } = options;
  return new THREE.MeshToonMaterial({ color, ...toonOptions });
}

function toMaterial(matOrColor) {
  if (matOrColor?.isMaterial) return matOrColor;
  return mat(matOrColor);
}

function enableShadows(child) {
  if (!child.isMesh) return;
  if (child.userData.isOutline) {
    child.castShadow = false;
    child.receiveShadow = false;
    return;
  }
  child.castShadow = true;
  child.receiveShadow = true;
}

function applyCartoonOutlines(group, thickness = 0.04) {
  const meshes = [];
  group.traverse((child) => {
    if (!child.isMesh || child.userData.isOutline || child.userData.noOutline) return;
    if (child.material?.transparent && child.material.opacity < 0.98) return;
    if (isVeryDark(child.material)) return;
    meshes.push(child);
  });

  for (const mesh of meshes) {
    const outline = new THREE.Mesh(mesh.geometry, cartoonOutlineMaterial);
    outline.scale.setScalar(1 + thickness);
    outline.renderOrder = -1;
    outline.userData.isOutline = true;
    outline.frustumCulled = mesh.frustumCulled;
    outline.raycast = () => null;
    outline.castShadow = false;
    outline.receiveShadow = false;
    mesh.add(outline);
  }
}

function isVeryDark(matRef) {
  const color = matRef?.color;
  if (!color) return false;
  const luminance = color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722;
  return luminance < 0.12;
}

function v(x, z) {
  return new THREE.Vector3(x, 0, z);
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadProgress() {
  try {
    if (new URLSearchParams(window.location.search).has("reset")) {
      window.localStorage.removeItem("islandDefense3dProgress");
      return 1;
    }
    const raw = window.localStorage.getItem("islandDefense3dProgress");
    if (!raw) return 1;
    const saved = JSON.parse(raw);
    return saved.date === todayKey() ? THREE.MathUtils.clamp(Number(saved.level) || 1, 1, 10) : 1;
  } catch {
    return 1;
  }
}

function saveProgress(level) {
  try {
    window.localStorage.setItem("islandDefense3dProgress", JSON.stringify({ date: todayKey(), level }));
  } catch {
    // Local storage can be unavailable in strict browser modes; gameplay still works.
  }
}
