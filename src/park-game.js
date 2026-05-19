import * as THREE from "../vendor/three.module.js";

const canvas = document.querySelector("#world");
const minimap = document.querySelector("#minimap");
const mapCtx = minimap.getContext("2d");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.82;
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
scene.background = null;
scene.fog = new THREE.Fog(0x78cfe0, 48, 118);

const camera = new THREE.PerspectiveCamera(58, 1, 0.08, 180);
scene.add(camera);
const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const groundHit = new THREE.Vector3();
const root = new THREE.Group();
scene.add(root);

const ui = {
  hp: document.querySelector("#hp"),
  coins: document.querySelector("#coins"),
  learn: document.querySelector("#learn"),
  threat: document.querySelector("#threat"),
  modeLabel: document.querySelector("#modeLabel"),
  prompt: document.querySelector("#prompt"),
  viewBtn: document.querySelector("#viewBtn"),
  attackBtn: document.querySelector("#attackBtn"),
  skillBtn: document.querySelector("#skillBtn"),
  quizBtn: document.querySelector("#quizBtn"),
  audioBtn: document.querySelector("#audioBtn"),
  joystick: document.querySelector("#joystick"),
  joystickStick: document.querySelector("#joystick span"),
  lookPad: document.querySelector("#lookPad"),
  towerMenu: document.querySelector("#towerMenu"),
  towerMenuTitle: document.querySelector("#towerMenuTitle"),
  towerMenuMeta: document.querySelector("#towerMenuMeta"),
  towerMenuUpgrade: document.querySelector("#towerMenuUpgrade"),
  towerMenuSell: document.querySelector("#towerMenuSell"),
  towerMenuClose: document.querySelector("#towerMenuClose"),
  paintedMapLayer: document.querySelector("#paintedMapLayer"),
  startCurtain: document.querySelector("#startCurtain"),
  startBtn: document.querySelector("#startBtn"),
  quizOverlay: document.querySelector("#quizOverlay"),
  quizReason: document.querySelector("#quizReason"),
  quizTitle: document.querySelector("#quizTitle"),
  quizProgress: document.querySelector("#quizProgress"),
  quizQuestion: document.querySelector("#quizQuestion"),
  quizChoices: document.querySelector("#quizChoices"),
  quizClose: document.querySelector("#quizClose"),
};

const state = {
  running: false,
  view: "overview",
  ride: null,
  selectedTower: null,
  hp: 100,
  coins: 260,
  learn: 0,
  threat: 1,
  parkTime: 8 * 60,
  waveTimer: 3,
  spawnTimer: 0,
  waveBudget: 6,
  spawned: 0,
  calmTimer: 0,
  lightningCooldown: 0,
  attackCooldown: 0,
  quizCooldown: 22,
  coasterBuff: 0,
  boatSupplyTimer: 0,
  cameraYaw: -0.72,
  cameraPitch: 0.72,
  cameraDistance: 52,
  cameraTargetDistance: 52,
  firstYaw: Math.PI,
  firstPitch: -0.04,
  playerTarget: null,
  drag: { active: false, pointerId: null, x: 0, y: 0, mode: "orbit" },
  joystick: { active: false, id: null, x: 0, y: 0, power: 0 },
  towers: [],
  enemies: [],
  bullets: [],
  effects: [],
  coins3d: [],
  rails: [],
  boats: [],
  obstacles: [],
  paintedBuilds: [],
  mapEnemies: [],
  mapEffects: [],
  scenic: {
    flags: [],
    water: [],
    balloons: [],
    pterodactyls: [],
    wheels: [],
    lampLights: [],
  },
  interactTarget: null,
  nearbyTower: null,
  selectedTowerEntity: null,
  quiz: { active: false, solved: 0, reason: "practice", current: null, deck: [], recent: [] },
  audio: { enabled: true, ctx: null, master: null, music: null, sfx: null, next: 0, step: 0 },
};

const PAINTED_BUILD_SPOTS = [
  { id: "northWestA", x: 25.2, y: 21.6, w: 13.8, h: 7.2, rot: -8, world: v(-15, 0.72, 8.5) },
  { id: "northWestB", x: 13.6, y: 37.6, w: 16.2, h: 8.4, rot: 8, world: v(-20, 0.72, 0.2) },
  { id: "westCenter", x: 31.0, y: 45.2, w: 13.0, h: 8.0, rot: 10, world: v(-9.6, 0.72, -2.5) },
  { id: "southCenter", x: 45.0, y: 62.5, w: 17.2, h: 8.8, rot: 0, world: v(-0.8, 0.72, -8.8) },
  { id: "eastNorth", x: 75.2, y: 37.8, w: 15.5, h: 8.2, rot: -3, world: v(12.4, 0.72, 2.6) },
  { id: "eastMid", x: 82.7, y: 49.8, w: 14.0, h: 7.8, rot: -4, world: v(18.4, 0.72, -3.0) },
  { id: "eastSouth", x: 72.6, y: 66.5, w: 14.8, h: 8.4, rot: 4, world: v(10.2, 0.72, -11.4) },
  { id: "southEast", x: 79.8, y: 75.3, w: 11.8, h: 6.8, rot: 8, world: v(16.8, 0.72, -14.8) },
];

const MAP_TOWER_COLORS = {
  spark: "#56d6ff",
  frost: "#d9fbff",
  vine: "#70e29a",
  cookie: "#d7954d",
};

const MAP_ENEMY_COLORS = {
  blob: "#58d886",
  jumper: "#9a77ff",
  shell: "#78c66a",
  shield: "#55c8ff",
  giant: "#d7d9ec",
};

const MAP_ENEMY_ROUTES = [
  [{ x: -5, y: 50 }, { x: 14, y: 44 }, { x: 29, y: 42 }, { x: 40, y: 43 }, { x: 50, y: 43 }],
  [{ x: 104, y: 42 }, { x: 86, y: 41 }, { x: 72, y: 42 }, { x: 60, y: 43 }, { x: 50, y: 43 }],
  [{ x: 42, y: -5 }, { x: 39, y: 16 }, { x: 43, y: 28 }, { x: 48, y: 37 }, { x: 50, y: 43 }],
  [{ x: 48, y: 106 }, { x: 47, y: 83 }, { x: 47, y: 66 }, { x: 49, y: 53 }, { x: 50, y: 43 }],
  [{ x: 20, y: 104 }, { x: 28, y: 82 }, { x: 38, y: 66 }, { x: 46, y: 52 }, { x: 50, y: 43 }],
];

const MAP_PROJECTS = [
  { id: "coaster", label: "飞车", x: 79.5, y: 21.8, icon: "⚡" },
  { id: "boat", label: "卡丁车", x: 23.0, y: 78.0, icon: "◆" },
];

const TOWER_DEFS = {
  spark: { name: "星光电塔", cost: 70, range: 8.2, damage: 18, rate: 0.32, color: 0x56d6ff, slow: 0 },
  frost: { name: "冰晶塔", cost: 95, range: 7.6, damage: 14, rate: 0.82, color: 0xcff9ff, slow: 0.52, slowTime: 2.4 },
  vine: { name: "藤蔓花坛", cost: 55, range: 5.0, damage: 4, rate: 0.2, color: 0x70e29a, aura: true, slow: 0.58, slowTime: 0.45 },
  cookie: { name: "饼干炮车", cost: 125, range: 7.0, damage: 36, rate: 1.05, color: 0xffb464, splash: 2.3, slow: 0 },
};

const ENEMY_DEFS = {
  blob: { hp: 76, speed: 2.0, reward: 14, damage: 4, color: 0x5ddb88 },
  jumper: { hp: 46, speed: 3.25, reward: 16, damage: 3, color: 0x9a7bff },
  shell: { hp: 180, speed: 1.18, reward: 32, damage: 8, color: 0x61b66b },
  shield: { hp: 110, shield: 70, speed: 1.58, reward: 28, damage: 6, color: 0x55c8ff },
  giant: { hp: 520, shield: 130, speed: 0.92, reward: 140, damage: 18, color: 0xdad8ef },
};

const ENEMY_NAMES = {
  blob: "果冻怪",
  jumper: "跳跳怪",
  shell: "甲壳怪",
  shield: "护盾怪",
  giant: "巨人怪",
};

const QUESTIONS = [
  ["春眠不觉晓，处处闻____。", "啼鸟", ["花香", "白云", "小雨"]],
  ["两个黄鹂鸣翠柳，一行____上青天。", "白鹭", ["小船", "星星", "飞鸟"]],
  ["日照香炉生紫烟，遥看瀑布挂____。", "前川", ["山边", "天边", "小岛"]],
  ["小时不识月，呼作____盘。", "白玉", ["金子", "太阳", "云朵"]],
  ["谁知盘中餐，粒粒皆____。", "辛苦", ["香甜", "漂亮", "开心"]],
  ["water 的中文意思是？", "水", ["树", "星星", "糖果"]],
  ["sun 的中文意思是？", "太阳", ["月亮", "雨", "冰"]],
  ["green monster 里的 green 是？", "绿色", ["蓝色", "红色", "黄色"]],
  ["apple 的中文意思是？", "苹果", ["香蕉", "面包", "铅笔"]],
  ["book 的中文意思是？", "书", ["门", "鱼", "花"]],
  ["happy 的中文意思是？", "开心", ["寒冷", "安静", "快速"]],
  ["植物生长通常需要阳光、水和____。", "空气", ["石头", "沙发", "糖纸"]],
  ["一天有多少小时？", "24", ["12", "30", "60"]],
  ["一年通常有多少个月？", "12", ["10", "7", "24"]],
  ["彩虹常见有几种颜色？", "7", ["3", "5", "10"]],
  ["水加热到很热会变成____。", "水蒸气", ["石头", "沙子", "铁块"]],
  ["影子通常出现在光照物体的____。", "背光一侧", ["发光一侧", "正上方", "里面"]],
  ["三角形有几条边？", "3", ["2", "4", "5"]],
  ["正方形有几个角？", "4", ["3", "5", "6"]],
  ["5 个十是____。", "50", ["15", "25", "100"]],
  ["100 里面有几个十？", "10", ["5", "20", "1"]],
  ["比 36 大 1 的数是？", "37", ["35", "46", "30"]],
  ["比 80 小 10 的数是？", "70", ["90", "8", "60"]],
  ["早上起床后应该先____。", "洗漱", ["睡觉", "吃糖纸", "关灯"]],
  ["遇到不会的题，可以先____。", "读清题目", ["随便选", "不看题", "撕书"]],
];

const matCache = new Map();
const material = {
  water: mat(0x2eabc2, { roughness: 0.42, metalness: 0.03, transparent: true, opacity: 0.58 }),
  deepWater: mat(0x17799f, { roughness: 0.5, metalness: 0.02 }),
  foam: mat(0xe9ffff, { roughness: 0.6, transparent: true, opacity: 0.64 }),
  tunnel: mat(0x39424a, { roughness: 0.95, flatShading: true }),
  sand: mat(0xf3dda2, { roughness: 0.86, flatShading: true }),
  grass: mat(0x5dad68, { roughness: 0.88, flatShading: true }),
  grass2: mat(0x85c75d, { roughness: 0.86, flatShading: true }),
  meadow: mat(0x9fd35f, { roughness: 0.86, flatShading: true }),
  plaza: mat(0xf7c982, { roughness: 0.72, flatShading: true }),
  plazaLight: mat(0xffdf9d, { roughness: 0.74, flatShading: true }),
  pathTrim: mat(0xffffff, { roughness: 0.65, transparent: true, opacity: 0.92 }),
  track: mat(0x7e8f84, { roughness: 0.9, flatShading: true }),
  stone: mat(0xc8b98e, { roughness: 0.86, flatShading: true }),
  pink: toon(0xff8fb8),
  pink2: toon(0xffb2c8),
  cream: toon(0xfff2cc),
  roof: toon(0x4ebdf0),
  roofDark: toon(0x208fd1),
  gold: toon(0xffd75d, { emissive: 0xb66f00, emissiveIntensity: 0.06 }),
  red: toon(0xf2555f),
  orange: toon(0xffa84e),
  purple: toon(0xa77bff),
  rail: toon(0xf2555f),
  railGold: toon(0xffd75d),
  rock: mat(0x918a78, { roughness: 0.92, flatShading: true }),
  rockLight: mat(0xb7aa92, { roughness: 0.92, flatShading: true }),
  trunk: mat(0x854d2b, { roughness: 0.82, flatShading: true }),
  wood: mat(0xb8783e, { roughness: 0.76, flatShading: true }),
  leaf: mat(0x45b965, { roughness: 0.74, flatShading: true }),
  hedge: mat(0x3fa35f, { roughness: 0.78, flatShading: true }),
  dark: mat(0x10202b, { roughness: 0.64 }),
  skin: toon(0xffd2a5),
  white: toon(0xf8fcff),
  glass: mat(0xc9fbff, { roughness: 0.12, metalness: 0.02, transparent: true, opacity: 0.58 }),
  glowBlue: toon(0x57e1ff, { emissive: 0x57e1ff, emissiveIntensity: 0.42 }),
};

const island = { rx: 28.5, rz: 20.5, buildRx: 25.4, buildRz: 17.6 };
const OVERVIEW_CAMERA_MIN_DISTANCE = 10;
const OVERVIEW_CAMERA_MAX_DISTANCE = 74;
const coasterCurve = makeCoasterCurve();
const boatCurve = makeKartCurve();
const enemyRoutes = [
  [v(-33, 0.35, -7), v(-23, 0.35, -5), v(-13, 0.35, -2), v(-5, 0.35, -1), v(0, 0.35, 0)],
  [v(32, 0.35, 8), v(23, 0.35, 6), v(13, 0.35, 3), v(5, 0.35, 1), v(0, 0.35, 0)],
  [v(-8, 0.35, 26), v(-6, 0.35, 16), v(-3, 0.35, 8), v(-1, 0.35, 2), v(0, 0.35, 0)],
  [v(17, 0.35, -25), v(12, 0.35, -15), v(7, 0.35, -7), v(3, 0.35, -2), v(0, 0.35, 0)],
];

const player = createPlayer();
const castle = createCastle();
const coasterTrain = createCoasterTrain();
const boat = createBoat();
const wand = createWand();
const keys = new Set();

init();

function init() {
  setupLights();
  buildWorld();
  root.add(castle, player, coasterTrain, boat);
  addObstacle(-1.4, 0.1, 2.25);
  addObstacle(1.4, 0.1, 2.25);
  addObstacle(0, 2.2, 1.9);
  addObstacle(12.2, -11.3, 2.7);
  addObstacle(-15.6, -7.4, 2.8);
  coasterTrain.userData.ride = "coaster";
  boat.userData.ride = "boat";
  player.position.copy(safeFirstPersonSpawn());
  boat.userData.t = 0.08;
  coasterTrain.userData.t = 0;
  setupPaintedMapLayer();
  bindEvents();
  resize();
  updateUi();
  renderer.setAnimationLoop(tick);
}

function setupLights() {
  scene.add(new THREE.HemisphereLight(0xe4f4ff, 0x4f7f5c, 1.15));
  const sun = new THREE.DirectionalLight(0xffefbf, 2.65);
  sun.position.set(-22, 34, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -45;
  sun.shadow.camera.right = 45;
  sun.shadow.camera.top = 45;
  sun.shadow.camera.bottom = -45;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 86;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x8fd9ff, 0.45);
  rim.position.set(26, 15, -20);
  scene.add(rim);
}

function buildWorld() {
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1000), material.deepWater);
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -0.34;
  sea.receiveShadow = true;
  root.add(sea);

  for (let i = 0; i < 74; i += 1) {
    const x = rand(-56, 56);
    const z = rand(-46, 46);
    if (Math.hypot(x / 29, z / 22) < 1.08) continue;
    addRipple(x, z, rand(1.1, 4.2), rand(0, Math.PI));
  }

  addIslandLayer(31.2, 22.2, 0.22, material.foam, -0.26, 0.22);
  addIslandLayer(29.5, 21.0, 0.68, material.sand, -0.03, 0.18);
  addIslandLayer(26.6, 18.9, 0.82, material.grass, 0.28, 0.12);
  addIslandLayer(18.4, 12.5, 0.12, material.grass2, 0.72, 0.16, 0.32);
  addIslandLayer(10.8, 7.2, 0.08, material.meadow, 0.79, 0.1, -0.18);
  addRiver();
  addPlazasAndPaths();
  addMountain();
  addCoaster();
  addBoatDock();
  addScenery();
  castle.position.set(0, 0.65, 0);
}

function addIslandLayer(rx, rz, h, matRef, y, noise = 0.1, rotation = 0) {
  const mesh = new THREE.Mesh(organicCylinderGeometry(1, 1, h, 96, noise), matRef);
  mesh.scale.set(rx, 1, rz);
  mesh.position.y = y;
  mesh.rotation.y = rotation;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);
  return mesh;
}

function addRiver() {
  const points = [v(-19.6, 0.73, -7.6), v(-12.5, 0.74, -3.9), v(-5.2, 0.75, 1.6), v(4.8, 0.75, 0.5), v(16.2, 0.73, -5.5)];
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.4);
  const river = new THREE.Mesh(new THREE.TubeGeometry(curve, 110, 1.55, 14, false), material.water);
  river.scale.y = 0.04;
  river.receiveShadow = true;
  root.add(river);
  const edgeA = new THREE.Mesh(new THREE.TubeGeometry(offsetCurve(curve, 1.42, false), 96, 0.11, 7, false), material.stone);
  const edgeB = new THREE.Mesh(new THREE.TubeGeometry(offsetCurve(curve, -1.42, false), 96, 0.11, 7, false), material.stone);
  edgeA.scale.y = 0.12;
  edgeB.scale.y = 0.12;
  root.add(edgeA, edgeB);
  for (let i = 0; i < 30; i += 1) {
    const p = curve.getPoint(i / 29);
    addRipple(p.x + rand(-0.6, 0.6), p.z + rand(-0.5, 0.5), rand(0.6, 1.6), rand(-0.5, 0.5), 0.82);
  }
  addBridge(-3.6, 0.9, 0.45);
  addBridge(8.2, -2.2, -0.35);
  addBridge(-13.0, -4.0, 0.68);
}

function addPlazasAndPaths() {
  addDisc(0, 0, 6.2, 4.55, material.plaza, 0.82);
  addDisc(0, 0, 4.35, 3.05, material.plazaLight, 0.86);
  addDecorativeTileRing(0, 0, 6.05, 4.35, 40);
  addPath([v(-20, 0.84, -6.6), v(-11.6, 0.84, -3.6), v(-2.2, 0.86, 0), v(8, 0.84, 2.8), v(19.4, 0.84, 7.0)], 1.15, material.plaza);
  addPath([v(-7, 0.84, 13.2), v(-2.2, 0.86, 5.0), v(0, 0.88, 0), v(2.2, 0.85, -6.8), v(9.2, 0.84, -14.0)], 1.02, material.plaza);
  addPath([v(0, 0.86, 0), v(5.4, 0.9, 4.6), v(10.6, 1.08, 7.6), v(14.2, 1.7, 8.8)], 0.9, material.plaza);
  addPath([v(0, 0.85, 0), v(6.6, 0.84, -3.2), v(12.2, 0.84, -8.0), v(15.4, 0.84, -12.0)], 0.9, material.plaza);
  [
    [-16.8, 4.2, 3.5, 2.3],
    [-13.8, -10.0, 3.6, 2.0],
    [8.8, 10.6, 3.1, 2.2],
    [18.2, 2.2, 3.4, 2.2],
    [8.4, -14.4, 2.7, 1.7],
  ].forEach(([x, z, rx, rz], index) => addBuildLawn(x, z, rx, rz, index));
}

function addMountain() {
  const mountain = new THREE.Group();
  mountain.position.set(13.8, 0.62, 8.6);
  const base = new THREE.Mesh(new THREE.ConeGeometry(7.8, 10.8, 10), material.rock);
  base.position.y = 5.1;
  base.scale.set(1.18, 1, 0.92);
  const shoulderA = new THREE.Mesh(new THREE.ConeGeometry(4.5, 7.4, 8), material.rockLight);
  shoulderA.position.set(3.8, 3.65, -2.6);
  shoulderA.scale.set(0.86, 1, 0.72);
  const shoulderB = shoulderA.clone();
  shoulderB.position.set(-3.6, 3.2, 1.9);
  shoulderB.scale.set(0.78, 0.9, 0.7);
  const grassCap = new THREE.Mesh(new THREE.ConeGeometry(6.8, 7.0, 10), material.grass2);
  grassCap.position.y = 3.55;
  grassCap.scale.set(1.08, 0.7, 0.84);
  const snow = new THREE.Mesh(new THREE.ConeGeometry(2.35, 2.25, 8), material.white);
  snow.position.y = 9.72;
  const cave = new THREE.Mesh(new THREE.SphereGeometry(1.05, 18, 10), material.dark);
  cave.position.set(2.7, 1.8, -2.8);
  cave.scale.set(1.15, 0.72, 0.34);
  const tunnelIn = createTunnelPortal();
  tunnelIn.position.set(0.3, 1.18, -4.95);
  tunnelIn.rotation.y = -0.18;
  const tunnelOut = createTunnelPortal();
  tunnelOut.position.set(4.85, 1.24, 0.1);
  tunnelOut.rotation.y = Math.PI / 2.2;
  const tunnelTube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    v(0.3, 1.15, -4.95),
    v(1.8, 1.1, -3.4),
    v(3.4, 1.08, -1.4),
    v(4.85, 1.18, 0.1),
  ]), 36, 0.92, 10, false), material.tunnel);
  mountain.add(base, shoulderA, shoulderB, grassCap, snow, cave, tunnelTube, tunnelIn, tunnelOut);
  addWaterfallToMountain(mountain);
  const trail = [
    v(5.4, 0.18, 2.4),
    v(4.2, 0.9, 3.2),
    v(3.0, 1.7, 3.9),
    v(1.2, 2.65, 4.4),
    v(-0.8, 3.65, 4.2),
    v(-2.1, 4.8, 3.0),
    v(-1.2, 6.0, 1.5),
    v(0.8, 6.9, 0.8),
  ];
  trail.forEach((point, index) => {
    const next = trail[Math.min(index + 1, trail.length - 1)];
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.16, 0.62), index % 2 ? material.wood : material.plaza);
    step.position.copy(point);
    step.rotation.y = Math.atan2(next.x - point.x, next.z - point.z);
    mountain.add(step);
    if (index % 2 === 0) {
      const railL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 6), material.gold);
      const railR = railL.clone();
      railL.position.copy(point).add(v(-0.58, 0.36, 0));
      railR.position.copy(point).add(v(0.58, 0.36, 0));
      railL.rotation.z = Math.PI / 2;
      railR.rotation.z = Math.PI / 2;
      mountain.add(railL, railR);
    }
  });
  for (let i = 0; i < 24; i += 1) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.16, 0.52), material.plaza);
    const t = i / 23;
    const a = t * Math.PI * 1.55 + 0.8;
    step.position.set(Math.cos(a) * (6.2 - t * 3.0), 0.6 + t * 6.4, Math.sin(a) * (4.9 - t * 2.2));
    step.rotation.y = -a;
    mountain.add(step);
  }
  for (let i = 0; i < 26; i += 1) {
    const a = rand(0, Math.PI * 2);
    const r = rand(3.2, 6.8);
    const shrub = createShrub(rand(0.28, 0.62));
    shrub.position.set(Math.cos(a) * r, rand(0.75, 3.2), Math.sin(a) * r * 0.74);
    mountain.add(shrub);
  }
  mountain.traverse(enableShadows);
  root.add(mountain);
}

function addCoaster() {
  const railA = new THREE.Mesh(new THREE.TubeGeometry(coasterCurve, 220, 0.12, 8, true), material.rail);
  const railB = new THREE.Mesh(new THREE.TubeGeometry(offsetCurve(coasterCurve, 0.54), 220, 0.12, 8, true), material.rail);
  const spine = new THREE.Mesh(new THREE.TubeGeometry(offsetCurve(coasterCurve, 0.27), 220, 0.06, 6, true), material.railGold);
  const glow = new THREE.Mesh(new THREE.TubeGeometry(offsetCurve(coasterCurve, 0.27), 220, 0.035, 6, true), material.glowBlue);
  glow.position.y = -0.18;
  root.add(railA, railB, spine, glow);
  [railA, railB, spine, glow].forEach((m) => { m.castShadow = true; m.receiveShadow = true; });
  for (let i = 0; i < 82; i += 1) {
    const t = i / 82;
    const p = coasterCurve.getPointAt(t);
    if (i % 2 === 0) {
      const p2 = coasterCurve.getPointAt((t + 0.006) % 1);
      const tie = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.09, 0.16), material.railGold);
      tie.position.copy(p).lerp(p2, 0.5);
      tie.quaternion.setFromUnitVectors(v(1, 0, 0), p2.clone().sub(p).setY(0).normalize());
      tie.position.y += 0.03;
      tie.castShadow = true;
      root.add(tie);
    }
    if (i % 4 === 0) {
      const pod = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), material.glowBlue);
      pod.position.copy(p);
      pod.position.y -= 0.42;
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.025, 6, 24), material.railGold);
      halo.position.copy(pod.position);
      halo.rotation.x = Math.PI / 2;
      root.add(pod, halo);
    }
  }
  addCoasterMountainAnchors();
  addStation(12.2, -11.3, "coaster");
  addStarArch(12.2, -9.2, 0.15, 0xf2555f);
  addBannerLine([v(12, 3.2, -9.6), v(15.8, 3.4, -8.2), v(18.8, 3.0, -5.4)], 9);
}

function addCoasterMountainAnchors() {
  const mountainCenter = v(13.8, 0, 8.6);
  [0.50, 0.56, 0.62, 0.68, 0.76].forEach((t, index) => {
    const trackPoint = coasterCurve.getPointAt(t);
    const direction = trackPoint.clone().sub(mountainCenter).setY(0).normalize();
    const anchor = mountainCenter.clone().add(direction.multiplyScalar(index % 2 ? 4.8 : 5.65));
    anchor.y = clamp(trackPoint.y - 1.55, 3.2, 8.8);
    const beamA = addBeamBetween(anchor, trackPoint.clone().add(v(-0.28, -0.18, 0)), 0.075, material.railGold);
    const beamB = addBeamBetween(anchor.clone().add(v(0, 0.38, 0)), trackPoint.clone().add(v(0.28, -0.18, 0)), 0.055, material.glowBlue);
    const pad = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), material.rockLight);
    pad.position.copy(anchor);
    pad.scale.set(1.25, 0.72, 1.0);
    root.add(beamA, beamB, pad);
  });
}

function addBeamBetween(from, to, radius, matRef) {
  const delta = to.clone().sub(from);
  const length = Math.max(0.001, delta.length());
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.18, length, 7), matRef);
  beam.position.copy(from).lerp(to, 0.5);
  beam.quaternion.setFromUnitVectors(v(0, 1, 0), delta.normalize());
  beam.castShadow = true;
  beam.receiveShadow = true;
  return beam;
}

function addBoatDock() {
  addStation(-15.6, -7.4, "boat");
  addKartTrack();
  addKartStartArch(-15.6, -8.3, -0.65);
}

function addStation(x, z, type) {
  const g = new THREE.Group();
  g.position.set(x, 0.82, z);
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.35, 0.28, 28), material.plaza);
  const trim = new THREE.Mesh(new THREE.TorusGeometry(1.92, 0.08, 8, 36), material.gold);
  trim.position.y = 0.2;
  trim.rotation.x = Math.PI / 2;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.15, 1.4, 6), type === "coaster" ? material.red : material.roof);
  roof.position.y = 1.9;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 1.9, 8), material.cream);
  pole.position.y = 0.95;
  const sign = createSign(type === "coaster" ? 0xf2555f : 0x4ebdf0);
  sign.position.set(0, 1.15, 1.85);
  g.add(floor, trim, pole, roof, sign);
  for (let i = 0; i < 6; i += 1) {
    const flag = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.42, 3), i % 2 ? material.gold : material.pink);
    const a = (i / 6) * Math.PI * 2;
    flag.position.set(Math.cos(a) * 1.55, 2.46, Math.sin(a) * 1.55);
    flag.rotation.z = -Math.PI / 2;
    flag.rotation.y = -a;
    g.add(flag);
  }
  g.userData.station = type;
  g.traverse((child) => {
    child.userData.station = type;
    enableShadows(child);
  });
  root.add(g);
}

function addKartTrack() {
  const track = new THREE.Mesh(new THREE.TubeGeometry(boatCurve, 220, 0.82, 12, true), material.track);
  track.scale.y = 0.035;
  track.position.y = 0.77;
  track.receiveShadow = true;
  root.add(track);
  const centerLine = new THREE.Mesh(new THREE.TubeGeometry(boatCurve, 220, 0.035, 6, true), material.gold);
  centerLine.scale.y = 0.04;
  centerLine.position.y = 0.83;
  root.add(centerLine);
  for (let i = 0; i < 34; i += 1) {
    const p = bumperCarPointAt(i / 34);
    const p2 = bumperCarPointAt((i + 0.012) / 34);
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.035, 0.1), i % 2 ? material.white : material.gold);
    dash.position.copy(p).setY(p.y + 0.035);
    dash.quaternion.setFromUnitVectors(v(1, 0, 0), p2.clone().sub(p).setY(0).normalize());
    dash.castShadow = false;
    root.add(dash);
  }
}

function addKartStartArch(x, z, rot) {
  const g = new THREE.Group();
  g.position.set(x, 0.85, z);
  g.rotation.y = rot;
  const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 2.4, 8), material.gold);
  const postR = postL.clone();
  postL.position.set(-1.15, 1.15, 0);
  postR.position.set(1.15, 1.15, 0);
  const top = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.13, 10, 28, Math.PI), material.red);
  top.position.y = 2.3;
  top.rotation.z = Math.PI;
  const sign = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.42, 0.12), material.cream);
  sign.position.y = 1.92;
  const starL = createStar(0.22, 0.09, 0.035, 0xffd75d);
  const starR = createStar(0.22, 0.09, 0.035, 0xffd75d);
  starL.position.set(-0.58, 1.94, -0.09);
  starR.position.set(0.58, 1.94, -0.09);
  g.add(postL, postR, top, sign, starL, starR);
  g.traverse(enableShadows);
  root.add(g);
}

function createTunnelPortal() {
  const g = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.16, 10, 28, Math.PI), material.rockLight);
  rim.rotation.z = Math.PI;
  rim.position.y = 0.2;
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.88, 18, 10), material.dark);
  mouth.scale.set(1.05, 0.72, 0.24);
  mouth.position.y = -0.05;
  const lightA = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), material.gold);
  const lightB = lightA.clone();
  lightA.position.set(-0.72, 0.24, -0.12);
  lightB.position.set(0.72, 0.24, -0.12);
  g.add(rim, mouth, lightA, lightB);
  return g;
}

function addScenery() {
  const trees = [
    [-24, -8, 1.2], [-22, 4, .9], [-13, 14.4, .85], [-2, 15.8, .75], [9, 13.6, .9], [18.8, 7, 1.1],
    [24, -4, .8], [15.8, -14.8, 1], [2, -16.4, .76], [-12, -14.6, 1.05], [-25, 4, .78], [24, 4, .66],
    [-20.5, -15.2, .7], [21.4, 14.2, .78], [5.4, 16.2, .72], [-4.8, -16.6, .8],
  ];
  trees.forEach(([x, z, s]) => {
    if (!isNearKartTrack(x, z, 2.7)) addPalm(x, z, s);
  });
  for (let i = 0; i < 270; i += 1) {
    const p = randomIslandPoint(26.5, 18.5);
    if (p.distanceTo(castle.position) < 4.8 || p.distanceTo(v(13.8, 0, 8.6)) < 7.2) continue;
    if (isNearKartTrack(p.x, p.z, 2.3)) continue;
    if (i % 5 === 0) addRock(p.x, p.z, rand(0.25, 0.65));
    else if (i % 7 === 0) addShrubPatch(p.x, p.z, rand(0.7, 1.25));
    else addFlower(p.x, p.z, i);
  }
  for (let i = 0; i < 38; i += 1) {
    const a = (i / 38) * Math.PI * 2;
    const x = Math.cos(a) * rand(24.5, 28.2);
    const z = Math.sin(a) * rand(17.6, 20.2);
    addShell(x, z);
  }
  [
    [-6.2, 2.6], [-2.6, 4.2], [2.5, 4.0], [5.8, 1.6], [5.5, -2.2], [1.4, -3.8], [-3.5, -3.6], [-6.5, -0.8],
    [-18.2, -5.2], [-12.4, -2.8], [9.2, 2.8], [16.8, 5.6], [2.2, -8.4], [8.6, -11.8],
  ].forEach(([x, z]) => {
    if (!isNearKartTrack(x, z, 2.4)) addLamp(x, z);
  });
  addFenceRing(0, 0, 7.2, 5.3, 34);
  addFenceRing(-16.8, 4.2, 4.2, 2.8, 22);
  addFenceRing(18.2, 2.2, 4.0, 2.65, 20);
  addFenceRing(8.8, 10.6, 3.75, 2.75, 20);
  addBannerLine([v(-18, 2.9, -6.4), v(-10, 3.2, -3.4), v(-2, 3.0, 0.4)], 12);
  addBannerLine([v(6, 3.1, 2.5), v(13, 3.35, 4.6), v(20, 3.0, 7)], 13);
  addBalloonCluster(7.8, 11.9, 1.0);
  addBalloonCluster(18.4, 6.4, 0.86);
  addBalloonCluster(-18.8, 5.6, 0.82);
  addPterodactylPatrol();
  addBeachDetails();
  addCarousel(13.5, 8.8);
  addFerrisWheel(-12.5, -12.2);
  addFoodStalls(6.2, 8.8);
  addToyBooths(-22.2, 5.6, -0.3);
  addToyBooths(20.0, -5.6, 0.35);
}

function addPterodactylPatrol() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.25, 8), material.orange);
  body.rotation.x = Math.PI / 2;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 8), material.gold);
  head.position.set(0, 0.05, -0.72);
  const crest = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.42, 3), material.red);
  crest.position.set(0, 0.2, -0.9);
  crest.rotation.x = -Math.PI / 2;
  const wingL = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.045, 0.42), material.pink2);
  const wingR = wingL.clone();
  wingL.position.set(-0.75, 0, -0.05);
  wingR.position.set(0.75, 0, -0.05);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.58, 4), material.orange);
  tail.position.set(0, 0, 0.78);
  tail.rotation.x = Math.PI / 2;
  g.add(body, head, crest, wingL, wingR, tail);
  g.position.set(0, 9.5, 0);
  g.scale.setScalar(1.15);
  g.traverse(enableShadows);
  root.add(g);
  state.scenic.pterodactyls.push({ group: g, wingL, wingR, t: rand(0, Math.PI * 2) });
}

function addCarousel(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0.85, z);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.25, 0.28, 32), material.plaza);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.45, 1.15, 24), material.pink);
  roof.position.y = 4.58;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 4.55, 10), material.gold);
  pole.position.y = 2.28;
  const canopyTrim = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.08, 8, 36), material.gold);
  canopyTrim.position.y = 4.02;
  canopyTrim.rotation.x = Math.PI / 2;
  g.add(base, roof, pole, canopyTrim);
  for (let i = 0; i < 4; i += 1) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 3.6, 7), material.cream);
    post.position.set(Math.cos(a) * 1.78, 2.08, Math.sin(a) * 1.78);
    g.add(post);
  }
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2;
    const horse = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10), i % 2 ? material.white : material.roof);
    horse.position.set(Math.cos(a) * 1.32, 0.86, Math.sin(a) * 1.32);
    horse.scale.set(1.45, 0.72, 0.55);
    const hpole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.9, 6), material.gold);
    hpole.position.set(Math.cos(a) * 1.32, 1.25, Math.sin(a) * 1.32);
    g.add(horse, hpole);
  }
  g.userData.spin = rand(0.3, 0.6);
  g.traverse(enableShadows);
  root.add(g);
  state.effects.push({ group: g, life: Infinity, spin: g.userData.spin, type: "scenicSpin" });
}

function addFerrisWheel(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0.9, z);
  const wheelRig = new THREE.Group();
  wheelRig.position.y = 2.7;
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.055, 8, 64), material.gold);
  wheel.rotation.y = Math.PI / 2;
  wheelRig.add(wheel);
  for (let i = 0; i < 12; i += 1) {
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.12, 6), material.cream);
    spoke.rotation.z = (i / 12) * Math.PI;
    wheelRig.add(spoke);
  }
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.9, 10), material.cream);
  axle.rotation.z = Math.PI / 2;
  g.add(wheelRig, axle);
  const cabins = [];
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.42), i % 2 ? material.pink : material.roof);
    cabin.position.set(0, Math.sin(a) * 2.2, Math.cos(a) * 2.2);
    cabin.userData.cabinAngle = a;
    cabins.push(cabin);
    wheelRig.add(cabin);
  }
  const legA = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.2, 6), material.cream);
  const legB = legA.clone();
  legA.position.set(0, 1.45, -0.9);
  legB.position.set(0, 1.45, 0.9);
  legA.rotation.x = 0.42;
  legB.rotation.x = -0.42;
  g.add(legA, legB);
  g.traverse(enableShadows);
  root.add(g);
  state.effects.push({ group: g, wheelRig, cabins, life: Infinity, spin: 0.22, type: "wheel" });
}

function addFoodStalls(x, z) {
  for (let i = 0; i < 3; i += 1) {
    const g = new THREE.Group();
    g.position.set(x + i * 2.2, 0.86, z + Math.sin(i) * 0.6);
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 1.2), i % 2 ? material.cream : material.pink);
    body.position.y = 0.5;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.05, 0.72, 4), i % 2 ? material.roof : material.red);
    roof.position.y = 1.38;
    roof.rotation.y = Math.PI / 4;
    g.add(body, roof);
    g.traverse(enableShadows);
    root.add(g);
  }
}

function addToyBooths(x, z, rot = 0) {
  const colors = [material.pink, material.roof, material.orange];
  for (let i = 0; i < 3; i += 1) {
    const g = new THREE.Group();
    g.position.set(x + Math.cos(rot) * i * 1.75, 0.82, z + Math.sin(rot) * i * 1.75);
    g.rotation.y = rot;
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.86, 1.0), colors[i % colors.length]);
    body.position.y = 0.43;
    const awning = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.16, 1.1), i % 2 ? material.gold : material.white);
    awning.position.y = 0.98;
    const finial = createStar(0.14, 0.06, 0.03, 0xffd75d);
    finial.position.y = 1.22;
    g.add(body, awning, finial);
    g.traverse(enableShadows);
    root.add(g);
  }
}

function addBuildLawn(x, z, rx, rz, index = 0) {
  const lawn = new THREE.Mesh(organicCylinderGeometry(1, 1, 0.055, 42, 0.08), material.meadow);
  lawn.position.set(x, 0.9, z);
  lawn.scale.set(rx, 1, rz);
  lawn.rotation.y = index * 0.34;
  lawn.receiveShadow = true;
  root.add(lawn);
  const dashes = 22;
  for (let i = 0; i < dashes; i += 1) {
    if (i % 2) continue;
    const a = (i / dashes) * Math.PI * 2;
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.035, 0.08), material.pathTrim);
    dash.position.set(x + Math.cos(a) * rx * 0.86, 0.96, z + Math.sin(a) * rz * 0.86);
    dash.rotation.y = -a + Math.PI / 2 + lawn.rotation.y;
    dash.castShadow = false;
    root.add(dash);
  }
}

function addDecorativeTileRing(x, z, rx, rz, count) {
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2;
    const tile = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.045, 0.18), i % 2 ? material.gold : material.pink2);
    tile.position.set(x + Math.cos(a) * rx, 0.93, z + Math.sin(a) * rz);
    tile.rotation.y = -a + Math.PI / 2;
    tile.castShadow = true;
    root.add(tile);
  }
}

function addWaterfallToMountain(parent) {
  const ribbon = new THREE.Mesh(new THREE.BoxGeometry(1.0, 5.4, 0.18), material.water);
  ribbon.position.set(4.2, 5.0, -2.84);
  ribbon.rotation.z = -0.12;
  const foam = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.07, 8, 36), material.foam);
  foam.position.set(4.0, 1.82, -3.0);
  foam.rotation.x = Math.PI / 2;
  const pool = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.0, 0.16, 30), material.water);
  pool.position.set(4.0, 0.88, -3.0);
  parent.add(ribbon, foam, pool);
  state.scenic.water.push(ribbon, foam, pool);
}

function addLamp(x, z, scale = 1) {
  const g = new THREE.Group();
  g.position.set(x, 0.86, z);
  g.scale.setScalar(scale);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 1.55, 8), material.dark);
  pole.position.y = 0.78;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), material.gold);
  cap.position.y = 1.62;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), toon(0xfff3a4, { emissive: 0xffd75d, emissiveIntensity: 0.45 }));
  bulb.position.y = 1.47;
  const light = new THREE.PointLight(0xffd75d, 0.35, 5);
  light.position.y = 1.5;
  g.add(pole, cap, bulb, light);
  g.traverse(enableShadows);
  state.scenic.lampLights.push(light);
  root.add(g);
}

function addFenceRing(x, z, rx, rz, count) {
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 0.56, 6), material.wood);
    post.position.set(x + Math.cos(a) * rx, 1.04, z + Math.sin(a) * rz);
    post.castShadow = true;
    root.add(post);
    if (i % 2 === 0) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.07, 0.08), material.gold);
      rail.position.set(x + Math.cos(a + Math.PI / count) * rx, 1.08, z + Math.sin(a + Math.PI / count) * rz);
      rail.rotation.y = -a + Math.PI / 2;
      rail.castShadow = true;
      root.add(rail);
    }
  }
}

function addBannerLine(points, count) {
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.35);
  const rope = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.025, 5, false), material.gold);
  rope.castShadow = true;
  root.add(rope);
  for (let i = 0; i < count; i += 1) {
    const p = curve.getPoint((i + 0.5) / count);
    const flag = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 3), [material.pink, material.roof, material.gold, material.orange][i % 4]);
    flag.position.copy(p).add(v(0, -0.18, 0));
    flag.rotation.set(Math.PI, 0, rand(-0.24, 0.24));
    flag.castShadow = true;
    state.scenic.flags.push(flag);
    root.add(flag);
  }
}

function addBalloonCluster(x, z, scale = 1) {
  const colors = [material.pink, material.roof, material.gold, material.purple, material.orange];
  const g = new THREE.Group();
  g.position.set(x, 0.9, z);
  g.scale.setScalar(scale);
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2;
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.25, 5), material.white);
    string.position.set(Math.cos(a) * 0.26, 1.1, Math.sin(a) * 0.18);
    const balloon = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), colors[i % colors.length]);
    balloon.position.set(string.position.x, 1.78 + Math.sin(i) * 0.18, string.position.z);
    balloon.scale.set(0.88, 1.16, 0.88);
    g.add(string, balloon);
    state.scenic.balloons.push(balloon);
  }
  g.traverse(enableShadows);
  root.add(g);
}

function addBeachDetails() {
  addBeachUmbrella(18.6, -15.5, 0.9);
  addBeachUmbrella(23.2, -9.0, 0.72);
  addBeachUmbrella(-22.8, -11.4, 0.78);
  addShellSculpture(16.4, -17.2);
  addShellSculpture(24.2, 8.8);
  for (let i = 0; i < 8; i += 1) {
    const boatToy = new THREE.Group();
    const a = rand(-0.6, 0.8);
    boatToy.position.set(rand(20, 28) * (i % 2 ? 1 : -1), 0.08, rand(-18, 17));
    boatToy.rotation.y = a;
    const hull = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.22, 0.46), i % 2 ? material.red : material.roof);
    const sail = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.8, 3), material.gold);
    sail.position.y = 0.62;
    sail.rotation.z = -0.1;
    boatToy.add(hull, sail);
    root.add(boatToy);
  }
}

function addBeachUmbrella(x, z, scale = 1) {
  const g = new THREE.Group();
  g.position.set(x, 0.58, z);
  g.scale.setScalar(scale);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.2, 8), material.wood);
  pole.position.y = 0.6;
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.42, 12), material.pink);
  shade.position.y = 1.18;
  g.add(pole, shade);
  g.traverse(enableShadows);
  root.add(g);
}

function addShellSculpture(x, z) {
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.72, 16, 10), material.pink2);
  shell.position.set(x, 0.74, z);
  shell.scale.set(1.35, 0.52, 0.9);
  shell.rotation.y = rand(0, Math.PI);
  shell.castShadow = true;
  root.add(shell);
}

function addStarArch(x, z, rot, color) {
  const g = new THREE.Group();
  g.position.set(x, 0.82, z);
  g.rotation.y = rot;
  const left = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 2.4, 8), material.gold);
  const right = left.clone();
  left.position.set(-1.08, 1.2, 0);
  right.position.set(1.08, 1.2, 0);
  const top = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.08, 8, 32, Math.PI), toon(color));
  top.position.y = 2.34;
  top.rotation.z = Math.PI;
  const star = createStar(0.34, 0.15, 0.06, 0xffd75d);
  star.position.y = 2.55;
  g.add(left, right, top, star);
  g.traverse(enableShadows);
  root.add(g);
}

function createSign(color) {
  const g = new THREE.Group();
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.46, 0.1), toon(color));
  const star = createStar(0.18, 0.08, 0.035, 0xffd75d);
  star.position.z = 0.08;
  g.add(board, star);
  return g;
}

function createShrub(scale = 1) {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i += 1) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), material.hedge);
    leaf.position.set(Math.cos(i * 1.7) * 0.22, Math.sin(i) * 0.08, Math.sin(i * 1.7) * 0.22);
    leaf.scale.setScalar(scale * rand(0.8, 1.2));
    g.add(leaf);
  }
  return g;
}

function addShrubPatch(x, z, scale = 1) {
  const g = createShrub(scale);
  g.position.set(x, 0.94, z);
  g.traverse(enableShadows);
  root.add(g);
}

function createCastle() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.95, 1.2, 20), material.cream);
  base.position.y = 0.8;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.11, 8, 48), material.gold);
  ring.position.y = 1.42;
  ring.rotation.x = Math.PI / 2;
  const keep = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.9, 2.35), material.pink);
  keep.position.y = 2.3;
  const balcony = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.35, 0.22, 20), material.plazaLight);
  balcony.position.set(0, 3.55, 0.18);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.25, 2.45, 6), material.roof);
  roof.position.y = 4.72;
  const star = createStar(0.62, 0.28, 0.12, 0xffd75d);
  star.position.set(0, 6.1, 0.15);
  const portal = new THREE.Mesh(new THREE.SphereGeometry(0.78, 18, 12), material.glowBlue);
  portal.position.set(0, 1.38, 1.24);
  portal.scale.set(1, 1.18, 0.22);
  for (let i = 0; i < 6; i += 1) {
    const a = Math.PI / 6 + i * Math.PI / 3;
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.48 + (i % 2) * 0.08, 0.62, 2.55 + (i % 2) * 0.45, 14), material.cream);
    const tr = new THREE.Mesh(new THREE.ConeGeometry(0.72 + (i % 2) * 0.08, 1.18, 12), i % 2 ? material.red : material.roof);
    tower.position.set(Math.cos(a) * 2.25, 1.85, Math.sin(a) * 1.88);
    tr.position.set(tower.position.x, 3.65 + (i % 2) * 0.42, tower.position.z);
    const miniStar = createStar(0.16, 0.07, 0.025, 0xffd75d);
    miniStar.position.set(tower.position.x, tr.position.y + 0.74, tower.position.z);
    g.add(tower, tr, miniStar);
  }
  const light = new THREE.PointLight(0xffd75d, 2, 18);
  light.position.y = 4.6;
  const fountain = new THREE.Group();
  fountain.position.set(0, -0.08, 2.78);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, 0.28, 28), material.water);
  bowl.position.y = 0.58;
  const waterStar = createStar(0.48, 0.22, 0.08, 0x57e1ff);
  waterStar.position.y = 0.84;
  waterStar.rotation.x = -Math.PI / 2;
  fountain.add(bowl, waterStar);
  g.add(base, ring, keep, balcony, roof, portal, star, light, fountain);
  g.traverse(enableShadows);
  return g;
}

function createPlayer() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.48, 20, 14), material.white);
  body.position.y = 0.62;
  body.scale.set(0.82, 1.08, 0.62);
  const vest = new THREE.Mesh(new THREE.SphereGeometry(0.38, 18, 12), material.roof);
  vest.position.set(0, 0.62, 0.16);
  vest.scale.set(0.72, 0.88, 0.38);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 14), material.skin);
  head.position.y = 1.34;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.16, 16), material.roof);
  cap.position.y = 1.7;
  const wandHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.72, 8), material.gold);
  wandHandle.position.set(0.54, 0.82, 0.18);
  wandHandle.rotation.z = -0.35;
  const wandStar = createStar(0.22, 0.1, 0.04, 0xffd75d);
  wandStar.position.set(0.68, 1.17, 0.18);
  const footL = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), material.roofDark);
  const footR = footL.clone();
  footL.position.set(-0.18, 0.11, 0.06);
  footR.position.set(0.18, 0.11, 0.06);
  footL.scale.set(1.0, 0.38, 1.25);
  footR.scale.copy(footL.scale);
  addFace(g, 1.34, 0.36, 0.7);
  g.add(body, vest, head, cap, wandHandle, wandStar, footL, footR);
  g.traverse(enableShadows);
  return g;
}

function createWand() {
  const g = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.78, 8), material.gold);
  handle.rotation.z = -0.45;
  const star = createStar(0.18, 0.08, 0.035, 0xffd75d);
  star.position.set(0.22, 0.37, 0);
  g.add(handle, star);
  return g;
}

function createCoasterTrain() {
  const g = new THREE.Group();
  const colors = [material.red, material.gold, material.roof];
  for (let i = 0; i < 4; i += 1) {
    const car = new THREE.Group();
    car.userData.carOffset = i * 0.012;
    car.userData.ride = "coaster";
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.34, 0.92), colors[i % colors.length]);
    body.position.y = 0.24;
    const cabin = new THREE.Mesh(new THREE.SphereGeometry(0.36, 18, 10), i % 2 ? material.cream : material.pink2);
    cabin.position.y = 0.48;
    cabin.scale.set(1.05, 0.48, 0.78);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.39, 0.72, 4), i === 0 ? material.gold : material.cream);
    nose.position.set(0, 0.27, -0.62);
    nose.rotation.x = -Math.PI / 2;
    const leftFin = createStar(0.12, 0.05, 0.02, 0xffd75d);
    const rightFin = createStar(0.12, 0.05, 0.02, 0xffd75d);
    leftFin.position.set(-0.48, 0.38, -0.1);
    rightFin.position.set(0.48, 0.38, -0.1);
    car.add(body, cabin, nose, leftFin, rightFin);
    car.traverse((child) => {
      child.userData.ride = "coaster";
      enableShadows(child);
    });
    g.add(car);
  }
  g.userData.cameraPosition = v(0, 2, 0);
  g.userData.cameraYaw = 0;
  g.userData.cameraPitch = -0.04;
  return g;
}

function createBoat() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.34, 1.06), material.roof);
  base.position.y = 0.28;
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.24, 0.78), material.pink);
  hood.position.set(0, 0.48, -0.18);
  hood.scale.set(1, 0.7, 1);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.86, 4), material.gold);
  nose.position.set(0, 0.42, -0.72);
  nose.rotation.x = -Math.PI / 2;
  nose.scale.set(1.18, 0.72, 0.82);
  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.38, 18, 10), material.glass);
  cockpit.position.set(0, 0.74, 0.12);
  cockpit.scale.set(1.2, 0.48, 0.86);
  const bumper = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.065, 8, 36), material.gold);
  bumper.position.y = 0.34;
  bumper.rotation.x = Math.PI / 2;
  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.12, 0.18), material.gold);
  spoiler.position.set(0, 0.72, 0.58);
  const spoilerL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.34, 0.12), material.gold);
  const spoilerR = spoilerL.clone();
  spoilerL.position.set(-0.45, 0.55, 0.55);
  spoilerR.position.set(0.45, 0.55, 0.55);
  const lightL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), material.glowBlue);
  const lightR = lightL.clone();
  lightL.position.set(-0.36, 0.48, -0.78);
  lightR.position.set(0.36, 0.48, -0.78);
  const wheelA = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.18, 14), material.dark);
  const wheelB = wheelA.clone();
  const wheelC = wheelA.clone();
  const wheelD = wheelA.clone();
  wheelA.position.set(-0.72, 0.18, -0.38);
  wheelB.position.set(0.72, 0.18, -0.38);
  wheelC.position.set(-0.72, 0.18, 0.38);
  wheelD.position.set(0.72, 0.18, 0.38);
  [wheelA, wheelB, wheelC, wheelD].forEach((wheel) => { wheel.rotation.z = Math.PI / 2; });
  g.add(base, hood, nose, cockpit, bumper, spoiler, spoilerL, spoilerR, lightL, lightR, wheelA, wheelB, wheelC, wheelD);
  g.traverse(enableShadows);
  return g;
}

function createTower(type) {
  const def = TOWER_DEFS[type];
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.78, 0.26, 18), material.plazaLight);
  base.position.y = 0.13;
  const trim = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.055, 8, 24), material.gold);
  trim.position.y = 0.28;
  trim.rotation.x = Math.PI / 2;
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.66, 14), material.cream);
  pedestal.position.y = 0.58;
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 14), toon(def.color, { emissive: def.color, emissiveIntensity: 0.16 }));
  core.position.y = 1.02;
  if (type === "spark") {
    const star = createStar(0.42, 0.18, 0.08, def.color);
    star.position.y = 1.28;
    const wandPost = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 0.72, 8), material.gold);
    wandPost.position.y = 0.9;
    g.add(wandPost, star);
  } else if (type === "frost") {
    core.geometry = new THREE.ConeGeometry(0.52, 1.35, 6);
    core.position.y = 1.22;
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.035, 8, 24), toon(def.color));
    halo.position.y = 1.0;
    halo.rotation.x = Math.PI / 2;
    g.add(halo);
  } else if (type === "vine") {
    core.scale.set(1.2, 0.55, 1.2);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.07, 8, 28), toon(def.color));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.72;
    const leafA = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), material.leaf);
    const leafB = leafA.clone();
    leafA.position.set(-0.32, 1.04, 0.12);
    leafA.scale.set(1.35, 0.72, 0.62);
    leafB.position.set(0.34, 0.96, -0.12);
    leafB.scale.set(1.25, 0.68, 0.58);
    g.add(ring, leafA, leafB);
  } else {
    core.scale.set(0.95, 0.62, 0.95);
    const cookie = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.18, 22), toon(0xd7954d));
    cookie.position.set(0, 1.08, 0.42);
    cookie.rotation.x = Math.PI / 2;
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 0.62, 12), material.dark);
    barrel.position.set(0, 1.08, 0.78);
    barrel.rotation.x = Math.PI / 2;
    g.add(cookie, barrel);
  }
  const glow = new THREE.PointLight(def.color, 0.85, 8);
  glow.position.y = 1.4;
  const actionRing = new THREE.Mesh(
    new THREE.RingGeometry(0.95, 1.18, 34),
    new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.44, side: THREE.DoubleSide }),
  );
  actionRing.rotation.x = -Math.PI / 2;
  actionRing.position.y = 0.04;
  actionRing.visible = false;
  g.userData.actionRing = actionRing;
  g.add(base, trim, pedestal, core, glow, actionRing);
  g.traverse(enableShadows);
  return g;
}

function setupPaintedMapLayer() {
  if (!ui.paintedMapLayer) return;
  ui.paintedMapLayer.innerHTML = "";
  ui.paintedMapLayer.addEventListener("click", (event) => {
    if (event.target !== ui.paintedMapLayer) return;
    if (state.view !== "overview" || state.quiz.active) return;
    const screenPoint = { x: event.clientX, y: event.clientY };
    const worldPoint = screenPointToParkWorld(screenPoint);
    placeTower(worldPoint, screenPoint, true);
  });
  PAINTED_BUILD_SPOTS.forEach((spot) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "map-hotspot";
    button.dataset.spot = spot.id;
    button.style.left = `${spot.x}%`;
    button.style.top = `${spot.y}%`;
    button.style.width = `${spot.w}%`;
    button.style.height = `${spot.h}%`;
    button.style.setProperty("--hotspot-rot", `${spot.rot}deg`);
    button.title = "点击建造选中的炮塔";
    button.setAttribute("aria-label", "可建造草坪");
    button.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      buildOnPaintedSpot(spot, button);
    });
    ui.paintedMapLayer.appendChild(button);
  });
  MAP_PROJECTS.forEach((project) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `map-project map-project--${project.id}`;
    button.dataset.project = project.id;
    button.style.left = `${project.x}%`;
    button.style.top = `${project.y}%`;
    button.innerHTML = `<span>${project.icon}</span><b>${project.label}</b>`;
    button.addEventListener("pointerdown", (event) => event.stopPropagation());
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      startMapProject(project.id);
    });
    ui.paintedMapLayer.appendChild(button);
  });
}

function buildOnPaintedSpot(spot, button) {
  if (state.view !== "overview") return;
  if (state.quiz.active) return;
  if (!state.running) {
    prompt("先点“进入乐园”，再在草坪上建造炮塔。");
    return;
  }
  if (state.paintedBuilds.some((build) => build.spotId === spot.id)) {
    prompt("这块草坪已经建好炮塔了，换一块草坪继续守护。");
    return;
  }
  const def = TOWER_DEFS[state.selectedTower];
  if (!def) return;
  if (state.coins < def.cost) {
    prompt(`${def.name} 需要 ${def.cost} 星币。`);
    return;
  }

  const group = createTower(state.selectedTower);
  group.position.copy(spot.world);
  root.add(group);
  state.towers.push({ type: state.selectedTower, group, cooldown: rand(0, 0.4), paintedSpot: spot.id });
  state.coins -= def.cost;
  state.learn = Math.min(100, state.learn + 4);

  const marker = document.createElement("span");
  marker.className = "map-tower";
  marker.style.left = `${spot.x}%`;
  marker.style.top = `${spot.y}%`;
  marker.style.setProperty("--tower-color", MAP_TOWER_COLORS[state.selectedTower] || "#56d6ff");
  marker.style.setProperty("--tower-glow", `${MAP_TOWER_COLORS[state.selectedTower] || "#56d6ff"}88`);
  ui.paintedMapLayer.appendChild(marker);
  button.classList.add("is-occupied");
  button.setAttribute("aria-label", `${def.name} 已建造`);
  state.paintedBuilds.push({ spotId: spot.id, marker, tower: group, type: state.selectedTower, cooldown: rand(0.05, 0.35) });

  prompt(`${def.name} 建好了。点击其他虚线草坪继续布防。`);
  playSfx("build");
  updateUi();
}

function addFreeBuildMarker(worldPosition, screenPoint) {
  if (!ui.paintedMapLayer || !screenPoint) return;
  const def = TOWER_DEFS[state.selectedTower];
  const marker = document.createElement("span");
  const mapX = clamp((screenPoint.x / window.innerWidth) * 100, 3, 97);
  const mapY = clamp((screenPoint.y / window.innerHeight) * 100, 4, 96);
  marker.className = "map-tower";
  marker.style.left = `${mapX}%`;
  marker.style.top = `${mapY}%`;
  marker.style.setProperty("--tower-color", MAP_TOWER_COLORS[state.selectedTower] || "#56d6ff");
  marker.style.setProperty("--tower-glow", `${MAP_TOWER_COLORS[state.selectedTower] || "#56d6ff"}88`);
  marker.title = def ? def.name : "炮塔";
  ui.paintedMapLayer.appendChild(marker);
  state.paintedBuilds.push({
    mapX,
    mapY,
    marker,
    tower: state.towers[state.towers.length - 1]?.group,
    type: state.selectedTower,
    cooldown: rand(0.05, 0.35),
    world: worldPosition.clone(),
  });
}

function startMapProject(projectId) {
  if (!state.running) {
    prompt("先点“进入乐园”，再进入游乐项目。");
    return;
  }
  if (state.quiz.active) return;
  startRide(projectId);
}

function startRide(projectId) {
  if (projectId === "coaster") {
    state.view = "first";
    state.ride = "coaster";
    state.coasterBuff = 8;
    updateCoasterTrainPose(coasterTrain.userData.t || 0);
    player.position.copy(coasterTrain.userData.cameraPosition || coasterCurve.getPointAt(coasterTrain.userData.t || 0));
    prompt("极速飞车出发。飞车经过时会给炮塔加速，点右上视角按钮离开项目。");
  } else if (projectId === "boat") {
    state.view = "first";
    state.ride = "boat";
    player.position.copy(boat.position).add(v(0, 0.32, 0));
    prompt("卡丁车出发，会沿岛上赛道行驶，点右上视角按钮离开项目。");
  }
  updateUi();
}

function bindEvents() {
  window.addEventListener("resize", resize);
  window.addEventListener("keydown", (event) => {
    ensureAudio();
    const key = event.key.toLowerCase();
    keys.add(key);
    if (key === "v") toggleView();
    if (key === " " || key === "f") {
      event.preventDefault();
      attack();
    }
    if (key === "q") castLightning();
  });
  window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
  window.addEventListener("pointerdown", ensureAudio, { capture: true });

  ui.startBtn.addEventListener("click", () => {
    state.running = true;
    ui.startCurtain.style.display = "none";
    updateUi();
    prompt("守护开始：第一只怪物马上从海边入口出现，留意地图边缘和远处道路。");
  });
  ui.viewBtn.addEventListener("click", toggleView);
  ui.attackBtn.addEventListener("click", attack);
  ui.skillBtn.addEventListener("click", castLightning);
  ui.quizBtn?.addEventListener("click", () => openQuiz("practice"));
  ui.audioBtn?.addEventListener("click", toggleAudio);
  ui.quizClose.addEventListener("click", () => closeQuiz(false));
  ui.towerMenuUpgrade?.addEventListener("click", () => upgradeSelectedTower());
  ui.towerMenuSell?.addEventListener("click", () => sellSelectedTower());
  ui.towerMenuClose?.addEventListener("click", () => hideTowerMenu());

  document.querySelectorAll(".tower").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedTower = state.selectedTower === button.dataset.tower ? null : button.dataset.tower;
      updateTowerButtons();
      prompt(state.selectedTower ? `${TOWER_DEFS[state.selectedTower].name} 已选中，点击岛上空地建造。` : "已退出建造模式。");
    });
  });
  updateTowerButtons();

  canvas.addEventListener("pointerdown", beginPointer);
  canvas.addEventListener("pointermove", movePointer);
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);
  ui.lookPad.addEventListener("pointerdown", beginPointer);
  ui.lookPad.addEventListener("pointermove", movePointer);
  ui.lookPad.addEventListener("pointerup", endPointer);
  ui.lookPad.addEventListener("pointercancel", endPointer);
  canvas.addEventListener("wheel", (event) => {
    if (state.view !== "overview") return;
    event.preventDefault();
    const zoomDelta = clamp(event.deltaY, -120, 120);
    const zoomFactor = Math.exp(zoomDelta * 0.00145);
    state.cameraTargetDistance = clamp(
      state.cameraTargetDistance * zoomFactor,
      OVERVIEW_CAMERA_MIN_DISTANCE,
      OVERVIEW_CAMERA_MAX_DISTANCE,
    );
  }, { passive: false });

  ui.joystick.addEventListener("pointerdown", beginJoystick);
  ui.joystick.addEventListener("pointermove", updateJoystick);
  ui.joystick.addEventListener("pointerup", endJoystick);
  ui.joystick.addEventListener("pointercancel", endJoystick);
}

function tick() {
  const dt = Math.min(clock.getDelta(), 0.04);
  if (state.running && !state.quiz.active) {
    updatePark(dt);
    updatePlayer(dt);
    updateMapDefense(dt);
    updateCombat(dt);
  }
  updateTowerMenuPosition();
  updateScenic(dt);
  updateCamera(dt);
  updateUi();
  updateMinimap();
  updateAudio();
  renderer.render(scene, camera);
}

function updatePark(dt) {
  state.parkTime += dt * 2.2;
  state.lightningCooldown = Math.max(0, state.lightningCooldown - dt);
  state.attackCooldown = Math.max(0, state.attackCooldown - dt);
  state.quizCooldown = Math.max(0, state.quizCooldown - dt);
  state.coasterBuff = Math.max(0, state.coasterBuff - dt);
  state.boatSupplyTimer = Math.max(0, state.boatSupplyTimer - dt);
  state.learn = Math.min(100, state.learn + dt * 0.28);
  if (state.learn >= 100 && state.enemies.length < 5 && state.quizCooldown <= 0) openQuiz("energy");

  if (state.waveTimer > 0) {
    state.waveTimer -= dt;
    return;
  }

  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0 && state.spawned < state.waveBudget) {
    spawnEnemy();
    state.spawned += 1;
    state.spawnTimer = clamp(2.2 - state.threat * 0.06, 0.65, 2.2);
  }

  if (state.spawned >= state.waveBudget && state.enemies.length === 0) {
    state.coins += 50 + state.threat * 4;
    state.hp = Math.min(100, state.hp + 5);
    state.threat += 1;
    state.waveBudget = 5 + Math.floor(state.threat * 1.6);
    state.spawned = 0;
    state.waveTimer = clamp(10 - state.threat * 0.35, 5, 10);
    prompt(`怪物被挡住了。乐园进入短暂平静，下一轮强度 ${state.threat}。`);
  }
}

function updatePlayer(dt) {
  if (state.ride === "coaster") {
    player.position.copy(coasterTrain.userData.cameraPosition || coasterTrain.position).add(v(0, 0.1, 0));
    return;
  }
  if (state.ride === "boat") {
    player.position.copy(boat.position).add(v(0, 0.32, 0));
    return;
  }

  const move = new THREE.Vector2(0, 0);
  if (keys.has("w") || keys.has("arrowup")) move.y += 1;
  if (keys.has("s") || keys.has("arrowdown")) move.y -= 1;
  if (keys.has("a") || keys.has("arrowleft")) move.x -= 1;
  if (keys.has("d") || keys.has("arrowright")) move.x += 1;
  const joystickX = state.view === "first" ? state.joystick.x * 0.28 : state.joystick.x;
  const joystickY = state.view === "first" ? state.joystick.y * 0.82 : state.joystick.y;
  move.x += joystickX;
  move.y += joystickY;
  if (move.lengthSq() > 0.001) {
    state.playerTarget = null;
    move.normalize();
    const yaw = state.view === "first" ? state.firstYaw : state.cameraYaw + Math.PI;
    const lateral = -move.x;
    const forward = v(Math.sin(yaw), 0, Math.cos(yaw));
    const right = v(Math.cos(yaw), 0, -Math.sin(yaw));
    const dir = right.multiplyScalar(lateral).addScaledVector(forward, move.y).normalize();
    const walkSpeed = state.view === "first" ? (keys.has("shift") ? 5.0 : 3.2) : (keys.has("shift") ? 8.8 : 6.0);
    const next = player.position.clone().addScaledVector(dir, dt * walkSpeed);
    player.position.copy(resolvePlayerMovement(player.position, next));
    player.rotation.y = Math.atan2(dir.x, dir.z);
    if (state.view === "first") state.firstYaw = lerpAngle(state.firstYaw, player.rotation.y, 1 - Math.pow(0.56, dt));
    animatePlayer(dt);
  } else if (state.playerTarget) {
    const delta = state.playerTarget.clone().sub(player.position);
    delta.y = 0;
    if (delta.length() < 0.32) {
      state.playerTarget = null;
    } else {
      const dir = delta.normalize();
      const next = player.position.clone().addScaledVector(dir, dt * 4.2);
      player.position.copy(resolvePlayerMovement(player.position, next));
      player.rotation.y = Math.atan2(dir.x, dir.z);
      animatePlayer(dt);
    }
  }
  updateInteractTarget();
}

function updateCombat(dt) {
  for (const tower of state.towers) {
    const def = towerStats(tower);
    tower.cooldown = Math.max(0, tower.cooldown - dt);
    if (def.aura) {
      for (const enemy of state.enemies) {
        if (enemy.group.position.distanceTo(tower.group.position) < def.range) applySlow(enemy, def.slow, def.slowTime);
      }
      continue;
    }
    const target = nearestEnemy(tower.group.position, def.range + (state.coasterBuff > 0 ? 1.3 : 0));
    if (!target) continue;
    const delta = target.group.position.clone().sub(tower.group.position);
    tower.group.rotation.y = Math.atan2(delta.x, delta.z);
    if (tower.cooldown <= 0) {
      tower.cooldown = def.rate * (state.coasterBuff > 0 ? 0.78 : 1);
      fireBullet(tower.group.position.clone().add(v(0, 1.25, 0)), target, def, tower.type);
    }
  }

  for (const enemy of state.enemies) updateEnemy(enemy, dt);
  state.enemies = state.enemies.filter((enemy) => enemy.alive);

  for (const bullet of state.bullets) updateBullet(bullet, dt);
  state.bullets = state.bullets.filter((bullet) => bullet.alive);
  for (const coin of state.coins3d) updatePickup(coin, dt);
  state.coins3d = state.coins3d.filter((coin) => coin.alive);
}

function updateMapDefense(dt) {
  updateMapEffects(dt);
}

function updateMapEnemies(dt) {
  for (const enemy of state.mapEnemies) {
    if (!enemy.alive) continue;
    if (enemy.slow > 0) enemy.slow = Math.max(0, enemy.slow - dt);
    else enemy.slowFactor = 1;
    const target = enemy.route[enemy.segment + 1];
    if (!target) {
      enemy.alive = false;
      enemy.node.remove();
      removeLinkedWorldEnemy(enemy);
      state.hp = Math.max(0, state.hp - enemy.damage);
      pulseMapCastle();
      if (state.hp <= 0) openQuiz("rescue");
      continue;
    }
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const distance = Math.hypot(dx, dy);
    const step = enemy.speed * enemy.slowFactor * dt;
    if (distance <= step) {
      enemy.x = target.x;
      enemy.y = target.y;
      enemy.segment += 1;
    } else {
      enemy.x += (dx / distance) * step;
      enemy.y += (dy / distance) * step;
    }
    positionMapNode(enemy.node, enemy.x, enemy.y);
    const hpBar = enemy.node.querySelector(".map-enemy__hp i");
    if (hpBar) hpBar.style.width = `${Math.max(0, enemy.hp / enemy.maxHp) * 100}%`;
  }
  state.mapEnemies = state.mapEnemies.filter((enemy) => enemy.alive);
}

function updateMapTowers(dt) {
  for (const build of state.paintedBuilds) {
    const def = TOWER_DEFS[build.type];
    const spot = PAINTED_BUILD_SPOTS.find((item) => item.id === build.spotId);
    const x = build.mapX ?? spot?.x;
    const y = build.mapY ?? spot?.y;
    if (!def || x == null || y == null) continue;
    build.cooldown = Math.max(0, (build.cooldown || 0) - dt);
    const target = nearestMapEnemy(x, y, mapTowerRange(build.type));
    if (!target) continue;
    if (build.cooldown <= 0) {
      build.cooldown = def.rate * (state.coasterBuff > 0 ? 0.78 : 1);
      const color = MAP_TOWER_COLORS[build.type] || "#56d6ff";
      const towerWorld = build.tower?.position || build.world;
      const targetWorld = target.worldEnemy?.group?.position;
      addMapSourceFlash(x, y, `${TOWER_DEFS[build.type]?.name || "炮塔"}发射`, color);
      addMapShot(x, y, target.x, target.y, color, 0.72);
      if (towerWorld && targetWorld) {
        addBeam(towerWorld.clone().add(v(0, 1.35, 0)), targetWorld.clone().add(v(0, 0.75, 0)), TOWER_DEFS[build.type]?.color || 0x56d6ff, 0.62, true);
      }
      damageMapEnemy(target, mapTowerDamage(build.type), build.type, {
        label: TOWER_DEFS[build.type]?.name || "炮塔",
        color,
        from: { x, y },
        worldFrom: towerWorld ? towerWorld.clone().add(v(0, 1.35, 0)) : null,
      });
      if (def.splash) {
        for (const enemy of state.mapEnemies) {
          if (enemy !== target && mapDistance(enemy.x, enemy.y, target.x, target.y) <= def.splash * 2.2) {
            damageMapEnemy(enemy, mapTowerDamage(build.type) * 0.45, build.type, {
              label: TOWER_DEFS[build.type]?.name || "炮塔",
              color,
              from: { x, y },
              worldFrom: towerWorld ? towerWorld.clone().add(v(0, 1.35, 0)) : null,
            });
          }
        }
      }
    }
  }
}

function updateMapEffects(dt) {
  for (const effect of state.mapEffects) {
    effect.life -= dt;
    if (effect.node.classList.contains("map-shot")) {
      effect.node.style.opacity = `${Math.max(0, effect.life / effect.maxLife)}`;
    }
    if (effect.life <= 0) {
      effect.node.remove();
      effect.dead = true;
    }
  }
  state.mapEffects = state.mapEffects.filter((effect) => !effect.dead);
}

function nearestMapEnemy(x, y, range) {
  let best = null;
  let bestDistance = range;
  for (const enemy of state.mapEnemies) {
    if (!enemy.alive) continue;
    const distance = mapDistance(x, y, enemy.x, enemy.y);
    if (distance < bestDistance) {
      best = enemy;
      bestDistance = distance;
    }
  }
  return best;
}

function damageMapEnemy(enemy, amount, sourceType, source = {}) {
  if (!enemy.alive) return;
  const def = TOWER_DEFS[sourceType];
  if (def?.slow) {
    enemy.slowFactor = Math.min(enemy.slowFactor, def.slow);
    enemy.slow = Math.max(enemy.slow, def.slowTime || 0.6);
  }
  enemy.hp -= amount;
  enemy.node.classList.add("is-hit");
  window.setTimeout(() => enemy.node.classList.remove("is-hit"), 120);
  if (enemy.hp <= 0) {
    const worldEnemy = enemy.worldEnemy;
    const worldPosition = worldEnemy?.group?.position?.clone();
    if (source.worldFrom && worldPosition) {
      addBeam(source.worldFrom.clone(), worldPosition.clone().add(v(0, 0.8, 0)), TOWER_DEFS[sourceType]?.color || 0xffd75d, 0.95, true);
      addKillFlash(worldPosition, TOWER_DEFS[sourceType]?.color || 0xffd75d);
    }
    enemy.alive = false;
    enemy.node.classList.add("is-dying");
    removeLinkedWorldEnemy(enemy);
    state.coins += enemy.reward;
    state.learn = Math.min(100, state.learn + 3.5);
    if (source.from) {
      addMapSourceFlash(source.from.x, source.from.y, `${source.label || "防御"}击杀`, source.color || "#ffd75d");
      addMapShot(source.from.x, source.from.y, enemy.x, enemy.y, source.color || "#ffd75d", 1.15, true);
    }
    addMapBurst(enemy.x, enemy.y, source.color || MAP_ENEMY_COLORS[enemy.type] || "#ffd75d", true);
    addMapKillLabel(enemy.x, enemy.y, source.label || "防御", source.color || MAP_ENEMY_COLORS[enemy.type] || "#ffd75d");
    state.mapEffects.push({ node: enemy.node, life: 0.72, maxLife: 0.72 });
    prompt(`${source.label || "防御"}消灭了${ENEMY_NAMES[enemy.type] || "怪物"}。`);
    playSfx("pop");
  }
}

function addMapShot(x1, y1, x2, y2, color, life = 0.22, strong = false) {
  const shot = document.createElement("span");
  shot.className = strong ? "map-shot map-shot--kill" : "map-shot";
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  shot.style.left = `${x1}%`;
  shot.style.top = `${y1}%`;
  shot.style.width = `${length}%`;
  shot.style.setProperty("--shot-color", color);
  shot.style.transform = `translateY(-50%) rotate(${Math.atan2(dy, dx)}rad)`;
  ui.paintedMapLayer.appendChild(shot);
  state.mapEffects.push({ node: shot, life, maxLife: life });
}

function addMapBurst(x, y, color, strong = false) {
  const burst = document.createElement("span");
  burst.className = strong ? "map-burst map-burst--kill" : "map-burst";
  burst.style.left = `${x}%`;
  burst.style.top = `${y}%`;
  burst.style.setProperty("--burst-color", color);
  ui.paintedMapLayer.appendChild(burst);
  state.mapEffects.push({ node: burst, life: strong ? 0.68 : 0.45, maxLife: strong ? 0.68 : 0.45 });
}

function addMapKillLabel(x, y, label, color) {
  if (!ui.paintedMapLayer) return;
  const node = document.createElement("span");
  node.className = "map-kill-label";
  node.textContent = label;
  node.style.left = `${x}%`;
  node.style.top = `${y}%`;
  node.style.setProperty("--label-color", color);
  ui.paintedMapLayer.appendChild(node);
  state.mapEffects.push({ node, life: 0.9, maxLife: 0.9 });
}

function addMapSourceFlash(x, y, label, color) {
  if (!ui.paintedMapLayer) return;
  const node = document.createElement("span");
  node.className = "map-source-flash";
  node.textContent = label;
  node.style.left = `${x}%`;
  node.style.top = `${y}%`;
  node.style.setProperty("--source-color", color);
  ui.paintedMapLayer.appendChild(node);
  state.mapEffects.push({ node, life: 0.9, maxLife: 0.9 });
}

function pulseMapCastle() {
  addMapBurst(50, 43, "#ff6174");
}

function positionMapNode(node, x, y) {
  node.style.left = `${x}%`;
  node.style.top = `${y}%`;
}

function mapDistance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function mapTowerRange(type) {
  if (type === "vine") return 15;
  if (type === "cookie") return 23;
  return type === "frost" ? 22 : 24;
}

function mapTowerDamage(type) {
  const base = TOWER_DEFS[type]?.damage || 16;
  return base * (state.coasterBuff > 0 ? 1.16 : 1);
}

function spawnEnemy() {
  const type = chooseEnemyType();
  const def = ENEMY_DEFS[type];
  const baseRoute = enemyRoutes[Math.floor(Math.random() * enemyRoutes.length)];
  const laneOffset = ((state.spawned % 4) - 1.5) * 0.72 + rand(-0.18, 0.18);
  const route = offsetEnemyRoute(baseRoute, laneOffset);
  const scale = 1 + state.threat * 0.08;
  const group = createEnemy(type, def);
  group.position.copy(route[0]);
  root.add(group);
  const worldEnemy = {
    type,
    group,
    route,
    segment: 0,
    hp: def.hp * scale,
    maxHp: def.hp * scale,
    shield: (def.shield || 0) * scale,
    maxShield: (def.shield || 0) * scale,
    speed: def.speed * (1 + state.threat * 0.012) * rand(0.92, 1.08),
    bobSeed: rand(0, Math.PI * 2),
    laneOffset,
    damage: def.damage,
    reward: def.reward,
    slow: 0,
    slowFactor: 1,
    alive: true,
  };
  state.enemies.push(worldEnemy);
  addBurst(route[0].clone().add(v(0, 0.4, 0)), def.color);
  if (state.spawned === 0) {
    prompt(`${ENEMY_NAMES[type] || "怪物"}来了！它们会沿路往城堡走，炮塔会发光拦截。`);
  }
}

function offsetEnemyRoute(route, amount) {
  return route.map((point, index) => {
    const previous = route[Math.max(0, index - 1)];
    const next = route[Math.min(route.length - 1, index + 1)];
    const dir = next.clone().sub(previous);
    dir.y = 0;
    if (dir.lengthSq() < 0.001) return point.clone();
    dir.normalize();
    return point.clone().add(v(-dir.z * amount, 0, dir.x * amount));
  });
}

function spawnMapEnemy(type, scale = 1) {
  if (!ui.paintedMapLayer) return null;
  const def = ENEMY_DEFS[type] || ENEMY_DEFS.blob;
  const route = MAP_ENEMY_ROUTES[Math.floor(Math.random() * MAP_ENEMY_ROUTES.length)].map((point) => ({ ...point }));
  const node = document.createElement("span");
  node.className = `map-enemy map-enemy--${type}`;
  node.style.setProperty("--enemy-color", MAP_ENEMY_COLORS[type] || "#58d886");
  const hp = def.hp * scale * 0.72;
  const enemy = {
    type,
    node,
    route,
    segment: 0,
    x: route[0].x,
    y: route[0].y,
    hp,
    maxHp: hp,
    speed: (def.speed * 4.8) / Math.sqrt(scale),
    reward: def.reward,
    damage: def.damage,
    slow: 0,
    slowFactor: 1,
    alive: true,
  };
  node.innerHTML = `<span class="map-enemy__body"></span><span class="map-enemy__hp"><i></i></span>`;
  ui.paintedMapLayer.appendChild(node);
  state.mapEnemies.push(enemy);
  positionMapNode(node, enemy.x, enemy.y);
  return enemy;
}

function removeLinkedWorldEnemy(mapEnemy) {
  const worldEnemy = mapEnemy.worldEnemy;
  if (!worldEnemy || !worldEnemy.alive) return;
  worldEnemy.alive = false;
  root.remove(worldEnemy.group);
}

function cleanupWorldEnemies() {
  state.enemies = state.enemies.filter((enemy) => enemy.alive);
}

function createEnemy(type, def) {
  const g = new THREE.Group();
  const bodyMat = toon(def.color);
  const body = new THREE.Mesh(type === "shell" ? new THREE.SphereGeometry(0.64, 18, 12) : new THREE.SphereGeometry(0.5, 18, 12), bodyMat);
  body.position.y = type === "jumper" ? 0.74 : type === "giant" ? 0.82 : 0.54;
  body.scale.set(type === "jumper" ? 0.82 : type === "blob" ? 1.12 : 1, type === "shell" ? 0.62 : type === "jumper" ? 1.22 : type === "blob" ? 0.92 : 1, type === "shell" ? 1.18 : type === "blob" ? 0.94 : 1);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 8), material.white);
  belly.position.set(0, body.position.y - 0.02, 0.38);
  belly.scale.set(1, 0.72, 0.34);
  g.add(body, belly);
  if (type === "blob") {
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.28, 6), material.gold);
    cap.position.set(0, 1.0, 0.02);
    const nubs = [-0.34, 0, 0.34].map((x, index) => {
      const nub = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), bodyMat);
      nub.position.set(x, 0.72 + Math.sin(index) * 0.06, -0.25);
      return nub;
    });
    g.add(cap, ...nubs);
  }
  if (type === "jumper") {
    const earGeo = new THREE.ConeGeometry(0.12, 0.42, 8);
    const earL = new THREE.Mesh(earGeo, bodyMat);
    const earR = earL.clone();
    earL.position.set(-0.22, 1.22, 0.02);
    earR.position.set(0.22, 1.22, 0.02);
    earL.rotation.z = 0.28;
    earR.rotation.z = -0.28;
    const footGeo = new THREE.SphereGeometry(0.16, 10, 8);
    const footL = new THREE.Mesh(footGeo, material.dark);
    const footR = footL.clone();
    footL.position.set(-0.25, 0.18, 0.18);
    footR.position.set(0.25, 0.18, 0.18);
    footL.scale.set(1.3, 0.38, 0.8);
    footR.scale.copy(footL.scale);
    g.add(earL, earR, footL, footR);
  }
  if (type === "shell") {
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.64, 18, 10), toon(0x9bd66f));
    shell.position.set(0, 0.72, -0.08);
    shell.scale.set(1.22, 0.42, 0.92);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.08, 0.08), material.leaf);
    stripe.position.set(0, 0.96, -0.08);
    g.add(shell, stripe);
  }
  if (type === "shield" || type === "giant") {
    const shield = new THREE.Mesh(new THREE.SphereGeometry(type === "giant" ? 0.85 : 0.58, 18, 12), material.glass);
    shield.position.y = type === "giant" ? 0.88 : 0.62;
    shield.scale.set(1.08, 1, 0.42);
    g.add(shield);
  }
  if (type === "shield") {
    const antennaGeo = new THREE.CylinderGeometry(0.025, 0.035, 0.45, 6);
    const antennaL = new THREE.Mesh(antennaGeo, material.glowBlue);
    const antennaR = antennaL.clone();
    antennaL.position.set(-0.24, 1.02, 0.02);
    antennaR.position.set(0.24, 1.02, 0.02);
    antennaL.rotation.z = -0.34;
    antennaR.rotation.z = 0.34;
    const lightL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), material.glowBlue);
    const lightR = lightL.clone();
    lightL.position.set(-0.32, 1.22, 0.02);
    lightR.position.set(0.32, 1.22, 0.02);
    g.add(antennaL, antennaR, lightL, lightR);
  }
  if (type === "giant") {
    const hornGeo = new THREE.ConeGeometry(0.13, 0.42, 8);
    const hornL = new THREE.Mesh(hornGeo, material.gold);
    const hornR = hornL.clone();
    hornL.position.set(-0.33, 1.45, 0.04);
    hornR.position.set(0.33, 1.45, 0.04);
    hornL.rotation.z = 0.35;
    hornR.rotation.z = -0.35;
    g.add(hornL, hornR);
    g.scale.setScalar(1.65);
  }
  addFace(g, body.position.y + 0.03, 0.44, type === "giant" ? 1.15 : 0.78);
  g.traverse(enableShadows);
  return g;
}

function updateEnemy(enemy, dt) {
  if (!enemy.alive) return;
  if (enemy.slow > 0) enemy.slow -= dt;
  else enemy.slowFactor = 1;
  const target = enemy.route[enemy.segment + 1];
  if (!target) {
    const position = enemy.group.position.clone();
    enemy.alive = false;
    root.remove(enemy.group);
    state.hp = Math.max(0, state.hp - enemy.damage);
    addBurst(position.clone().add(v(0, 0.5, 0)), 0xff6174);
    addBeam(position.clone().add(v(0, 0.7, 0)), castle.position.clone().add(v(0, 1.4, 0)), 0xff6174, 0.78, true);
    pulseCastle(0xff6174);
    prompt(`${ENEMY_NAMES[enemy.type] || "怪物"}撞到了城堡，城堡能量减少。`);
    if (state.hp <= 0) openQuiz("rescue");
    return;
  }
  const delta = target.clone().sub(enemy.group.position);
  delta.y = 0;
  const step = dt * enemy.speed * enemy.slowFactor;
  if (delta.length() <= Math.max(0.28, step)) {
    enemy.group.position.copy(target);
    enemy.segment += 1;
  }
  else {
    const dir = delta.normalize();
    enemy.group.position.addScaledVector(dir, step);
    enemy.group.rotation.y = Math.atan2(dir.x, dir.z);
  }
  separateEnemy(enemy, dt);
  const time = performance.now() * 0.001 + enemy.bobSeed;
  const bounce = enemy.type === "jumper" ? Math.abs(Math.sin(time * 7.5)) * 0.55 : Math.sin(time * 4.2) * 0.035;
  enemy.group.position.y = 0.35 + bounce;
  enemy.group.rotation.z = Math.sin(time * (enemy.type === "shell" ? 3.2 : 5.1)) * (enemy.type === "giant" ? 0.035 : 0.075);
}

function separateEnemy(enemy, dt) {
  const push = v(0, 0, 0);
  for (const other of state.enemies) {
    if (other === enemy || !other.alive) continue;
    const dx = enemy.group.position.x - other.group.position.x;
    const dz = enemy.group.position.z - other.group.position.z;
    const distanceSq = dx * dx + dz * dz;
    if (distanceSq < 0.0001 || distanceSq > 1.25) continue;
    const distance = Math.sqrt(distanceSq);
    const strength = (1.12 - distance) / 1.12;
    push.x += (dx / distance) * strength;
    push.z += (dz / distance) * strength;
  }
  if (push.lengthSq() > 0.001) {
    push.normalize().multiplyScalar(dt * 1.2);
    enemy.group.position.add(push);
  }
}

function fireBullet(origin, target, def, type) {
  const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), toon(def.color, { emissive: def.color, emissiveIntensity: 0.5 }));
  mesh.position.copy(origin);
  root.add(mesh);
  state.bullets.push({
    mesh,
    target,
    damage: def.damage,
    slow: def.slow,
    slowTime: def.slowTime,
    splash: def.splash || 0,
    type,
    label: TOWER_DEFS[type]?.name || "炮塔",
    color: def.color,
    origin: origin.clone(),
    alive: true,
    speed: 18,
  });
  playSfx("zap");
}

function updateBullet(bullet, dt) {
  if (!bullet.target.alive) {
    bullet.alive = false;
    root.remove(bullet.mesh);
    return;
  }
  const targetPos = bullet.target.group.position.clone().add(v(0, 0.72, 0));
  const delta = targetPos.sub(bullet.mesh.position);
  const step = bullet.speed * dt;
  if (delta.length() <= step) {
    addBeam(bullet.origin || bullet.mesh.position.clone(), bullet.target.group.position.clone().add(v(0, 0.72, 0)), bullet.color || TOWER_DEFS[bullet.type]?.color || 0xffd75d, 0.62, true);
    hitEnemy(bullet.target, bullet.damage, bullet);
    if (bullet.splash) {
      for (const enemy of state.enemies) {
        if (enemy !== bullet.target && enemy.group.position.distanceTo(bullet.target.group.position) < bullet.splash) {
          hitEnemy(enemy, bullet.damage * 0.55, bullet);
        }
      }
    }
    addBurst(bullet.mesh.position, TOWER_DEFS[bullet.type]?.color || 0xffd75d);
    bullet.alive = false;
    root.remove(bullet.mesh);
  } else {
    const previous = bullet.mesh.position.clone();
    bullet.mesh.position.addScaledVector(delta.normalize(), step);
    addBeam(previous, bullet.mesh.position.clone(), bullet.color || TOWER_DEFS[bullet.type]?.color || 0xffd75d, 0.12, false);
  }
}

function hitEnemy(enemy, amount, source = {}) {
  if (!enemy.alive) return;
  if (source.slow) applySlow(enemy, source.slow, source.slowTime);
  let left = amount;
  if (enemy.shield > 0) {
    const shieldHit = Math.min(enemy.shield, left);
    enemy.shield -= shieldHit;
    left -= shieldHit;
  }
  enemy.hp -= left;
  if (enemy.hp <= 0) killEnemy(enemy, source);
}

function killEnemy(enemy, source = {}) {
  const position = enemy.group.position.clone();
  const sourcePosition = source.origin || source.mesh?.position;
  enemy.alive = false;
  root.remove(enemy.group);
  state.coins += enemy.reward;
  state.learn = Math.min(100, state.learn + 3.5);
  spawnCoin(position);
  addBurst(position, source.color || ENEMY_DEFS[enemy.type].color);
  addKillFlash(position, source.color || ENEMY_DEFS[enemy.type].color);
  if (sourcePosition) addBeam(sourcePosition.clone(), position.clone().add(v(0, 0.8, 0)), source.color || ENEMY_DEFS[enemy.type].color, 0.95, true);
  prompt(`${source.label || "防御"}消灭了${ENEMY_NAMES[enemy.type] || "怪物"}。`);
  playSfx("pop");
}

function attack() {
  if (state.attackCooldown > 0 || state.quiz.active) return;
  state.attackCooldown = 0.42;
  let hit = false;
  const origin = player.position.clone();
  const worldTarget = nearestEnemy(origin, 8.5) || nearestEnemy(castle.position, 40);
  if (worldTarget) {
    hitEnemy(worldTarget, 32 + state.threat * 1.5, { slow: 0.82, slowTime: 0.4, label: "星杖", color: 0xffd75d });
    addBeam(origin.clone().add(v(0, 1.45, 0)), worldTarget.group.position.clone().add(v(0, 0.7, 0)), 0xffd75d, 0.62, true);
    hit = true;
  } else {
    addBurst(origin.clone().add(v(Math.sin(state.firstYaw) * 2, 1, Math.cos(state.firstYaw) * 2)), 0xffd75d);
  }
  prompt(hit ? "星杖命中怪物。" : "暂时没有怪物，继续建塔准备防守。");
  playSfx("attack");
}

function castLightning() {
  if (state.lightningCooldown > 0 || state.quiz.active) return;
  state.lightningCooldown = 12;
  let center = player.position.clone().add(v(Math.sin(state.firstYaw) * 7, 0, Math.cos(state.firstYaw) * 7));
  const target = nearestEnemy(player.position, 16) || nearestEnemy(castle.position, 40);
  if (target) center = target.group.position.clone();
  for (const enemy of state.enemies) {
    if (enemy.group.position.distanceTo(center) < 6.8) hitEnemy(enemy, 70 + state.threat * 5, { slow: 0.45, slowTime: 1.8, label: "闪电技能", color: 0xfff36d });
  }
  addLightning(center);
  prompt("城堡闪电清扫了一片区域。");
  playSfx("lightning");
}

function placeTower(point, screenPoint = null, screenBuild = false) {
  if (!state.selectedTower) {
    prompt("先选择一个炮塔；再次点击已选按钮可以退出建造模式。");
    return;
  }
  const def = TOWER_DEFS[state.selectedTower];
  if (!def) return;
  if (!state.running) {
    prompt("先点“进入乐园”，再在岛上建造炮塔。");
    return;
  }
  if (!(screenBuild ? isScreenBuildable(screenPoint) : isBuildable(point))) {
    prompt("这里不能建造，换到空地、沙滩或浅水边。");
    return;
  }
  if (state.coins < def.cost) {
    prompt(`${def.name} 需要 ${def.cost} 星币。`);
    return;
  }
  for (const tower of state.towers) {
    if (tower.group.position.distanceTo(point) < 2.1) {
      prompt("炮塔之间留一点空间。");
      return;
    }
  }
  const group = createTower(state.selectedTower);
  group.position.copy(point).setY(0.72);
  root.add(group);
  const tower = { type: state.selectedTower, group, cooldown: rand(0, 0.4), level: 1, spent: def.cost, obstacle: { x: point.x, z: point.z, radius: 1.35 } };
  group.userData.tower = tower;
  group.traverse((child) => { child.userData.tower = tower; });
  state.towers.push(tower);
  state.obstacles.push(tower.obstacle);
  state.coins -= def.cost;
  state.learn = Math.min(100, state.learn + 4);
  addFreeBuildMarker(group.position, screenPoint);
  prompt(`${def.name} 建好了。`);
  state.selectedTower = null;
  updateTowerButtons();
  playSfx("build");
  updateUi();
}

function updateScenic(dt) {
  const coasterSpeed = state.ride === "coaster" ? 0.082 : 0.055;
  coasterTrain.userData.t = (coasterTrain.userData.t + dt * coasterSpeed) % 1;
  const t = coasterTrain.userData.t;
  updateCoasterTrainPose(t);
  if (state.ride === "coaster") {
    state.coasterBuff = 5;
  }

  boat.userData.t = (boat.userData.t + dt * 0.035) % 1;
  const bp = bumperCarPointAt(boat.userData.t);
  const bp2 = bumperCarPointAt((boat.userData.t + 0.01) % 1);
  boat.position.copy(bp);
  boat.rotation.y = Math.atan2(bp2.x - bp.x, bp2.z - bp.z) + Math.PI / 2;
  boat.userData.cameraYaw = Math.atan2(bp2.x - bp.x, bp2.z - bp.z);
  boat.visible = state.ride !== "boat";
  if (state.ride === "boat" && state.boatSupplyTimer <= 0) {
    state.boatSupplyTimer = 8;
    state.coins += 18;
    prompt("卡丁车通过奖励点，获得星币。");
  }

  for (const effect of state.effects) {
    if (effect.type === "scenicSpin") effect.group.rotation.y += dt * effect.spin;
    if (effect.type === "wheel") {
      effect.wheelRig.rotation.x += dt * effect.spin;
      effect.cabins.forEach((cabin) => {
        cabin.rotation.x = -effect.wheelRig.rotation.x;
      });
    }
    if (effect.life !== Infinity) {
      effect.life -= dt;
      if (effect.type !== "beam") effect.group.scale.multiplyScalar(1 + dt * (effect.type === "killFlash" ? 1.45 : 0.9));
      effect.group.traverse((child) => {
        if (child.material?.transparent) child.material.opacity = Math.max(0, child.material.opacity - dt * (effect.type === "beam" ? 0.55 : 0.9));
        if (child.isLight) child.intensity = Math.max(0, child.intensity - dt * 4);
      });
      if (effect.life <= 0) {
        root.remove(effect.group);
        effect.dead = true;
      }
    }
  }
  const time = performance.now() * 0.001;
  state.scenic.flags.forEach((flag, index) => {
    flag.rotation.z = Math.sin(time * 2.4 + index) * 0.12;
  });
  state.scenic.balloons.forEach((balloon, index) => {
    balloon.position.y += Math.sin(time * 1.7 + index * 0.8) * dt * 0.08;
  });
  state.scenic.pterodactyls.forEach((flyer, index) => {
    const a = time * 0.34 + flyer.t + index * 1.7;
    const dive = Math.sin(a * 1.9) * 0.5 + Math.sin(a * 0.7) * 0.5;
    const x = Math.cos(a) * 18 + Math.sin(a * 2.1) * 3.2;
    const z = Math.sin(a * 0.86) * 13 + Math.cos(a * 1.4) * 2.2;
    const y = 10.6 + Math.sin(a * 1.3) * 1.4 - Math.max(0, dive) * 2.6;
    const nextA = a + 0.035;
    const next = v(Math.cos(nextA) * 18 + Math.sin(nextA * 2.1) * 3.2, y, Math.sin(nextA * 0.86) * 13 + Math.cos(nextA * 1.4) * 2.2);
    const dir = next.sub(v(x, y, z)).normalize();
    flyer.group.position.set(x, y, z);
    flyer.group.rotation.y = Math.atan2(dir.x, dir.z);
    flyer.group.rotation.x = clamp(-dive * 0.18, -0.22, 0.18);
    flyer.group.rotation.z = clamp(Math.sin(a * 1.35) * 0.42, -0.5, 0.5);
    const flap = Math.sin(time * (dive > 0.35 ? 10.5 : 5.8) + flyer.t);
    flyer.wingL.rotation.z = -0.18 + flap * 0.5;
    flyer.wingR.rotation.z = 0.18 - flap * 0.5;
  });
  state.scenic.water.forEach((item, index) => {
    item.scale.x = 1 + Math.sin(time * 3 + index) * 0.025;
    item.scale.z = 1 + Math.cos(time * 2.4 + index) * 0.025;
  });
  state.effects = state.effects.filter((item) => !item.dead);
}

function updateCoasterTrainPose(t) {
  const leadT = wrap01(t);
  const lead = coasterCurve.getPointAt(leadT);
  const ahead = coasterCurve.getPointAt(wrap01(leadT + 0.006));
  const behind = coasterCurve.getPointAt(wrap01(leadT - 0.008));
  const leadDir = ahead.clone().sub(behind).normalize();
  coasterTrain.position.set(0, 0, 0);
  coasterTrain.rotation.set(0, 0, 0);
  coasterTrain.userData.cameraYaw = Math.atan2(leadDir.x, leadDir.z);
  coasterTrain.userData.cameraPitch = clamp(Math.asin(leadDir.y) * 0.45 - 0.04, -0.26, 0.18);
  coasterTrain.userData.cameraPosition = lead.clone().add(v(0, 1.18, 0)).addScaledVector(leadDir, 1.15);

  coasterTrain.children.forEach((car) => {
    const carT = wrap01(t - car.userData.carOffset);
    const p = coasterCurve.getPointAt(carT);
    const p2 = coasterCurve.getPointAt(wrap01(carT + 0.006));
    const p0 = coasterCurve.getPointAt(wrap01(carT - 0.006));
    const dir = p2.clone().sub(p0).normalize();
    const bend = Math.sign(p2.clone().sub(p).cross(p.clone().sub(p0)).y || 0);
    car.position.copy(p);
    car.lookAt(p2);
    car.rotateZ(bend * 0.14);
  });
}

function bumperCarPointAt(t) {
  const point = boatCurve.getPointAt(wrap01(t));
  point.y = kartTrackHeight(point);
  return point;
}

function updateCamera(dt) {
  player.visible = state.view !== "first";
  coasterTrain.visible = state.ride !== "coaster";
  if (state.view === "first") {
    const base = player.position.clone().add(v(0, state.ride === "boat" ? 0.46 : state.ride ? 0.52 : 0.98, 0));
    const yaw = state.ride === "coaster" ? coasterTrain.userData.cameraYaw : state.ride === "boat" ? boat.userData.cameraYaw : state.firstYaw;
    const pitch = state.ride === "coaster" ? coasterTrain.userData.cameraPitch + Math.sin(performance.now() * 0.009) * 0.018 : state.ride === "boat" ? -0.04 : state.firstPitch;
    const look = v(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
    const followDistance = state.ride ? 0 : 2.55;
    const desired = base.clone().addScaledVector(look, -followDistance);
    if (!state.ride) desired.y += 0.04;
    camera.position.lerp(desired, 1 - Math.pow(0.001, dt));
    camera.lookAt(base.clone().add(look.clone().multiplyScalar(state.ride ? 1 : 4.2)));
    if (!camera.children.includes(wand)) camera.add(wand);
    wand.position.set(0.42, -0.34, -0.68);
    wand.rotation.set(-0.55, -0.18, -0.2);
  } else {
    if (camera.children.includes(wand)) camera.remove(wand);
    const target = castle.position.clone();
    state.cameraDistance += (state.cameraTargetDistance - state.cameraDistance) * (1 - Math.pow(0.006, dt));
    const horizontal = Math.cos(state.cameraPitch) * state.cameraDistance;
    const eyeLift = state.cameraPitch < 0.16 ? 3.8 : 8;
    const desired = v(
      target.x + Math.sin(state.cameraYaw) * horizontal,
      target.y + Math.sin(state.cameraPitch) * state.cameraDistance + eyeLift,
      target.z + Math.cos(state.cameraYaw) * horizontal,
    );
    camera.position.lerp(desired, 1 - Math.pow(0.002, dt));
    camera.lookAt(target.x, target.y + 1.5, target.z);
  }
}

function updateInteractTarget() {
  let target = null;
  const p = player.position;
  const tower = nearestTower(p, 3.2);
  setNearbyTower(tower);
  if (tower && !state.ride) target = { type: "tower", tower, text: `管理${TOWER_DEFS[tower.type].name}` };
  else if (p.distanceTo(v(12.2, 0, -11.3)) < 3.4) target = { type: "coaster", text: state.ride === "coaster" ? "离开极速飞车" : "乘坐极速飞车" };
  else if (p.distanceTo(v(-15.6, 0, -7.4)) < 3.5 || p.distanceTo(boat.position) < 2.8) target = { type: "boat", text: state.ride === "boat" ? "离开卡丁车" : "开卡丁车" };
  else if (p.distanceTo(v(13.8, 0, 8.6)) < 6.8) target = { type: "mountain", text: "山路可以攀爬，山顶能看清怪物入口" };
  state.interactTarget = target;
}

function interact() {
  if (state.quiz.active) return;
  if (state.ride) {
    exitRideToOverview();
    return;
  }
  updateInteractTarget();
  if (!state.interactTarget) {
    prompt("靠近车站、卡丁车起点或项目入口就可以互动。");
    return;
  }
  if (state.interactTarget.type === "coaster") {
    startRide("coaster");
  } else if (state.interactTarget.type === "boat") {
    startRide("boat");
  } else if (state.interactTarget.type === "tower") {
    showTowerMenu(state.interactTarget.tower);
  } else {
    prompt("山路开放，可以沿着台阶爬到山顶观察全岛。");
  }
}

function toggleView() {
  if (state.ride) {
    exitRideToOverview();
    return;
  }
  state.view = state.view === "overview" ? "first" : "overview";
  if (state.view === "first") ensureSafeFirstPersonPosition();
  document.body.classList.toggle("is-first-person", state.view === "first");
  prompt(state.view === "first" ? "第一人称：右下移动，拖动画面转向；底部攻击和闪电照常可用。" : "守护视角：点击岛上空地建造炮塔，拖动旋转观察。");
  updateUi();
}

function exitRideToOverview() {
  const exit = state.ride === "coaster" ? v(12.2, 0.72, -9.2) : v(-15.2, 0.72, -5.2);
  state.ride = null;
  state.view = "overview";
  player.position.copy(exit);
  prompt("已经回到守护视角，可以继续建塔和防守。");
  updateUi();
}

function safeFirstPersonSpawn() {
  return v(-5.8, 0.72, -8.6);
}

function ensureSafeFirstPersonPosition() {
  const dangerZones = [
    { center: castle.position, radius: 8.2 },
    { center: v(13.8, 0, 8.6), radius: 7.4 },
    { center: v(-15.6, 0, -7.4), radius: 4.2 },
    { center: boat.position, radius: 3.8 },
  ];
  const tooClose = dangerZones.some((zone) => player.position.distanceTo(zone.center) < zone.radius);
  if (tooClose || player.position.y > 2.2) {
    player.position.copy(safeFirstPersonSpawn());
    state.firstYaw = 0.35;
    state.firstPitch = -0.08;
  }
}

function beginPointer(event) {
  ensureAudio();
  if (state.quiz.active) return;
  const target = event.currentTarget;
  if (target !== canvas && target !== ui.lookPad) return;
  if (target === canvas && state.view !== "overview" && !state.selectedTower) return;
  state.drag = {
    active: true,
    pointerId: event.pointerId,
    captureTarget: target,
    x: event.clientX,
    y: event.clientY,
    mode: target === canvas && state.view !== "overview" ? "build" : state.view === "first" ? "look" : "orbit",
    moved: false,
  };
  target.setPointerCapture(event.pointerId);
}

function movePointer(event) {
  if (!state.drag.active || state.drag.pointerId !== event.pointerId) return;
  const dx = event.clientX - state.drag.x;
  const dy = event.clientY - state.drag.y;
  state.drag.x = event.clientX;
  state.drag.y = event.clientY;
  if (Math.abs(dx) + Math.abs(dy) > 2) state.drag.moved = true;
  if (state.drag.mode === "look") {
    state.firstYaw -= dx * 0.004;
    state.firstPitch = clamp(state.firstPitch - dy * 0.003, -0.72, 0.58);
  } else if (state.drag.mode === "orbit") {
    state.cameraYaw -= dx * 0.005;
    state.cameraPitch = clamp(state.cameraPitch + dy * 0.003, 0.04, 1.05);
  }
}

function endPointer(event) {
  if (!state.drag.active || state.drag.pointerId !== event.pointerId) return;
  state.drag.captureTarget?.releasePointerCapture(event.pointerId);
  if (!state.drag.moved && state.drag.captureTarget === canvas && !state.quiz.active) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = state.view === "overview" ? findOverviewInteraction(raycaster.intersectObjects(root.children, true)) : null;
    if (hit) {
      if (hit.type === "tower") showTowerMenu(hit.tower);
      else startRide(hit.type || hit);
      state.drag.active = false;
      return;
    }
    if (raycaster.ray.intersectPlane(groundPlane, groundHit)) {
      const point = groundHit.clone().setY(terrainHeight(groundHit.x, groundHit.z));
      if (state.selectedTower) placeTower(point.clone().setY(0.72));
      else if (state.view === "overview") movePlayerTo(point);
    }
  }
  state.drag.active = false;
}

function findOverviewInteraction(intersections) {
  for (const hit of intersections) {
    let node = hit.object;
    while (node) {
      if (node.userData?.ride) return node.userData.ride;
      if (node.userData?.station) return node.userData.station;
      if (node.userData?.tower) return { type: "tower", tower: node.userData.tower };
      node = node.parent;
    }
  }
  return null;
}

function movePlayerTo(point) {
  const target = clampToWalkableIsland(point);
  state.playerTarget = resolveMovingObjectCollision(target, 0.72);
  hideTowerMenu();
  prompt("岛主出发。");
}

function beginJoystick(event) {
  ensureAudio();
  state.joystick.active = true;
  state.joystick.id = event.pointerId;
  ui.joystick.setPointerCapture(event.pointerId);
  updateJoystick(event);
}

function updateJoystick(event) {
  if (!state.joystick.active || state.joystick.id !== event.pointerId) return;
  const rect = ui.joystick.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const radius = rect.width * 0.32;
  const dx = event.clientX - cx;
  const dy = event.clientY - cy;
  const len = Math.hypot(dx, dy);
  const clamped = Math.min(radius, len);
  const nx = len > 0 ? dx / len : 0;
  const ny = len > 0 ? dy / len : 0;
  const dead = radius * 0.14;
  state.joystick.x = len > dead ? nx * (clamped / radius) : 0;
  state.joystick.y = len > dead ? -ny * (clamped / radius) : 0;
  state.joystick.power = Math.hypot(state.joystick.x, state.joystick.y);
  ui.joystickStick.style.setProperty("--jx", `${nx * clamped}px`);
  ui.joystickStick.style.setProperty("--jy", `${ny * clamped}px`);
}

function endJoystick(event) {
  if (state.joystick.id !== event.pointerId) return;
  state.joystick = { active: false, id: null, x: 0, y: 0, power: 0 };
  ui.joystickStick.style.setProperty("--jx", "0px");
  ui.joystickStick.style.setProperty("--jy", "0px");
}

function openQuiz(reason) {
  if (state.quiz.active) return;
  if (reason !== "practice" && state.quizCooldown > 0) {
    if (reason === "rescue") {
      state.hp = Math.max(state.hp, 18);
      prompt("城堡进入短暂保护，下一次抢修题稍后出现。");
    }
    return;
  }
  if (state.ride) exitRideToOverview("游乐项目已暂停，先完成学习挑战。");
  state.quiz.active = true;
  state.quizCooldown = reason === "practice" ? 8 : 48;
  document.body.classList.add("is-quiz-active");
  state.quiz.reason = reason;
  state.quiz.solved = 0;
  ui.quizOverlay.hidden = false;
  ui.quizReason.textContent = reason === "rescue" ? "城堡抢修" : reason === "energy" ? "学习补能" : "自主练习";
  ui.quizTitle.textContent = reason === "rescue" ? "答对题目，重新点亮城堡" : "答题获得星币和城堡能量";
  nextQuestion();
}

function nextQuestion() {
  state.quiz.current = generateQuestion();
  ui.quizProgress.textContent = `${state.quiz.solved + 1} / 5`;
  ui.quizQuestion.textContent = state.quiz.current.prompt;
  ui.quizChoices.innerHTML = "";
  state.quiz.current.choices.forEach((choice) => {
    const button = document.createElement("button");
    button.textContent = choice;
    button.addEventListener("click", () => answerQuestion(button, choice));
    ui.quizChoices.appendChild(button);
  });
}

function answerQuestion(button, choice) {
  const correct = choice === state.quiz.current.answer;
  button.classList.add(correct ? "is-correct" : "is-wrong");
  [...ui.quizChoices.children].forEach((item) => {
    item.disabled = true;
    if (item.textContent === state.quiz.current.answer) item.classList.add("is-correct");
  });
  if (correct) {
    state.quiz.solved += 1;
    state.coins += 18;
    state.hp = Math.min(100, state.hp + 6);
    state.learn = Math.max(0, state.learn - 20);
    playSfx("correct");
  } else {
    state.learn = Math.min(100, state.learn + 6);
    playSfx("wrong");
  }
  setTimeout(() => {
    if (!state.quiz.active) return;
    if (state.quiz.solved >= 5) closeQuiz(true);
    else nextQuestion();
  }, 520);
}

function closeQuiz(success) {
  ui.quizOverlay.hidden = true;
  state.quiz.active = false;
  document.body.classList.remove("is-quiz-active");
  state.quizCooldown = Math.max(state.quizCooldown, 34);
  if (success) {
    if (state.quiz.reason === "rescue") state.hp = 55;
    state.learn = 0;
    pulseCastle(0x70e29a);
    prompt("学习能量注入城堡，乐园继续开放。");
  } else {
    prompt("回到乐园，题目会继续保留在循环里。");
  }
}

function generateQuestion() {
  if (!state.quiz.deck.length) {
    state.quiz.deck = [
      ...QUESTIONS.map(([promptText, answer, wrong]) => ({ prompt: promptText, answer, choices: shuffle([answer, ...wrong]) })),
      ...Array.from({ length: 32 }, () => mathQuestion()),
    ];
    state.quiz.deck = shuffle(state.quiz.deck);
  }
  return state.quiz.deck.pop();
}

function mathQuestion() {
  const difficulty = Math.min(6, 1 + Math.floor(state.threat / 3));
  const type = randInt(0, 5);
  if (type === 0) {
    const a = randInt(8, 35 + difficulty * 8);
    const b = randInt(6, 28 + difficulty * 6);
    return choices(`${a} + ${b} = ?`, a + b);
  }
  if (type === 1) {
    const b = randInt(8, 25 + difficulty * 6);
    const ans = randInt(12, 42 + difficulty * 8);
    return choices(`${ans + b} - ${b} = ?`, ans);
  }
  if (type === 2) {
    const a = randInt(3, 9 + difficulty);
    const b = randInt(3, 12);
    return choices(`${a} × ${b} = ?`, a * b);
  }
  if (type === 3) {
    const d = randInt(3, 12);
    const ans = randInt(3, 12);
    return choices(`${d * ans} ÷ ${d} = ?`, ans);
  }
  if (type === 4) {
    const a = randInt(3, 8);
    const b = randInt(4, 9);
    const c = randInt(10, 40);
    return choices(`${a} × ${b} + ${c} = ?`, a * b + c);
  }
  const price = randInt(4, 12);
  const count = randInt(3, 9);
  const paid = price * count + randInt(5, 24);
  return choices(`一个气球 ${price} 星币，买 ${count} 个后付 ${paid}，应找回多少？`, paid - price * count);
}

function choices(promptText, answer) {
  const wrong = new Set();
  while (wrong.size < 3) {
    const offset = randInt(-12, 12) || 3;
    const v2 = answer + offset;
    if (v2 !== answer && v2 >= 0) wrong.add(String(v2));
  }
  return { prompt: promptText, answer: String(answer), choices: shuffle([String(answer), ...wrong]) };
}

function updateUi() {
  ui.hp.textContent = Math.round(state.hp);
  ui.coins.textContent = Math.round(state.coins);
  ui.learn.textContent = `${Math.round(state.learn)}%`;
  ui.threat.textContent = state.threat;
  ui.modeLabel.textContent = state.ride === "coaster" ? "极速飞车" : state.ride === "boat" ? "卡丁车" : state.view === "first" ? "第一人称" : "守护视角";
  ui.viewBtn.title = "切换守护视角和第一人称";
  ui.viewBtn.setAttribute("aria-label", ui.viewBtn.title);
  ui.audioBtn?.classList.toggle("is-on", state.audio.enabled);
  ui.skillBtn.style.opacity = state.lightningCooldown > 0 ? "0.45" : "1";
  document.body.classList.toggle("is-first-person", state.view === "first");
  document.body.classList.toggle("is-ride-view", Boolean(state.ride));
  document.body.classList.toggle("is-running", state.running);
}

function updateMinimap() {
  const w = minimap.width;
  const h = minimap.height;
  mapCtx.clearRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) * 0.44;
  const sweep = (performance.now() * 0.00135) % (Math.PI * 2);
  mapCtx.save();
  mapCtx.translate(cx, cy);
  mapCtx.beginPath();
  mapCtx.arc(0, 0, radius, 0, Math.PI * 2);
  mapCtx.clip();
  const bg = mapCtx.createRadialGradient(0, 0, 4, 0, 0, radius);
  bg.addColorStop(0, "rgba(86, 214, 255, .14)");
  bg.addColorStop(1, "rgba(8, 24, 34, .42)");
  mapCtx.fillStyle = bg;
  mapCtx.fillRect(-radius, -radius, radius * 2, radius * 2);
  mapCtx.strokeStyle = "rgba(190, 248, 255, .22)";
  mapCtx.lineWidth = 1;
  for (const ring of [0.34, 0.66, 1]) {
    mapCtx.beginPath();
    mapCtx.arc(0, 0, radius * ring, 0, Math.PI * 2);
    mapCtx.stroke();
  }
  mapCtx.beginPath();
  mapCtx.moveTo(-radius, 0);
  mapCtx.lineTo(radius, 0);
  mapCtx.moveTo(0, -radius);
  mapCtx.lineTo(0, radius);
  mapCtx.stroke();
  mapCtx.fillStyle = "rgba(86, 214, 255, .12)";
  mapCtx.beginPath();
  mapCtx.moveTo(0, 0);
  mapCtx.arc(0, 0, radius, sweep - 0.48, sweep, false);
  mapCtx.closePath();
  mapCtx.fill();
  mapCtx.strokeStyle = "rgba(120, 245, 255, .82)";
  mapCtx.lineWidth = 2;
  mapCtx.beginPath();
  mapCtx.moveTo(0, 0);
  mapCtx.lineTo(Math.cos(sweep) * radius, Math.sin(sweep) * radius);
  mapCtx.stroke();
  mapCtx.fillStyle = "#ffd75d";
  mapCtx.beginPath();
  mapCtx.arc(0, 0, 4, 0, Math.PI * 2);
  mapCtx.fill();
  mapCtx.fillStyle = "rgba(255, 248, 184, .92)";
  mapCtx.beginPath();
  mapCtx.moveTo(0, -radius + 8);
  mapCtx.lineTo(-5, -radius + 19);
  mapCtx.lineTo(5, -radius + 19);
  mapCtx.closePath();
  mapCtx.fill();
  const heading = radarHeading();
  state.enemies.forEach((enemy) => dotRadarEnemy(enemy, radius, heading));
  mapCtx.restore();
}

function radarHeading() {
  if (state.ride === "coaster") return coasterTrain.userData.cameraYaw ?? player.rotation.y;
  if (state.ride === "boat") return boat.userData.cameraYaw ?? player.rotation.y;
  return state.view === "first" ? state.firstYaw : player.rotation.y;
}

function dotRadarEnemy(enemy, radius, heading) {
  const color = MAP_ENEMY_COLORS[enemy.type] || "#ff6174";
  let x;
  let z;
  if (enemy.group) {
    x = enemy.group.position.x - player.position.x;
    z = enemy.group.position.z - player.position.z;
  } else {
    x = (enemy.x - 50) * 0.55 - player.position.x;
    z = (enemy.y - 50) * 0.42 - player.position.z;
  }
  const distance = Math.min(1, Math.hypot(x, z) / 34);
  const angle = Math.atan2(x, z) - heading;
  const px = Math.sin(angle) * radius * distance;
  const py = -Math.cos(angle) * radius * distance;
  mapCtx.fillStyle = color;
  mapCtx.shadowColor = color;
  mapCtx.shadowBlur = 8;
  mapCtx.beginPath();
  mapCtx.arc(px, py, enemy.type === "giant" ? 5.4 : enemy.type === "shield" ? 4.6 : 3.8, 0, Math.PI * 2);
  mapCtx.fill();
  mapCtx.shadowBlur = 0;
  if (enemy.type === "shield" || enemy.type === "giant") {
    mapCtx.strokeStyle = "rgba(255,255,255,.76)";
    mapCtx.lineWidth = 1.5;
    mapCtx.beginPath();
    mapCtx.arc(px, py, enemy.type === "giant" ? 7.2 : 6, 0, Math.PI * 2);
    mapCtx.stroke();
  }
}

function dot(x, z, color, r) {
  mapCtx.fillStyle = color;
  mapCtx.beginPath();
  mapCtx.arc(x, z, r, 0, Math.PI * 2);
  mapCtx.fill();
}

function updateTowerButtons() {
  document.querySelectorAll(".tower").forEach((button) => {
    button.classList.toggle("is-active", Boolean(state.selectedTower) && button.dataset.tower === state.selectedTower);
  });
}

function prompt(text) {
  ui.prompt.textContent = text;
}

function toggleAudio() {
  state.audio.enabled = !state.audio.enabled;
  if (state.audio.master) state.audio.master.gain.value = state.audio.enabled ? 0.55 : 0;
  updateUi();
}

function ensureAudio() {
  if (state.audio.ctx) {
    if (state.audio.ctx.state === "suspended") state.audio.ctx.resume();
    return;
  }
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return;
  const ctx = new AudioContextCtor();
  const master = ctx.createGain();
  const music = ctx.createGain();
  const sfx = ctx.createGain();
  master.gain.value = state.audio.enabled ? 0.48 : 0;
  music.gain.value = 0.16;
  sfx.gain.value = 0.38;
  music.connect(master);
  sfx.connect(master);
  master.connect(ctx.destination);
  Object.assign(state.audio, { ctx, master, music, sfx, next: ctx.currentTime + 0.08, step: 0 });
}

function updateAudio() {
  const audio = state.audio;
  if (!audio.ctx || !state.running) return;
  const notes = [392, 523.25, 659.25, 587.33, 523.25, 440, 392, 329.63];
  while (audio.next < audio.ctx.currentTime + 0.35) {
    const osc = audio.ctx.createOscillator();
    const gain = audio.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = notes[audio.step % notes.length];
    gain.gain.setValueAtTime(0.0001, audio.next);
    gain.gain.exponentialRampToValueAtTime(0.08, audio.next + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.next + 0.28);
    osc.connect(gain).connect(audio.music);
    osc.start(audio.next);
    osc.stop(audio.next + 0.32);
    audio.next += 0.34;
    audio.step += 1;
  }
}

function playSfx(kind) {
  const audio = state.audio;
  if (!audio.ctx || !state.audio.enabled) return;
  const presets = {
    build: [420, 0.18, "sine", 0.14],
    zap: [720, 0.08, "square", 0.06],
    attack: [620, 0.12, "triangle", 0.1],
    pop: [860, 0.13, "sine", 0.12],
    lightning: [110, 0.34, "sawtooth", 0.1],
    correct: [760, 0.2, "triangle", 0.12],
    wrong: [180, 0.18, "sawtooth", 0.07],
  };
  const [freq, dur, type, volume] = presets[kind] || presets.pop;
  const osc = audio.ctx.createOscillator();
  const gain = audio.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audio.ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freq * 1.35, audio.ctx.currentTime + dur);
  gain.gain.setValueAtTime(volume, audio.ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.ctx.currentTime + dur);
  osc.connect(gain).connect(audio.sfx);
  osc.start();
  osc.stop(audio.ctx.currentTime + dur + 0.02);
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function chooseEnemyType() {
  if (state.threat % 7 === 0 && state.spawned === state.waveBudget - 1) return "giant";
  const pool = ["blob", "blob", "jumper", "shell"];
  if (state.threat >= 2) pool.push("shield");
  if (state.threat >= 5) pool.push("giant");
  if (state.threat >= 9) pool.push("jumper", "shield");
  return pool[Math.floor(Math.random() * pool.length)];
}

function applySlow(enemy, factor, seconds) {
  if (!factor) return;
  enemy.slowFactor = Math.min(enemy.slowFactor, factor);
  enemy.slow = Math.max(enemy.slow, seconds || 0.5);
}

function towerStats(tower) {
  const def = TOWER_DEFS[tower.type];
  const level = tower.level || 1;
  return {
    ...def,
    range: def.range + (level - 1) * 0.7,
    damage: def.damage * (1 + (level - 1) * 0.34),
    rate: def.rate * Math.max(0.62, 1 - (level - 1) * 0.06),
  };
}

function nearestTower(position, maxDistance) {
  let best = null;
  let bestDistance = maxDistance;
  for (const tower of state.towers) {
    const distance = tower.group.position.distanceTo(position);
    if (distance < bestDistance) {
      best = tower;
      bestDistance = distance;
    }
  }
  return best;
}

function setNearbyTower(tower) {
  if (state.nearbyTower === tower) return;
  if (state.nearbyTower?.group?.userData.actionRing) state.nearbyTower.group.userData.actionRing.visible = false;
  state.nearbyTower = tower;
  if (tower?.group?.userData.actionRing) tower.group.userData.actionRing.visible = true;
}

function showTowerMenu(tower) {
  if (!tower || !ui.towerMenu) return;
  state.selectedTowerEntity = tower;
  const def = TOWER_DEFS[tower.type];
  ui.towerMenu.hidden = false;
  ui.towerMenuTitle.textContent = def.name;
  ui.towerMenuMeta.textContent = `Lv.${tower.level || 1} · 回收 ${towerRefund(tower)} 星币`;
  ui.towerMenuUpgrade.textContent = (tower.level || 1) >= 5 ? "满级" : `升级 ${towerUpgradeCost(tower)}`;
  ui.towerMenuUpgrade.disabled = (tower.level || 1) >= 5;
  ui.towerMenuSell.textContent = "回收";
  positionTowerMenu(tower);
  prompt(`${def.name}：可以升级或回收。`);
}

function hideTowerMenu() {
  if (ui.towerMenu) ui.towerMenu.hidden = true;
  state.selectedTowerEntity = null;
}

function updateTowerMenuPosition() {
  if (!state.selectedTowerEntity || ui.towerMenu?.hidden) return;
  positionTowerMenu(state.selectedTowerEntity);
}

function positionTowerMenu(tower) {
  if (!tower?.group?.parent || !ui.towerMenu) return;
  const anchor = tower.group.position.clone().add(v(0, 2.1, 0));
  anchor.project(camera);
  const x = (anchor.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-anchor.y * 0.5 + 0.5) * window.innerHeight;
  const rect = ui.towerMenu.getBoundingClientRect();
  const width = rect.width || 260;
  const height = rect.height || 118;
  ui.towerMenu.style.setProperty("--menu-x", `${clamp(x + 18, 12, window.innerWidth - width - 12)}px`);
  ui.towerMenu.style.setProperty("--menu-y", `${clamp(y - height * 0.55, 86, window.innerHeight - height - 22)}px`);
}

function towerUpgradeCost(tower) {
  return 55 + (tower.level || 1) * 45;
}

function towerRefund(tower) {
  return Math.floor((tower.spent || TOWER_DEFS[tower.type].cost) * 0.55);
}

function upgradeSelectedTower() {
  const tower = state.selectedTowerEntity;
  if (!tower) return;
  if ((tower.level || 1) >= 5) {
    prompt("这个炮塔已经满级了。");
    return;
  }
  const cost = towerUpgradeCost(tower);
  if (state.coins < cost) {
    prompt(`升级需要 ${cost} 星币。`);
    return;
  }
  state.coins -= cost;
  tower.spent = (tower.spent || TOWER_DEFS[tower.type].cost) + cost;
  tower.level = (tower.level || 1) + 1;
  tower.group.scale.setScalar(1 + (tower.level - 1) * 0.09);
  addBurst(tower.group.position.clone().add(v(0, 0.8, 0)), TOWER_DEFS[tower.type].color);
  state.learn = Math.min(100, state.learn + 5);
  showTowerMenu(tower);
  prompt(`${TOWER_DEFS[tower.type].name} 升到 ${tower.level} 级。`);
  updateUi();
}

function sellSelectedTower() {
  const tower = state.selectedTowerEntity;
  if (!tower) return;
  const refund = towerRefund(tower);
  state.coins += refund;
  root.remove(tower.group);
  state.towers = state.towers.filter((item) => item !== tower);
  state.obstacles = state.obstacles.filter((item) => item !== tower.obstacle);
  if (state.nearbyTower === tower) state.nearbyTower = null;
  hideTowerMenu();
  prompt(`回收炮塔，返还 ${refund} 星币。`);
  updateUi();
}

function nearestEnemy(position, range) {
  let best = null;
  let bestDist = range;
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    const dist = enemy.group.position.distanceTo(position);
    if (dist < bestDist) {
      best = enemy;
      bestDist = dist;
    }
  }
  return best;
}

function spawnCoin(position) {
  const coin = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), material.gold);
  coin.position.copy(position).add(v(0, 1.1, 0));
  coin.userData.velocity = v(rand(-1, 1), rand(2, 4), rand(-1, 1));
  coin.alive = true;
  root.add(coin);
  state.coins3d.push(coin);
}

function updatePickup(coin, dt) {
  coin.userData.velocity.y -= dt * 4.5;
  coin.position.addScaledVector(coin.userData.velocity, dt);
  coin.rotation.y += dt * 6;
  if (coin.position.y < 0.78) {
    coin.alive = false;
    root.remove(coin);
  }
}

function pulseCastle(color) {
  const light = new THREE.PointLight(color, 2.4, 18);
  light.position.copy(castle.position).add(v(0, 4, 0));
  root.add(light);
  state.effects.push({ group: light, life: 0.45, type: "light" });
}

function addBurst(position, color) {
  const g = new THREE.Group();
  g.position.copy(position);
  for (let i = 0; i < 10; i += 1) {
    const shard = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.42), toon(color, { emissive: color, emissiveIntensity: 0.35, transparent: true, opacity: 0.85 }));
    shard.position.set(rand(-0.2, 0.2), rand(0.2, 1.2), rand(-0.2, 0.2));
    shard.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
    g.add(shard);
  }
  root.add(g);
  state.effects.push({ group: g, life: 0.55, type: "burst" });
}

function addKillFlash(position, color) {
  const flash = new THREE.Group();
  flash.position.copy(position);
  const light = new THREE.PointLight(color, 3.2, 10);
  light.position.y = 1.4;
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.045, 8, 48),
    toon(color, { emissive: color, emissiveIntensity: 0.5, transparent: true, opacity: 0.82 }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.12;
  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.26, 2.8, 10),
    toon(color, { emissive: color, emissiveIntensity: 0.7, transparent: true, opacity: 0.34 }),
  );
  column.position.y = 1.4;
  flash.add(light, ring, column);
  root.add(flash);
  state.effects.push({ group: flash, life: 0.78, type: "killFlash" });
}

function addBeam(from, to, color, life = 0.32, strong = false) {
  const mid = from.clone().lerp(to, 0.5);
  const len = from.distanceTo(to);
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(strong ? 0.085 : 0.045, strong ? 0.16 : 0.08, len, 10),
    toon(color, { emissive: color, emissiveIntensity: strong ? 0.95 : 0.6, transparent: true, opacity: strong ? 0.94 : 0.78 }),
  );
  beam.position.copy(mid);
  beam.quaternion.setFromUnitVectors(v(0, 1, 0), to.clone().sub(from).normalize());
  root.add(beam);
  state.effects.push({ group: beam, life, type: "beam" });
}

function addLightning(position) {
  const g = new THREE.Group();
  g.position.copy(position);
  const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.24, 8.5, 7), toon(0xfff36d, { emissive: 0xfff36d, emissiveIntensity: 0.7, transparent: true, opacity: 0.9 }));
  bolt.position.y = 4;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.06, 8, 64), toon(0x56d6ff, { emissive: 0x56d6ff, emissiveIntensity: 0.35, transparent: true, opacity: 0.72 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.2;
  g.add(bolt, ring);
  root.add(g);
  state.effects.push({ group: g, life: 0.65, type: "burst" });
}

function addPath(points, radius, matRef) {
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.35);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 72, radius, 10, false), matRef);
  mesh.scale.y = 0.035;
  mesh.receiveShadow = true;
  root.add(mesh);
}

function addDisc(x, z, rx, rz, matRef, y) {
  const mesh = new THREE.Mesh(organicCylinderGeometry(1, 1, 0.08, 42, 0.08), matRef);
  mesh.position.set(x, y, z);
  mesh.scale.set(rx, 1, rz);
  mesh.receiveShadow = true;
  root.add(mesh);
}

function addBridge(x, z, rot) {
  const g = new THREE.Group();
  g.position.set(x, 1.0, z);
  g.rotation.y = rot;
  for (let i = 0; i < 7; i += 1) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 3.4), material.trunk);
    plank.position.x = (i - 3) * 0.38;
    g.add(plank);
  }
  g.traverse(enableShadows);
  root.add(g);
}

function addPalm(x, z, scale = 1) {
  const g = new THREE.Group();
  g.position.set(x, 0.74, z);
  g.scale.setScalar(scale);
  addObstacle(x, z, 0.62 * scale);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 2.3, 7), material.trunk);
  trunk.position.y = 1.15;
  trunk.rotation.z = rand(-0.16, 0.16);
  g.add(trunk);
  for (let i = 0; i < 7; i += 1) {
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 2.0), material.leaf);
    leaf.position.y = 2.36;
    leaf.rotation.y = (i / 7) * Math.PI * 2;
    leaf.rotation.x = 0.62;
    g.add(leaf);
  }
  g.traverse(enableShadows);
  root.add(g);
}

function addFlower(x, z, i) {
  const colors = [0xff8fb8, 0xffd75d, 0xf8fcff, 0x70e29a, 0x56d6ff];
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.34, 5), material.leaf);
  stem.position.set(x, 0.9, z);
  const bloom = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(0.06, 0.12), 0), toon(colors[i % colors.length]));
  bloom.position.set(x, 1.09, z);
  stem.castShadow = true;
  bloom.castShadow = true;
  root.add(stem, bloom);
}

function addRock(x, z, s) {
  const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), material.rock);
  mesh.position.set(x, 0.83, z);
  mesh.scale.set(rand(1, 1.7), rand(0.48, 0.9), rand(0.8, 1.25));
  mesh.rotation.set(rand(0, 1), rand(0, Math.PI), rand(0, 1));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);
  addObstacle(x, z, Math.max(0.5, s * 1.35));
}

function addShell(x, z) {
  const shell = new THREE.Mesh(new THREE.SphereGeometry(rand(0.12, 0.24), 9, 6), toon(rand(0, 1) > 0.5 ? 0xffdfd1 : 0xfff2be));
  shell.position.set(x, 0.54, z);
  shell.scale.set(1.25, 0.34, 0.72);
  shell.rotation.y = rand(0, Math.PI);
  shell.castShadow = true;
  root.add(shell);
}

function addRipple(x, z, width, rot, y = -0.15) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rot;
  for (let i = 0; i < 3; i += 1) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(width * rand(0.22, 0.38), 0.018, 0.035), material.foam);
    dash.position.x = (i - 1) * width * 0.26;
    dash.position.z = Math.sin(i) * 0.09;
    g.add(dash);
  }
  root.add(g);
}

function animatePlayer(dt) {
  const t = performance.now() * 0.012;
  player.children.forEach((child, index) => {
    if (index < 2) child.position.y += Math.sin(t + index) * dt * 0.05;
  });
}

function isBuildable(point) {
  const x = point.x / 28.0;
  const z = point.z / 19.8;
  if (x * x + z * z > 1) return false;
  if (point.distanceTo(castle.position) < 5.2) return false;
  if (point.distanceTo(v(13.8, 0, 8.6)) < 6.4) return false;
  if (point.distanceTo(v(12.2, 0, -11.3)) < 3.1) return false;
  if (point.distanceTo(v(-15.6, 0, -7.4)) < 3.1) return false;
  return true;
}

function isScreenBuildable(screenPoint) {
  if (!screenPoint) return false;
  const x = (screenPoint.x / window.innerWidth) * 100;
  const y = (screenPoint.y / window.innerHeight) * 100;
  if (x < 5 || x > 95 || y < 10 || y > 94) return false;
  if (x > 84 && (y < 34 || y > 82)) return false;
  const islandDx = (x - 50) / 48;
  const islandDy = (y - 54) / 46;
  if (islandDx * islandDx + islandDy * islandDy > 1) return false;
  if (Math.hypot((x - 50) / 6, (y - 43) / 6) < 1) return false;
  return true;
}

function screenPointToParkWorld(screenPoint) {
  const mapX = (screenPoint.x / window.innerWidth) * 100;
  const mapY = (screenPoint.y / window.innerHeight) * 100;
  const x = ((mapX - 50) / 43) * island.buildRx;
  const z = ((mapY - 54) / 42) * island.buildRz;
  return v(x, terrainHeight(x, z), z);
}

function clampToIsland(point) {
  const next = point.clone();
  const x = next.x / island.rx;
  const z = next.z / island.rz;
  const d = Math.sqrt(x * x + z * z);
  if (d > 1) {
    next.x /= d;
    next.z /= d;
  }
  next.y = terrainHeight(next.x, next.z);
  return next;
}

function clampToWalkableIsland(point) {
  const next = point.clone();
  const x = next.x / 28.3;
  const z = next.z / 20.0;
  const d = Math.sqrt(x * x + z * z);
  if (d > 1) {
    next.x /= d;
    next.z /= d;
  }
  next.y = terrainHeight(next.x, next.z);
  return next;
}

function addObstacle(x, z, radius) {
  state.obstacles.push({ x, z, radius });
}

function resolvePlayerMovement(from, desired) {
  const clampFn = state.view === "first" ? clampToWalkableIsland : clampToIsland;
  const start = clampFn(from);
  let next = clampFn(desired);
  const playerRadius = 0.72;
  let movement = next.clone().sub(start);

  for (let pass = 0; pass < 3; pass += 1) {
    let changed = false;
    for (const obstacle of state.obstacles) {
      const dx = next.x - obstacle.x;
      const dz = next.z - obstacle.z;
      const minDistance = obstacle.radius + playerRadius;
      const distance = Math.hypot(dx, dz);
      if (distance >= minDistance || distance <= 0.001) continue;

      const normal = v(dx / distance, 0, dz / distance);
      const blocked = movement.dot(normal);
      const slide = movement.clone().addScaledVector(normal, -blocked);
      const pushed = v(obstacle.x, next.y, obstacle.z).addScaledVector(normal, minDistance + 0.015);
      const slideCandidate = clampFn(start.clone().add(slide));
      const slideDistance = Math.hypot(slideCandidate.x - obstacle.x, slideCandidate.z - obstacle.z);
      next = slideDistance >= minDistance ? slideCandidate : clampFn(pushed);
      movement = next.clone().sub(start);
      changed = true;
    }
    if (!changed) break;
  }

  next.y = terrainHeight(next.x, next.z);
  return next;
}

function resolveMovingObjectCollision(point, radius, ignore = []) {
  for (let pass = 0; pass < 3; pass += 1) {
    let changed = false;
    for (const obstacle of state.obstacles) {
      if (ignore.some((item) => Math.hypot(obstacle.x - item.x, obstacle.z - item.z) < item.radius)) continue;
      const dx = point.x - obstacle.x;
      const dz = point.z - obstacle.z;
      const minDistance = obstacle.radius + radius;
      const distance = Math.hypot(dx, dz);
      if (distance >= minDistance || distance <= 0.001) continue;
      point.x = obstacle.x + (dx / distance) * (minDistance + 0.03);
      point.z = obstacle.z + (dz / distance) * (minDistance + 0.03);
      changed = true;
    }
    if (!changed) break;
  }
  const clamped = clampToWalkableIsland(point);
  point.x = clamped.x;
  point.z = clamped.z;
  return point;
}

function resolvePlayerCollision(point) {
  const next = point.clone();
  const playerRadius = 0.72;
  for (let pass = 0; pass < 2; pass += 1) {
    for (const obstacle of state.obstacles) {
      const dx = next.x - obstacle.x;
      const dz = next.z - obstacle.z;
      const minDistance = obstacle.radius + playerRadius;
      const distance = Math.hypot(dx, dz);
      if (distance > 0.001 && distance < minDistance) {
        const push = (minDistance - distance) / distance;
        next.x += dx * push;
        next.z += dz * push;
      } else if (distance <= 0.001) {
        next.x += minDistance;
      }
    }
  }
  return clampToIsland(next);
}

function terrainHeight(x, z) {
  const mountainDist = Math.hypot((x - 13.8) / 7.2, (z - 8.6) / 5.2);
  if (mountainDist < 1) return 0.72 + (1 - mountainDist) * 6.4;
  return 0.72;
}

function randomIslandPoint(rx, rz) {
  const a = rand(0, Math.PI * 2);
  const r = Math.sqrt(rand(0, 1));
  return v(Math.cos(a) * rx * r, 0, Math.sin(a) * rz * r);
}

function makeCoasterCurve() {
  return new THREE.CatmullRomCurve3([
    v(12.2, 1.65, -11.2), v(20.0, 4.0, -10.2), v(25.5, 9.0, -3.8), v(27.0, 13.8, 8.8),
    v(17.8, 14.8, 17.4), v(3.0, 8.8, 14.6), v(-1.4, 5.2, 2.4), v(7.4, 8.8, -3.8), v(15.2, 6.0, -7.2),
  ], true, "catmullrom", 0.5);
}

function makeKartCurve() {
  return new THREE.CatmullRomCurve3([
    v(-15.6, 0, -8.3),
    v(-22.0, 0, -14.4),
    v(-31.6, 1.35, -12.2),
    v(-32.0, 1.35, 5.2),
    v(-24.8, 0, 13.2),
    v(-13.2, 0, 17.0),
    v(-2.8, 0, 16.2),
    v(7.2, 0, 15.8),
    v(19.8, 0, 16.2),
    v(27.2, 0, 8.2),
    v(28.0, 0, -5.4),
    v(22.8, 0, -14.8),
    v(9.0, 0, -17.2),
    v(-3.4, 0, -15.6),
    v(-10.8, 0, -11.8),
  ], true, "catmullrom", 0.38);
}

function kartTrackHeight(point) {
  if (point.y > 0.55) return point.y;
  const nearTunnel = Math.hypot((point.x - 16.6) / 4.8, (point.z - 6.2) / 4.4) < 1;
  if (nearTunnel) return 0.94;
  return terrainHeight(point.x, point.z) + 0.08;
}

function isNearKartTrack(x, z, radius) {
  for (let i = 0; i < 96; i += 1) {
    const p = boatCurve.getPointAt(i / 96);
    if (Math.hypot(p.x - x, p.z - z) < radius) return true;
  }
  return false;
}

function nearestKartTrackPoint(x, z) {
  let best = null;
  let bestDistance = Infinity;
  for (let i = 0; i < 120; i += 1) {
    const p = boatCurve.getPointAt(i / 120);
    const distance = Math.hypot(p.x - x, p.z - z);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = p;
    }
  }
  return { point: best, distance: bestDistance };
}

function coasterSupportFoot(point) {
  const foot = point.clone();
  const nearest = nearestKartTrackPoint(foot.x, foot.z);
  const safeDistance = 2.35;
  if (nearest.point && nearest.distance < safeDistance) {
    const dx = foot.x - nearest.point.x;
    const dz = foot.z - nearest.point.z;
    const length = Math.hypot(dx, dz) || 1;
    foot.x += (dx / length) * (safeDistance - nearest.distance + 0.25);
    foot.z += (dz / length) * (safeDistance - nearest.distance + 0.25);
  }
  return foot;
}

function offsetCurve(curve, amount, closed = true) {
  const points = curve.getPoints(80).map((p, i, arr) => {
    const previous = arr[closed ? (i + arr.length - 1) % arr.length : Math.max(0, i - 1)];
    const next = arr[closed ? (i + 1) % arr.length : Math.min(arr.length - 1, i + 1)];
    const n = next.clone().sub(previous).normalize();
    return p.clone().add(v(-n.z * amount, 0, n.x * amount));
  });
  return new THREE.CatmullRomCurve3(points, closed, "catmullrom", 0.5);
}

function organicCylinderGeometry(topRadius, bottomRadius, height, segments, noise = 0.1) {
  const geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments, 1);
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const radius = Math.hypot(x, z);
    if (radius < 0.01) continue;
    const a = Math.atan2(z, x);
    const wave = 1 + Math.sin(a * 3.1) * noise * 0.35 + Math.sin(a * 7.7) * noise * 0.28;
    pos.setX(i, x * wave);
    pos.setZ(i, z * wave);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function createStar(radius, innerRadius, depth, color) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i += 1) {
    const a = Math.PI / 2 + i * Math.PI / 5;
    const r = i % 2 === 0 ? radius : innerRadius;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: depth * 0.28, bevelSize: depth * 0.18, bevelSegments: 1 }), toon(color, { emissive: color, emissiveIntensity: 0.12 }));
  mesh.rotation.z = Math.PI / 2;
  return mesh;
}

function addFace(group, y, z, scale = 1) {
  const eyeGeo = new THREE.SphereGeometry(0.045 * scale, 10, 8);
  const eyeA = new THREE.Mesh(eyeGeo, material.dark);
  const eyeB = eyeA.clone();
  eyeA.position.set(-0.13 * scale, y + 0.03 * scale, z);
  eyeB.position.set(0.13 * scale, y + 0.03 * scale, z);
  const smile = new THREE.Mesh(new THREE.SphereGeometry(0.05 * scale, 8, 6), material.dark);
  smile.position.set(0, y - 0.12 * scale, z + 0.012);
  smile.scale.set(1.65, 0.45, 0.34);
  group.add(eyeA, eyeB, smile);
}

function mat(color, options = {}) {
  const key = `m-${color}-${JSON.stringify(options)}`;
  if (matCache.has(key)) return matCache.get(key);
  const value = new THREE.MeshStandardMaterial({ color, ...options });
  matCache.set(key, value);
  return value;
}

function toon(color, options = {}) {
  const key = `t-${color}-${JSON.stringify(options)}`;
  if (matCache.has(key)) return matCache.get(key);
  const value = new THREE.MeshToonMaterial({ color, ...options });
  matCache.set(key, value);
  return value;
}

function enableShadows(child) {
  if (!child.isMesh) return;
  child.castShadow = true;
  child.receiveShadow = true;
}

function v(x, y, z) {
  return new THREE.Vector3(x, y, z);
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerpAngle(from, to, amount) {
  const delta = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + delta * amount;
}

function wrap01(value) {
  return ((value % 1) + 1) % 1;
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
