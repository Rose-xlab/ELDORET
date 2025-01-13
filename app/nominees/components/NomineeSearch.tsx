// app/nominees/components/NomineeSearch.tsx
import { SearchBar } from "@/components/ui/SearchBar";

interface NomineeSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function NomineeSearch({ value, onChange }: NomineeSearchProps) {
  return (
    <SearchBar
      placeholder="Search officials by name, position, or institution..."
      value={value}
      onChange={onChange}
    />
  );
}
