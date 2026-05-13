# Image Gen 2 美术重设方向

当前目标：把《岛屿保卫战》从“编辑器原型感”改成 8 岁小朋友能直接玩的 3D 塔防游戏。美术要求是精致玩具模型风、低多边形 3D、可爱但不幼稚、能上 Steam 原型页，避免草稿、避免高饱和手游广告感。

## 统一风格

- 3D toy diorama / premium low-poly game art。
- 等距或 2.5D 俯视角，轮廓清楚，小尺寸也能认出。
- 暖色自然岛屿、糖果、星星能量和蓝白队长主题。
- UI 要像儿童冒险游戏，不像开发工具或编辑器。
- 不使用真人照片，不把真实小朋友直接放进游戏。

## 需要 Image Gen 2 生成的第一批资产

1. `assets/imagegen2/art_direction_key.png`
   - 用作整体美术方向板：岛屿、星星岛心、队长、4 类炮台、5 类怪物、小精灵。
2. `assets/imagegen2/ui_tower_cards.png`
   - 4 个炮台按钮图：电炮台、寒冰塔、小路障、饼干炮。
3. `assets/imagegen2/characters_and_enemies_sheet.png`
   - 队长、小精灵、圆怪、盾怪、乌龟、蝙蝠、月球 Boss 角色表。
4. `assets/imagegen2/gameplay_mockup.png`
   - 真正游戏界面 mockup：顶部状态、右侧或底部建造菜单、3D 岛屿战斗中画面。

## Prompt 1: 总体美术方向板

Use case: stylized-concept
Asset type: 3D game art direction key sheet
Primary request: A polished art direction board for a browser 3D tower defense game named Island Defense, showing a toy-like island battlefield with a star heart core, a brave child island captain in blue-white uniform with a golden star baton, helper sprites, candy objects, four defense towers, and cute mischievous monsters.
Scene/backdrop: bright ocean island diorama, yellow wooden roads leading toward a glowing star core, candy and natural island props.
Style/medium: premium low-poly 3D toy model render, Steam-quality indie game concept, not sketchy, not flat 2D, not mobile ad.
Composition/framing: clean art sheet with grouped subjects and one small gameplay vignette, no UI text.
Lighting/mood: warm daylight, soft shadows, playful adventure mood.
Color palette: turquoise water, fresh island greens, warm sand and wood, blue-white captain colors, gold stars, gentle candy accents.
Constraints: child-friendly for age 8, cute but readable, clear silhouettes, no scary horror, no real photos, no watermark, no text.

## Prompt 2: 炮台按钮图

Use case: stylized-concept
Asset type: game UI tower card icon sheet
Primary request: Four polished 3D toy-like tower icons for a children-friendly island tower defense game: electric spark tower, frost tower, slow road barrier, cookie cannon.
Scene/backdrop: each tower on a simple dark-blue rounded game card tile with warm rim lighting.
Style/medium: premium low-poly 3D toy render, compact readable icons, consistent material language.
Composition/framing: 2x2 icon sheet, each tower centered with generous padding, no text.
Lighting/mood: cheerful but polished, soft studio shadows.
Color palette: electric blue and gold, icy blue-white, warm wood and yellow road barrier, cookie tan and cream.
Constraints: no text, no watermark, no messy background, no high-saturation mobile ad style.

## Prompt 3: 角色和怪物表

Use case: stylized-concept
Asset type: game character and enemy model sheet
Primary request: A consistent 3D toy model sheet for Island Defense: child island captain with blue-white uniform and golden star baton, tiny helper sprite, round green blob monster, shield monster with blue shield, slow turtle monster, fast cute bat, moon boss.
Scene/backdrop: neutral warm light gray-blue studio background.
Style/medium: polished low-poly 3D toy models, game-ready silhouettes.
Composition/framing: lineup from left to right, equal scale references, no labels or text.
Lighting/mood: warm soft light, playful but battle-ready.
Constraints: age 8 friendly, cute mischievous monsters, not scary, no real child face, no watermark.

## Prompt 4: 游戏界面 mockup

Use case: ui-mockup
Asset type: polished in-game HUD and interaction mockup
Primary request: A final-looking in-game screenshot mockup for a 3D island tower defense game for an 8-year-old player, showing the island, star heart, incoming cute monsters, placed towers, helper sprites, and a simple child-friendly build menu.
Scene/backdrop: full-screen 3D island battlefield, not an editor, no developer panel.
Style/medium: premium low-poly 3D game UI mockup.
Composition/framing: top-down angled camera, top HUD with hearts/stars/time, bottom or right build menu with large tower buttons, clear call-to-action.
Lighting/mood: warm adventure, readable and calm.
Constraints: no English developer words, no "Designer", no "DEV ROUTE", no wireframe/editor UI, no real photos, no watermark.

## 后续素材计划

- 按上述 prompt 继续生成更完整的 UI 卡片、升级态炮台、补给船和精灵训练素材。
- 新素材建议保存到 `assets/imagegen2/` 或覆盖现有同名 PNG，再通过 manifest 接入游戏。
