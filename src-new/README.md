# src-new アーキテクチャ設計書

## 概要

src-newは3層アーキテクチャに基づいて設計されたモジュラー型Obsidianプラグインアーキテクチャです。
関心の分離、依存性の逆転、拡張性を重視した設計となっています。

## アーキテクチャ層構成

```
src-new/
├── obsidian-api/          # Obsidian統合層（下位層）
│   ├── common/           # 共通定数・アイコン
│   ├── [feature]/        # 機能別ディレクトリ
│   │   ├── [feature]-plugin.ts    # Obsidianプラグイン統合
│   │   ├── [feature]-factory.ts   # React注入・View管理
│   │   ├── [feature]-view.ts      # ObsidianのView実装
│   │   └── [feature]-files.ts     # ファイル操作
├── react/                # React UI層（中間層）
│   ├── types/           # React層型定義
│   ├── components/      # 汎用Reactコンポーネント
│   ├── hooks/           # カスタムフック
│   ├── context/         # Reactコンテキスト
│   ├── app/            # アプリケーション固有UI
│   └── [feature]/      # 機能固有のUI（必要時）
└── service-api/          # サービス抽象化層（上位層）
    ├── core/           # ツールシステム基盤
    └── api/            # 機能別サービスAPI
        └── [feature]-tool/  # 機能サービス実装
```

## 各層の責任と依存関係

### 1. obsidian-api層（最下位層）
**責任:**
- Obsidian Plugin API との直接的な統合
- ファイルシステム操作とVault操作
- Obsidianビュー（FileView）の実装
- React UIの注入と生命周期管理

**依存関係:**
- ✅ Obsidian API への依存
- ✅ react層への依存（UI注入のため）
- ❌ service-api層への依存禁止

**設計パターン:**
- **Factory Pattern**: React注入と生命周期管理
- **Plugin Pattern**: Obsidian統合の責務分離

```typescript
// 例: painter-factory.ts
export class PainterFactory {
  createPainterView(leaf: any): PainterView {
    const view = new PainterView(leaf);
    this.injectReact(view); // React注入
    return view;
  }
  
  private injectReact(view: PainterView): void {
    // Reactコンポーネントをビューに注入
  }
}
```

### 2. react層（中間層）
**責任:**
- UI コンポーネントとUIロジック
- 状態管理とユーザーインタラクション
- 型安全性の提供
- プラットフォーム非依存のUI実装

**依存関係:**
- ❌ Obsidian API への直接依存禁止
- ❌ service-api層への依存禁止（props経由でのみ機能提供）
- ✅ React/JavaScript標準ライブラリのみ依存

**設計思想:**
- **Pure Component**: プラットフォーム非依存
- **Props Injection**: 外部機能はprops経由で注入
- **Single Responsibility**: 各コンポーネントは単一責任

```typescript
// 例: PainterReactView.tsx
interface PainterReactViewProps {
  layers: any[];
  onLayerChange: (layers: any[]) => void; // 外部機能をprops注入
}
export default function PainterReactView({ layers, onLayerChange }: PainterReactViewProps) {
  // Pure UI logic
}
```

### 3. service-api層（最上位層）
**責任:**
- ビジネスロジックの抽象化
- AIとの統合インターフェース
- ツール形式での機能提供
- 外部システムとの統合

**依存関係:**
- ✅ obsidian-api層への依存（データ操作）
- ❌ react層への直接依存禁止
- ✅ 外部サービス（AI、API等）への依存

**設計パターン:**
- **Tool Pattern**: 統一された実行インターフェース
- **Dependency Injection**: 設定ベースのツール登録

```typescript
// 例: service-api/api/storyboard-tool/action.ts
export const storyboardTool: Tool<StoryboardToolInput> = {
  name: 'storyboard_tool',
  description: 'Storyboard management and manipulation',
  parameters: { /* JSON Schema */ },
  execute: Internal.executeStoryboardTool
};
```

## データフロー原則

### 下向きデータフロー
```
service-api → obsidian-api → react
```
- 上位層から下位層への依存は許可
- ファクトリがPropsとしてサービス機能を注入

### 上向きイベントフロー
```
react → obsidian-api → service-api
```
- callback/eventによる上位層への通知
- 依存性の逆転により疎結合を維持

## 機能実装の基本パターン

### 新機能追加時の手順:

1. **obsidian-api/[feature]/**: Obsidian統合実装
   - `[feature]-plugin.ts`: Obsidianプラグイン登録
   - `[feature]-factory.ts`: React注入管理
   - `[feature]-view.ts`: Obsidianビュー実装
   - `[feature]-files.ts`: ファイル操作（必要時）

2. **react/types/[feature].ts**: 型定義
   
3. **react/app/[Feature]ReactView.tsx**: メインUI実装

4. **react/[feature]/**: 機能固有UI（複雑な場合）
   - `components/`: 機能固有コンポーネント
   - `hooks/`: 機能固有フック

5. **service-api/api/[feature]-tool/**: サービスAPI実装
   - `action.ts`: ツール定義と実装

6. **service-api/core/tools-config.json**: ツール登録

## アーキテクチャの利点

1. **関心の分離**: 各層が明確な責任を持つ
2. **テスタビリティ**: React層は純粋関数として独立テスト可能
3. **再利用性**: React層はObsidian非依存で他プラットフォーム対応可能
4. **拡張性**: サービスAPI層で新機能を容易に追加
5. **保守性**: 依存方向が明確で変更影響範囲が限定的

## 重要な設計制約

❌ **禁止事項:**
- react層からのObsidian API直接呼び出し
- obsidian-api層からのservice-api層への依存
- Reactコンポーネント内でのファイル操作

✅ **推奨事項:**
- Props Injectionによる機能提供
- Factory Patternによるライフサイクル管理
- Tool Patternによるサービス統一化
- namespace分離による内部実装隠蔽 