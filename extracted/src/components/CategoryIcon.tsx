import React from 'react';
import {
  GraduationCap,
  Terminal,
  Code2,
  Cpu,
  Coffee,
  Gamepad2,
  Sparkles,
  Users,
  Bookmark,
  LucideProps,
} from 'lucide-react';
import { CategoryKey } from '../types';

interface Props extends LucideProps {
  category: CategoryKey;
}

export const CategoryIcon: React.FC<Props> = ({ category, ...props }) => {
  switch (category) {
    case 'university':
      return <GraduationCap {...props} />;
    case 'work':
      return <Terminal {...props} />;
    case 'python':
      return <Code2 {...props} />;
    case 'pytorch':
      return <Cpu {...props} />;
    case 'recovery':
      return <Coffee {...props} />;
    case 'gaming':
      return <Gamepad2 {...props} />;
    case 'habit':
      return <Sparkles {...props} />;
    case 'meeting':
      return <Users {...props} />;
    case 'custom':
    default:
      return <Bookmark {...props} />;
  }
};
