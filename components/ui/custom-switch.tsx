import React from 'react';

interface CustomSwitchProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export function CustomSwitch({ id, checked, onCheckedChange, className = '' }: CustomSwitchProps) {
  return (
    <label className={`switch relative inline-block w-[60px] h-[34px] ${className}`} htmlFor={id}>
      <input type='checkbox' id={id} checked={checked} onChange={(e) => onCheckedChange(e.target.checked)} className='opacity-0 w-0 h-0' />
      <span
        className={`
        slider round absolute cursor-pointer top-0 left-0 right-0 bottom-0 
        transition-all duration-400 rounded-[34px] before:rounded-full
        before:absolute before:content-[''] before:h-[26px] before:w-[26px] 
        before:left-[4px] before:bottom-[4px] before:bg-white before:transition-all before:duration-400
        ${checked ? 'bg-blue-500 before:translate-x-[26px]' : 'bg-gray-300'}
        hover:ring-1 hover:ring-blue-300
      `}
      ></span>
    </label>
  );
}
