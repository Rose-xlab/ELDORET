// app/institutions/components/InstitutionFilter.tsx
import { FilterPanel } from "@/components/ui/FilterPanel";

const INSTITUTION_FILTERS = [
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
    name: "Type",
    options: [
      { id: 1, label: "Government", value: "government" },
      { id: 2, label: "Education", value: "education" },
      { id: 3, label: "Healthcare", value: "healthcare" },
      { id: 4, label: "Financial", value: "financial" },
    ],
  },
];

interface InstitutionFilterProps {
  selectedFilters: Record<string, string[]>;
  onFilterChange: (filters: Record<string, string[]>) => void;
}

export function InstitutionFilter({ selectedFilters, onFilterChange }: InstitutionFilterProps) {
  return (
    <FilterPanel
      filters={INSTITUTION_FILTERS}
      selectedFilters={selectedFilters}
      onChange={onFilterChange}
    />
  );
}