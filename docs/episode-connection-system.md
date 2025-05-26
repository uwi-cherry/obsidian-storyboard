# エピソード補完連結システム

## エピソードラベリング

```
function label_episodes(episodes):
    labeled_episodes = []
    
    for i, episode in enumerate(episodes):
        labels = assign_episode_labels(episode, i, len(episodes))
        labeled_episodes.append({
            "episode": episode,
            "labels": labels,
            "position": i
        })
    
    return labeled_episodes

function assign_episode_labels(episode, position, total_episodes):
    prompt = f"""
    以下のエピソードに適切なラベルを割り当ててください：
    エピソード: {episode}
    位置: {position + 1}/{total_episodes}
    
    必須ラベル：
    1. 物語要素タイプ：
       - ミーム（情報や概念が人から人へと伝播・複製される現象）
       - ヒステリー（集団心理や社会現象として広がる感情的反応）
       - ミラクル（個人的で一回性の特別な体験や出来事）
    
    2. 時間軸タイプ：
       - 現在進行（メイン時間軸）
       - 過去編（回想・前日譚）
       - 未来予告（予知・予言）
       - 並行時間（同時進行の別視点）
    
    出力形式:
    物語要素: "ミーム/ヒステリー/ミラクル"
    時間軸: "現在進行/過去編/未来予告/並行時間"
    """
    
    response = generate_text(prompt)
    lines = response.strip().split('\n')
    
    return {
        "story_element": lines[0].replace('物語要素: ', '').strip('"'),
        "timeline": lines[1].replace('時間軸: ', '').strip('"')
    }
```

## エピソード間補完システム

```
function create_episode_bridges(labeled_episodes):
    bridged_episodes = []
    
    for i in range(len(labeled_episodes)):
        current_episode = labeled_episodes[i]
        bridged_episodes.append(current_episode)
        
        # 次のエピソードがある場合、補完を生成
        if i < len(labeled_episodes) - 1:
            next_episode = labeled_episodes[i + 1]
            bridge = create_bridge_between_episodes(current_episode, next_episode)
            if bridge:
                bridged_episodes.append(bridge)
    
    return bridged_episodes

function create_bridge_between_episodes(current_episode, next_episode):
    prompt = f"""
    以下の2つのエピソード間を補完する橋渡しを生成してください：
    
    現在のエピソード:
    内容: {current_episode["episode"]}
    ラベル: {current_episode["labels"]}
    
    次のエピソード:
    内容: {next_episode["episode"]}
    ラベル: {next_episode["labels"]}
    
    補完方法（必要に応じて使用）：
    - 時間飛躍：「3年後」「その夜」「翌朝」など
    - 視点変更：別キャラクターの視点
    - 過去編挿入：「それより前の話」
    - 並行描写：「同じ頃、別の場所では」
    - 因果説明：「なぜそうなったのか」
    - 状態変化：人格は維持、状況は変化
    
    無理やりでも必ず2つのエピソードを繋げてください。
    論理的でなくても構いません。時間を飛ばしたり戻したりして強引に接続してください。
    
    補完が不要な場合は「不要」と回答してください。
    
    出力形式: "補完エピソード" または "不要"
    """
    
    response = generate_text(prompt)
    bridge_content = response.strip()
    
    if bridge_content == "不要":
        return None
    
    return {
        "episode": bridge_content,
        "labels": {
            "story_element": "補完要素",
            "timeline": "橋渡し時間"
        },
        "position": f"{current_episode['position']}.5",
        "is_bridge": True
    }
```

## 状態・人格分離管理

```
function manage_character_continuity(bridged_episodes):
    character_timeline = []
    
    for episode_data in bridged_episodes:
        character_state = track_character_evolution(
            episode_data, 
            character_timeline
        )
        character_timeline.append(character_state)
    
    return character_timeline

function track_character_evolution(episode_data, previous_timeline):
    prompt = f"""
    以下のエピソードでのキャラクター状態を管理してください：
    
    エピソード: {episode_data["episode"]}
    ラベル: {episode_data["labels"]}
    
    これまでの経緯: {previous_timeline[-3:] if previous_timeline else "なし"}
    
    分離管理の要件：
    
    人格（変化しない要素）：
    - 価値観、信念、感情の癖
    - 行動の根底にある安定した土台
    - 長期的に維持される特性
    
    状態（変化する要素）：
    - 現在の立場、環境、状況
    - 一時的な感情や反応
    - 外的条件による変化
    
    人格は一貫性を保ち、状態のみを変化させてください。
    
    出力形式:
    人格: "一貫した人格特性"
    状態: "現在の状況・立場"
    変化: "前回からの状態変化"
    """
    
    response = generate_text(prompt)
    lines = response.strip().split('\n')
    
    return {
        "episode_position": episode_data["position"],
        "personality": lines[0].replace('人格: ', '').strip('"'),
        "state": lines[1].replace('状態: ', '').strip('"'),
        "change": lines[2].replace('変化: ', '').strip('"'),
        "episode_labels": episode_data["labels"]
    }
```

## 最終物語生成

```
function create_final_connected_story(bridged_episodes, character_timeline, theme):
    prompt = f"""
    以下の補完済みエピソードとキャラクター経緯から最終的な物語を生成してください：
    
    補完済みエピソード: {bridged_episodes}
    キャラクター経緯: {character_timeline}
    テーマ: {theme}
    
    最終物語の要件：
    - 全てのエピソード（補完含む）を時系列順に配置
    - ミーム・ヒステリー・ミラクルを適切に配分
    - 人格の一貫性と状態の変化を反映
    - 時間飛躍や視点変更を自然に組み込む
    - 必ず完結させる
    
    出力形式: "完結した連結物語"
    """
    
    response = generate_text(prompt)
    return response.strip()
```

## メインシステム

```
function connect_episodes_with_bridges(episodes, story_theme):
    # 1. エピソードにラベルを付与
    labeled_episodes = label_episodes(episodes)
    
    # 2. エピソード間に補完を挿入
    bridged_episodes = create_episode_bridges(labeled_episodes)
    
    # 3. キャラクターの状態・人格を分離管理
    character_timeline = manage_character_continuity(bridged_episodes)
    
    # 4. 最終的な連結物語を生成
    final_story = create_final_connected_story(
        bridged_episodes, 
        character_timeline, 
        story_theme
    )
    
    return {
        "labeled_episodes": labeled_episodes,
        "bridged_episodes": bridged_episodes,
        "character_timeline": character_timeline,
        "final_story": final_story
    }

function complete_story_system_with_bridges(base_word, n_abstract):
    # 既存のモチーフ生成システムからエピソードを取得
    episodes = episodes_generation_system(base_word, n_abstract)
    
    # エピソードを補完・連結して完結した物語を生成
    story_theme = f"{base_word}をテーマとした物語"
    result = connect_episodes_with_bridges(episodes, story_theme)
    
    return {
        "original_episodes": episodes,
        "labeled_episodes": result["labeled_episodes"],
        "bridged_episodes": result["bridged_episodes"],
        "character_timeline": result["character_timeline"],
        "final_story": result["final_story"],
        "theme": story_theme
    } 