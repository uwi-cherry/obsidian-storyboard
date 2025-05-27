# 実装計画

## 目的

既存の「モチーフ生成システム」と「エピソード補完連結システム」を統合し、Obsidian プラグインとしてストーリー生成機能を提供する。

## 大まかな流れ

1. **準備**
   - `src` アーキテクチャに基づき、新しい機能用ディレクトリを作成。
   - 必要に応じて React コンポーネントやツールクラスを配置する。

2. **モチーフ生成機能の実装**
   - `docs/motif-generation-system.md` のアルゴリズムを参考に、
     - `iterative_divergence`
     - `validate_concepts`
     - `list_contrastive_items`
     - `extract_commonality`
     - `concretize_maximally`
     を実装。
   - キャラクター設定とエピソード生成を行う `episodes_generation_system` まで作成する。

3. **エピソード連結機能の実装**
   - `docs/episode-connection-system.md` の内容に沿って、
     - `label_episodes`
     - `create_episode_bridges`
     - `manage_character_continuity`
     - `create_final_connected_story`
     - `connect_episodes_with_bridges`
     などを実装。
   - キャラクターの人格と状態を分離しつつ、エピソード同士を強引にでも連結させるロジックを組み込む。

4. **統合・UI実装**
   - モチーフ生成とエピソード連結を組み合わせた `complete_story_system_with_bridges` を作成。
   - Obsidian 上で入力単語を受け取り、最終的な物語を出力する UI を React で実装。
   - ユーザー操作を最小限にし、生成結果をノートへ自動挿入する仕組みを整える。

5. **テストと調整**
   - 可能な範囲で単体テストを作成し、各関数の振る舞いを確認。
   - 出力が極端に偏らないようパラメータやプロンプトを調整する。

## 補足

実装の詳細は既存ドキュメントを参照しつつ、Obsidian プラグインとしての構造を崩さないよう注意する。初期段階では最小機能の実装にとどめ、動作確認後に追加機能を検討する。
