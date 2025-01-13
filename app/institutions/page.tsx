"use client";

import { useEffect, useState, useCallback } from "react";
import { InstitutionCard } from "./components/InstitutionCard";
import { InstitutionFilter } from "./components/InstitutionFilter";
import { InstitutionSearch } from "./components/InstitutionSearch";
import { Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/use-toast";

// Import shared types or define complete interfaces
interface BaseNominee {
  id: number;
  name: string;
  image?: string;
  positionId: number;
  institutionId: number;
  districtId: number;
  status: boolean;
  position?: {
    name: string;
  };
}

interface Rating {
  id: number;
  score: number;
  comment?: string;
  createdAt: string;
  ratingCategory: {
    id: number;
    name: string;
    icon: string;
    weight: number;
    description: string;
    examples: string[];
  };
}

interface BaseInstitution {
  id: number;
  name: string;
  image?: string;
  status: boolean;
  rating: Rating[];
  nominees?: BaseNominee[];
  overallRank?: number;
}

export default function InstitutionsPage() {
  const { toast } = useToast();
  const [institutions, setInstitutions] = useState<BaseInstitution[]>([]);  // Initialize with empty array
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchInstitutions = useCallback(async () => {
    setLoading(true); // Set loading at the start of fetch
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        search: searchTerm,
        ...Object.fromEntries(
          Object.entries(filters).flatMap(([key, values]) =>
            values.map(value => [key, value])
          )
        )
      });

      const response = await fetch(`/api/institutions?${queryParams}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      setInstitutions(data.data || []); // Ensure we always set an array
      setTotalPages(data.pages || 1);    // Ensure we always have at least 1 page
    } catch (error) {
      console.error('Error fetching institutions:', error);
      setInstitutions([]); // Reset to empty array on error
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load institutions. Please try again later."
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filters, toast]);

  useEffect(() => {
    fetchInstitutions();
  }, [fetchInstitutions]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Institutions Directory</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="md:col-span-1">
          <InstitutionFilter
            selectedFilters={filters}
            onFilterChange={setFilters}
          />
        </div>

        {/* Main Content */}
        <div className="md:col-span-3">
          <div className="mb-6">
            <InstitutionSearch
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : institutions.length > 0 ? (
            <>
              <div className="space-y-4">
                {institutions.map((institution) => (
                  <InstitutionCard 
                    key={institution.id} 
                    institution={institution} // Removed unnecessary type assertion
                  />
                ))}
              </div>

              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No institutions found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}