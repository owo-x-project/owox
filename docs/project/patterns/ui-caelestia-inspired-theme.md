---
status: 採用
related:
  - docs/project/specs/owox/SPEC-ui-workspace-shell.md
  - docs/project/specs/owox/SPEC-ui-responsive-webui.md
subproject: owox
---

# Caelestia Inspired Theme

## 目的

Caelestia Shell を参照した translucent surface、Material Design 3 風 color、密度、motion の視覚方針を統一する。

## 適用範囲

- workspace shell、drawer、panel、modal、status surface、command palette。

## 適用しない範囲

- terminal text rendering の可読性を下げる透明化。
- editor text rendering の可読性を下げる装飾。
- 情報密度を落とす過度な余白。

## パターン

- motion と視覚的 polish を重視する。
- color system は Material Design 3 dynamic color 風の base / accent / semantic token とする。
- translucent surface と blur は workspace chrome に限定する。
- workspace chrome は top bar、drawer、sheet、modal、command palette を指す。
- terminal、editor、diff の本文領域は不透明背景寄りにし、decorative blur を禁止する。
- terminal と editor は可読性を最優先し、contrast、font size、line height の下限を持つ。
- motion は操作の方向、状態変化、sheet / modal の出入りを説明する目的で使う。
- density は compact workbench とする。status / panel は薄く、touch target は viewport 別に確保する。
- motion duration token は micro 80ms、standard 160ms、sheet / modal 220ms、heavy 320ms とする。
- easing token は Material Design 3 風に standard、emphasized、decelerate、accelerate を持つ。
- `prefers-reduced-motion` を必須対応し、transform motion を fade / instant に落とす。

## 適用条件

- shell、drawer、panel、modal など workspace chrome を表現する場合。
- ユーザーが操作対象や状態変化を視覚的に追う必要がある場合。

## 例外 / 逸脱条件

- terminal / editor / diff の本文領域では decorative blur や強い transparency を避ける。
- 低性能端末や reduced motion 設定では motion を抑制する。
- high contrast が必要な状態では translucent surface より contrast を優先する。

## 根拠

- Caelestia Shell の視覚的な shell 感を取り入れつつ、開発作業の可読性を守る。

## 関連資料

- `../specs/owox/SPEC-ui-workspace-shell.md`
- `../specs/owox/SPEC-ui-responsive-webui.md`
