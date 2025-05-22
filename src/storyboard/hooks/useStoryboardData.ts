import { useState, useCallback, useEffect, useMemo } from 'react';
import { StoryboardData, CharacterInfo } from '../storyboard-types';
import { StoryboardService } from '../../services/storyboard-service';

export default function useStoryboardData(
  initialData: StoryboardData,
  onDataChange: (data: StoryboardData) => void,
) {
  const [storyboard, setStoryboard] = useState<StoryboardData>(initialData);

  useEffect(() => {
    setStoryboard(initialData);
  }, [initialData]);

  const updateData = useCallback(
    (updater: (prev: StoryboardData) => StoryboardData) => {
      setStoryboard(prev => {
        const next = updater(prev);
        onDataChange(next);
        return next;
      });
    },
    [onDataChange]
  );

  const service = useMemo(() => new StoryboardService(updateData), [updateData]);

  const uniqueSpeakers = service.getUniqueSpeakers(storyboard);
  const allSpeakers = uniqueSpeakers;
  const allCharacters: CharacterInfo[] = allSpeakers.map(name => {
    const found = (storyboard.characters ?? []).find(c => c.name === name);
    return found ? found : { name, attributes: { 説明: '' } };
  });

  return {
    storyboard,
    setStoryboard,
    storyboardService: service,
    uniqueSpeakers,
    allCharacters,
  };
}

