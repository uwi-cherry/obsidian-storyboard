import { App, TFile } from "obsidian";
import { useState, useCallback, useEffect } from "react";
import { toolRegistry } from "src/service/core/tool-registry";
import { StoryboardData } from "src/types/storyboard";
import useStoryboardData from "./useStoryboardData";


export default function useStoryboardPageData(app: App, file: TFile | null) {
  const [initialData, setInitialData] = useState<StoryboardData>({
    title: '',
    chapters: [{ bgmPrompt: 'calm acoustic guitar, soft piano, peaceful ambient instrumental', frames: [] }],
    characters: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const handleDataChange = useCallback(
    async (updatedData: StoryboardData) => {
      if (!file) return;
      try {
        await toolRegistry.executeTool('save_storyboard_data', {
          app,
          file,
          data: JSON.stringify(updatedData)
        });
      } catch (error) {
        console.error(error);
      }
    },
    [app, file]
  );

  const hookData = useStoryboardData(initialData, handleDataChange);
  const { setStoryboard, ...restHookData } = hookData;

  const addRow = useCallback(
    async (chapterIndex: number, initialText = '') => {
      if (!file) return;
      try {
        await toolRegistry.executeTool('add_storyboard_row', {
          app,
          file,
          chapterIndex,
          initialText,
        });
        const result = await toolRegistry.executeTool('load_storyboard_data', {
          app,
          file,
        });
        setStoryboard(JSON.parse(result));
      } catch (error) {
        console.error(error);
      }
    },
    [app, file, setStoryboard]
  );

  useEffect(() => {
    const loadData = async () => {
      if (!file) return;
      try {
        setIsLoading(true);
        const result = await toolRegistry.executeTool('load_storyboard_data', {
          app,
          file,
        });
        setInitialData(JSON.parse(result));
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [app, file]);

  return { isLoading, handleDataChange, addRow, ...restHookData };
}
