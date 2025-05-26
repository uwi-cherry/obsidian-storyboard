# モチーフ生成システム

## 基本アルゴリズム

### refine関数
```
function refine(G, n_abstract):
    G[0] = G

    # 抽象化プロセス
    for i = 1 to n_abstract:
        P = list_contrastive_items(G[i-1])   # 前概念と異なる項目群を列挙
        G[i] = extract_commonality(P)        # 共通点から抽象化する

    # 各抽象概念G[i]をそれぞれ最大限具体化する
    for i = 1 to n_abstract:
        G[i] = concretize_maximally(G[i])    # 可能な限り最も具体化

    return G # 初期値+抽象化を繰り返した数だけ要素が存在します！
```



### LLM呼び出し関数

#### list_contrastive_items(concept)
```
function list_contrastive_items(concept):
    prompt = f"""
    以下の概念と対照的な項目を5-10個列挙してください：
    概念: {concept}
    
    対照的な項目とは、以下の観点で異なるものです：
    - 性質や特徴が正反対
    - 文脈や用途が異なる
    - 感情的な印象が対照的
    - 物理的・抽象的な属性が逆
    
    出力形式: ["項目1", "項目2", "項目3", ...]
    """
    
    response = llm_call(prompt)
    return parse_list(response)
```

#### extract_commonality(items)
```
function extract_commonality(items):
    prompt = f"""
    以下の項目群から共通点を抽出し、より抽象的な概念を生成してください：
    項目群: {items}
    
    抽象化の観点：
    - 共通する機能や役割
    - 共通する感情や印象
    - 共通する構造や形態
    - 共通する文脈や用途
    
    元の項目群よりも一段階抽象度の高い概念を1つ生成してください。
    
    出力形式: "抽象化された概念"
    """
    
    response = llm_call(prompt)
    return response.strip()
```

#### concretize_maximally(concept)
```
function concretize_maximally(concept):
    prompt = f"""
    以下の抽象的な概念を可能な限り最も具体的に変換してください：
    抽象概念: {concept}
    
    最大限具体化の観点：
    - 五感で感じられる詳細な描写
    - 具体的な色、形、質感、音、匂い
    - 明確な時間、場所、状況設定
    - 具体的な人物、物体、行動
    - 実際に体験できるレベルの詳細
    - 視覚的にイメージできる鮮明な描写
    
    抽象的な要素を一切残さず、完全に具体化された概念を生成してください。
    創作に直接使用できるレベルの具体性を目指してください。
    元の概念の要素を最大限尊重して具体化してください。
    
    出力形式: "最大限具体化された概念"
    """
    
    response = llm_call(prompt)
    return response.strip()
```

## ユースケース実装

### 1. キャラクター設定統合

```
function create_character_profiles(personalities, motifs):
    # Gの要素数分のキャラクターを生成
    character_profiles = []
    
    # 性格とモチーフをシャッフルして重複を避ける
    shuffled_personalities = shuffle(personalities)
    shuffled_motifs = shuffle(motifs)
    
    for i = 0 to len(personalities) - 1:
        # シャッフルされた順序で組み合わせ
        character_profile = combine_character_elements(shuffled_personalities[i], shuffled_motifs[i])
        character_profiles.append(character_profile)
    
    return character_profiles

function combine_character_elements(personality, motif):
    # LLM呼び出しで性格とモチーフを統合したキャラクター設定を生成
    return llm_call("統合されたキャラクター設定を生成", {
        personality: personality,
        motif: motif
    })
```

### 2. エピソード生成

```
function create_episodes(character_profiles, story_worldviews):
    # キャラクター数分のエピソードを生成
    episodes = []
    
    # ストーリー世界観をシャッフルして重複を避ける
    shuffled_worldviews = shuffle(story_worldviews)
    
    for i = 0 to len(character_profiles) - 1:
        # シャッフルされた順序で組み合わせ
        episode = combine_story_elements(character_profiles[i], shuffled_worldviews[i])
        episodes.append(episode)
    
    return episodes

function combine_story_elements(character, worldview):
    # LLM呼び出しでキャラクターと世界観を統合したエピソードを生成
    return llm_call("統合されたエピソードを生成", {
        character: character,
        worldview: worldview
    })
```

### 3. 全体統合システム

```
function motif_generation_system(
    base_personality, 
    base_motif, 
    base_story, 
    n_abstract
):
    # 1. 基本要素の生成
    personalities = refine(base_personality, n_abstract)
    motifs = refine(base_motif, n_abstract)
    story_worldviews = refine(base_story, n_abstract)
    
    # 2. キャラクター設定の生成（Gの要素数分）
    character_profiles = create_character_profiles(personalities, motifs)
    
    # 3. エピソードの生成
    episodes = create_episodes(character_profiles, story_worldviews)
    
    return {
        personalities: personalities,
        motifs: motifs,
        story_worldviews: story_worldviews,
        character_profiles: character_profiles,
        episodes: episodes
    }
```