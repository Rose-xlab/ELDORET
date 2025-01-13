// app/nominees/components/NomineeFilter.tsx
import { FilterPanel } from "@/components/ui/FilterPanel";

const NOMINEE_FILTERS = [
  {
    name: "Status",
    options: [
      { id: 1, label: "Active", value: "active" },
      { id: 2, label: "Inactive", value: "inactive" },
    ],
  },
  {
    name: "Rating",
    options: [
      { id: 1, label: "High to Low", value: "high" },
      { id: 2, label: "Low to High", value: "low" },
    ],
  },
  {
    name: "Position",
    options: [
      { id: 1, label: "Cabinet Secretary", value: "cabinet_secretary" },
      { id: 2, label: "Minister", value: "minister" },
      { id: 3, label: "Mayor", value: "mayor" },
      { id: 4, label: "Managing Director", value: "managing_director" },
    ],
  },
];

interface NomineeFilterProps {
  selectedFilters: Record<string, string[]>;
  onFilterChange: (filters: Record<string, string[]>) => void;
}

export function NomineeFilter({ selectedFilters, onFilterChange }: NomineeFilterProps) {
  return (
    <FilterPanel
      filters={NOMINEE_FILTERS}
      selectedFilters={selectedFilters}
      onChange={onFilterChange}
    />
  );
}
