# owox Product Roadmap

## 目的

ADR-0003 の product split に基づき、`owox`、`owlcore`、brand repo 拡張を段階的に実装する。

## 範囲

- v0 `owox` Terminal Workspace / plugin host
- v1 `owlcore` serverless repo-native 公式 plugin
- v2 brand repo / brand context exploration

## 対象外

- 旧 Owox 制御プレーンをそのまま `owoxd` server として実装すること
- Git hosting / CI/CD / deployment service の再実装
- community marketplace の完全版

## Phase

- `phase-00-rebaseline-docs/index.md`: 既存資料を ADR-0003 に合わせて再基準化する
- `phase-01-owox-host/index.md`: `owox` shell、terminal workspace、plugin host、plugin UI host を固める
- `phase-02-owlcore-plugin/index.md`: `owlcore` CLI / library / repo layout / plugin UI を実装する
- `phase-03-brand-context/index.md`: brand repo / brand context の実装形態を検討する

## 完了定義

- v0 要件が `owox` 本体に閉じている。
- v1 要件が `owlcore` plugin に閉じている。
- `.owox/owlcore/` layout が schema / CLI / plugin UI から一貫して使える。
- brand repo が v2 以降の拡張として分離されている。

## 関連資料

- `../../adr/active/ADR-0003-owox-owlcore-product-split.md`
- `../../requirements/owox/v0/index.md`
- `../../requirements/owlcore/v1/index.md`
- `../../requirements/brand-repo/v2/index.md`
