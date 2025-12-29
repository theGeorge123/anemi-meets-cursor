import React, { useState } from 'react';
import { Button } from './ui/button'; // Assuming shadcn/ui button
import { Input } from './ui/input'; // Assuming shadcn/ui input
import { Loader2, Check, X, Edit } from 'lucide-react';

interface EditableFieldProps {
  label: string;
  value: string;
  onSave: (newValue: string) => Promise<void> | void;
}

export const EditableField: React.FC<EditableFieldProps> = ({ label, value, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(currentValue);
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCurrentValue(value);
    setIsEditing(false);
  };

  return (
    <div
      className="flex flex-col gap-2 sm:gap-3 py-4 border-b"
      role="group"
      aria-label={`${label} field`}
    >
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {isEditing ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2 w-full">
          <Input
            value={currentValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleSave();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
              }
            }}
            className="w-full sm:max-w-md"
            disabled={isSaving}
            autoFocus
          />
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button size="icon" onClick={handleSave} disabled={isSaving} aria-label="Save">
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCancel}
              disabled={isSaving}
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <span className="text-sm text-gray-900 break-words">{value || 'Niet ingesteld'}</span>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            aria-label={`Edit ${label}`}
            className="shrink-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
