// app/institutions/components/InstitutionSearch.tsx
import { SearchBar } from "@/components/ui/SearchBar";

interface InstitutionSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function InstitutionSearch({ value, onChange }: InstitutionSearchProps) {
  return (
    <SearchBar
      placeholder="Search institutions by name..."
      value={value}
      onChange={onChange}
    />
  );
}