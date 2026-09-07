// src/components/DynamicIcon.tsx
import * as Icons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
}

export const DynamicIcon = ({ name, className = "w-5 h-5" }: DynamicIconProps) => {
  const IconComponent = (Icons as Record<string, any>)[name] || Icons.Wrench;
  return <IconComponent className={className} />;
};