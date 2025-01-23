"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import Image from 'next/image';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Upload, Check, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

// Interfaces
interface PaginationButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

interface Nominee {
  id: number;
  name: string;
  positionId: number;
  institutionId: number;
  districtId: number;
  evidence?: string;
  image?: string;
  status: boolean;
}

interface Position {
  id: number;
  name: string;
}

interface Institution {
  id: number;
  name: string;
}

interface District {
  id: number;
  name: string;
}

interface EditNomineeFormData {
  id: number;
  name: string;
  positionId: number;
  institutionId: number;
  districtId: number;
  evidence?: string;
  image?: string;
  status: boolean;
}

interface EntityState<T> {
  data: T[];
  page: number;
  loading: boolean;
  hasMore: boolean;
  searchText: string;
}

interface InfiniteScrollSelectProps {
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<Institution | Position | District>;
  placeholder: string;
  onScrollEnd: () => void;
  hasMore: boolean;
  loading: boolean;
}

interface UploadSummary {
  total: number;
  successful: number;
  failed: number;
  duplicates: number;
  details?: {
    positions: { created: number; existing: number };
    institutions: { created: number; existing: number };
    districts: { created: number; existing: number };
    nominees: { created: number; failed: number; duplicates: number };
  };
}

const InfiniteScrollSelect: React.FC<InfiniteScrollSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  onScrollEnd,
  hasMore,
  loading
}) => {
  const selectRef = useRef<HTMLSelectElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLSelectElement>) => {
    const select = e.target as HTMLSelectElement;
    if (select.scrollTop + select.clientHeight >= select.scrollHeight - 20) {
      if (hasMore && !loading) {
        onScrollEnd();
      }
    }
  }, [hasMore, loading, onScrollEnd]);

  return (
    <select
      ref={selectRef}
      value={value}
      onChange={onChange}
      onScroll={handleScroll}
      className="w-full border rounded p-2 text-black"
      style={{ maxHeight: '200px' }}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
      {loading && <option disabled>Loading more...</option>}
    </select>
  );
};

const PaginationButton: React.FC<PaginationButtonProps> = ({
  children,
  onClick,
  isActive = false,
  disabled = false
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-3 py-1 mx-1 rounded ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'bg-white text-blue-600 hover:bg-blue-50'
    } ${
      disabled
        ? 'opacity-50 cursor-not-allowed'
        : 'hover:bg-blue-100'
    } border border-blue-600`}
  >
    {children}
  </button>
);

// Main Component
const NomineesDashboard: React.FC = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // States
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [selectedNominees, setSelectedNominees] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(null);
  const [searchInput, setSearchInput] = useState("");
  
  // Entity States
  const [institutions, setInstitutions] = useState<EntityState<Institution>>({
    data: [],
    page: 1,
    loading: false,
    hasMore: true,
    searchText: ''
  });

  const [positions, setPositions] = useState<EntityState<Position>>({
    data: [],
    page: 1,
    loading: false,
    hasMore: true,
    searchText: ''
  });

  const [districts, setDistricts] = useState<EntityState<District>>({
    data: [],
    page: 1,
    loading: false,
    hasMore: true,
    searchText: ''
  });
  // Form States
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingNominee, setEditingNominee] = useState<EditNomineeFormData | null>(null);
  const [newNominee, setNewNominee] = useState({
    name: "",
    positionId: 0,
    institutionId: 0,
    districtId: 0,
    evidence: "",
    status: true
  });

  // Bulk action handlers
  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (!selectedNominees.length) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select nominees first"
      });
      return;
    }

    try {
      const endpoint = '/api/nominees/bulk';
      const method = 'POST';
      const payload: { ids: number[]; action: string; status?: boolean } = {
        ids: selectedNominees,
        action: action
      };

      if (action === 'activate' || action === 'deactivate') {
        payload.status = action === 'activate';
      }

      if (action === 'delete' && !window.confirm("Are you sure you want to delete the selected nominees?")) {
        return;
      }

      const response = await axios({
        method,
        url: endpoint,
        data: payload
      });

      if (response.status >= 200 && response.status < 300) {
        setSelectedNominees([]);
        await fetchNominees(currentPage, searchInput);
        
        toast({
          title: "Success",
          description: `Successfully ${action}d ${selectedNominees.length} nominee${selectedNominees.length > 1 ? 's' : ''}`
        });
      }
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${action} nominees: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = nominees.map(nominee => nominee.id);
      setSelectedNominees(allIds);
    } else {
      setSelectedNominees([]);
    }
  };

  const handleSelectNominee = (id: number, checked: boolean) => {
    setSelectedNominees(prev => {
      if (checked && !prev.includes(id)) {
        return [...prev, id];
      }
      return prev.filter(nomineeId => nomineeId !== id);
    });
  };

  // Status toggle handler
  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await axios.patch(`/api/nominees/${id}`, {
        status: !currentStatus
      });
      fetchNominees(currentPage, searchInput);
      toast({
        title: "Success",
        description: `Nominee ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Error toggling status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update nominee status"
      });
    }
  };

  // Generic load entities function
  const loadEntities = useCallback(async <T extends Institution | Position | District>(
    entityType: 'institutions' | 'positions' | 'districts',
    pageNum: number,
    searchText: string = '',
    setState: React.Dispatch<React.SetStateAction<EntityState<T>>>
  ) => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const response = await axios.get(`/api/${entityType}?page=${pageNum}&limit=30&search=${searchText}`);
      setState(prev => ({
        ...prev,
        data: pageNum === 1 ? response.data.data : [...prev.data, ...response.data.data],
        hasMore: pageNum < response.data.pages,
        loading: false,
        page: pageNum
      }));
    } catch (error) {
      console.error(`Error loading ${entityType}:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load ${entityType}`
      });
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [toast]);

  // Memoized load functions for each entity type
  const loadInstitutions = useCallback((pageNum: number, searchText: string = '') =>
    loadEntities<Institution>('institutions', pageNum, searchText, setInstitutions),
  [loadEntities]);

  const loadPositions = useCallback((pageNum: number, searchText: string = '') =>
    loadEntities<Position>('positions', pageNum, searchText, setPositions),
  [loadEntities]);

  const loadDistricts = useCallback((pageNum: number, searchText: string = '') =>
    loadEntities<District>('districts', pageNum, searchText, setDistricts),
  [loadEntities]);

  // Fetch nominees
  const fetchNominees = useCallback(async (page: number, search: string = '') => {
    try {
      const response = await axios.get(`/api/nominees?page=${page}&search=${search}`);
      setNominees(response.data.data);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error fetching nominees:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch nominees"
      });
    }
  }, [toast]);

  // File handling
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        if (editingNominee) {
          setEditingNominee({
            ...editingNominee,
            image: data.url
          });
        } else {
          setNewNominee(prev => ({
            ...prev,
            image: data.url
          }));
        }

        toast({
          title: "Success",
          description: "Image uploaded successfully",
        });
      } catch (error) {
        console.error('Error uploading image:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to upload image",
        });
      }
    }
  }, [editingNominee, toast]);

  // Bulk Upload Handler
  const handleBulkUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await axios.post('/api/nominees/bulk-upload', formData);
        setUploadSummary(response.data.summary);
        fetchNominees(currentPage, searchInput);
        
        toast({
          title: "Success",
          description: `Processed ${response.data.summary.total} nominees: ${response.data.summary.successful} successful, ${response.data.summary.failed} failed, ${response.data.summary.duplicates} duplicates`,
        });
      } catch (error) {
        console.error('Error uploading CSV:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to process CSV upload",
        });
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [currentPage, fetchNominees, searchInput, toast]);

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const response = await axios.get('/api/nominees/bulk-upload');
      const { headers, example } = response.data.template;
      
      const csvContent = [
        headers.join(','),
        Object.values(example).join(',')
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nominees-template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download template",
      });
    }
  }, [toast]);

  // Entity search handler
  const handleEntitySearch = useCallback(<T extends Institution | Position | District>(
    entityType: 'institutions' | 'positions' | 'districts',
    searchText: string,
    setState: React.Dispatch<React.SetStateAction<EntityState<T>>>,
    loadFunction: (page: number, search: string) => void
  ) => {
    setState(prev => ({ ...prev, searchText, page: 1 }));
    loadFunction(1, searchText);
  }, []);

  // Nominee CRUD operations
  const handleCreateNominee = useCallback(async () => {
    try {
      if (!newNominee.name || !newNominee.positionId || !newNominee.institutionId || !newNominee.districtId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please fill in all required fields"
        });
        return;
      }

      await axios.post("/api/nominees", newNominee);
      fetchNominees(currentPage, searchInput);
      setNewNominee({
        name: "",
        positionId: 0,
        institutionId: 0,
        districtId: 0,
        evidence: "",
        status: true
      });
      toast({
        title: "Success",
        description: "Nominee created successfully"
      });
    } catch (error) {
      console.error('Error creating nominee:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create nominee"
      });
    }
  }, [newNominee, currentPage, fetchNominees, searchInput, toast]);

  const handleEditNominee = useCallback((nominee: Nominee) => {
    setEditingNominee({
      id: nominee.id,
      name: nominee.name,
      positionId: nominee.positionId,
      institutionId: nominee.institutionId,
      districtId: nominee.districtId,
      evidence: nominee.evidence || '',
      image: nominee.image || undefined,
      status: nominee.status
    });
    setEditDialogOpen(true);
  }, []);

  const handleUpdateNominee = useCallback(async () => {
    if (!editingNominee) return;

    try {
      await axios.patch(`/api/nominees/${editingNominee.id}`, editingNominee);
      fetchNominees(currentPage, searchInput);
      setEditDialogOpen(false);
      setEditingNominee(null);
      toast({
        title: "Success",
        description: "Nominee updated successfully"
      });
    } catch (error) {
      console.error('Error updating nominee:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update nominee"
      });
    }
  }, [editingNominee, currentPage, fetchNominees, searchInput, toast]);

  const handleDeleteNominee = useCallback(async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this nominee?")) return;

    try {
      await axios.delete(`/api/nominees/${id}`);
      fetchNominees(currentPage, searchInput);
      toast({
        title: "Success",
        description: "Nominee deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting nominee:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete nominee"
      });
    }
  }, [currentPage, fetchNominees, searchInput, toast]);

  // Pagination helper
  const getPageNumbers = useCallback(() => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    const initialStartPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, initialStartPage + maxVisiblePages - 1);
    const startPage = Math.max(1, endPage - maxVisiblePages + 1);

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  }, [currentPage, totalPages]);

  // Effects
  useEffect(() => {
    loadInstitutions(1);
    loadPositions(1);
    loadDistricts(1);
  }, [loadInstitutions, loadPositions, loadDistricts]);

  useEffect(() => {
    fetchNominees(currentPage, searchInput);
  }, [currentPage, searchInput, fetchNominees]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl text-black font-bold mb-4">Nominees Dashboard</h1>

      {/* Search Input */}
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search nominees by name, position, or institution..."
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setCurrentPage(1);
            fetchNominees(1, e.target.value);
          }}
          className="w-full md:w-96 text-black"
        />
      </div>

      {/* Bulk Actions */}
      <div className="flex justify-between mb-4">
        <div className="flex gap-2">
          <Button
            onClick={() => handleBulkAction('activate')}
            variant="outline"
            className="flex items-center gap-2"
            disabled={!selectedNominees.length}
          >
            <Check className="w-4 h-4" />
            Activate Selected
          </Button>
          <Button
            onClick={() => handleBulkAction('deactivate')}
            variant="outline"
            className="flex items-center gap-2"
            disabled={!selectedNominees.length}
          >
            <X className="w-4 h-4" />
            Deactivate Selected
          </Button>
          <Button
            onClick={() => handleBulkAction('delete')}
            variant="secondary"
            className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-2"
            disabled={!selectedNominees.length}
          >
            Delete Selected
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleDownloadTemplate}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className=">w-4 h-4" />
            Download Template
          </Button>
          <input
            type="file"
            accept=".csv"
            onChange={handleBulkUpload}
            className="hidden"
            ref={fileInputRef}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Bulk Upload
          </Button>
        </div>
      </div>

      {/* Upload Summary */}
      {uploadSummary && (
        <Card className="p-4 mb-4">
          <h3 className="text-lg font-semibold mb-2">Upload Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-50 rounded shadow">
              <p className="text-sm text-gray-600">Total Processed</p>
              <p className="text-xl font-bold">{uploadSummary.total}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded shadow">
              <p className="text-sm text-gray-600">Successful</p>
              <p className="text-xl font-bold text-green-600">
                {uploadSummary.successful}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded shadow">
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-xl font-bold text-red-600">{uploadSummary.failed}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded shadow">
              <p className="text-sm text-gray-600">Duplicates</p>
              <p className="text-xl font-bold text-yellow-600">{uploadSummary.duplicates}</p>
            </div>
            
            {uploadSummary.details && (
              <>
                <div className="p-3 bg-gray-50 rounded shadow">
                  <p className="text-sm text-gray-600">New Entities</p>
                  <p className="text-xl font-bold">
                    {uploadSummary.details.positions.created + 
                     uploadSummary.details.institutions.created + 
                     uploadSummary.details.districts.created}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded shadow">
                  <p className="text-sm text-gray-600">Reused Entities</p>
                  <p className="text-xl font-bold text-blue-600">
                    {uploadSummary.details.positions.existing + 
                     uploadSummary.details.institutions.existing + 
                     uploadSummary.details.districts.existing}
                  </p>
                </div>
                
                <div className="col-span-2 grid grid-cols-3 gap-4">
                  <div className="p-3 bg-blue-50 rounded shadow">
                    <p className="text-sm text-gray-600">Positions</p>
                    <p className="text-sm">New: <span className="font-bold">{uploadSummary.details.positions.created}</span></p>
                    <p className="text-sm">Reused: <span className="font-bold">{uploadSummary.details.positions.existing}</span></p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded shadow">
                    <p className="text-sm text-gray-600">Institutions</p>
                    <p className="text-sm">New: <span className="font-bold">{uploadSummary.details.institutions.created}</span></p>
                    <p className="text-sm">Reused: <span className="font-bold">{uploadSummary.details.institutions.existing}</span></p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded shadow">
                    <p className="text-sm text-gray-600">Districts</p>
                    <p className="text-sm">New: <span className="font-bold">{uploadSummary.details.districts.created}</span></p>
                    <p className="text-sm">Reused: <span className="font-bold">{uploadSummary.details.districts.existing}</span></p>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Create Nominee Form */}
      <Card className="p-4 mb-4">
        <h2 className="text-xl text-black font-semibold mb-4">Create Nominee</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="text"
            placeholder="Name"
            value={newNominee.name}
            onChange={(e) => setNewNominee({ ...newNominee, name: e.target.value })}
            className="text-black"
          />

          {/* Institution Select with Infinite Scroll */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search institutions..."
              value={institutions.searchText}
              onChange={(e) => handleEntitySearch(
                'institutions',
                e.target.value,
                setInstitutions,
                loadInstitutions
              )}
              className="w-full mb-2 p-2 border rounded text-black"
            />
            <InfiniteScrollSelect
              value={newNominee.institutionId || ""}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (!isNaN(value)) {
                  setNewNominee(prev => ({
                    ...prev,
                    institutionId: value
                  }));
                }
              }}
              options={institutions.data}
              placeholder="Select Institution"
              hasMore={institutions.hasMore}
              loading={institutions.loading}
              onScrollEnd={() => loadInstitutions(institutions.page + 1, institutions.searchText)}
            />
          </div>

          {/* Position Select with Infinite Scroll */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search positions..."
              value={positions.searchText}
              onChange={(e) => handleEntitySearch(
                'positions',
                e.target.value,
                setPositions,
                loadPositions
              )}
              className="w-full mb-2 p-2 border rounded text-black"
            />
            <InfiniteScrollSelect
              value={newNominee.positionId || ""}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (!isNaN(value)) {
                  setNewNominee(prev => ({
                    ...prev,
                    positionId: value
                  }));
                }
              }}
              options={positions.data}
              placeholder="Select Position"
              hasMore={positions.hasMore}
              loading={positions.loading}
              onScrollEnd={() => loadPositions(positions.page + 1, positions.searchText)}
            />
          </div>

          {/* District Select with Infinite Scroll */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search districts..."
              value={districts.searchText}
              onChange={(e) => handleEntitySearch(
                'districts',
                e.target.value,
                setDistricts,
                loadDistricts
              )}
              className="w-full mb-2 p-2 border rounded text-black"
            />
            <InfiniteScrollSelect
              value={newNominee.districtId || ""}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (!isNaN(value)) {
                  setNewNominee(prev => ({
                    ...prev,
                    districtId: value
                  }));
                }
              }}
              options={districts.data}
              placeholder="Select District"
              hasMore={districts.hasMore}
              loading={districts.loading}
              onScrollEnd={() => loadDistricts(districts.page + 1, districts.searchText)}
            />
          </div>

          <div className="md:col-span-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="text-black"
            />
          </div>

          <div className="md:col-span-2">
            <Input
              type="text"
              placeholder="Evidence"
              value={newNominee.evidence}
              onChange={(e) => setNewNominee({ ...newNominee, evidence: e.target.value })}
              className="text-black"
            />
          </div>
        </div>

        <Button
          onClick={handleCreateNominee}
          className="mt-4 bg-blue-600 text-white"
        >
          Create Nominee
        </Button>
      </Card>

      {/* Nominees List Table */}
      <Card className="p-4">
        <h2 className="text-xl text-black font-semibold mb-4">Nominees List</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">
                  <Checkbox
                    checked={selectedNominees.length === nominees.length && nominees.length > 0}
                    onCheckedChange={(checked: boolean) => handleSelectAll(checked)}
                  />
                </th>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Image</th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Position</th>
                <th className="px-4 py-2 text-left">Institution</th>
                <th className="px-4 py-2 text-left">District</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {nominees.map((nominee) => (
                <tr key={nominee.id} className="border-t">
                  <td className="px-4 py-2">
                    <Checkbox
                      checked={selectedNominees.includes(nominee.id)}
                      onCheckedChange={(checked: boolean) => 
                        handleSelectNominee(nominee.id, checked)
                      }
                    />
                  </td>
                  <td className="px-4 py-2">{nominee.id}</td>
                  <td className="px-4 py-2">
                    <div className="relative w-16 h-16">
                      <Image
                        src={nominee.image || "/npp.png"}
                        alt={nominee.name}
                        width={64}
                        height={64}
                        className="object-cover rounded-full"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2">{nominee.name}</td>
                  <td className="px-4 py-2">
                    {positions.data.find((p) => p.id === nominee.positionId)?.name}
                  </td>
                  <td className="px-4 py-2">
                    {institutions.data.find((i) => i.id === nominee.institutionId)?.name}
                  </td>
                  <td className="px-4 py-2">
                    {districts.data.find((d) => d.id === nominee.districtId)?.name}
                  </td>
                  <td className="px-4 py-2">
                    <Button
                      onClick={() => handleToggleStatus(nominee.id, nominee.status)}
                      variant="outline"
                      className={`${
                        nominee.status 
                          ? 'bg-green-100 hover:bg-green-200 text-green-800' 
                          : 'bg-red-100 hover:bg-red-200 text-red-800'
                      }`}
                    >
                      {nominee.status ? 'Active' : 'Inactive'}
                    </Button>
                  </td>
                  <td className="px-4 py-2 space-x-2">
                    <Button
                      onClick={() => handleEditNominee(nominee)}
                      variant="outline"
                      className="mr-2"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteNominee(nominee.id)}
                      variant="secondary"
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center mt-4 space-x-2">
          <PaginationButton
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            ⟪
          </PaginationButton>
          
          <PaginationButton
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            ‹
          </PaginationButton>

          {getPageNumbers().map(pageNum => (
            <PaginationButton
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              isActive={currentPage === pageNum}
            >
              {pageNum}
            </PaginationButton>
          ))}

          <PaginationButton
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            ›
          </PaginationButton>

          <PaginationButton
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            ⟫
          </PaginationButton>
        </div>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Nominee</DialogTitle>
            <DialogDescription>
              Make changes to the nominee&apos;s information here.
            </DialogDescription>
          </DialogHeader>

          {editingNominee && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-black">Name</label>
                <Input
                  value={editingNominee.name}
                  onChange={(e) => setEditingNominee({
                    ...editingNominee,
                    name: e.target.value
                  })}
                  className="text-black"
                />
              </div>

              {/* Institution Select in Edit Dialog with Infinite Scroll */}
              <div className="grid gap-2">
                <label className="text-black">Institution</label>
                <div className="relative">
                  <InfiniteScrollSelect
                    value={editingNominee.institutionId}
                    onChange={(e) => setEditingNominee({
                      ...editingNominee,
                      institutionId: Number(e.target.value)
                    })}
                    options={institutions.data}
                    placeholder="Select Institution"
                    hasMore={institutions.hasMore}
                    loading={institutions.loading}
                    onScrollEnd={() => loadInstitutions(institutions.page + 1, institutions.searchText)}
                  />
                </div>
              </div>

              {/* Position Select in Edit Dialog with Infinite Scroll */}
              <div className="grid gap-2">
                <label className="text-black">Position</label>
                <div className="relative">
                  <InfiniteScrollSelect
                    value={editingNominee.positionId}
                    onChange={(e) => setEditingNominee({
                      ...editingNominee,
                      positionId: Number(e.target.value)
                    })}
                    options={positions.data}
                    placeholder="Select Position"
                    hasMore={positions.hasMore}
                    loading={positions.loading}
                    onScrollEnd={() => loadPositions(positions.page + 1, positions.searchText)}
                  />
                </div>
              </div>

              {/* District Select in Edit Dialog with Infinite Scroll */}
              <div className="grid gap-2">
                <label className="text-black">District</label>
                <div className="relative">
                  <InfiniteScrollSelect
                    value={editingNominee.districtId}
                    onChange={(e) => setEditingNominee({
                      ...editingNominee,
                      districtId: Number(e.target.value)
                    })}
                    options={districts.data}
                    placeholder="Select District"
                    hasMore={districts.hasMore}
                    loading={districts.loading}
                    onScrollEnd={() => loadDistricts(districts.page + 1, districts.searchText)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-black">Image</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="text-black"
                />
                {editingNominee.image && (
                  <div className="relative w-20 h-20 mt-2">
                    <Image
                      src={editingNominee.image}
                      alt="Current nominee image"
                      width={80}
                      height={80}
                      className="object-cover rounded"
                    />
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <label className="text-black">Evidence</label>
                <Input
                  value={editingNominee.evidence}
                  onChange={(e) => setEditingNominee({
                    ...editingNominee,
                    evidence: e.target.value
                  })}
                  className="text-black"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-black">Status</label>
                <select
                  value={editingNominee.status ? "true" : "false"}
                  onChange={(e) => setEditingNominee({
                    ...editingNominee,
                    status: e.target.value === "true"
                  })}
                  className="w-full border rounded p-2 text-black"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateNominee} className="bg-blue-600 text-white">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NomineesDashboard;