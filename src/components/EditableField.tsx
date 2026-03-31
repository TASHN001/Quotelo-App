import { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  className?: string;
  inputClassName?: string;
  multiline?: boolean;
  type?: 'text' | 'number';
  placeholder?: string;
}

export function EditableField({
  value,
  onSave,
  className = '',
  inputClassName = '',
  multiline = false,
  type = 'text',
  placeholder = ''
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement || inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save:', error);
      setEditValue(value);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    const baseInputClass = `w-full bg-orange-50 border-2 border-orange-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500 ${inputClassName}`;

    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={`${baseInputClass} min-h-[60px] resize-y`}
          disabled={isSaving}
          placeholder={placeholder}
        />
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={baseInputClass}
        disabled={isSaving}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div className="relative inline-block group">
      <div
        onClick={() => setIsEditing(true)}
        className={`cursor-text hover:bg-orange-50 hover:border hover:border-orange-200 rounded px-2 py-1 transition-colors ${className}`}
      >
        {value || <span className="text-gray-400">{placeholder}</span>}
      </div>
      {showSaved && (
        <div className="absolute -right-6 top-1/2 -translate-y-1/2">
          <Check className="w-4 h-4 text-green-500" strokeWidth={2.5} />
        </div>
      )}
    </div>
  );
}
