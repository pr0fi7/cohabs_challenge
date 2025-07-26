import React from 'react';
import { Button } from '../../ui/button';

interface QuickReplyOption {
  label: string;
  action: string;
}

interface QuickReplyButtonsProps {
  options: QuickReplyOption[];
  onSelect: (action: string) => void;
}

export const QuickReplyButtons: React.FC<QuickReplyButtonsProps> = ({ 
  options, 
  onSelect 
}) => {
  return (
    <div 
      className="flex flex-wrap gap-2 mt-3 ml-11"
      role="group"
      aria-label="Quick reply options"
    >
      {options.map((option, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onSelect(option.action)}
          className="rounded-2xl border-primary/20 hover:border-primary hover:bg-primary/5 transition-all duration-200"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
};