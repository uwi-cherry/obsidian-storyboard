# エピソード連結システム

## 基本概念

### 1. 出来事の具体化

物語では抽象的なテーマから具体的な出来事を生成する必要があります。出来事は5W1Hで説明でき、社会的関与・可動・不動をもたらす具体的な変化として定義されます。

```
function create_concrete_event(abstract_theme, context):
    prompt = f"""
    以下の抽象的なテーマから、具体的な出来事を生成してください：
    テーマ: {abstract_theme}
    文脈: {context}
    
    出来事の要件：
    - 5W1H（いつ、どこで、誰が、何を、なぜ、どのように）で説明できる
    - 社会的関与、可動性、不動性に具体的な変化をもたらす
    - 眩暈、模倣、賭博、競争の要素を含む
    - 抽象的な概念ではなく、観察可能な具体的な変化
    
    抽象的な単語の羅列ではなく、実際に起こる具体的な出来事として描写してください。
    「愛」「希望」「絶望」などの抽象概念をそのまま使用することは禁止です。
    
    出力形式: "具体的な出来事の描写"
    """
    
    response = generate_text(prompt)
    return response.strip()
```

### 2. 時間の離散性管理

物語の時間は意味のある出来事のみを描写し、本質的に全てがクリフハンガーとなります。

```
function create_discrete_timeline(events):
    timeline_events = []
    
    for i, event in enumerate(events):
        # 各出来事に時間的な意味付けを行う
        temporal_event = structure_temporal_event(event, i, len(events))
        timeline_events.append(temporal_event)
    
    return timeline_events

function structure_temporal_event(event, position, total_events):
    prompt = f"""
    以下の出来事を物語の時間軸に配置してください：
    出来事: {event}
    位置: {position + 1}/{total_events}
    
    時間構造の要件：
    - 意味のある出来事のみを描写（ダラダラとした継続は禁止）
    - 前後の出来事との間に時間的な飛躍を設ける
    - 「お約束」「伏線」「謎」で未来の出来事を暗示
    - 必要に応じて回想や複数視点を活用
    
    同じ場面の継続ではなく、時間的に区切られた独立した出来事として構成してください。
    
    出力形式: "時間軸に配置された出来事"
    """
    
    response = generate_text(prompt)
    return response.strip()
```

### 3. 登場人物と世界観の関係

世界観が中心に存在し、そこからずれた人物がネームドキャラクターとなります。

```
function define_worldview_and_characters(base_setting):
    prompt = f"""
    以下の設定から世界観とキャラクターの関係を定義してください：
    基本設定: {base_setting}
    
    世界観の定義：
    - この世界で何が普通かを明確にする
    - 協調性の高い人々（モブキャラ）の行動パターン
    - 社会の基本的なルールや価値観
    
    ネームドキャラクターの条件（世界観からのずれ）：
    - 低い外向性：大衆と関わらない
    - 低い神経症傾向：大衆に流されない
    - 高い開放性：独自性を持つ
    
    出力形式:
    世界観: "この世界の普通の状態"
    主要キャラクター: "世界観からずれた人物の特徴"
    """
    
    response = generate_text(prompt)
    lines = response.strip().split('\n')
    
    worldview = lines[0].replace('世界観: ', '').strip('"')
    main_character = lines[1].replace('主要キャラクター: ', '').strip('"')
    
    return {"worldview": worldview, "main_character": main_character}
```

### 4. 性格と態度の分離

性格（安定した土台）と態度（瞬間的な表出）を明確に区別します。

```
function separate_personality_and_attitude(character_description):
    prompt = f"""
    以下のキャラクター描写から性格と態度を分離してください：
    キャラクター: {character_description}
    
    性格の定義：
    - 価値観、信念、感情の癖
    - 行動の根底にある安定した土台
    - 長期的に維持される明暗・緊張⇔緩和のパターン
    
    態度の定義：
    - 言葉遣い、口調、表情、身振り
    - その場で他者に伝わる振る舞い
    - 明暗・緊張⇔緩和の瞬間的表出
    
    性格と態度を混同せず、明確に分離してください。
    
    出力形式:
    性格: "安定した内面的特徴"
    態度: "外面的な振る舞い"
    """
    
    response = generate_text(prompt)
    lines = response.strip().split('\n')
    
    personality = lines[0].replace('性格: ', '').strip('"')
    attitude = lines[1].replace('態度: ', '').strip('"')
    
    return {"personality": personality, "attitude": attitude}
```

### 5. 祝福・呪いと奇跡の区別

祝福・呪いは読者の快・不快を演出する「都合」であり、奇跡は物語上の意味の重さで定義されます。

```
function classify_story_elements(event, story_context):
    prompt = f"""
    以下の出来事を分析し、祝福・呪いまたは奇跡として分類してください：
    出来事: {event}
    物語文脈: {story_context}
    
    分類基準：
    
    祝福・呪い：
    - 読者の快・不快を演出するための「都合」
    - 確率や作中世界の「すごさ」で判断
    - 物語進行のための便利な要素
    
    奇跡：
    - 物語全体の問いに対する価値ある答え
    - 物語上の意味の重さで定義
    - 確率の低さではなく意味の深さが重要
    
    「奇跡」「祝福」「呪い」という単語は使用禁止です。
    具体的な出来事の性質と意味を分析してください。
    
    出力形式: "分類結果と理由"
    """
    
    response = generate_text(prompt)
    return response.strip()
```

## エピソード連結システム

### メインシステム

```
function connect_episodes(episodes, story_theme):
    # 1. 世界観とキャラクターの関係を確立
    worldview_data = define_worldview_and_characters(story_theme)
    
    # 2. 各エピソードを具体的な出来事に変換
    concrete_events = []
    for episode in episodes:
        concrete_event = create_concrete_event(episode, worldview_data["worldview"])
        concrete_events.append(concrete_event)
    
    # 3. キャラクターの性格と態度を分離
    character_data = separate_personality_and_attitude(worldview_data["main_character"])
    
    # 4. 時間軸に沿って出来事を構造化
    timeline_events = create_discrete_timeline(concrete_events)
    
    # 5. 各出来事の物語的意味を分析
    analyzed_events = []
    for event in timeline_events:
        analysis = classify_story_elements(event, story_theme)
        analyzed_events.append({"event": event, "analysis": analysis})
    
    # 6. 連結された物語を生成
    connected_story = create_connected_narrative(
        analyzed_events, 
        character_data, 
        worldview_data["worldview"],
        story_theme
    )
    
    return connected_story

function create_connected_narrative(analyzed_events, character_data, worldview, theme):
    prompt = f"""
    以下の要素を使用して連結された物語を生成してください：
    
    分析済み出来事: {analyzed_events}
    キャラクター性格: {character_data["personality"]}
    キャラクター態度: {character_data["attitude"]}
    世界観: {worldview}
    物語テーマ: {theme}
    
    物語構成の要件：
    
    1. 出来事の連結：
    - 各出来事を因果関係で結ぶ
    - 時間的な飛躍を活用
    - 伏線と回収を配置
    
    2. キャラクターの一貫性：
    - 性格と態度を混同しない
    - 世界観からのずれを維持
    - 本質的な対話の不成立を描写
    
    3. 終幕の設計：
    - 物語の核となる問いをまとめる
    - 冒頭と響き合うモチーフを返す
    - 「ひとまとまりの過去」として完結
    
    「俺たちの戦いはこれからだ」エンドは禁止です。
    必ず物語を完結させてください。
    
    出力形式: "連結された完結物語"
    """
    
    response = generate_text(prompt)
    return response.strip()
```

### 対話システム

```
function create_character_dialogue(character1_data, character2_data, situation):
    prompt = f"""
    以下のキャラクター間の対話を生成してください：
    
    キャラクター1:
    性格: {character1_data["personality"]}
    態度: {character1_data["attitude"]}
    
    キャラクター2:
    性格: {character2_data["personality"]}
    態度: {character2_data["attitude"]}
    
    状況: {situation}
    
    対話の要件：
    - 見た目や口調だけでない本質的なずれを描写
    - 両者の本質が異なるため会話が成り立たない場面も含む
    - 性格（内面）と態度（外面）を明確に区別
    - 単純な肯定・否定ではなく根本的な価値観の違いを表現
    
    出力形式: "対話シーン"
    """
    
    response = generate_text(prompt)
    return response.strip()
```

### 統合システム

```
function complete_story_system(base_word, n_abstract):
    # 既存のモチーフ生成システムからエピソードを取得
    episodes = episodes_generation_system(base_word, n_abstract)
    
    # エピソードを連結して完結した物語を生成
    story_theme = f"{base_word}をテーマとした物語"
    connected_story = connect_episodes(episodes, story_theme)
    
    return {
        "episodes": episodes,
        "connected_story": connected_story,
        "theme": story_theme
    } 