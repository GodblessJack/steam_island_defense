(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const canvas = $("#gameCanvas");
  const ctx = canvas.getContext("2d");

  const ui = {
    menu: $("#menuScreen"),
    hud: $("#hud"),
    resumeBtn: $("#resumeBtn"),
    newRunBtn: $("#newRunBtn"),
    saveDate: $("#saveDate"),
    saveLevel: $("#saveLevel"),
    saveBest: $("#saveBest"),
    levelGrid: $("#levelGrid"),
    menuBtn: $("#menuBtn"),
    captainChip: $("#captainChip"),
    captainPortrait: $("#captainPortrait"),
    pauseBtn: $("#pauseBtn"),
    soundBtn: $("#soundBtn"),
    towerBar: $("#towerBar"),
    buildMenu: $("#buildMenu"),
    selectionPanel: $("#selectionPanel"),
    selectionTitle: $("#selectionTitle"),
    selectionMeta: $("#selectionMeta"),
    upgradeBtn: $("#upgradeBtn"),
    sellBtn: $("#sellBtn"),
    lightningBtn: $("#lightningBtn"),
    lightningCd: $("#lightningCd"),
    pulseBtn: $("#pulseBtn"),
    pulseCd: $("#pulseCd"),
    hudLevel: $("#hudLevel"),
    hudHearts: $("#hudHearts"),
    hudStars: $("#hudStars"),
    hudTimer: $("#hudTimer"),
    quizModal: $("#quizModal"),
    quizReason: $("#quizReason"),
    quizProgress: $("#quizProgress"),
    quizQuestion: $("#quizQuestion"),
    quizOptions: $("#quizOptions"),
    quizFeedback: $("#quizFeedback"),
    resultModal: $("#resultModal"),
    resultEyebrow: $("#resultEyebrow"),
    resultTitle: $("#resultTitle"),
    resultText: $("#resultText"),
    nextLevelBtn: $("#nextLevelBtn"),
    resultMenuBtn: $("#resultMenuBtn"),
    pauseModal: $("#pauseModal"),
    resumeGameBtn: $("#resumeGameBtn"),
    pauseMenuBtn: $("#pauseMenuBtn"),
    toast: $("#toast"),
  };

  const TAU = Math.PI * 2;
  const SAVE_KEY = "steamIslandDefense.dailySave.v1";
  const MAX_LEVEL = 10;
  const ART_MANIFEST_URL = "./assets/generated-assets.json";

  const towerTypes = [
    {
      id: "spark",
      name: "电炮台",
      icon: "⚡",
      cost: 70,
      unlock: 1,
      range: 138,
      damage: 16,
      rate: 2.35,
      bulletSpeed: 480,
      color: "#35a7ff",
      accent: "#ffe66d",
      note: "快射速",
    },
    {
      id: "frost",
      name: "寒冰塔",
      icon: "❄",
      cost: 95,
      unlock: 1,
      range: 132,
      damage: 18,
      rate: 0.72,
      bulletSpeed: 390,
      color: "#6ed7ff",
      accent: "#ffffff",
      slow: 0.48,
      slowTime: 2.2,
      note: "减速",
    },
    {
      id: "cookie",
      name: "饼干炮",
      icon: "●",
      cost: 120,
      unlock: 4,
      range: 156,
      damage: 36,
      rate: 0.68,
      bulletSpeed: 330,
      color: "#d8954d",
      accent: "#7a4b2a",
      splash: 54,
      note: "范围",
    },
    {
      id: "rainbow",
      name: "彩虹镜",
      icon: "◆",
      cost: 155,
      unlock: 7,
      range: 172,
      damage: 24,
      rate: 1.1,
      bulletSpeed: 520,
      color: "#8c5cff",
      accent: "#35e0a1",
      chain: 2,
      note: "弹射",
    },
  ];

  const enemyTypes = {
    blob: {
      name: "圆圆怪",
      hp: 100,
      speed: 36,
      damage: 1,
      reward: 14,
      radius: 19,
      color: "#61d765",
      outline: "#247c4c",
    },
    shield: {
      name: "盾盾怪",
      hp: 92,
      shield: 74,
      speed: 29,
      damage: 2,
      reward: 22,
      radius: 21,
      color: "#66cf86",
      outline: "#22615f",
    },
    turtle: {
      name: "乌龟怪",
      hp: 280,
      speed: 17,
      damage: 3,
      reward: 36,
      radius: 25,
      color: "#79bd4e",
      outline: "#386b32",
    },
    bat: {
      name: "蝙蝠怪",
      hp: 25,
      speed: 88,
      damage: 1,
      reward: 10,
      radius: 16,
      color: "#6f5cd8",
      outline: "#332c78",
    },
    rogue: {
      name: "叛变精灵",
      hp: 115,
      speed: 42,
      damage: 2,
      reward: 28,
      radius: 18,
      color: "#ff8f5f",
      outline: "#a84442",
      ranged: true,
    },
    boss: {
      name: "月球 Boss",
      hp: 760,
      speed: 15,
      damage: 5,
      reward: 140,
      radius: 42,
      color: "#f7eec0",
      outline: "#80735f",
      boss: true,
    },
    finalBoss: {
      name: "潮汐月王",
      hp: 1680,
      speed: 13,
      damage: 5,
      reward: 260,
      radius: 54,
      color: "#f8df9a",
      outline: "#575489",
      boss: true,
    },
  };

  const stages = [
    {
      min: 1,
      name: "糖果海湾",
      waterTop: "#43d5da",
      waterBottom: "#1597b8",
      land: "#71d871",
      land2: "#4fbf70",
      path: "#ffce73",
      pathEdge: "#e69258",
      decor: "candy",
    },
    {
      min: 4,
      name: "焦糖沙漠",
      waterTop: "#52bad0",
      waterBottom: "#178db2",
      land: "#f5c76d",
      land2: "#db9d56",
      path: "#ffe0a0",
      pathEdge: "#c67a4e",
      decor: "desert",
    },
    {
      min: 7,
      name: "泡泡水门",
      waterTop: "#69d5ff",
      waterBottom: "#2965bd",
      land: "#77d6a2",
      land2: "#4aa38f",
      path: "#d8f1ff",
      pathEdge: "#5c9aca",
      decor: "water",
    },
    {
      min: 10,
      name: "月光终局",
      waterTop: "#4a64bd",
      waterBottom: "#1a255b",
      land: "#79cfaa",
      land2: "#5575a8",
      path: "#cbd8ff",
      pathEdge: "#7889c8",
      decor: "moon",
    },
  ];

  const state = {
    w: 1280,
    h: 720,
    dpr: 1,
    mode: "menu",
    paused: false,
    lastTs: 0,
    time: 0,
    level: 1,
    unlockedLevel: 1,
    bestScore: 0,
    saveDate: "",
    levelStartedAt: 0,
    elapsed: 0,
    timeLimit: 82,
    hearts: 15,
    stars: 250,
    studyShield: 0,
    bonusStars: 0,
    core: { x: 640, y: 360, r: 50 },
    player: {
      x: 640,
      y: 360,
      r: 16,
      speed: 178,
      target: null,
      cooldown: 0,
      pulseCd: 0,
      castTimer: 0,
      moving: false,
      bob: 0,
    },
    lightningCd: 0,
    lightningAiming: false,
    selectedTowerType: "spark",
    selectedEntity: null,
    selectedSpot: null,
    pendingBuildSpot: null,
    paths: [],
    buildSpots: [],
    towers: [],
    enemies: [],
    bullets: [],
    candies: [],
    allies: [],
    particles: [],
    damageText: [],
    spawnQueue: [],
    supplyQueue: [],
    studySupplies: [],
    activeSupply: null,
    keys: new Set(),
    pointer: { x: 0, y: 0 },
    quiz: null,
    audio: null,
    soundOn: true,
    idSeed: 1,
  };

  const images = {
    hero: new Image(),
    memory: new Image(),
  };
  images.hero.src = "./assets/menu-hero-illustration.png";
  images.memory.src = "./assets/menu-badge-illustration.png";

  const artAssets = {
    characters: {
      captainIdle: optionalImage("./assets/characters/captain_idle.png"),
      captainCast: optionalImage("./assets/characters/captain_cast.png"),
      captainRun01: optionalImage("./assets/characters/captain_run_01.png"),
      captainRun02: optionalImage("./assets/characters/captain_run_02.png"),
      captainRun03: optionalImage("./assets/characters/captain_run_03.png"),
      captainRun04: optionalImage("./assets/characters/captain_run_04.png"),
    },
    ui: {
      captainPortrait: optionalImage("./assets/ui/captain_portrait.png"),
    },
    towers: {
      sparkLv1: optionalImage("./assets/towers/spark_lv1.png"),
      frostLv1: optionalImage("./assets/towers/frost_lv1.png"),
      cookieLv1: optionalImage("./assets/towers/cookie_lv1.png"),
      rainbowLv1: optionalImage("./assets/towers/rainbow_lv1.png"),
    },
    enemies: {
      blobIdle: optionalImage("./assets/enemies/blob_idle.png"),
      shieldIdle: optionalImage("./assets/enemies/shield_idle.png"),
      turtleIdle: optionalImage("./assets/enemies/turtle_idle.png"),
      batIdle: optionalImage("./assets/enemies/bat_idle.png"),
      moonBossIdle: optionalImage("./assets/enemies/moon_boss_idle.png"),
    },
  };

  const towerArtKey = {
    spark: "sparkLv1",
    frost: "frostLv1",
    cookie: "cookieLv1",
    rainbow: "rainbowLv1",
  };

  const enemyArtKey = {
    blob: "blobIdle",
    shield: "shieldIdle",
    turtle: "turtleIdle",
    bat: "batIdle",
    boss: "moonBossIdle",
    finalBoss: "moonBossIdle",
  };

  function optionalImage(src) {
    return {
      src,
      image: new Image(),
      ready: false,
      objectUrl: "",
    };
  }

  function eachArtAsset(callback) {
    for (const [groupName, group] of Object.entries(artAssets)) {
      for (const [assetName, asset] of Object.entries(group)) {
        callback(asset, groupName, assetName);
      }
    }
  }

  function loadOptionalArt() {
    if (!window.fetch || !window.URL) return;
    fetch(ART_MANIFEST_URL, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((manifest) => {
        if (!manifest) return;
        eachArtAsset((asset, groupName, assetName) => {
          const src = manifest[groupName] && manifest[groupName][assetName];
          if (typeof src === "string" && src.trim()) loadArtAsset(asset, src.trim());
        });
      })
      .catch(() => {});
  }

  function loadArtAsset(asset, src) {
    asset.src = src;
    asset.image.onload = () => {
      asset.ready = true;
      syncCaptainPortrait();
    };
    asset.image.onerror = () => {
      asset.ready = false;
    };
    asset.image.src = src;
  }

  function isArtReady(asset) {
    return Boolean(asset && asset.ready && asset.image.naturalWidth > 0 && asset.image.naturalHeight > 0);
  }

  function syncCaptainPortrait() {
    const asset = artAssets.ui.captainPortrait;
    if (!ui.captainChip || !ui.captainPortrait || !isArtReady(asset)) return;
    ui.captainPortrait.src = asset.image.src;
    ui.captainChip.classList.add("is-ready");
  }

  function drawAnchoredArt(asset, x, footY, targetHeight, maxWidth = targetHeight) {
    if (!isArtReady(asset)) return false;
    const ratio = asset.image.naturalWidth / asset.image.naturalHeight;
    const width = Math.min(maxWidth, targetHeight * ratio);
    const height = width / ratio;
    ctx.drawImage(asset.image, x - width / 2, footY - height, width, height);
    return true;
  }

  function drawSoftShadow(x, y, rx, ry, alpha = 0.22) {
    ctx.save();
    ctx.fillStyle = `rgba(19,32,65,${alpha})`;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function todayKey() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function pick(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function getStage(level = state.level) {
    let current = stages[0];
    for (const stage of stages) {
      if (level >= stage.min) current = stage;
    }
    return current;
  }

  function resize() {
    const prevW = state.w;
    const prevH = state.h;
    state.w = window.innerWidth;
    state.h = window.innerHeight;
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(state.w * state.dpr);
    canvas.height = Math.floor(state.h * state.dpr);
    canvas.style.width = `${state.w}px`;
    canvas.style.height = `${state.h}px`;
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

    if (prevW && prevH && state.mode !== "menu") {
      const sx = state.w / prevW;
      const sy = state.h / prevH;
      for (const group of [
        state.towers,
        state.enemies,
        state.bullets,
        state.candies,
        state.allies,
        state.particles,
        state.damageText,
      ]) {
        for (const item of group) {
          item.x *= sx;
          item.y *= sy;
          if (item.tx) item.tx *= sx;
          if (item.ty) item.ty *= sy;
        }
      }
      state.player.x *= sx;
      state.player.y *= sy;
    }
    buildWorldLayout();
  }

  function buildWorldLayout() {
    const w = state.w;
    const h = state.h;
    state.core = { x: w * 0.5, y: h * 0.51, r: clamp(Math.min(w, h) * 0.066, 38, 56) };
    const c = state.core;
    const leftMid = h * 0.38;
    const topMid = w * 0.47;
    const rightMid = h * 0.33;
    const bottomMid = w * 0.62;

    const lanes = [
      [
        { x: -80, y: leftMid },
        { x: w * 0.14, y: leftMid },
        { x: w * 0.28, y: h * 0.43 },
        { x: c.x - c.r * 0.9, y: c.y - c.r * 0.35 },
      ],
      [
        { x: topMid, y: -80 },
        { x: topMid, y: h * 0.14 },
        { x: w * 0.54, y: h * 0.27 },
        { x: c.x + c.r * 0.35, y: c.y - c.r * 0.9 },
      ],
      [
        { x: w + 80, y: rightMid },
        { x: w * 0.82, y: rightMid },
        { x: w * 0.73, y: h * 0.47 },
        { x: c.x + c.r * 0.95, y: c.y },
      ],
      [
        { x: bottomMid, y: h + 80 },
        { x: bottomMid, y: h * 0.83 },
        { x: w * 0.56, y: h * 0.7 },
        { x: c.x + c.r * 0.16, y: c.y + c.r * 0.95 },
      ],
      [
        { x: -80, y: h * 0.72 },
        { x: w * 0.18, y: h * 0.72 },
        { x: w * 0.36, y: h * 0.64 },
        { x: c.x - c.r * 0.75, y: c.y + c.r * 0.55 },
      ],
    ];
    const laneCount = clamp(2 + Math.floor((state.level - 1) / 2), 2, state.level >= 9 ? 5 : 4);
    state.paths = lanes.slice(0, laneCount);

    const spotDefs = [
      [0.22, 0.28],
      [0.31, 0.36],
      [0.39, 0.28],
      [0.57, 0.25],
      [0.69, 0.34],
      [0.77, 0.45],
      [0.64, 0.61],
      [0.54, 0.73],
      [0.42, 0.66],
      [0.29, 0.58],
      [0.18, 0.68],
      [0.82, 0.24],
    ];
    const oldByIndex = new Map(state.buildSpots.map((spot, index) => [index, spot.tower]));
    state.buildSpots = spotDefs.map(([nx, ny], index) => ({
      id: index,
      x: clamp(w * nx, 46, w - 46),
      y: clamp(h * ny, 88, h - 104),
      r: 26,
      tower: oldByIndex.get(index) || null,
    }));
    for (const tower of state.towers) {
      const spot = state.buildSpots[tower.spotId];
      if (spot) {
        tower.x = spot.x;
        tower.y = spot.y;
        spot.tower = tower;
      }
    }
  }

  function loadSave() {
    const fresh = { date: todayKey(), currentLevel: 1, unlockedLevel: 1, bestScore: 0 };
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return fresh;
      const parsed = JSON.parse(raw);
      if (parsed.date !== fresh.date) return fresh;
      return {
        date: parsed.date,
        currentLevel: clamp(Number(parsed.currentLevel) || 1, 1, MAX_LEVEL),
        unlockedLevel: clamp(Number(parsed.unlockedLevel) || 1, 1, MAX_LEVEL),
        bestScore: Number(parsed.bestScore) || 0,
      };
    } catch {
      return fresh;
    }
  }

  function saveProgress(patch = {}) {
    const current = {
      date: state.saveDate || todayKey(),
      currentLevel: state.level,
      unlockedLevel: state.unlockedLevel,
      bestScore: state.bestScore,
      ...patch,
    };
    state.saveDate = current.date;
    state.unlockedLevel = current.unlockedLevel;
    state.bestScore = current.bestScore;
    localStorage.setItem(SAVE_KEY, JSON.stringify(current));
  }

  function resetDailySave() {
    const date = todayKey();
    state.saveDate = date;
    state.unlockedLevel = 1;
    state.bestScore = 0;
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({ date, currentLevel: 1, unlockedLevel: 1, bestScore: 0 }),
    );
    renderMenu();
  }

  function renderMenu() {
    const save = loadSave();
    state.saveDate = save.date;
    state.unlockedLevel = save.unlockedLevel;
    state.bestScore = save.bestScore;
    ui.saveDate.textContent = save.date;
    ui.saveLevel.textContent = `第 ${save.currentLevel} 关`;
    ui.saveBest.textContent = `最佳 ${save.bestScore}`;
    ui.levelGrid.innerHTML = "";

    for (let i = 1; i <= MAX_LEVEL; i += 1) {
      const button = document.createElement("button");
      button.className = "level-btn";
      button.textContent = i < 10 ? `0${i}` : `${i}`;
      button.disabled = i > save.unlockedLevel;
      if (button.disabled) button.classList.add("is-locked");
      if (i === save.currentLevel) button.classList.add("is-current");
      button.title = getStage(i).name;
      button.addEventListener("click", () => startLevel(i));
      ui.levelGrid.append(button);
    }
  }

  function showMenu() {
    state.mode = "menu";
    state.paused = false;
    state.lightningAiming = false;
    hideBuildMenu();
    ui.menu.classList.add("is-active");
    ui.hud.classList.remove("is-active");
    ui.quizModal.classList.remove("is-active");
    ui.resultModal.classList.remove("is-active");
    ui.pauseModal.classList.remove("is-active");
    renderMenu();
  }

  function startLevel(level, options = {}) {
    state.mode = "playing";
    state.paused = false;
    state.level = clamp(level, 1, MAX_LEVEL);
    state.levelStartedAt = performance.now();
    state.elapsed = 0;
    state.hearts = 15;
    state.stars = 250 + (options.bonusStars || 0);
    state.bonusStars = options.bonusStars || 0;
    state.studyShield = options.studyShield || 0;
    state.timeLimit = computeTimeLimit();
    state.player.x = state.w * 0.5;
    state.player.y = state.h * 0.53;
    state.player.target = null;
    state.player.cooldown = 0;
    state.player.pulseCd = 0;
    state.player.castTimer = 0;
    state.player.moving = false;
    state.lightningCd = 0;
    state.lightningAiming = false;
    state.selectedEntity = null;
    state.selectedSpot = null;
    state.pendingBuildSpot = null;
    state.towers = [];
    state.enemies = [];
    state.bullets = [];
    state.candies = [];
    state.allies = [];
    state.particles = [];
    state.damageText = [];
    state.spawnQueue = [];
    state.supplyQueue = [];
    state.studySupplies = [];
    state.activeSupply = null;
    state.buildSpots = [];
    buildWorldLayout();
    seedCandies();
    buildSpawnQueue();
    buildSupplyQueue();
    renderTowerBar();
    hideBuildMenu();
    updateSelectionPanel();
    ui.menu.classList.remove("is-active");
    ui.hud.classList.add("is-active");
    ui.resultModal.classList.remove("is-active");
    ui.pauseModal.classList.remove("is-active");
    ui.quizModal.classList.remove("is-active");
    saveProgress({ currentLevel: state.level });
    toast(`${getStage().name} · 第 ${state.level} 关`);
    playTone(523, 0.08, "sine", 0.04);
  }

  function computeTimeLimit() {
    const base = 92 - state.level * 3.2;
    const unlockPressure = Math.max(0, state.unlockedLevel - state.level) * 1.8;
    return Math.round(clamp(base - unlockPressure, 56, 88));
  }

  function seedCandies() {
    const count = clamp(2 + Math.floor(state.level / 2), 2, 7);
    const positions = [
      [0.37, 0.5],
      [0.62, 0.41],
      [0.46, 0.68],
      [0.72, 0.56],
      [0.26, 0.47],
      [0.56, 0.3],
      [0.36, 0.74],
    ];
    state.candies = positions.slice(0, count).map(([nx, ny], index) => ({
      id: nextId(),
      x: state.w * nx,
      y: state.h * ny,
      hp: 45 + state.level * 5,
      maxHp: 45 + state.level * 5,
      r: 17,
      wobble: Math.random() * TAU,
      alive: true,
      index,
    }));
  }

  function buildSpawnQueue() {
    const level = state.level;
    const total = 12 + level * 4 + (level >= 7 ? 4 : 0);
    const gap = clamp(1.22 - level * 0.045, 0.66, 1.18);
    const queue = [];
    for (let i = 0; i < total; i += 1) {
      let type = "blob";
      const roll = Math.random();
      if (level >= 2 && roll > 0.68) type = "bat";
      if (level >= 3 && roll > 0.78) type = "shield";
      if (level >= 4 && roll > 0.84) type = "turtle";
      if (level >= 6 && roll > 0.9) type = "rogue";
      queue.push({
        at: 1.2 + i * gap + rand(-0.18, 0.32),
        type,
        lane: i % state.paths.length,
      });
    }
    if (level === 5) {
      queue.push({ at: total * gap + 3, type: "boss", lane: 1 });
    }
    if (level === 10) {
      queue.push({ at: total * gap + 2, type: "boss", lane: 0 });
      queue.push({ at: total * gap + 7, type: "finalBoss", lane: 2 });
    }
    state.spawnQueue = queue.sort((a, b) => a.at - b.at);
  }

  function buildSupplyQueue() {
    const positions = [
      { x: state.w * 0.52, y: state.h * 0.32, kind: "stars" },
      { x: state.w * 0.28, y: state.h * 0.62, kind: "shield" },
      { x: state.w * 0.74, y: state.h * 0.55, kind: "upgrade" },
    ];
    const count = state.level >= 6 ? 3 : 2;
    const times = state.level >= 6 ? [12, 36, 62] : [12, 38];
    state.supplyQueue = positions.slice(0, count).map((position, index) => ({
      at: times[index],
      ...position,
    }));
  }

  function spawnStudySupply(config) {
    const supply = {
      id: nextId(),
      x: clamp(config.x, 82, state.w - 82),
      y: clamp(config.y, 118, state.h - 122),
      r: 26,
      kind: config.kind,
      alive: true,
      born: state.time,
      wobble: Math.random() * TAU,
    };
    state.studySupplies.push(supply);
    pulseAt(supply.x, supply.y, "#ffe66d", 38);
    toast("星星补给抵达");
  }

  function renderTowerBar() {
    ui.towerBar.innerHTML = "";
    for (const type of towerTypes) {
      const button = document.createElement("button");
      button.className = "tower-card";
      if (state.selectedTowerType === type.id) button.classList.add("is-selected");
      const blocked = getTowerBlockReason(type);
      if (blocked) button.classList.add("is-locked");
      button.dataset.unavailable = blocked ? "true" : "false";
      button.title = type.note;
      button.innerHTML = `
        <span class="tower-icon" style="background:${type.color}">${type.icon}</span>
        <span class="tower-name">${type.name}</span>
        <span class="tower-cost">★ ${type.cost} · ${type.note}</span>
      `;
      button.addEventListener("click", () => {
        state.selectedTowerType = type.id;
        state.selectedEntity = null;
        state.selectedSpot = null;
        if (state.pendingBuildSpot) renderBuildMenu(state.pendingBuildSpot);
        renderTowerBar();
        updateSelectionPanel();
        if (blocked) toast(blocked);
      });
      ui.towerBar.append(button);
    }
  }

  function nextId() {
    state.idSeed += 1;
    return state.idSeed;
  }

  function getTowerType(id) {
    return towerTypes.find((type) => type.id === id) || towerTypes[0];
  }

  function getTowerBlockReason(type) {
    if (state.level < type.unlock) return `${type.name} 第 ${type.unlock} 关解锁`;
    if (state.stars < type.cost) return `${type.name} 还差 ${type.cost - state.stars} 星星`;
    return "";
  }

  function getPointer(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (state.w / rect.width),
      y: (event.clientY - rect.top) * (state.h / rect.height),
    };
  }

  function handleCanvasAction(point) {
    if (state.lightningAiming) {
      hideBuildMenu();
      castLightning(point);
      return;
    }
    const supply = findStudySupply(point);
    if (supply) {
      hideBuildMenu();
      openSupplyQuiz(supply);
      return;
    }
    const spot = findSpot(point);
    if (spot) {
      if (spot.tower) {
        hideBuildMenu();
        state.selectedEntity = spot.tower;
        state.selectedSpot = spot;
        updateSelectionPanel();
      } else {
        showBuildMenu(spot);
      }
      return;
    }
    const tower = findTower(point);
    if (tower) {
      hideBuildMenu();
      state.selectedEntity = tower;
      state.selectedSpot = state.buildSpots.find((candidate) => candidate.tower === tower) || null;
      updateSelectionPanel();
      return;
    }
    hideBuildMenu();
    state.player.target = { x: point.x, y: point.y };
    state.selectedEntity = null;
    state.selectedSpot = null;
    updateSelectionPanel();
  }

  function findSpot(point) {
    return state.buildSpots.find((spot) => Math.hypot(spot.x - point.x, spot.y - point.y) < spot.r + 11);
  }

  function findTower(point) {
    return state.towers.find((tower) => Math.hypot(tower.x - point.x, tower.y - point.y) < 28);
  }

  function findStudySupply(point) {
    return state.studySupplies.find(
      (supply) => supply.alive && Math.hypot(supply.x - point.x, supply.y - point.y) < supply.r + 18,
    );
  }

  function openSupplyQuiz(supply) {
    supply.alive = false;
    state.activeSupply = supply;
    pulseAt(supply.x, supply.y, "#ffe66d", 46);
    openQuiz("supply");
  }

  function showBuildMenu(spot) {
    state.pendingBuildSpot = spot;
    state.selectedEntity = null;
    state.selectedSpot = spot;
    renderBuildMenu(spot);
    ui.buildMenu.classList.add("is-active");
    updateSelectionPanel();
  }

  function hideBuildMenu() {
    state.pendingBuildSpot = null;
    if (ui.buildMenu) {
      ui.buildMenu.classList.remove("is-active");
      ui.buildMenu.innerHTML = "";
    }
  }

  function renderBuildMenu(spot) {
    ui.buildMenu.style.left = `${clamp(spot.x, 150, state.w - 150)}px`;
    ui.buildMenu.style.top = `${clamp(spot.y, 122, state.h - 132)}px`;
    ui.buildMenu.innerHTML = "";
    for (const type of towerTypes) {
      const locked = state.level < type.unlock;
      const blocked = getTowerBlockReason(type);
      const button = document.createElement("button");
      button.className = "build-choice";
      if (blocked) button.classList.add("is-unavailable");
      button.dataset.unavailable = blocked ? "true" : "false";
      button.innerHTML = `
        <span class="tower-icon" style="background:${type.color}">${type.icon}</span>
        <b>${type.name}</b>
        <span>${locked ? `第${type.unlock}关` : `★${type.cost}`}</span>
      `;
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        ensureAudio();
        state.selectedTowerType = type.id;
        state.selectedEntity = null;
        state.selectedSpot = spot;
        renderTowerBar();
        updateSelectionPanel();
        if (blocked) {
          toast(blocked);
        } else if (placeTower(spot, type.id)) {
          hideBuildMenu();
          renderTowerBar();
        }
      });
      ui.buildMenu.append(button);
    }
  }

  function placeTower(spot, towerTypeId = state.selectedTowerType) {
    const type = getTowerType(towerTypeId);
    if (state.level < type.unlock) {
      toast(`第 ${type.unlock} 关解锁`);
      return false;
    }
    if (state.stars < type.cost) {
      toast("星星不够");
      pulseAt(spot.x, spot.y, "#ff6f61", 10);
      return false;
    }
    const tower = {
      id: nextId(),
      type: type.id,
      x: spot.x,
      y: spot.y,
      spotId: spot.id,
      level: 1,
      cooldown: 0.12,
      angle: -Math.PI / 2,
      born: state.time,
      shots: 0,
    };
    state.selectedTowerType = type.id;
    state.stars -= type.cost;
    state.towers.push(tower);
    spot.tower = tower;
    state.selectedEntity = tower;
    state.selectedSpot = spot;
    updateSelectionPanel();
    pulseAt(tower.x, tower.y, type.color, 24);
    playTone(660, 0.05, "triangle", 0.04);
    return true;
  }

  function towerUpgradeCost(tower) {
    const type = getTowerType(tower.type);
    return Math.round(type.cost * (0.72 + tower.level * 0.62));
  }

  function upgradeSelectedTower() {
    const tower = state.selectedEntity;
    if (!tower || tower.level >= 5) return;
    const cost = towerUpgradeCost(tower);
    if (state.stars < cost) {
      toast("升级星星不够");
      return;
    }
    state.stars -= cost;
    tower.level += 1;
    const type = getTowerType(tower.type);
    pulseAt(tower.x, tower.y, type.accent, 34);
    floatingText(tower.x, tower.y - 32, `Lv.${tower.level}`, type.accent);
    updateSelectionPanel();
    playTone(880, 0.08, "sine", 0.045);
  }

  function sellSelectedTower() {
    const tower = state.selectedEntity;
    if (!tower) return;
    const type = getTowerType(tower.type);
    const refund = Math.round(type.cost * (0.45 + tower.level * 0.16));
    state.stars += refund;
    state.towers = state.towers.filter((item) => item !== tower);
    const spot = state.buildSpots.find((candidate) => candidate.tower === tower);
    if (spot) spot.tower = null;
    state.selectedEntity = null;
    state.selectedSpot = null;
    updateSelectionPanel();
    toast(`回收 +${refund} 星星`);
  }

  function updateSelectionPanel() {
    const tower = state.selectedEntity;
    if (tower) {
      const type = getTowerType(tower.type);
      const maxed = tower.level >= 5;
      ui.selectionTitle.textContent = `${type.name} Lv.${tower.level}`;
      ui.selectionMeta.textContent = maxed
        ? "已经满级"
        : `升级 ★ ${towerUpgradeCost(tower)} · 射程 ${Math.round(type.range + tower.level * 8)}`;
      ui.upgradeBtn.disabled = maxed;
      ui.sellBtn.disabled = false;
      ui.selectionPanel.classList.add("is-active");
      return;
    }
    const type = getTowerType(state.selectedTowerType);
    ui.selectionTitle.textContent = type.name;
    ui.selectionMeta.textContent =
      state.level < type.unlock ? `第 ${type.unlock} 关解锁` : `建造 ★ ${type.cost} · ${type.note}`;
    ui.upgradeBtn.disabled = true;
    ui.sellBtn.disabled = true;
    ui.selectionPanel.classList.toggle("is-active", state.mode === "playing");
  }

  function update(dt) {
    state.time += dt;
    state.elapsed += dt;
    state.timeLimit -= dt;
    state.lightningCd = Math.max(0, state.lightningCd - dt);
    state.player.pulseCd = Math.max(0, state.player.pulseCd - dt);

    while (state.spawnQueue.length && state.spawnQueue[0].at <= state.elapsed) {
      const item = state.spawnQueue.shift();
      spawnEnemy(item.type, item.lane);
    }
    while (state.supplyQueue.length && state.supplyQueue[0].at <= state.elapsed) {
      spawnStudySupply(state.supplyQueue.shift());
    }

    updatePlayer(dt);
    updateTowers(dt);
    updateBullets(dt);
    updateEnemies(dt);
    updateAllies(dt);
    updateParticles(dt);
    updateFloatingText(dt);
    cleanup();

    if (state.hearts <= 0 && state.mode === "playing") {
      openQuiz("defeat");
      return;
    }

    if (state.spawnQueue.length === 0 && state.enemies.length === 0 && state.mode === "playing") {
      completeLevel(false);
    }
  }

  function spawnEnemy(typeId, laneIndex) {
    const proto = enemyTypes[typeId] || enemyTypes.blob;
    const path = state.paths[laneIndex % state.paths.length];
    const hpScale = 1 + (state.level - 1) * 0.105;
    const enemy = {
      id: nextId(),
      type: typeId,
      name: proto.name,
      path,
      segment: 0,
      x: path[0].x,
      y: path[0].y,
      hp: Math.round(proto.hp * hpScale * (proto.boss ? 1 + state.level * 0.04 : 1)),
      maxHp: Math.round(proto.hp * hpScale * (proto.boss ? 1 + state.level * 0.04 : 1)),
      shield: Math.round((proto.shield || 0) * (1 + state.level * 0.08)),
      maxShield: Math.round((proto.shield || 0) * (1 + state.level * 0.08)),
      speed: proto.speed * (1 + Math.min(0.24, state.level * 0.018)),
      damage: proto.damage,
      reward: Math.round(proto.reward * (1 + state.level * 0.05)),
      radius: proto.radius,
      slow: 1,
      slowTimer: 0,
      attackCd: rand(0.4, 1.2),
      alive: true,
      spawned: state.time,
      wobble: Math.random() * TAU,
    };
    state.enemies.push(enemy);
    if (proto.boss) {
      toast(`${proto.name} 登场`);
      pulseAt(enemy.x, enemy.y, "#fff0a8", 40);
    }
  }

  function updatePlayer(dt) {
    const p = state.player;
    p.bob += dt * 6;
    p.castTimer = Math.max(0, p.castTimer - dt);
    p.moving = false;
    let dx = 0;
    let dy = 0;
    if (state.keys.has("arrowleft") || state.keys.has("a")) dx -= 1;
    if (state.keys.has("arrowright") || state.keys.has("d")) dx += 1;
    if (state.keys.has("arrowup") || state.keys.has("w")) dy -= 1;
    if (state.keys.has("arrowdown") || state.keys.has("s")) dy += 1;

    if (dx || dy) {
      const len = Math.hypot(dx, dy) || 1;
      p.x += (dx / len) * p.speed * dt;
      p.y += (dy / len) * p.speed * dt;
      p.target = null;
      p.moving = true;
    } else if (p.target) {
      const to = { x: p.target.x - p.x, y: p.target.y - p.y };
      const len = Math.hypot(to.x, to.y);
      if (len < 5) {
        p.target = null;
      } else {
        p.x += (to.x / len) * p.speed * dt;
        p.y += (to.y / len) * p.speed * dt;
        p.moving = true;
      }
    }

    p.x = clamp(p.x, 28, state.w - 28);
    p.y = clamp(p.y, 80, state.h - 70);
    p.cooldown -= dt;
    if (p.cooldown <= 0) {
      const target = nearestEnemy(p, 118);
      if (target) {
        createBullet({
          x: p.x,
          y: p.y - 10,
          target,
          damage: 12 + Math.floor(state.level * 0.8),
          speed: 520,
          color: "#fff176",
          kind: "player",
          radius: 5,
        });
        p.cooldown = 0.38;
      }
    }
  }

  function updateTowers(dt) {
    for (const tower of state.towers) {
      const type = getTowerType(tower.type);
      const levelFactor = 1 + (tower.level - 1) * 0.32;
      const rateFactor = 1 + (tower.level - 1) * 0.11;
      tower.cooldown -= dt;
      if (tower.cooldown > 0) continue;
      const range = type.range + (tower.level - 1) * 9;
      const target = nearestCandy(tower, range) || nearestEnemy(tower, range);
      if (!target) continue;
      tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
      createBullet({
        x: tower.x + Math.cos(tower.angle) * 18,
        y: tower.y + Math.sin(tower.angle) * 18,
        target,
        damage: Math.round(type.damage * levelFactor),
        speed: type.bulletSpeed,
        color: type.accent,
        kind: type.id,
        slow: type.slow,
        slowTime: type.slowTime,
        splash: type.splash ? type.splash + tower.level * 4 : 0,
        chain: type.chain ? type.chain + Math.floor(tower.level / 3) : 0,
        radius: tower.type === "cookie" ? 8 : 5,
      });
      tower.shots += 1;
      tower.cooldown = 1 / (type.rate * rateFactor);
      if (tower.type === "spark" && tower.shots % 3 === 0) {
        pulseAt(tower.x, tower.y, "rgba(255,230,109,0.7)", 10);
      }
    }
  }

  function createBullet(config) {
    state.bullets.push({
      id: nextId(),
      x: config.x,
      y: config.y,
      target: config.target,
      tx: config.target.x,
      ty: config.target.y,
      damage: config.damage,
      speed: config.speed,
      color: config.color,
      kind: config.kind,
      slow: config.slow || 0,
      slowTime: config.slowTime || 0,
      splash: config.splash || 0,
      chain: config.chain || 0,
      radius: config.radius || 5,
      age: 0,
      alive: true,
    });
  }

  function updateBullets(dt) {
    for (const bullet of state.bullets) {
      bullet.age += dt;
      const target = bullet.target;
      if (target && target.alive !== false && !target.dead) {
        bullet.tx = target.x;
        bullet.ty = target.y;
      }
      const dx = bullet.tx - bullet.x;
      const dy = bullet.ty - bullet.y;
      const len = Math.hypot(dx, dy);
      const step = bullet.speed * dt;
      if (len <= step || bullet.age > 2.5) {
        bullet.x = bullet.tx;
        bullet.y = bullet.ty;
        hitBullet(bullet);
        bullet.alive = false;
      } else {
        bullet.x += (dx / len) * step;
        bullet.y += (dy / len) * step;
      }
    }
  }

  function hitBullet(bullet) {
    const target = bullet.target;
    if (!target || target.dead || target.alive === false) return;
    if (target.maxHp && target.index !== undefined) {
      damageCandy(target, bullet.damage, bullet);
      return;
    }
    damageEnemy(target, bullet.damage, bullet.kind);
    if (bullet.slow) {
      target.slow = Math.min(target.slow, bullet.slow);
      target.slowTimer = Math.max(target.slowTimer, bullet.slowTime);
    }
    if (bullet.splash) {
      for (const enemy of state.enemies) {
        if (enemy !== target && dist(enemy, bullet) <= bullet.splash) {
          damageEnemy(enemy, Math.round(bullet.damage * 0.55), "splash");
          if (bullet.slow) {
            enemy.slow = Math.min(enemy.slow, bullet.slow + 0.12);
            enemy.slowTimer = Math.max(enemy.slowTimer, bullet.slowTime * 0.7);
          }
        }
      }
      pulseAt(bullet.x, bullet.y, "rgba(255,214,90,0.85)", bullet.splash);
    }
    if (bullet.chain) {
      let last = target;
      const hit = new Set([target.id]);
      for (let i = 0; i < bullet.chain; i += 1) {
        const next = state.enemies
          .filter((enemy) => !hit.has(enemy.id) && dist(enemy, last) < 126)
          .sort((a, b) => dist(a, last) - dist(b, last))[0];
        if (!next) break;
        hit.add(next.id);
        drawInstantArc(last.x, last.y, next.x, next.y, "#8c5cff");
        damageEnemy(next, Math.round(bullet.damage * 0.58), "chain");
        last = next;
      }
    }
    pulseAt(bullet.x, bullet.y, bullet.color, 12);
  }

  function updateEnemies(dt) {
    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;
      enemy.wobble += dt * 5;
      if (enemy.slowTimer > 0) {
        enemy.slowTimer -= dt;
        if (enemy.slowTimer <= 0) enemy.slow = 1;
      }

      if (enemyTypes[enemy.type].ranged) {
        enemy.attackCd -= dt;
        const ally = state.allies.find((item) => item.hp > 0 && dist(item, enemy) < 122);
        if (ally && enemy.attackCd <= 0) {
          ally.hp -= 14;
          floatingText(ally.x, ally.y - 22, "-14", "#ff6f61");
          enemy.attackCd = 1.25;
          continue;
        }
      }

      const speed = enemy.speed * enemy.slow;
      advanceEnemy(enemy, speed * dt);
    }
  }

  function advanceEnemy(enemy, distanceToMove) {
    let remaining = distanceToMove;
    while (remaining > 0 && enemy.alive) {
      const next = enemy.path[enemy.segment + 1];
      if (!next) {
        breach(enemy);
        return;
      }
      const dx = next.x - enemy.x;
      const dy = next.y - enemy.y;
      const len = Math.hypot(dx, dy);
      if (len <= remaining) {
        enemy.x = next.x;
        enemy.y = next.y;
        enemy.segment += 1;
        remaining -= len;
      } else {
        enemy.x += (dx / len) * remaining;
        enemy.y += (dy / len) * remaining;
        remaining = 0;
      }
    }
  }

  function breach(enemy) {
    const absorbed = state.studyShield > 0;
    if (absorbed) {
      state.studyShield -= 1;
      floatingText(state.core.x, state.core.y - 46, "护盾", "#6ed7ff");
    } else {
      state.hearts -= enemy.damage;
      floatingText(state.core.x, state.core.y - 46, `-${enemy.damage}`, "#ff5d73");
    }
    enemy.alive = false;
    pulseAt(state.core.x, state.core.y, absorbed ? "#6ed7ff" : "#ff5d73", 42);
    playTone(absorbed ? 440 : 220, 0.06, "sawtooth", 0.035);
  }

  function updateAllies(dt) {
    const aliveAllies = state.allies.filter((ally) => ally.hp > 0);
    aliveAllies.forEach((ally, index) => {
      ally.age += dt;
      ally.healTimer += dt;
      const angle = state.time * 0.9 + index * ((Math.PI * 2) / Math.max(1, aliveAllies.length));
      const desired = {
        x: state.player.x + Math.cos(angle) * (42 + index * 3),
        y: state.player.y + Math.sin(angle) * (34 + index * 3),
      };
      ally.x += (desired.x - ally.x) * clamp(dt * 4.2, 0, 1);
      ally.y += (desired.y - ally.y) * clamp(dt * 4.2, 0, 1);
      if (ally.healTimer >= 10) {
        ally.healTimer = 0;
        ally.hp = Math.min(ally.maxHp, ally.hp + 18 + state.level * 2);
        floatingText(ally.x, ally.y - 18, "+", "#57d78b");
      }
      ally.cooldown -= dt;
      if (ally.cooldown <= 0) {
        const target = nearestEnemy(ally, 105);
        if (target) {
          createBullet({
            x: ally.x,
            y: ally.y,
            target,
            damage: 9 + Math.floor(state.level * 0.7),
            speed: 420,
            color: "#ff8fe1",
            kind: "ally",
            radius: 4,
          });
          ally.cooldown = 0.78;
        }
      }
    });
    state.allies = state.allies.filter((ally) => ally.hp > -20);
  }

  function cleanup() {
    state.enemies = state.enemies.filter((enemy) => enemy.alive && enemy.hp > 0);
    state.bullets = state.bullets.filter((bullet) => bullet.alive);
    state.candies = state.candies.filter((candy) => candy.alive);
    state.studySupplies = state.studySupplies.filter((supply) => supply.alive);
    state.particles = state.particles.filter((particle) => particle.life > 0);
    state.damageText = state.damageText.filter((text) => text.life > 0);
  }

  function nearestEnemy(origin, range) {
    let best = null;
    let bestDistance = Infinity;
    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;
      const d = dist(origin, enemy);
      if (d < range && d < bestDistance) {
        best = enemy;
        bestDistance = d;
      }
    }
    return best;
  }

  function nearestCandy(origin, range) {
    let best = null;
    let bestDistance = Infinity;
    for (const candy of state.candies) {
      if (!candy.alive) continue;
      const d = dist(origin, candy);
      if (d < range && d < bestDistance) {
        best = candy;
        bestDistance = d;
      }
    }
    return best;
  }

  function damageEnemy(enemy, amount, source) {
    if (!enemy || !enemy.alive) return;
    let remaining = amount;
    if (enemy.shield > 0) {
      const shieldHit = Math.min(enemy.shield, remaining);
      enemy.shield -= shieldHit;
      remaining -= shieldHit;
      if (shieldHit > 0) floatingText(enemy.x, enemy.y - enemy.radius - 18, `-${shieldHit}`, "#70c7ff");
    }
    if (remaining > 0) {
      enemy.hp -= remaining;
      if (amount >= 24 || source === "lightning") {
        floatingText(enemy.x, enemy.y - enemy.radius - 18, `-${remaining}`, "#ffef7a");
      }
    }
    if (enemy.hp <= 0) {
      killEnemy(enemy);
    }
  }

  function killEnemy(enemy) {
    enemy.alive = false;
    const reward = enemy.reward;
    state.stars += reward;
    floatingText(enemy.x, enemy.y - enemy.radius, `+${reward}`, "#ffd65a");
    pulseAt(enemy.x, enemy.y, enemyTypes[enemy.type].color, enemy.radius + 18);
    for (let i = 0; i < 8 + enemy.radius / 4; i += 1) {
      spawnParticle(enemy.x, enemy.y, enemyTypes[enemy.type].color, rand(50, 160));
    }
    playTone(enemyTypes[enemy.type].boss ? 196 : 784, 0.05, "square", 0.025);
  }

  function damageCandy(candy, amount) {
    candy.hp -= amount;
    floatingText(candy.x, candy.y - 18, `-${Math.round(amount)}`, "#ff92cb");
    if (candy.hp <= 0) {
      candy.alive = false;
      spawnAlly(candy.x, candy.y);
      pulseAt(candy.x, candy.y, "#ff8fe1", 52);
      playTone(1046, 0.1, "triangle", 0.045);
    }
  }

  function spawnAlly(x, y) {
    const maxAllies = clamp(2 + Math.floor(state.level / 3), 2, 5);
    if (state.allies.filter((ally) => ally.hp > 0).length >= maxAllies) {
      state.stars += 35;
      floatingText(x, y - 20, "+35", "#ffd65a");
      return;
    }
    state.allies.push({
      id: nextId(),
      x,
      y,
      hp: 70 + state.level * 7,
      maxHp: 70 + state.level * 7,
      cooldown: 0.2,
      healTimer: 0,
      age: 0,
    });
    floatingText(x, y - 24, "小精灵", "#ff8fe1");
  }

  function castLightning(point) {
    if (state.lightningCd > 0) return;
    const size = clamp(Math.min(state.w, state.h) * 0.108, 68, 108);
    const radius = size * 1.5;
    let hit = 0;
    for (const enemy of state.enemies) {
      if (Math.abs(enemy.x - point.x) < radius && Math.abs(enemy.y - point.y) < radius) {
        damageEnemy(enemy, 50 + state.level * 4, "lightning");
        enemy.slow = Math.min(enemy.slow, 0.64);
        enemy.slowTimer = Math.max(enemy.slowTimer, 0.9);
        hit += 1;
      }
    }
    for (const candy of state.candies) {
      if (Math.abs(candy.x - point.x) < radius && Math.abs(candy.y - point.y) < radius) {
        damageCandy(candy, 50 + state.level * 2);
        hit += 1;
      }
    }
    for (let gx = -1; gx <= 1; gx += 1) {
      for (let gy = -1; gy <= 1; gy += 1) {
        pulseAt(point.x + gx * size, point.y + gy * size, "#fff176", size * 0.56);
      }
    }
    state.lightningCd = 10.5;
    state.lightningAiming = false;
    state.player.castTimer = 0.45;
    toast(hit ? `闪电命中 ${hit} 个目标` : "闪电落在海风里");
    playTone(1046, 0.08, "sawtooth", 0.04);
  }

  function castPulse() {
    if (state.player.pulseCd > 0) return;
    const radius = 128;
    let hit = 0;
    for (const enemy of state.enemies) {
      const d = dist(enemy, state.player);
      if (d < radius) {
        damageEnemy(enemy, 26 + state.level * 2, "pulse");
        const push = (radius - d) * 0.28;
        if (d > 0) {
          enemy.x += ((enemy.x - state.player.x) / d) * push;
          enemy.y += ((enemy.y - state.player.y) / d) * push;
        }
        hit += 1;
      }
    }
    state.player.pulseCd = 7.5;
    state.player.castTimer = 0.45;
    pulseAt(state.player.x, state.player.y, "#ffe66d", radius);
    if (hit) floatingText(state.player.x, state.player.y - 34, `✦ ${hit}`, "#ffe66d");
    playTone(698, 0.08, "triangle", 0.04);
  }

  function openQuiz(reason) {
    state.mode = "quiz";
    state.paused = true;
    state.lightningAiming = false;
    const total = reason === "supply" ? 3 : 5;
    state.quiz = {
      reason,
      correct: 0,
      answered: 0,
      total,
      difficulty: clamp(state.level + Math.floor(towerPowerScore() / 160), 1, 12),
      locked: false,
    };
    ui.quizReason.textContent =
      reason === "supply" ? "星星补给" : reason === "timeout" ? "时间挑战" : "复活补给";
    ui.quizModal.classList.add("is-active");
    nextQuestion();
  }

  function towerPowerScore() {
    return state.towers.reduce((sum, tower) => {
      const type = getTowerType(tower.type);
      return sum + type.cost * (0.7 + tower.level * 0.55);
    }, 0);
  }

  function nextQuestion() {
    if (!state.quiz) return;
    const quiz = state.quiz;
    quiz.locked = false;
    quiz.current = createQuestion(quiz.difficulty);
    ui.quizProgress.textContent = `第 ${quiz.answered + 1} / ${quiz.total} 题`;
    ui.quizQuestion.textContent = quiz.current.question;
    ui.quizFeedback.textContent = quiz.current.subject;
    ui.quizOptions.innerHTML = "";
    quiz.current.options.forEach((option) => {
      const button = document.createElement("button");
      button.className = "quiz-option";
      button.textContent = option;
      button.addEventListener("click", () => answerQuestion(button, option));
      ui.quizOptions.append(button);
    });
  }

  function answerQuestion(button, option) {
    const quiz = state.quiz;
    if (!quiz || quiz.locked) return;
    quiz.locked = true;
    const correct = option === quiz.current.answer;
    quiz.answered += 1;
    if (correct) {
      button.classList.add("is-correct");
      quiz.correct += 1;
      ui.quizFeedback.textContent = "答对了，星星在发光";
      playTone(880, 0.06, "sine", 0.045);
    } else {
      button.classList.add("is-wrong");
      ui.quizFeedback.textContent = `正确答案：${quiz.current.answer}`;
      [...ui.quizOptions.children].forEach((child) => {
        if (child.textContent === quiz.current.answer) child.classList.add("is-correct");
      });
      playTone(180, 0.08, "sawtooth", 0.035);
    }

    setTimeout(() => {
      if (!state.quiz) return;
      if (state.quiz.answered >= state.quiz.total) {
        finishQuiz();
      } else {
        nextQuestion();
      }
    }, correct ? 460 : 900);
  }

  function finishQuiz() {
    const { reason, correct, total } = state.quiz;
    state.quiz = null;
    ui.quizModal.classList.remove("is-active");
    state.paused = false;
    if (reason === "timeout") {
      completeLevel(true);
      return;
    }
    if (reason === "supply") {
      applySupplyReward(correct, total);
      state.mode = "playing";
      return;
    }
    const strong = correct >= 3;
    toast(strong ? "复活补给：+110 星星，3 次护盾" : "复活补给：+60 星星，1 次护盾");
    startLevel(state.level, { bonusStars: strong ? 110 : 60, studyShield: strong ? 3 : 1 });
  }

  function applySupplyReward(correct, total) {
    const perfect = correct === total;
    let message = "";
    if (perfect) {
      state.stars += 90;
      state.studyShield += 2;
      const upgraded = grantFreeUpgrade();
      if (!upgraded) spawnAlly(state.player.x + 24, state.player.y - 18);
      message = upgraded ? "补给奖励：+90 星星，护盾，免费升级" : "补给奖励：+90 星星，护盾，小精灵";
    } else if (correct >= 2) {
      state.stars += 60;
      state.studyShield += 1;
      message = "补给奖励：+60 星星，1 次护盾";
    } else {
      state.stars += 25;
      message = "补给奖励：+25 星星";
    }
    const supply = state.activeSupply;
    if (supply) {
      floatingText(supply.x, supply.y - 26, `答对 ${correct}/${total}`, "#ffe66d");
      pulseAt(supply.x, supply.y, perfect ? "#ffe66d" : "#6ed7ff", perfect ? 62 : 42);
    }
    state.activeSupply = null;
    toast(message);
    playTone(perfect ? 1046 : 784, 0.1, "triangle", 0.045);
  }

  function grantFreeUpgrade() {
    const tower = state.towers
      .filter((candidate) => candidate.level < 5)
      .sort((a, b) => a.level - b.level || towerUpgradeCost(a) - towerUpgradeCost(b))[0];
    if (!tower) return false;
    tower.level += 1;
    const type = getTowerType(tower.type);
    floatingText(tower.x, tower.y - 34, `Lv.${tower.level}`, type.accent);
    pulseAt(tower.x, tower.y, type.accent, 38);
    if (state.selectedEntity === tower) updateSelectionPanel();
    return true;
  }

  function createQuestion(difficulty) {
    const subject = pick(["数学", "语文", "科学", "英语"]);
    if (subject === "数学") return createMathQuestion(difficulty);
    if (subject === "语文") return createChineseQuestion(difficulty);
    if (subject === "科学") return createScienceQuestion();
    return createEnglishQuestion(difficulty);
  }

  function createMathQuestion(difficulty) {
    const cap = difficulty < 4 ? 30 : difficulty < 8 ? 60 : 100;
    const mode = difficulty > 5 ? pick(["add", "sub", "mul", "money"]) : pick(["add", "sub"]);
    if (mode === "mul") {
      const a = Math.floor(rand(2, 6));
      const b = Math.floor(rand(2, 9));
      return optionsQuestion("数学", `${a} × ${b} = ?`, a * b);
    }
    if (mode === "money") {
      const a = Math.floor(rand(2, 8));
      const b = Math.floor(rand(1, 6));
      return optionsQuestion("数学", `${a} 元 + ${b} 角 = 多少角？`, a * 10 + b);
    }
    const a = Math.floor(rand(7, cap));
    const b = Math.floor(rand(3, Math.min(cap, 36)));
    if (mode === "sub") {
      const big = Math.max(a, b);
      const small = Math.min(a, b);
      return optionsQuestion("数学", `${big} - ${small} = ?`, big - small);
    }
    return optionsQuestion("数学", `${a} + ${b} = ?`, a + b);
  }

  function optionsQuestion(subject, question, answer) {
    const options = new Set([String(answer)]);
    while (options.size < 4) {
      const drift = Math.floor(rand(-9, 10)) || 3;
      options.add(String(Math.max(0, Number(answer) + drift)));
    }
    return { subject, question, answer: String(answer), options: shuffle([...options]) };
  }

  function createChineseQuestion(difficulty) {
    const bank = [
      {
        question: "“绿油油的小岛”里，哪个词表示颜色？",
        answer: "绿油油",
        options: ["绿油油", "小岛", "的", "里"],
      },
      {
        question: "下面哪个词适合形容糖果？",
        answer: "甜甜的",
        options: ["甜甜的", "冷冰冰", "轰隆隆", "慢吞吞"],
      },
      {
        question: "“乌龟慢慢爬。”这句话里的动词是？",
        answer: "爬",
        options: ["乌龟", "慢慢", "爬", "这"],
      },
      {
        question: "“一座小岛”里，量词是？",
        answer: "座",
        options: ["一", "座", "小", "岛"],
      },
      {
        question: "下面哪个字和“海”同偏旁？",
        answer: "河",
        options: ["河", "林", "星", "糖"],
      },
    ];
    if (difficulty >= 8) {
      bank.push({
        question: "“小精灵勇敢地守护星星。”谁在守护星星？",
        answer: "小精灵",
        options: ["小精灵", "星星", "炮台", "糖果"],
      });
    }
    return { subject: "语文", ...pick(bank) };
  }

  function createScienceQuestion() {
    const bank = [
      {
        question: "植物生长最需要哪三样？",
        answer: "阳光、水、空气",
        options: ["阳光、水、空气", "糖果、沙子、月亮", "石头、纸、火", "冰块、盐、云"],
      },
      {
        question: "蝙蝠通常在什么时候更活跃？",
        answer: "夜晚",
        options: ["夜晚", "中午", "下雪时", "海底"],
      },
      {
        question: "水遇冷可能会变成什么？",
        answer: "冰",
        options: ["冰", "木头", "面包", "星星"],
      },
      {
        question: "乌龟身上硬硬的部分叫？",
        answer: "壳",
        options: ["壳", "翅膀", "鱼鳍", "叶子"],
      },
      {
        question: "影子通常出现在光的哪一边？",
        answer: "背光的一边",
        options: ["背光的一边", "光源里面", "云上面", "水里面"],
      },
    ];
    return { subject: "科学", ...pick(bank) };
  }

  function createEnglishQuestion(difficulty) {
    const bank = [
      { question: "star 的意思是？", answer: "星星", options: ["星星", "乌龟", "糖果", "小岛"] },
      { question: "candy 的意思是？", answer: "糖果", options: ["糖果", "月亮", "水", "炮台"] },
      { question: "turtle 的意思是？", answer: "乌龟", options: ["乌龟", "蝙蝠", "星星", "面包"] },
      { question: "blue shield 是什么颜色的盾？", answer: "蓝色", options: ["蓝色", "红色", "绿色", "黄色"] },
      { question: "fast monster 表示怪兽跑得？", answer: "快", options: ["快", "慢", "高", "圆"] },
    ];
    if (difficulty >= 7) {
      bank.push({
        question: "protect the island 的意思是？",
        answer: "保护小岛",
        options: ["保护小岛", "吃糖果", "打开书包", "画月亮"],
      });
    }
    return { subject: "英语", ...pick(bank) };
  }

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function completeLevel(viaQuiz) {
    state.mode = "result";
    state.paused = true;
    const timeBonus = Math.max(0, Math.ceil(state.timeLimit)) * 9;
    const score = Math.max(0, state.hearts) * 120 + state.stars + timeBonus + state.level * 180;
    const next = clamp(state.level + 1, 1, MAX_LEVEL);
    const unlocked = Math.max(state.unlockedLevel, next);
    const best = Math.max(state.bestScore, score);
    saveProgress({ currentLevel: next, unlockedLevel: unlocked, bestScore: best });

    ui.resultEyebrow.textContent = viaQuiz ? "学习通关" : "胜利";
    if (state.level === MAX_LEVEL) {
      ui.resultTitle.textContent = "潮汐月王退回海面";
      ui.resultText.textContent = `今日总分 ${score}。小岛、糖果和小精灵都守住了。`;
      ui.nextLevelBtn.textContent = "再玩第 1 关";
    } else {
      ui.resultTitle.textContent = viaQuiz ? "答题补上了最后一颗星" : "小岛守住了！";
      ui.resultText.textContent = `得分 ${score} · 爱心 ${Math.max(0, state.hearts)} · 星星 ${state.stars}`;
      ui.nextLevelBtn.textContent = `第 ${next} 关`;
    }
    ui.resultModal.classList.add("is-active");
    playTone(523, 0.08, "triangle", 0.04);
    setTimeout(() => playTone(784, 0.08, "triangle", 0.04), 110);
    setTimeout(() => playTone(1046, 0.12, "triangle", 0.04), 220);
  }

  function togglePause() {
    if (state.mode !== "playing") return;
    state.paused = !state.paused;
    ui.pauseModal.classList.toggle("is-active", state.paused);
  }

  function pulseAt(x, y, color, size) {
    for (let i = 0; i < 9; i += 1) {
      spawnParticle(x, y, color, rand(size * 0.3, size));
    }
  }

  function spawnParticle(x, y, color, speed) {
    const angle = rand(0, TAU);
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: rand(2, 5),
      color,
      life: rand(0.32, 0.72),
      maxLife: 0.72,
    });
  }

  function updateParticles(dt) {
    for (const particle of state.particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.94;
      particle.vy *= 0.94;
    }
  }

  function floatingText(x, y, text, color) {
    state.damageText.push({ x, y, text, color, life: 0.9, maxLife: 0.9 });
  }

  function updateFloatingText(dt) {
    for (const text of state.damageText) {
      text.life -= dt;
      text.y -= 38 * dt;
    }
  }

  function drawInstantArc(x1, y1, x2, y2, color) {
    state.particles.push({
      x: (x1 + x2) / 2,
      y: (y1 + y2) / 2,
      vx: 0,
      vy: 0,
      r: Math.hypot(x2 - x1, y2 - y1),
      color,
      life: 0.08,
      maxLife: 0.08,
      arc: { x1, y1, x2, y2 },
    });
  }

  function draw() {
    const stage = getStage();
    drawBackground(stage);
    drawIsland(stage);
    drawPaths(stage);
    drawCandies();
    drawStudySupplies();
    drawBuildSpots();
    drawTowers();
    drawCore();
    drawAllies();
    drawPlayer();
    drawEnemies();
    drawBullets();
    drawParticles();
    drawFloatingText();
    drawAiming();
    if (state.mode === "menu") drawMenuCanvasDetails();
    syncHud();
  }

  function hexToRgb(color) {
    const hex = color.replace("#", "");
    const normalized =
      hex.length === 3
        ? hex
            .split("")
            .map((part) => part + part)
            .join("")
        : hex;
    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16),
    };
  }

  function rgbToHex({ r, g, b }) {
    return `#${[r, g, b].map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0")).join("")}`;
  }

  function mix(a, b, amount) {
    const ca = hexToRgb(a);
    const cb = hexToRgb(b);
    return rgbToHex({
      r: ca.r + (cb.r - ca.r) * amount,
      g: ca.g + (cb.g - ca.g) * amount,
      b: ca.b + (cb.b - ca.b) * amount,
    });
  }

  function lighten(color, amount) {
    return mix(color, "#ffffff", amount);
  }

  function darken(color, amount) {
    return mix(color, "#07182e", amount);
  }

  function drawDistantIslets(stage) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    for (const [x, y, sx, sy] of [
      [0.08, 0.12, 0.09, 0.032],
      [0.91, 0.12, 0.12, 0.04],
      [0.1, 0.9, 0.11, 0.035],
      [0.89, 0.89, 0.08, 0.026],
    ]) {
      const cx = state.w * x;
      const cy = state.h * y;
      ctx.fillStyle = darken(stage.land2, 0.12);
      ctx.beginPath();
      ctx.ellipse(cx, cy, state.w * sx, state.h * sy, Math.sin(x * 9) * 0.2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.beginPath();
      ctx.ellipse(cx, cy + state.h * sy * 0.75, state.w * sx * 0.92, 3, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawIslandBlob(rx, ry, offsetY) {
    ctx.beginPath();
    ctx.moveTo(-rx * 0.98, -ry * 0.07 + offsetY);
    ctx.bezierCurveTo(-rx * 0.9, -ry * 0.62 + offsetY, -rx * 0.18, -ry * 1.08 + offsetY, rx * 0.38, -ry * 0.82 + offsetY);
    ctx.bezierCurveTo(rx * 0.94, -ry * 0.56 + offsetY, rx * 1.08, -ry * 0.05 + offsetY, rx * 0.9, ry * 0.34 + offsetY);
    ctx.bezierCurveTo(rx * 0.64, ry * 0.95 + offsetY, -rx * 0.18, ry * 1.05 + offsetY, -rx * 0.74, ry * 0.65 + offsetY);
    ctx.bezierCurveTo(-rx * 1.08, ry * 0.4 + offsetY, -rx * 1.16, ry * 0.13 + offsetY, -rx * 0.98, -ry * 0.07 + offsetY);
    ctx.closePath();
  }

  function drawBackground(stage) {
    const g = ctx.createLinearGradient(0, 0, 0, state.h);
    g.addColorStop(0, lighten(stage.waterTop, 0.16));
    g.addColorStop(0.42, stage.waterTop);
    g.addColorStop(1, darken(stage.waterBottom, 0.12));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, state.w, state.h);

    const glow = ctx.createRadialGradient(state.w * 0.2, state.h * 0.1, 40, state.w * 0.2, state.h * 0.1, state.w * 0.72);
    glow.addColorStop(0, "rgba(255,246,183,0.32)");
    glow.addColorStop(0.44, "rgba(120,234,255,0.12)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, state.w, state.h);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let y = 24; y < state.h; y += 42) {
      ctx.beginPath();
      for (let x = -30; x <= state.w + 30; x += 16) {
        const wave = Math.sin(x * 0.018 + y * 0.025 + state.time * 0.8) * 4;
        if (x === -30) ctx.moveTo(x, y + wave);
        else ctx.lineTo(x, y + wave);
      }
      ctx.globalAlpha = 0.12 + 0.08 * Math.sin(y * 0.04 + state.time);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    for (let i = 0; i < 34; i += 1) {
      const x = (i * 157 + state.time * 18) % (state.w + 90) - 45;
      const y = 42 + ((i * 91 + Math.sin(state.time + i) * 18) % Math.max(80, state.h - 90));
      ctx.globalAlpha = 0.08 + (i % 5) * 0.018;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(x, y, 18 + (i % 4) * 9, 2.8, Math.sin(i) * 0.55, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    if (stage.decor === "moon") {
      const rg = ctx.createRadialGradient(state.w * 0.78, state.h * 0.16, 10, state.w * 0.78, state.h * 0.16, 170);
      rg.addColorStop(0, "rgba(255,244,193,0.9)");
      rg.addColorStop(1, "rgba(255,244,193,0)");
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, state.w, state.h);
      ctx.fillStyle = "#fff2a6";
      ctx.beginPath();
      ctx.arc(state.w * 0.78, state.h * 0.16, 38, 0, TAU);
      ctx.fill();
    }

    drawDistantIslets(stage);
  }

  function drawIsland(stage) {
    const c = state.core;
    ctx.save();
    ctx.translate(c.x, c.y + 12);
    const islandW = clamp(state.w * 0.45, 420, 680);
    const islandH = clamp(state.h * 0.46, 300, 430);

    ctx.fillStyle = "rgba(5,38,65,0.28)";
    ctx.beginPath();
    ctx.ellipse(0, 38, islandW * 0.58, islandH * 0.45, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.42)";
    drawIslandBlob(islandW * 0.56, islandH * 0.45, 11);
    ctx.fill();
    ctx.fillStyle = "#ffe0a7";
    drawIslandBlob(islandW * 0.545, islandH * 0.43, 6);
    ctx.fill();

    const g = ctx.createLinearGradient(0, -islandH * 0.42, 0, islandH * 0.5);
    g.addColorStop(0, stage.land);
    g.addColorStop(0.56, mix(stage.land, stage.land2, 0.3));
    g.addColorStop(1, stage.land2);
    ctx.fillStyle = g;
    ctx.strokeStyle = "rgba(33,75,62,0.22)";
    ctx.lineWidth = 5;
    drawIslandBlob(islandW * 0.5, islandH * 0.39, 0);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = "rgba(255,255,255,0.42)";
    for (let i = 0; i < 28; i += 1) {
      const x = Math.cos(i * 2.399) * islandW * (0.1 + (i % 9) * 0.038);
      const y = Math.sin(i * 1.77) * islandH * (0.08 + (i % 7) * 0.038);
      ctx.beginPath();
      ctx.ellipse(x, y, 8 + (i % 4) * 5, 3 + (i % 3), Math.sin(i) * 1.2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = darken(stage.land2, 0.18);
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i += 1) {
      ctx.beginPath();
      ctx.ellipse(
        Math.cos(i * 1.9) * islandW * 0.18,
        Math.sin(i * 1.3) * islandH * 0.15,
        islandW * (0.1 + (i % 3) * 0.02),
        islandH * 0.035,
        i * 0.55,
        0,
        TAU,
      );
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();

    drawDecor(stage);
  }

  function drawDecor(stage) {
    const decorPoints = [
      [0.16, 0.2],
      [0.83, 0.18],
      [0.17, 0.82],
      [0.84, 0.76],
      [0.48, 0.16],
      [0.7, 0.68],
    ];
    decorPoints.forEach(([nx, ny], i) => {
      const x = state.w * nx;
      const y = state.h * ny;
      if (stage.decor === "candy") drawLollipop(x, y, i);
      else if (stage.decor === "desert") drawCactusCandy(x, y, i);
      else if (stage.decor === "water") drawShell(x, y, i);
      else drawMoonCrystal(x, y, i);
    });

    const islandDecor = [
      [0.35, 0.31, "palm"],
      [0.67, 0.39, "palm"],
      [0.34, 0.69, "rock"],
      [0.73, 0.62, "rock"],
      [0.49, 0.78, "flower"],
      [0.58, 0.23, "flower"],
    ];
    islandDecor.forEach(([nx, ny, kind], i) => {
      const x = state.w * nx;
      const y = state.h * ny;
      if (kind === "palm") drawPalm(x, y, i, stage);
      else if (kind === "rock") drawGameRock(x, y, i, stage);
      else drawTinyFlowers(x, y, i);
    });
  }

  function drawLollipop(x, y, i) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(state.time + i) * 0.05);
    ctx.strokeStyle = "#f7f2d0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 14);
    ctx.lineTo(0, 42);
    ctx.stroke();
    ctx.fillStyle = i % 2 ? "#ff8fe1" : "#ff6f61";
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 1.45);
    ctx.stroke();
    ctx.restore();
  }

  function drawCactusCandy(x, y, i) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = i % 2 ? "#57d78b" : "#35a7ff";
    roundRect(-8, -24, 16, 44, 8);
    ctx.fill();
    ctx.fillStyle = "#ff8fe1";
    ctx.beginPath();
    ctx.arc(0, -26, 8, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawShell(x, y, i) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = i % 2 ? "#ffd65a" : "#f5eefc";
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 11, Math.sin(i) * 0.8, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(23,33,58,0.18)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(10, 0);
    ctx.stroke();
    ctx.restore();
  }

  function drawMoonCrystal(x, y, i) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(state.time * 0.2 + i);
    ctx.fillStyle = i % 2 ? "#cbd8ff" : "#ffe487";
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(14, 0);
    ctx.lineTo(0, 20);
    ctx.lineTo(-14, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawPalm(x, y, i, stage) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(state.time * 0.8 + i) * 0.03);
    ctx.fillStyle = "rgba(15,36,54,0.18)";
    ctx.beginPath();
    ctx.ellipse(7, 32, 24, 7, -0.1, 0, TAU);
    ctx.fill();
    const trunk = ctx.createLinearGradient(-4, -14, 4, 34);
    trunk.addColorStop(0, "#b87845");
    trunk.addColorStop(1, "#7d4a2a");
    ctx.strokeStyle = trunk;
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 31);
    ctx.quadraticCurveTo(-4, 8, 2, -15);
    ctx.stroke();
    ctx.strokeStyle = "rgba(65,38,20,0.25)";
    ctx.lineWidth = 2;
    for (let j = 0; j < 5; j += 1) {
      ctx.beginPath();
      ctx.moveTo(-5, 24 - j * 7);
      ctx.lineTo(5, 21 - j * 7);
      ctx.stroke();
    }
    ctx.translate(2, -18);
    for (let j = 0; j < 6; j += 1) {
      ctx.rotate((Math.PI * 2) / 6);
      const leaf = ctx.createLinearGradient(0, 0, 42, 0);
      leaf.addColorStop(0, lighten(stage.land, 0.12));
      leaf.addColorStop(1, darken(stage.land2, 0.08));
      ctx.fillStyle = leaf;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(22, -12, 46, -3);
      ctx.quadraticCurveTo(22, 6, 0, 0);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawGameRock(x, y, i, stage) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(15,36,54,0.16)";
    ctx.beginPath();
    ctx.ellipse(4, 12, 22, 7, 0, 0, TAU);
    ctx.fill();
    const g = ctx.createLinearGradient(-14, -12, 14, 16);
    g.addColorStop(0, "#d8e6df");
    g.addColorStop(1, darken(stage.land2, 0.18));
    ctx.fillStyle = g;
    ctx.strokeStyle = "rgba(23,33,58,0.16)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-17, 8);
    ctx.lineTo(-8, -12 - (i % 2) * 4);
    ctx.lineTo(9, -10);
    ctx.lineTo(21, 3);
    ctx.lineTo(10, 15);
    ctx.lineTo(-9, 15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.beginPath();
    ctx.moveTo(-7, -7);
    ctx.lineTo(5, -10);
    ctx.stroke();
    ctx.restore();
  }

  function drawTinyFlowers(x, y, i) {
    ctx.save();
    ctx.translate(x, y);
    for (let j = 0; j < 5; j += 1) {
      const px = Math.cos(j * 2.1 + i) * (8 + j * 3);
      const py = Math.sin(j * 1.7 + i) * 8;
      ctx.fillStyle = j % 2 ? "#ff8fe1" : "#fff2a6";
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#57d78b";
      ctx.beginPath();
      ctx.ellipse(px + 4, py + 3, 5, 2, -0.4, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPaths(stage) {
    for (const path of state.paths) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(8,25,42,0.2)";
      ctx.lineWidth = 56;
      drawPolyline(path);
      ctx.strokeStyle = darken(stage.pathEdge, 0.1);
      ctx.lineWidth = 47;
      drawPolyline(path);
      ctx.strokeStyle = stage.pathEdge;
      ctx.lineWidth = 41;
      drawPolyline(path);
      ctx.strokeStyle = stage.path;
      ctx.lineWidth = 31;
      drawPolyline(path);
      drawPathTexture(path, stage);
      ctx.strokeStyle = "rgba(255,255,255,0.32)";
      ctx.lineWidth = 3;
      drawPolyline(path);
    }
  }

  function drawPolyline(points) {
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
  }

  function drawPathTexture(path, stage) {
    ctx.save();
    let stamp = 0;
    forEachPathSample(path, 34, (x, y, angle) => {
      stamp += 1;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + Math.sin(stamp) * 0.4);
      ctx.fillStyle = stamp % 2 ? "rgba(255,255,255,0.18)" : "rgba(119,82,44,0.1)";
      ctx.beginPath();
      ctx.ellipse(0, 0, 9 + (stamp % 3) * 3, 3.6, 0, 0, TAU);
      ctx.fill();
      if (stamp % 4 === 0) {
        ctx.strokeStyle = darken(stage.pathEdge, 0.05);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-7, 0);
        ctx.lineTo(7, 0);
        ctx.stroke();
      }
      ctx.restore();
    });
    ctx.restore();
  }

  function forEachPathSample(path, spacing, callback) {
    let carried = 0;
    for (let i = 0; i < path.length - 1; i += 1) {
      const a = path[i];
      const b = path[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      for (let d = spacing - carried; d < length; d += spacing) {
        const t = d / length;
        callback(a.x + dx * t, a.y + dy * t, angle);
      }
      carried = length ? (length + carried) % spacing : carried;
    }
  }

  function drawBuildSpots() {
    for (const spot of state.buildSpots) {
      if (spot.tower) continue;
      const selected =
        state.pendingBuildSpot === spot ||
        (state.mode === "playing" && dist(spot, state.pointer) < spot.r + 10);
      ctx.save();
      ctx.fillStyle = "rgba(13,31,55,0.18)";
      ctx.beginPath();
      ctx.ellipse(spot.x + 2, spot.y + 13, spot.r * 1.08, spot.r * 0.34, 0, 0, TAU);
      ctx.fill();
      const g = ctx.createLinearGradient(spot.x, spot.y - spot.r, spot.x, spot.y + spot.r);
      g.addColorStop(0, selected ? "#fff5b4" : "#fff8df");
      g.addColorStop(1, selected ? "#f1c765" : "#d7b778");
      ctx.fillStyle = g;
      ctx.strokeStyle = selected ? "#ffe66d" : "rgba(92,74,45,0.42)";
      ctx.lineWidth = selected ? 4 : 2.5;
      ctx.beginPath();
      ctx.ellipse(spot.x, spot.y, spot.r * 0.98, spot.r * 0.72, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.beginPath();
      ctx.ellipse(spot.x - 6, spot.y - 7, spot.r * 0.48, spot.r * 0.18, -0.25, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = selected ? "#7a5b00" : "rgba(95,68,36,0.45)";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(spot.x - 10, spot.y);
      ctx.lineTo(spot.x + 10, spot.y);
      ctx.moveTo(spot.x, spot.y - 10);
      ctx.lineTo(spot.x, spot.y + 10);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawCandies() {
    for (const candy of state.candies) {
      const wobble = Math.sin(state.time * 3 + candy.wobble) * 3;
      ctx.save();
      ctx.translate(candy.x, candy.y + wobble);
      ctx.rotate(Math.sin(state.time * 1.6 + candy.wobble) * 0.12);
      ctx.fillStyle = "rgba(19,32,65,0.18)";
      ctx.beginPath();
      ctx.ellipse(0, 20, 24, 8, 0, 0, TAU);
      ctx.fill();
      const g = ctx.createLinearGradient(-16, -16, 16, 16);
      g.addColorStop(0, "#ff8fe1");
      g.addColorStop(0.5, "#fff2a6");
      g.addColorStop(1, "#8c5cff");
      ctx.shadowColor = "rgba(255,143,225,0.55)";
      ctx.shadowBlur = 16;
      ctx.fillStyle = g;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(19, -2);
      ctx.lineTo(12, 20);
      ctx.lineTo(-12, 20);
      ctx.lineTo(-19, -2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-7, -13);
      ctx.quadraticCurveTo(2, -18, 10, -8);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.arc(-7, -10, 3, 0, TAU);
      ctx.fill();
      drawMiniBar(-18, -31, 36, 5, candy.hp / candy.maxHp, "#ff8fe1");
      ctx.restore();
    }
  }

  function drawStudySupplies() {
    for (const supply of state.studySupplies) {
      const hover = state.mode === "playing" && dist(supply, state.pointer) < supply.r + 18;
      const bob = Math.sin(state.time * 3.2 + supply.wobble) * 4;
      ctx.save();
      ctx.translate(supply.x, supply.y + bob);
      ctx.fillStyle = "rgba(19,32,65,0.22)";
      ctx.beginPath();
      ctx.ellipse(3, 27, 31, 10, 0, 0, TAU);
      ctx.fill();

      if (hover) {
        ctx.globalAlpha = 0.24;
        ctx.fillStyle = "#ffe66d";
        ctx.beginPath();
        ctx.arc(0, 0, 44 + Math.sin(state.time * 8) * 3, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      const box = ctx.createLinearGradient(0, -28, 0, 27);
      box.addColorStop(0, "#fff0ad");
      box.addColorStop(0.56, "#f5b75c");
      box.addColorStop(1, "#b56c38");
      ctx.fillStyle = box;
      ctx.strokeStyle = "#7f4a2f";
      ctx.lineWidth = 3;
      roundRect(-24, -18, 48, 36, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#e85d5a";
      roundRect(-4, -19, 8, 38, 4);
      ctx.fill();
      roundRect(-25, -3, 50, 8, 4);
      ctx.fill();

      ctx.fillStyle = "#fff7c2";
      ctx.strokeStyle = "#9b672f";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-27, -18);
      ctx.lineTo(0, -33);
      ctx.lineTo(27, -18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ffd65a";
      ctx.shadowColor = "rgba(255,214,90,0.72)";
      ctx.shadowBlur = 12;
      drawStar(0, -34, 12, 5, 5);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#7f4a2f";
      ctx.font = "900 13px ui-rounded, system-ui";
      ctx.textAlign = "center";
      ctx.fillText("?", 0, 7);
      ctx.restore();
    }
  }

  function drawTowers() {
    for (const tower of state.towers) {
      const type = getTowerType(tower.type);
      const selected = state.selectedEntity === tower;
      ctx.save();
      ctx.translate(tower.x, tower.y);
      if (selected) {
        ctx.globalAlpha = 0.17;
        ctx.fillStyle = type.color;
        ctx.beginPath();
        ctx.arc(0, 0, type.range + (tower.level - 1) * 9, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = "rgba(19,32,65,0.22)";
      ctx.beginPath();
      ctx.ellipse(2, 21, 32, 10, 0, 0, TAU);
      ctx.fill();
      if (!drawTowerArt(tower)) drawTowerBody(tower, type);
      if (selected) {
        ctx.strokeStyle = "#ffe66d";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 34, 0, TAU);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(23,33,58,0.78)";
      ctx.font = "900 10px ui-rounded, system-ui";
      ctx.textAlign = "center";
      ctx.fillText(`LV ${tower.level}`, 0, 42);
      ctx.restore();
    }
  }

  function drawTowerArt(tower) {
    const asset = artAssets.towers[towerArtKey[tower.type]];
    if (!isArtReady(asset)) return false;
    const pop = Math.max(0, 1 - (state.time - tower.born) * 2.8);
    ctx.save();
    ctx.translate(0, Math.sin((state.time - tower.born) * 13) * pop * 3);
    const height = 68 + Math.min(8, tower.level * 2);
    drawAnchoredArt(asset, 0, 32, height, 82);
    ctx.restore();
    return true;
  }

  function drawTowerBody(tower, type) {
    const base = ctx.createLinearGradient(0, -24, 0, 24);
    base.addColorStop(0, "#fff4d5");
    base.addColorStop(1, "#b68554");
    ctx.fillStyle = base;
    ctx.strokeStyle = "rgba(73,48,35,0.42)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 8, 25, 17, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.34)";
    ctx.beginPath();
    ctx.ellipse(-7, 1, 10, 4, -0.25, 0, TAU);
    ctx.fill();

    ctx.save();
    ctx.rotate(tower.angle || -Math.PI / 2);
    const barrel = ctx.createLinearGradient(-12, -8, 34, 8);
    barrel.addColorStop(0, lighten(type.color, 0.2));
    barrel.addColorStop(1, darken(type.color, 0.15));
    ctx.fillStyle = barrel;
    ctx.strokeStyle = "rgba(23,33,58,0.3)";
    ctx.lineWidth = 3;
    roundRect(-12, -11, 40, 22, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = type.accent;
    roundRect(14, -5, 22, 10, 5);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.48)";
    roundRect(-6, -8, 18, 4, 4);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#f9fbff";
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, TAU);
    ctx.fill();
    ctx.stroke();
    const gem = ctx.createRadialGradient(-5, -6, 2, 0, 0, 13);
    gem.addColorStop(0, "#ffffff");
    gem.addColorStop(0.32, lighten(type.color, 0.18));
    gem.addColorStop(1, darken(type.color, 0.12));
    ctx.fillStyle = gem;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, TAU);
    ctx.fill();

    if (tower.type === "cookie") {
      ctx.fillStyle = "#7a4b2a";
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath();
        ctx.arc(Math.cos(i * 1.7) * 5, Math.sin(i * 1.7) * 5, 2, 0, TAU);
        ctx.fill();
      }
    }
    if (tower.type === "rainbow") {
      ctx.strokeStyle = "#ffe66d";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-8, 7);
      ctx.quadraticCurveTo(0, -11, 10, 7);
      ctx.stroke();
    }
  }

  function drawCore() {
    const c = state.core;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.fillStyle = "rgba(19,32,65,0.24)";
    ctx.beginPath();
    ctx.ellipse(3, c.r * 0.78, c.r * 1.18, c.r * 0.32, 0, 0, TAU);
    ctx.fill();
    const plinth = ctx.createLinearGradient(0, -c.r * 0.2, 0, c.r * 0.68);
    plinth.addColorStop(0, "#fff4d5");
    plinth.addColorStop(1, "#b88f62");
    ctx.fillStyle = plinth;
    ctx.strokeStyle = "rgba(88,58,40,0.35)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, c.r * 0.34, c.r * 0.9, c.r * 0.34, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    const g = ctx.createRadialGradient(-c.r * 0.25, -c.r * 0.3, 6, 0, 0, c.r);
    g.addColorStop(0, "#fff6b7");
    g.addColorStop(1, "#ffc33d");
    ctx.fillStyle = g;
    ctx.shadowColor = "rgba(255,211,69,0.78)";
    ctx.shadowBlur = 20;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    drawStar(0, -c.r * 0.2, c.r * 0.78, c.r * 0.36, 5);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#8d5c00";
    ctx.font = "900 13px ui-rounded, system-ui";
    ctx.textAlign = "center";
    ctx.fillText(String(Math.max(0, state.hearts)), 0, 1);
    if (state.studyShield > 0) {
      ctx.strokeStyle = "rgba(110,215,255,0.9)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, c.r + 11 + Math.sin(state.time * 6) * 2, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function getCaptainArt() {
    const captain = artAssets.characters;
    if (state.player.castTimer > 0 && isArtReady(captain.captainCast)) return captain.captainCast;
    const runFrames = [
      captain.captainRun01,
      captain.captainRun02,
      captain.captainRun03,
      captain.captainRun04,
    ].filter(isArtReady);
    if (state.player.moving && runFrames.length) {
      return runFrames[Math.floor(state.time * 9) % runFrames.length];
    }
    return captain.captainIdle;
  }

  function drawCaptainArt() {
    const asset = getCaptainArt();
    if (!isArtReady(asset)) return false;
    drawSoftShadow(2, 23, 23, 7, 0.24);
    drawAnchoredArt(asset, 0, 30, 82, 84);
    if (state.player.castTimer > 0) {
      ctx.save();
      ctx.globalAlpha = clamp(state.player.castTimer / 0.45, 0, 1);
      ctx.fillStyle = "#fff7b8";
      ctx.shadowColor = "rgba(255,214,90,0.7)";
      ctx.shadowBlur = 12;
      drawStar(26, -22, 6, 2.8, 5);
      ctx.fill();
      ctx.restore();
    }
    return true;
  }

  function drawPlayer() {
    const p = state.player;
    ctx.save();
    ctx.translate(p.x, p.y + Math.sin(p.bob) * 2);
    if (drawCaptainArt()) {
      ctx.restore();
      return;
    }
    ctx.fillStyle = "rgba(19,32,65,0.24)";
    ctx.beginPath();
    ctx.ellipse(2, 23, 23, 7, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#274a9f";
    ctx.beginPath();
    ctx.moveTo(-14, -4);
    ctx.quadraticCurveTo(-24, 8, -13, 25);
    ctx.lineTo(13, 25);
    ctx.quadraticCurveTo(23, 8, 14, -4);
    ctx.closePath();
    ctx.fill();
    const suit = ctx.createLinearGradient(0, -14, 0, 22);
    suit.addColorStop(0, "#5ba7ff");
    suit.addColorStop(1, "#265dce");
    ctx.fillStyle = suit;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    roundRect(-13, -12, 26, 34, 9);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#ffe66d";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-9, 2);
    ctx.lineTo(0, 14);
    ctx.lineTo(9, 2);
    ctx.stroke();
    ctx.fillStyle = "#ffd6a5";
    ctx.beginPath();
    ctx.arc(0, -20, 13, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#223154";
    ctx.beginPath();
    ctx.arc(-2, -28, 13, Math.PI, TAU);
    ctx.quadraticCurveTo(8, -29, 12, -18);
    ctx.quadraticCurveTo(3, -22, -10, -17);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#17213a";
    ctx.beginPath();
    ctx.arc(-4, -22, 2, 0, TAU);
    ctx.arc(5, -22, 2, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#7a4429";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(1, -16, 4, 0.15, Math.PI - 0.15);
    ctx.stroke();
    ctx.strokeStyle = "#ffe66d";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(10, -4);
    ctx.lineTo(25, -17);
    ctx.stroke();
    ctx.fillStyle = "#fff7b8";
    drawStar(27, -19, 5, 2.4, 5);
    ctx.fill();
    ctx.restore();
  }

  function drawAllies() {
    for (const ally of state.allies) {
      if (ally.hp <= 0) continue;
      ctx.save();
      ctx.translate(ally.x, ally.y + Math.sin(state.time * 5 + ally.id) * 3);
      ctx.fillStyle = "rgba(19,32,65,0.15)";
      ctx.beginPath();
      ctx.ellipse(0, 13, 13, 5, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.beginPath();
      ctx.ellipse(-10, -2, 10, 5, -0.55, 0, TAU);
      ctx.ellipse(10, -2, 10, 5, 0.55, 0, TAU);
      ctx.fill();
      const g = ctx.createRadialGradient(-4, -6, 2, 0, 0, 18);
      g.addColorStop(0, "#fff7ff");
      g.addColorStop(1, "#ff8fe1");
      ctx.shadowColor = "rgba(255,143,225,0.55)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = g;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#17213a";
      ctx.beginPath();
      ctx.arc(-4, -2, 1.7, 0, TAU);
      ctx.arc(4, -2, 1.7, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "#17213a";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 2, 4, 0.1, Math.PI - 0.1);
      ctx.stroke();
      drawMiniBar(-14, -21, 28, 4, ally.hp / ally.maxHp, "#57d78b");
      ctx.restore();
    }
  }

  function drawEnemies() {
    for (const enemy of state.enemies) {
      ctx.save();
      ctx.translate(enemy.x, enemy.y + Math.sin(enemy.wobble) * 2);
      if (enemy.slow < 1) {
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = "#6ed7ff";
        ctx.beginPath();
        ctx.arc(0, 0, enemy.radius + 8, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      const proto = enemyTypes[enemy.type];
      if (!drawEnemyArt(enemy, proto)) {
        if (enemy.type === "bat") drawBat(enemy, proto);
        else if (enemy.type === "turtle") drawTurtle(enemy, proto);
        else if (proto.boss) drawBoss(enemy, proto);
        else drawBlob(enemy, proto);
      }
      const y = -enemy.radius - 22;
      if (enemy.maxShield) drawMiniBar(-enemy.radius, y - 7, enemy.radius * 2, 4, enemy.shield / enemy.maxShield, "#70c7ff");
      drawMiniBar(-enemy.radius, y, enemy.radius * 2, 5, enemy.hp / enemy.maxHp, "#ff5d73");
      ctx.restore();
    }
  }

  function drawEnemyArt(enemy, proto) {
    const asset = artAssets.enemies[enemyArtKey[enemy.type]];
    if (!isArtReady(asset)) return false;
    const radius = enemy.radius;
    const isBoss = Boolean(proto.boss);
    const height = isBoss ? radius * 2.6 : enemy.type === "bat" ? radius * 2.45 : radius * 2.35;
    const maxWidth = isBoss ? radius * 2.9 : enemy.type === "bat" ? radius * 4.3 : radius * 2.75;
    drawSoftShadow(2, radius * 0.88, radius * (enemy.type === "bat" ? 1.18 : 0.98), radius * 0.28, 0.18);
    drawAnchoredArt(asset, 0, radius * 1.04, height, maxWidth);
    if (enemy.type === "shield" && enemy.shield > 0) {
      ctx.save();
      ctx.globalAlpha = 0.56;
      ctx.strokeStyle = "#70c7ff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, radius + 6, -Math.PI * 0.8, Math.PI * 0.85);
      ctx.stroke();
      ctx.restore();
    }
    return true;
  }

  function drawBlob(enemy, proto) {
    ctx.fillStyle = "rgba(19,32,65,0.18)";
    ctx.beginPath();
    ctx.ellipse(0, enemy.radius * 0.88, enemy.radius * 0.9, enemy.radius * 0.28, 0, 0, TAU);
    ctx.fill();
    const body = ctx.createRadialGradient(-enemy.radius * 0.35, -enemy.radius * 0.38, 3, 0, 0, enemy.radius * 1.15);
    body.addColorStop(0, lighten(proto.color, 0.32));
    body.addColorStop(0.55, proto.color);
    body.addColorStop(1, darken(proto.color, 0.2));
    ctx.fillStyle = body;
    ctx.strokeStyle = proto.outline;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, enemy.radius * 1.03, enemy.radius * 0.96, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.32)";
    ctx.beginPath();
    ctx.ellipse(-enemy.radius * 0.28, -enemy.radius * 0.36, enemy.radius * 0.24, enemy.radius * 0.11, -0.55, 0, TAU);
    ctx.fill();
    if (enemy.type === "shield") {
      ctx.globalAlpha = 0.92;
      ctx.strokeStyle = "#70c7ff";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius + 5, -Math.PI * 0.8, Math.PI * 0.85);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (enemy.type === "rogue") {
      ctx.fillStyle = "#ffe66d";
      drawStar(0, -enemy.radius * 0.88, 8, 4, 5);
      ctx.fill();
    }
    drawEnemyFace(enemy.radius);
  }

  function drawTurtle(enemy, proto) {
    ctx.fillStyle = "rgba(19,32,65,0.18)";
    ctx.beginPath();
    ctx.ellipse(0, enemy.radius * 0.82, enemy.radius, enemy.radius * 0.28, 0, 0, TAU);
    ctx.fill();
    const shell = ctx.createLinearGradient(0, -enemy.radius, 0, enemy.radius);
    shell.addColorStop(0, "#b6e778");
    shell.addColorStop(1, "#4e9b42");
    ctx.fillStyle = shell;
    ctx.strokeStyle = proto.outline;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, enemy.radius * 1.15, enemy.radius * 0.8, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.ellipse(-enemy.radius * 0.28, -enemy.radius * 0.24, enemy.radius * 0.32, enemy.radius * 0.14, -0.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#5ba946";
    ctx.beginPath();
    ctx.ellipse(0, -2, enemy.radius * 0.7, enemy.radius * 0.48, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(35,82,39,0.38)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-enemy.radius * 0.42, -2);
    ctx.lineTo(enemy.radius * 0.42, -2);
    ctx.moveTo(0, -enemy.radius * 0.38);
    ctx.lineTo(0, enemy.radius * 0.32);
    ctx.stroke();
    drawEnemyFace(enemy.radius * 0.74);
  }

  function drawBat(enemy, proto) {
    ctx.fillStyle = "rgba(19,32,65,0.18)";
    ctx.beginPath();
    ctx.ellipse(0, enemy.radius * 0.92, enemy.radius, enemy.radius * 0.22, 0, 0, TAU);
    ctx.fill();
    const wing = ctx.createLinearGradient(0, -enemy.radius, 0, enemy.radius);
    wing.addColorStop(0, lighten(proto.color, 0.18));
    wing.addColorStop(1, darken(proto.color, 0.22));
    ctx.fillStyle = wing;
    ctx.strokeStyle = proto.outline;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-enemy.radius * 0.4, 0);
    ctx.quadraticCurveTo(-enemy.radius * 1.6, -enemy.radius * 0.9, -enemy.radius * 2.05, 2);
    ctx.quadraticCurveTo(-enemy.radius * 1.3, -enemy.radius * 0.2, -enemy.radius * 0.7, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(enemy.radius * 0.4, 0);
    ctx.quadraticCurveTo(enemy.radius * 1.6, -enemy.radius * 0.9, enemy.radius * 2.05, 2);
    ctx.quadraticCurveTo(enemy.radius * 1.3, -enemy.radius * 0.2, enemy.radius * 0.7, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    const body = ctx.createRadialGradient(-4, -5, 2, 0, 0, enemy.radius);
    body.addColorStop(0, lighten(proto.color, 0.35));
    body.addColorStop(1, proto.color);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius * 0.82, 0, TAU);
    ctx.fill();
    ctx.stroke();
    drawEnemyFace(enemy.radius * 0.72);
  }

  function drawBoss(enemy, proto) {
    ctx.fillStyle = "rgba(19,32,65,0.22)";
    ctx.beginPath();
    ctx.ellipse(4, enemy.radius * 0.84, enemy.radius * 1.14, enemy.radius * 0.28, 0, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.globalAlpha = 0.18 + Math.sin(state.time * 3) * 0.04;
    ctx.strokeStyle = "#fff2a6";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius + 13, 0, TAU);
    ctx.stroke();
    ctx.restore();
    const g = ctx.createRadialGradient(-enemy.radius * 0.25, -enemy.radius * 0.35, 4, 0, 0, enemy.radius);
    g.addColorStop(0, "#fff8d6");
    g.addColorStop(1, proto.color);
    ctx.fillStyle = g;
    ctx.shadowColor = "rgba(255,235,160,0.45)";
    ctx.shadowBlur = 18;
    ctx.strokeStyle = proto.outline;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(87,84,137,0.18)";
    for (const [x, y, r] of [
      [-15, -12, 7],
      [16, 8, 9],
      [4, -24, 5],
    ]) {
      ctx.beginPath();
      ctx.arc(x * (enemy.radius / 42), y * (enemy.radius / 42), r * (enemy.radius / 42), 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(87,84,137,0.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-enemy.radius * 0.16, -enemy.radius * 0.05, enemy.radius * 0.64, -0.4, 2.7);
    ctx.stroke();
    drawEnemyFace(enemy.radius * 0.55);
  }

  function drawEnemyFace(radius) {
    ctx.fillStyle = "#17213a";
    ctx.beginPath();
    ctx.arc(-radius * 0.28, -radius * 0.12, Math.max(2, radius * 0.09), 0, TAU);
    ctx.arc(radius * 0.28, -radius * 0.12, Math.max(2, radius * 0.09), 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.beginPath();
    ctx.arc(-radius * 0.31, -radius * 0.15, Math.max(1, radius * 0.035), 0, TAU);
    ctx.arc(radius * 0.25, -radius * 0.15, Math.max(1, radius * 0.035), 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#17213a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, radius * 0.12, radius * 0.22, 0.18, Math.PI - 0.18);
    ctx.stroke();
  }

  function drawBullets() {
    for (const bullet of state.bullets) {
      ctx.save();
      ctx.fillStyle = bullet.color;
      ctx.shadowColor = bullet.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawParticles() {
    for (const particle of state.particles) {
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      if (particle.arc) {
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(particle.arc.x1, particle.arc.y1);
        ctx.lineTo(particle.arc.x2, particle.arc.y2);
        ctx.stroke();
      } else {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r * (1 + (1 - alpha) * 1.4), 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawFloatingText() {
    for (const text of state.damageText) {
      const alpha = clamp(text.life / text.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = "900 15px ui-rounded, system-ui";
      ctx.textAlign = "center";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(23,33,58,0.62)";
      ctx.fillStyle = text.color;
      ctx.strokeText(text.text, text.x, text.y);
      ctx.fillText(text.text, text.x, text.y);
      ctx.restore();
    }
  }

  function drawAiming() {
    if (!state.lightningAiming) return;
    const size = clamp(Math.min(state.w, state.h) * 0.108, 68, 108);
    ctx.save();
    ctx.strokeStyle = "rgba(255,241,118,0.92)";
    ctx.fillStyle = "rgba(255,241,118,0.13)";
    ctx.lineWidth = 2;
    for (let gx = -1; gx <= 1; gx += 1) {
      for (let gy = -1; gy <= 1; gy += 1) {
        ctx.beginPath();
        ctx.rect(state.pointer.x + gx * size - size / 2, state.pointer.y + gy * size - size / 2, size, size);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawMenuCanvasDetails() {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 18; i += 1) {
      const x = ((i * 173 + state.time * 18) % (state.w + 120)) - 60;
      const y = 70 + ((i * 89) % Math.max(260, state.h - 120));
      drawStar(x, y, 7 + (i % 3) * 2, 3, 5);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawMiniBar(x, y, w, h, ratio, color) {
    ctx.save();
    ctx.fillStyle = "rgba(23,33,58,0.34)";
    roundRect(x, y, w, h, h / 2);
    ctx.fill();
    ctx.fillStyle = color;
    roundRect(x, y, Math.max(0, w * clamp(ratio, 0, 1)), h, h / 2);
    ctx.fill();
    ctx.restore();
  }

  function drawStar(x, y, outer, inner, points) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i += 1) {
      const radius = i % 2 === 0 ? outer : inner;
      const angle = -Math.PI / 2 + (i * Math.PI) / points;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function roundRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function syncHud() {
    ui.hudLevel.textContent = state.level;
    ui.hudHearts.textContent = Math.max(0, state.hearts);
    ui.hudStars.textContent = state.stars;
    ui.hudTimer.textContent = Math.max(0, Math.ceil(state.timeLimit));
    ui.lightningCd.textContent = state.lightningCd > 0 ? Math.ceil(state.lightningCd) : "0";
    ui.pulseCd.textContent = state.player.pulseCd > 0 ? Math.ceil(state.player.pulseCd) : "0";
    ui.lightningBtn.disabled = state.mode !== "playing" || state.lightningCd > 0;
    ui.pulseBtn.disabled = state.mode !== "playing" || state.player.pulseCd > 0;
  }

  function toast(message) {
    ui.toast.textContent = message;
    ui.toast.classList.add("is-active");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => ui.toast.classList.remove("is-active"), 1500);
  }

  function ensureAudio() {
    if (state.audio || !state.soundOn) return state.audio;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    state.audio = new AudioContext();
    return state.audio;
  }

  function playTone(freq, duration, type = "sine", gain = 0.04) {
    if (!state.soundOn) return;
    const audio = ensureAudio();
    if (!audio) return;
    const osc = audio.createOscillator();
    const volume = audio.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    volume.gain.value = gain;
    osc.connect(volume);
    volume.connect(audio.destination);
    osc.start();
    volume.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    osc.stop(audio.currentTime + duration + 0.02);
  }

  function initEvents() {
    const handleBoardPointer = (event) => {
      state.pointer = getPointer(event);
      if (state.mode !== "playing" || state.paused) return;
      ensureAudio();
      handleCanvasAction(state.pointer);
    };
    const handleAppPointer = (event) => {
      if (event.target === canvas) return;
      const target = event.target;
      if (!target || typeof target.closest !== "function") return;
      if (
        target.closest(
          "button, .tower-card, .build-menu, .selection-panel, .skill-dock, .hud-top, .modal.is-active, .screen.is-active",
        )
      ) {
        return;
      }
      handleBoardPointer(event);
    };

    window.addEventListener("resize", resize);
    canvas.addEventListener("pointermove", (event) => {
      state.pointer = getPointer(event);
    });
    canvas.addEventListener("pointerdown", handleBoardPointer);
    canvas.parentElement.addEventListener("pointerdown", handleAppPointer);
    window.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      state.keys.add(key);
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
        event.preventDefault();
      }
      if (key === "escape") {
        if (state.mode === "playing") togglePause();
        else if (state.mode === "result") showMenu();
      }
      if (key === "q") toggleLightningAim();
      if (key === " ") castPulse();
      const number = Number(key);
      if (number >= 1 && number <= towerTypes.length) {
        const type = towerTypes[number - 1];
        if (type && state.level >= type.unlock) {
          state.selectedTowerType = type.id;
          state.selectedEntity = null;
          renderTowerBar();
          updateSelectionPanel();
        }
      }
    });
    window.addEventListener("keyup", (event) => {
      state.keys.delete(event.key.toLowerCase());
    });

    ui.resumeBtn.addEventListener("click", () => {
      ensureAudio();
      const save = loadSave();
      startLevel(save.currentLevel);
    });
    ui.newRunBtn.addEventListener("click", () => {
      ensureAudio();
      resetDailySave();
      startLevel(1);
    });
    ui.menuBtn.addEventListener("click", showMenu);
    ui.pauseBtn.addEventListener("click", togglePause);
    ui.resumeGameBtn.addEventListener("click", togglePause);
    ui.pauseMenuBtn.addEventListener("click", showMenu);
    ui.resultMenuBtn.addEventListener("click", showMenu);
    ui.nextLevelBtn.addEventListener("click", () => {
      const next = state.level === MAX_LEVEL ? 1 : clamp(state.level + 1, 1, MAX_LEVEL);
      startLevel(next);
    });
    ui.upgradeBtn.addEventListener("click", upgradeSelectedTower);
    ui.sellBtn.addEventListener("click", sellSelectedTower);
    ui.lightningBtn.addEventListener("click", toggleLightningAim);
    ui.pulseBtn.addEventListener("click", castPulse);
    ui.soundBtn.addEventListener("click", () => {
      state.soundOn = !state.soundOn;
      ui.soundBtn.textContent = state.soundOn ? "♪" : "×";
      if (state.soundOn) {
        ensureAudio();
        playTone(660, 0.05, "sine", 0.035);
      }
    });
  }

  function toggleLightningAim() {
    if (state.mode !== "playing" || state.paused || state.lightningCd > 0) return;
    state.lightningAiming = !state.lightningAiming;
    toast(state.lightningAiming ? "选择闪电落点" : "闪电收起");
  }

  function frame(ts) {
    const dt = state.lastTs ? Math.min((ts - state.lastTs) / 1000, 0.033) : 0;
    state.lastTs = ts;
    if (state.mode === "playing" && !state.paused) update(dt);
    else state.time += dt;
    draw();
    requestAnimationFrame(frame);
  }

  function boot() {
    const save = loadSave();
    state.saveDate = save.date;
    state.level = save.currentLevel;
    state.unlockedLevel = save.unlockedLevel;
    state.bestScore = save.bestScore;
    resize();
    initEvents();
    loadOptionalArt();
    renderMenu();
    requestAnimationFrame(frame);
  }

  boot();
})();
