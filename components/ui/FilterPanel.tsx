// components/ui/FilterPanel.tsx
import { useState } from "react";
import { Button } from "./button";
import { Card } from "./card";

interface FilterOption {
  id: string | number;
  label: string;
  value: string | number;
}

interface FilterGroup {
  name: string;
  options: FilterOption[];
}

interface FilterPanelProps {
  filters: FilterGroup[];
  selectedFilters: Record<string, string[]>;
  onChange: (filters: Record<string, string[]>) => void;
}

export function FilterPanel({ filters, selectedFilters, onChange }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleFilter = (groupName: string, value: string) => {
    const currentGroupFilters = selectedFilters[groupName] || [];
    const newGroupFilters = currentGroupFilters.includes(value)
      ? currentGroupFilters.filter(v => v !== value)
      : [...currentGroupFilters, value];

    onChange({
      ...selectedFilters,
      [groupName]: newGroupFilters
    });
  };

  return (
    <Card className="p-4">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full mb-4"
      >
        Filters {Object.values(selectedFilters).flat().length > 0 && `(${Object.values(selectedFilters).flat().length})`}
      </Button>

      {isOpen && (
        <div className="space-y-4">
          {filters.map((group) => (
            <div key={group.name}>
              <h3 className="font-medium mb-2">{group.name}</h3>
              <div className="space-y-2">
                {group.options.map((option) => (
                  <label key={option.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={(selectedFilters[group.name] || []).includes(option.value.toString())}
                      onChange={() => toggleFilter(group.name, option.value.toString())}
                      className="rounded border-gray-300"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}