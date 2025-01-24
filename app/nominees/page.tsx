"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import Image from "next/image";
import Link from "next/link";
import { Nominee, Rating } from "@/types/interfaces";

interface NomineeResponse {
  data: Nominee[];
  pages: number;
}

export default function NomineesPage() {
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<"recent" | "rating">("recent");

  const fetchNominees = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({
        search: searchTerm,
        page: currentPage.toString(),
        sort: sortBy,
      });

      const response = await fetch(`/api/nominees?${queryParams}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: NomineeResponse = await response.json();

      setNominees(data.data);
      setTotalPages(data.pages);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching nominees:", error);
      setLoading(false);
    }
  }, [searchTerm, currentPage, sortBy]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchNominees();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [fetchNominees]);

  const calculateAverageRating = (ratings: Rating[]) => {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating.score, 0);
    return (sum / ratings.length).toFixed(1);
  };

  const renderSkeletonLoader = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, index) => (
        <div key={index} className="animate-pulse">
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );

  const renderNomineeCard = (nominee: Nominee) => (
    <Link key={nominee.id} href={`/nominees/${nominee.id}`}>
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start space-x-4">
          <Avatar className="w-16 h-16">
            <Image
              src={
                nominee.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(nominee.name)}&size=64&background=f3f4f6&color=4b5563`
              }
              alt={nominee.name}
              width={64}
              height={64}
              className="object-cover"
            />
          </Avatar>

          <div className="flex-1">
            <div className="flex justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {nominee.name}
                </h2>
                <p className="text-gray-600">
                  {nominee.position?.name || "Position Not Specified"}
                </p>
                <p className="text-gray-500">
                  {nominee.institution?.name || "Institution Not Specified"}
                </p>
                <p className="text-sm text-gray-400">
                  {nominee.district?.name || "District Not Specified"}
                </p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {calculateAverageRating(nominee.rating)}/5
                </div>
                <p className="text-sm text-gray-500">
                  {nominee.rating?.length || 0} ratings
                </p>
              </div>
            </div>

            {nominee.rating && nominee.rating.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-900">
                  Recent Ratings:
                </h3>
                <div className="mt-1 text-sm text-gray-600">
                  {nominee.rating.slice(0, 3).map((rating, index) => (
                    <span key={`${rating.id}-${index}`} className="mr-4">
                      {rating.ratingCategory.name}: {rating.score}/5
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );

  const renderPagination = () => (
    <div className="mt-8 flex justify-center gap-2">
      <Button
        variant="outline"
        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
        disabled={currentPage === 1}
      >
        Previous
      </Button>
      <span className="py-2">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        variant="outline"
        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Officials Directory
        </h1>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <Input
          type="text"
          placeholder="Search officials by name, position, or institution..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xl"
        />

        <div className="flex gap-2">
          <Button
            variant={sortBy === "recent" ? "default" : "outline"}
            onClick={() => setSortBy("recent")}
          >
            Most Recent
          </Button>
          <Button
            variant={sortBy === "rating" ? "default" : "outline"}
            onClick={() => setSortBy("rating")}
          >
            Highest Rated
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        renderSkeletonLoader()
      ) : (
        <div className="space-y-4">
          {nominees.map((nominee) => renderNomineeCard(nominee))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && renderPagination()}
    </div>
  );
}
