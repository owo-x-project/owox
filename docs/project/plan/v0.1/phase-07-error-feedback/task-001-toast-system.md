# Task 001: トースト通知システム

## 目的

エラー/警告/情報をトースト形式で表示し、自動消滅、手動 dismiss、スタック表示を実装する。

## 前提条件

- Phase 01 完了

## 作業内容

- トーストストアの作成:
  ```typescript
  interface Toast {
    id: string;
    kind: 'error' | 'warning' | 'info' | 'success';
    message: string;
    detail?: string;
    duration?: number; // ms, 0=永続
    dismissible: boolean;
  }
  ```
  - SolidJS ストアで管理
  - `addToast()` / `removeToast()` アクション
- ToastContainer コンポーネント:
  - 画面右下に固定配置
  - 最大表示数: 5 (古いものから消える)
  - スタック表示 (新しいものが上)
  - 各トーストに:
    - × ボタン (dismiss)
    - 種別アイコン + 色分け
    - プログレスバー (残り時間)
- 自動消滅:
  - 非致命エラー: 5秒
  - 警告: 4秒
  - 情報: 3秒
  - 成功: 2秒
  - 致命エラー: 自動消滅しない (手動 dismiss のみ)
- アニメーション:
  - 表示: 右からスライドイン + フェードイン
  - 消滅: 右へスライドアウト + フェードアウト
  - `prefers-reduced-motion` 対応
- 既存 ErrorBanner からの移行:
  - `toErrorView()` の出力を `addToast()` に接続
  - インライン表示が適切な箇所はインラインのまま維持

## 完了条件

- トーストが右下にスタック表示される
- 自動消滅する
- × ボタンで手動 dismiss できる
- 種別ごとに色分けされている

## 検証方法

- エラー発生操作 (存在しないファイルの読み込み等) でトースト表示確認
- 自動消滅タイミング確認
- × ボタン操作確認

## 依存関係

- Phase 01 完了

## 成果物

- `src/features/feedback/toast-store.ts` (新規)
- `src/features/feedback/ToastContainer.tsx` (新規)
- `src/features/feedback/Toast.tsx` (新規)
- `src/features/feedback/feedback.css` (変更)
- 各 Surface コンポーネント (ErrorBanner → Toast への移行)
