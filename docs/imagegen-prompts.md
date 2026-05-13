# Image Gen 2 素材提示词草案

这些提示词用于《岛屿保卫战》的正式素材生产。当前美术方向：

- 精致玩具模型风
- 稍微倾斜的等距视角
- 温暖童话自然色
- 可爱但有捣蛋威胁的敌人
- 清楚爽快但不吵的战斗反馈

## 1. 通用风格约束

所有素材都应遵守：

```text
Use case: stylized-concept
Asset type: isometric game sprite for a children's tower defense game
Style: premium toy-model look, soft rounded shapes, warm fairytale natural colors, polished 2.5D isometric game art, gentle clay/vinyl toy material, clear readable silhouette, soft studio lighting, subtle rim light, clean edges, no harsh horror, no photorealism, no text, no watermark
Camera: three-quarter isometric view, slight top-down angle, centered subject, generous padding
Background: perfectly flat solid #00ff00 chroma-key background for background removal; no shadows or gradients in the background; do not use #00ff00 in the subject
```

## 2. 主角：小岛队长

输入图片角色：

- `/Users/jack/Documents/studygame/小岛.jpeg`：人物参考图，参考小朋友气质、年龄感、脸型。
- `/Users/jack/Documents/studygame/小岛和爸爸.jpeg`：辅助参考图，只参考小朋友，不生成爸爸角色。

### 2.1 主角站立

```text
Use case: stylized-concept
Asset type: main playable character sprite
Input images: Image 1 is character identity reference for the child; Image 2 is supporting identity reference for the same child only
Primary request: Create a stylized cartoon game character based on the child reference, transformed into a Little Island Captain for a children's tower defense game.
Subject: an 8-year-old Chinese boy captain, brave and cute, wearing a blue-and-white island guardian uniform with a small captain scarf/cape, holding a golden star command wand
Pose: idle standing pose, ready to lead tiny sprite companions
Style: premium toy-model look, soft rounded vinyl figure, warm fairytale natural colors, polished 2.5D isometric game sprite, clear readable silhouette, big expressive eyes, child-friendly
Camera: three-quarter isometric view, slight top-down angle, centered full body, generous padding
Background: perfectly flat solid #00ff00 chroma-key background for background removal; no shadows, gradients, texture, text, or watermark; do not use #00ff00 in the subject
Avoid: realistic photo, scary expression, anime exaggeration, mobile ad gloss, complex background
```

Suggested output path:

`assets/characters/captain_idle.png`

### 2.2 主角跑步帧

```text
Same character as the Little Island Captain. Create one running animation frame for an isometric children's tower defense game sprite. Blue-and-white island guardian uniform, golden star command wand, playful determined expression, premium toy-model look, warm fairytale natural colors, centered full body on flat #00ff00 chroma-key background. No text, no watermark.
```

Suggested output paths:

- `assets/characters/captain_run_01.png`
- `assets/characters/captain_run_02.png`
- `assets/characters/captain_run_03.png`
- `assets/characters/captain_run_04.png`

### 2.3 主角技能姿势

```text
Same Little Island Captain character. Create a skill-casting pose: the child raises a golden star command wand, summoning a gentle star-light burst. Premium toy-model isometric game sprite, warm natural colors, clear silhouette, child-friendly heroic expression, full body centered, flat #00ff00 chroma-key background, no text, no watermark.
```

Suggested output path:

`assets/characters/captain_cast.png`

## 3. 小精灵

### 3.1 粉色攻击小精灵

```text
Create a tiny candy sprite companion for a children's tower defense game. Pink translucent soft-candy body, tiny wings, star-shaped glow, cute brave face, premium toy-model isometric sprite, warm fairytale natural colors, readable at small size, centered on flat #00ff00 chroma-key background, no text, no watermark.
```

Suggested output path:

`assets/allies/sprite_pink_idle.png`

### 3.2 蓝色护盾小精灵

```text
Create a tiny shield sprite companion for a children's tower defense game. Blue translucent soft-candy body, small round shield aura, cute protective face, premium toy-model isometric sprite, warm fairytale natural colors, centered on flat #00ff00 chroma-key background, no text, no watermark.
```

Suggested output path:

`assets/allies/sprite_blue_shield.png`

## 4. 炮台

### 4.1 电炮台

```text
Create an isometric toy-model electric tower for a children's tower defense game. Blue battery base, small copper coil, star-shaped electric spark, warm wood-and-gem details, cute rounded construction, premium polished 2.5D sprite, clear silhouette, centered on flat #00ff00 chroma-key background, no text, no watermark.
```

Suggested output path:

`assets/towers/spark_lv1.png`

### 4.2 寒冰塔

```text
Create an isometric toy-model frost tower for a children's tower defense game. Pale blue ice crystal on a warm wooden base, snowflake detail, rounded toy-like shape, soft glow, premium polished 2.5D sprite, clear silhouette, centered on flat #00ff00 chroma-key background, no text, no watermark.
```

Suggested output path:

`assets/towers/frost_lv1.png`

### 4.3 饼干炮

```text
Create an isometric toy-model cookie cannon for a children's tower defense game. Cookie cannon barrel, cream frosting trim, warm wooden base, playful but sturdy, premium polished 2.5D sprite, clear silhouette, centered on flat #00ff00 chroma-key background, no text, no watermark.
```

Suggested output path:

`assets/towers/cookie_lv1.png`

### 4.4 彩虹镜

```text
Create an isometric toy-model rainbow prism tower for a children's tower defense game. Gem prism reflector, rainbow arc detail, warm wooden base, magical but clean, premium polished 2.5D sprite, clear silhouette, centered on flat #00ff00 chroma-key background, no text, no watermark.
```

Suggested output path:

`assets/towers/rainbow_lv1.png`

## 5. 怪物

### 5.1 圆圆怪

```text
Create a cute mischievous round monster for a children's tower defense game. Green soft vinyl toy body, tiny feet, big cheeky eyes, playful troublemaker expression, not scary, premium isometric toy-model sprite, centered on flat #00ff00 chroma-key background, no text, no watermark.
```

Suggested output path:

`assets/enemies/blob_idle.png`

### 5.2 盾盾怪

```text
Create a cute shield monster for a children's tower defense game. Round green soft vinyl body with a visible blue bubble shield arc in front, mischievous but child-friendly face, premium isometric toy-model sprite, clear silhouette, centered on flat #00ff00 chroma-key background, no text, no watermark.
```

Suggested output path:

`assets/enemies/shield_idle.png`

### 5.3 乌龟怪

```text
Create a cute slow turtle monster for a children's tower defense game. Thick rounded shell, short legs, sleepy stubborn expression, green and warm brown toy material, not scary, premium isometric toy-model sprite, centered on flat #00ff00 chroma-key background, no text, no watermark.
```

Suggested output path:

`assets/enemies/turtle_idle.png`

### 5.4 蝙蝠怪

```text
Create a cute fast bat monster for a children's tower defense game. Small purple body, oversized rounded wings, cheeky grin, not scary, premium isometric toy-model sprite, clear silhouette, centered on flat #00ff00 chroma-key background, no text, no watermark.
```

Suggested output path:

`assets/enemies/bat_idle.png`

### 5.5 月球 Boss

```text
Create a cute but imposing moon boss monster for a children's tower defense game. Large round moon body, soft crater details, mischievous face, warm pale gold material, slow heavy toy-model presence, not scary, premium isometric 2.5D game sprite, centered on flat #00ff00 chroma-key background, no text, no watermark.
```

Suggested output path:

`assets/enemies/moon_boss_idle.png`

## 6. 生成后的处理

1. 保存到 `$CODEX_HOME/generated_images/...` 后复制进项目目录。
2. 用 chroma key 去除 #00ff00 背景。
3. 验证透明角、主体边缘、尺寸一致性。
4. 保存到建议路径后，更新 `assets/generated-assets.json` 中对应 key，游戏才会加载该素材。
5. 如果边缘不干净，重新生成或二次去底。

Manifest key 示例：

```json
{
  "characters": {
    "captainIdle": "./assets/characters/captain_idle.png",
    "captainCast": "./assets/characters/captain_cast.png"
  },
  "ui": {
    "captainPortrait": "./assets/ui/captain_portrait.png"
  },
  "towers": {
    "sparkLv1": "./assets/towers/spark_lv1.png",
    "frostLv1": "./assets/towers/frost_lv1.png",
    "cookieLv1": "./assets/towers/cookie_lv1.png",
    "rainbowLv1": "./assets/towers/rainbow_lv1.png"
  },
  "enemies": {
    "blobIdle": "./assets/enemies/blob_idle.png",
    "shieldIdle": "./assets/enemies/shield_idle.png",
    "turtleIdle": "./assets/enemies/turtle_idle.png",
    "batIdle": "./assets/enemies/bat_idle.png",
    "moonBossIdle": "./assets/enemies/moon_boss_idle.png"
  }
}
```
