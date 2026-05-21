import React, { useState, useEffect } from 'react';

interface EditableTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function EditableTextEditor({ value, onChange, disabled = false }: EditableTextEditorProps) {
  const [localValue, setLocalValue] = useState(value);

  // Sync external value changes into local state
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#fffdf9] border border-[#e8e1d8] shadow-sm">
      <div className="px-4 py-2 border-b border-[#e8e1d8] bg-[#f7f4ef] flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[#777169]">Agreement Text</span>
        {disabled && <span className="text-xs text-orange-500 font-semibold">Locked (Approved)</span>}
      </div>
      <textarea
        className="w-full h-full flex-1 p-4 resize-none focus:outline-none text-[#3f3a35] disabled:bg-gray-100"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder="Agreement text will appear here. You can manually edit it..."
      />
    </div>
  );
}
