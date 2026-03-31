import { Check } from 'lucide-react';
import { IndustryGroup, getIndustryTypes } from '../lib/industryData';

interface IndustryTypeSelectorProps {
  selectedGroup: IndustryGroup;
  selectedType: string | null;
  onSelect: (type: string) => void;
  onSkip: () => void;
}

export function IndustryTypeSelector({ selectedGroup, selectedType, onSelect, onSkip }: IndustryTypeSelectorProps) {
  const types = getIndustryTypes(selectedGroup);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <p className="text-gray-600">
          You selected <span className="font-semibold text-gray-900">{selectedGroup}</span>
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Select a specific type or skip this step to use General
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {types.map((type) => {
            const isSelected = selectedType === type;

            return (
              <button
                key={type}
                onClick={() => onSelect(type)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50'
                }`}
              >
                <span className={`font-medium ${
                  isSelected ? 'text-orange-900' : 'text-gray-900'
                }`}>
                  {type}
                </span>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={onSkip}
        className="mt-6 w-full py-3 px-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
      >
        Skip this step
      </button>
    </div>
  );
}
