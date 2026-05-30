# Task 003: Surface 切替・Sheet 開閉のページ遷移アニメーション

## 目的

Terminal/Files/Review の Surface 切替と、モバイルの Sheet 開閉にスムーズなトランジションを追加する。

## 前提条件

- Phase 01 完了

## 作業内容

- Surface 切替時に crossfade (opacity + translateY) アニメーション追加
  - 現在の Surface がフェードアウト (opacity: 1→0, translateY: 0→-8px)
  - 新しい Surface がフェードイン (opacity: 0→1, translateY: 8px→0)
  - `--motion-standard` (160ms) で統一
- Sheet 開閉のアニメーション改善
  - 現在の `sheet-in` キーフレームを強化
  - 閉じるときの `sheet-out` キーフレーム追加
  - バックドロップのフェードイン/アウト
- ドロワーの展開/折りたたみにスライドアニメーション
- SolidJS の `<Transition>` / `<TransitionGroup>` を使用

## 完了条件

- Surface 切替時にスムーズなクロスフェードがある
- Sheet 開閉がスムーズ
- ドロワー展開/折りたたみにアニメーションがある

## 検証方法

- Terminal→Files→Review の切替操作でアニメーション確認
- モバイルビューポートで Sheet 操作確認

## 依存関係

- Phase 01 完了

## 成果物

- `src/features/shell/WorkspaceShell.tsx` (変更)
- `src/features/shell/Sheet.tsx` (変更)
- `src/styles.css` (変更)
