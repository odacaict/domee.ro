import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  checked,
  onChange,
  label,
  className,
}) => {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <button
        type="button"
        id={id}
        onClick={() => onChange(!checked)}
        className={cn(
          'mt-0.5 flex h-5 w-5 items-center justify-center rounded border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-20',
          checked
            ? 'bg-amber-600 border-amber-600 text-white'
            : 'border-slate-300 hover:border-amber-400 bg-white'
        )}
      >
        {checked && <Check size={14} />}
      </button>
      <label
        htmlFor={id}
        className="text-sm text-slate-600 cursor-pointer select-none flex-1 leading-relaxed"
        onClick={() => onChange(!checked)}
      >
        {label}
      </label>
    </div>
  );
};