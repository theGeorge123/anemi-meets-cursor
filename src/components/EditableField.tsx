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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {isEditing ? (
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <Input
            value={currentValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentValue(e.target.value)}
            className="w-full sm:w-auto"
            disabled={isSaving}
          />
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
      ) : (
        <div className="flex items-center gap-4 mt-1 sm:mt-0">
          <span className="text-sm text-gray-900">{value || 'Niet ingesteld'}</span>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            aria-label={`Edit ${label}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
