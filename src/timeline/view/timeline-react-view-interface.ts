import type { OtioProject } from '../timeline-types';

export interface TimelineReactViewProps {
  project: OtioProject;
  onProjectChange: (project: OtioProject) => void;
}
