import React, { useEffect, useState } from 'react';
import { useLayerContext } from '../../context/LayerContext';
import { Notice, App, TFile } from 'obsidian';
import { t } from '../../../obsidian-i18n';
import { ADD_ICON_SVG, BUTTON_ICONS, TABLE_ICONS } from '../../../icons';

interface RightSidebarReactViewProps {
  view?: any;
  app?: App;
}

export default function RightSidebarReactView({ view, app }: RightSidebarReactViewProps) {
  const [isPsdPainterOpen, setIsPsdPainterOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [currentImagePrompt, setCurrentImagePrompt] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);

  // LayerContextが利用可能かチェック
  let layerContext;
  try {
    layerContext = useLayerContext();
  } catch {
    layerContext = null;
  }

  const { layers, currentLayerIndex, setLayers, setCurrentLayerIndex } = layerContext || {
    layers: [],
    currentLayerIndex: 0,
    setLayers: () => {},
    setCurrentLayerIndex: () => {}
  };

  useEffect(() => {
    if (!view?.app) return;
    
    const updatePsdPainterState = () => {
      setIsPsdPainterOpen(
        view.app.workspace.getLeavesOfType('psd-view').length > 0
      );
    };

    view.app.workspace.on('active-leaf-change', updatePsdPainterState);
    return () => {
      view.app.workspace.off('active-leaf-change', updatePsdPainterState);
    };
  }, [view?.app]);

  // ナビゲーション機能
  const handleCreateNewPsd = async () => {
    try {
      new Notice('新しいPSDファイルを作成中...');
      setCurrentImageUrl('new-psd-path');
    } catch (error) {
      console.error('Create PSD failed:', error);
      new Notice('PSD作成に失敗しました');
    }
  };

  const handleOpenPsdPainter = async () => {
    if (!currentImageUrl || !app) return;
    
    try {
      const fileObj = app.vault.getAbstractFileByPath(currentImageUrl);
      if (fileObj instanceof TFile) {
        const leaf = app.workspace.getLeaf(true);
        await leaf.openFile(fileObj, { active: true });
      }
    } catch (error) {
      console.error('Open PSD failed:', error);
      new Notice('PSDファイルを開けませんでした');
    }
  };

  const handleBackToStoryboard = () => {
    if (!app) return;
    
    try {
      app.workspace.getLeavesOfType('psd-view').forEach((l) => l.detach());
      const storyboardLeaf = app.workspace
        .getLeavesOfType('markdown')
        .find((l) => {
          const v = l.view as any;
          return (
            v &&
            v.contentEl &&
            v.contentEl.querySelector('.storyboard-view-container')
          );
        });
      if (storyboardLeaf) {
        app.workspace.setActiveLeaf(storyboardLeaf);
      }
    } catch (error) {
      console.error('Back to storyboard failed:', error);
    }
  };

  // レイヤー操作
  const addBlankLayer = () => {
    if (!layerContext) return;
    
    const newLayer = {
      name: `レイヤー ${layers.length + 1}`,
      visible: true,
      opacity: 1,
      blendMode: 'normal',
      canvas: document.createElement('canvas')
    };
    
    // 新しいキャンバスの初期化
    newLayer.canvas.width = layers[0]?.canvas.width || 800;
    newLayer.canvas.height = layers[0]?.canvas.height || 600;
    
    setLayers([...layers, newLayer]);
  };

  const deleteCurrentLayer = () => {
    if (!layerContext || layers.length <= 1) return;
    
    const newLayers = layers.filter((_, index) => index !== currentLayerIndex);
    setLayers(newLayers);
    if (currentLayerIndex >= newLayers.length) {
      setCurrentLayerIndex(newLayers.length - 1);
    }
  };

  const toggleVisibility = (index: number) => {
    if (!layerContext) return;
    
    const newLayers = [...layers];
    newLayers[index].visible = !newLayers[index].visible;
    setLayers(newLayers);
  };

  const renameLayer = (index: number) => {
    if (!layerContext) return;
    
    const newName = prompt(t('ENTER_LAYER_NAME') || 'レイヤー名を入力', layers[index].name);
    if (newName && newName !== layers[index].name) {
      const newLayers = [...layers];
      newLayers[index].name = newName;
      setLayers(newLayers);
    }
  };

  const changeOpacity = (opacity: number) => {
    if (!layerContext) return;
    
    const newLayers = [...layers];
    newLayers[currentLayerIndex].opacity = opacity / 100;
    setLayers(newLayers);
  };

  const changeBlendMode = (blendMode: string) => {
    if (!layerContext) return;
    
    const newLayers = [...layers];
    newLayers[currentLayerIndex].blendMode = blendMode;
    setLayers(newLayers);
  };

  // チャット機能
  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setLoading(true);
    
    try {
      // TODO: 実際のAI API連携
      await new Promise(resolve => setTimeout(resolve, 1000));
      const response = `AI応答（開発中）: ${userMessage}`;
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Chat error:', error);
      new Notice('チャット応答エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-primary border-l border-modifier-border">
      {/* ナビゲーション コントロール */}
      <div className="p-2 border-b border-modifier-border">
        <div className="flex gap-2 flex-col">
          <div className="flex gap-2">
            <button
              className={`flex-1 p-2 bg-accent text-on-accent rounded cursor-pointer text-xs hover:bg-accent-hover ${!currentImageUrl?.endsWith('.psd') && !isPsdPainterOpen ? '' : 'hidden'}`}
              onClick={handleCreateNewPsd}
            >
              {t('CREATE_PSD') || 'PSD作成'}
            </button>
            <button
              className={`flex-1 p-2 bg-accent text-on-accent rounded cursor-pointer text-xs hover:bg-accent-hover ${currentImageUrl?.endsWith('.psd') && !isPsdPainterOpen ? '' : 'hidden'}`}
              onClick={handleOpenPsdPainter}
            >
              {t('OPEN_PSD') || 'PSD開く'}
            </button>
            <button
              className={`flex-1 p-2 bg-accent text-on-accent rounded cursor-pointer text-xs hover:bg-accent-hover ${!isPsdPainterOpen ? '' : 'hidden'}`}
              onClick={() => new Notice('動画エクスポート機能は開発中です')}
            >
              {t('EXPORT_VIDEO') || '動画出力'}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              className={`flex-1 p-2 bg-accent text-on-accent rounded cursor-pointer text-xs hover:bg-accent-hover ${isPsdPainterOpen ? '' : 'hidden'}`}
              onClick={handleBackToStoryboard}
            >
              {t('BACK_TO_STORYBOARD') || 'ストーリーボードに戻る'}
            </button>
            <button
              className={`flex-1 p-2 bg-accent text-on-accent rounded cursor-pointer text-xs hover:bg-accent-hover ${isPsdPainterOpen ? '' : 'hidden'}`}
              onClick={() => new Notice('画像エクスポート機能は開発中です')}
            >
              {t('EXPORT_IMAGE') || '画像出力'}
            </button>
          </div>
        </div>
      </div>

      {/* レイヤー コントロール */}
      {layerContext && layers.length > 0 && (
        <div className="p-2 border-b border-modifier-border">
          <div className="text-text-normal text-sm mb-2 pb-1 border-b border-modifier-border">
            {t('LAYERS') || 'レイヤー'}
          </div>

          {/* レイヤー操作ボタン */}
          <div className="flex items-center gap-2 mb-2">
            <button
              className="p-1 bg-primary border border-modifier-border text-text-normal rounded cursor-pointer hover:bg-modifier-hover flex items-center justify-center"
              onClick={addBlankLayer}
              title={t('NEW_LAYER') || '新しいレイヤー'}
              dangerouslySetInnerHTML={{ __html: ADD_ICON_SVG }}
            />
            <button
              className="p-1 bg-primary border border-modifier-border text-text-normal rounded cursor-pointer hover:bg-modifier-hover flex items-center justify-center"
              onClick={deleteCurrentLayer}
              title={t('DELETE_LAYER') || 'レイヤーを削除'}
              dangerouslySetInnerHTML={{ __html: TABLE_ICONS.delete }}
            />
          </div>

          {/* 不透明度とブレンドモード */}
          {layers[currentLayerIndex] && (
            <div className="flex items-center gap-2 mb-2">
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round((layers[currentLayerIndex]?.opacity ?? 1) * 100)}
                onChange={e => changeOpacity(parseInt(e.target.value, 10))}
                className="flex-1 h-1 bg-modifier-border rounded outline-none"
              />
              <select
                value={layers[currentLayerIndex]?.blendMode || 'normal'}
                onChange={e => changeBlendMode(e.target.value)}
                className="p-1 border border-modifier-border rounded bg-primary text-xs"
              >
                {[
                  'normal',
                  'multiply',
                  'screen',
                  'overlay',
                  'darken',
                  'lighten',
                  'color-dodge',
                  'color-burn',
                  'hard-light',
                  'soft-light',
                  'difference',
                  'exclusion'
                ].map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>
          )}

          {/* レイヤーリスト */}
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {layers.map((layer, idx) => (
              <div
                key={idx}
                className={`p-2 bg-primary rounded cursor-pointer flex items-center gap-2 relative select-none hover:bg-modifier-hover ${idx === currentLayerIndex ? 'ring-2 ring-accent' : ''}`}
                onClick={() => setCurrentLayerIndex(idx)}
              >
                <div
                  className={`w-4 h-4 border border-modifier-border rounded relative cursor-pointer ${layer.visible ? 'bg-accent' : 'bg-transparent'}`}
                  onClick={e => {
                    e.stopPropagation();
                    toggleVisibility(idx);
                  }}
                />
                <div
                  className="text-text-normal text-sm flex-1"
                  onDoubleClick={() => renameLayer(idx)}
                >
                  {layer.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* チャット ボックス */}
      <div className="flex-1 flex flex-col">
        <div className="text-text-normal text-sm p-2 border-b border-modifier-border">
          {t('CHAT') || 'チャット'}
        </div>
        
        {/* メッセージ履歴 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`text-sm rounded px-2 py-1 max-w-full break-words ${
                msg.role === 'user' 
                  ? 'bg-accent text-on-accent text-right ml-auto' 
                  : 'bg-secondary mr-auto'
              }`}
            >
              {msg.content}
            </div>
          ))}
          
          {loading && (
            <div className="text-xs text-text-faint text-center">
              {t('LOADING') || '読み込み中...'}
            </div>
          )}
        </div>

        {/* 入力フォーム */}
        <div className="p-2 border-t border-modifier-border">
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder={t('CHAT_INPUT_PLACEHOLDER') || 'メッセージを入力...'}
              className="flex-1 p-1 border border-modifier-border rounded bg-primary text-text-normal"
              disabled={loading}
              onKeyDown={e => e.key === 'Enter' && handleSendChat()}
            />
            <button
              onClick={handleSendChat}
              className="p-1 bg-accent text-on-accent rounded cursor-pointer hover:bg-accent-hover disabled:opacity-50"
              disabled={loading || !chatInput.trim()}
            >
              送信
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 