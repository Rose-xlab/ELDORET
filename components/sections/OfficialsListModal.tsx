import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';
import { Pagination } from "@/components/ui/Pagination";

interface Official {
  id: number;
  name: string;
  image?: string;
  role?: string;
}

interface OfficialsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  officials: Official[];
  institutionName: string;
}

const OFFICIALS_PER_PAGE = 10;

export default function OfficialsListModal({
  isOpen,
  onClose,
  officials,
  institutionName,
}: OfficialsListModalProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredOfficials, setFilteredOfficials] = useState(officials);

  // Reset page when search changes
  useEffect(() => {
    const filtered = officials.filter(official =>
      official.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOfficials(filtered);
    setCurrentPage(1);
  }, [searchTerm, officials]);

  const totalPages = Math.ceil(filteredOfficials.length / OFFICIALS_PER_PAGE);
  const startIndex = (currentPage - 1) * OFFICIALS_PER_PAGE;
  const endIndex = startIndex + OFFICIALS_PER_PAGE;
  const currentOfficials = filteredOfficials.slice(startIndex, endIndex);

  const handleOfficialClick = (officialId: number) => {
    router.push(`/nominees/${officialId}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold mb-4">
            Officials at {institutionName}
          </DialogTitle>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search officials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </DialogHeader>

        <div className="flex flex-col">
          <div className="overflow-y-auto max-h-[60vh] pr-2">
            {currentOfficials.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                {searchTerm ? 'No officials found matching your search' : 'No officials found'}
              </p>
            ) : (
              <div className="grid gap-4 py-4">
                {currentOfficials.map((official) => (
                  <Button
                    key={official.id}
                    variant="ghost"
                    className="w-full flex items-center gap-4 p-4 hover:bg-gray-100 rounded-lg"
                    onClick={() => handleOfficialClick(official.id)}
                  >
                    <div className="relative w-12 h-12 flex-shrink-0">
                      {official.image ? (
                        <Image
                          src={official.image}
                          alt={official.name}
                          fill
                          className="object-cover rounded-full"
                          sizes="48px"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-500 text-xl">
                            {official.name[0]}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold">{official.name}</h3>
                      {official.role && (
                        <p className="text-sm text-gray-500">{official.role}</p>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="pt-4 border-t">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}