// app/admin/districts/page.tsx
"use client";
import React, { useEffect, useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface District {
  id: number;
  name: string;
  region: string;
  status: boolean;
  createdAt: Date;
}

interface ApiError {
  error: string;
  message?: string;
}

const DistrictsDashboard: React.FC = () => {
  const { toast } = useToast();
  const [districts, setDistricts] = useState<District[]>([]);
  const [newDistrict, setNewDistrict] = useState({ name: '', region: '', status: true });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState<District | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showInactive, setShowInactive] = useState(false);

  const fetchDistricts = useCallback(async (page: number) => {
    try {
      const response = await axios.get(`/api/districts?page=${page}&includeInactive=${showInactive}`);
      setDistricts(response.data.data);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error fetching districts:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch districts",
      });
    }
  }, [showInactive, toast]);

  useEffect(() => {
    fetchDistricts(currentPage);
  }, [currentPage, fetchDistricts]);

  const handleCreateDistrict = async () => {
    try {
      if (!newDistrict.name.trim() || !newDistrict.region.trim()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please enter both district name and region",
        });
        return;
      }

      await axios.post('/api/districts', newDistrict);
      fetchDistricts(currentPage);
      setNewDistrict({ name: '', region: '', status: true });
      toast({
        title: "Success",
        description: "District created successfully",
      });
    } catch (error) {
      console.error('Error creating district:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create district",
      });
    }
  };

  const handleEditDistrict = (district: District) => {
    setEditingDistrict(district);
    setEditDialogOpen(true);
  };

  const handleUpdateDistrict = async () => {
    if (!editingDistrict) return;

    try {
      await axios.patch(`/api/districts/${editingDistrict.id}`, {
        name: editingDistrict.name,
        region: editingDistrict.region,
        status: editingDistrict.status,
      });
      fetchDistricts(currentPage);
      setEditDialogOpen(false);
      setEditingDistrict(null);
      toast({
        title: "Success",
        description: "District updated successfully",
      });
    } catch (error) {
      console.error('Error updating district:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update district",
      });
    }
  };

  const handleToggleStatus = async (district: District) => {
    try {
      await axios.patch(`/api/districts/${district.id}`, {
        status: !district.status,
      });
      fetchDistricts(currentPage);
      toast({
        title: "Success",
        description: `District ${district.status ? 'deactivated' : 'activated'} successfully`,
      });
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      console.error('Error toggling district status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.error || "Failed to update district status",
      });
    }
  };

  const handleDeleteDistrict = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this district?")) {
      return;
    }

    try {
      await axios.delete(`/api/districts/${id}`);
      fetchDistricts(currentPage);
      toast({
        title: "Success",
        description: "District deleted successfully",
      });
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      console.error('Error deleting district:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.error || "Failed to delete district",
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl text-black font-bold mb-4">Districts Dashboard</h1>

      {/* Create District Form */}
      <Card className="p-4 mb-4">
        <h2 className="text-xl text-black font-semibold mb-4">Create District</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="text"
            placeholder="District Name"
            value={newDistrict.name}
            onChange={(e) => setNewDistrict({ ...newDistrict, name: e.target.value })}
            className="text-black"
          />
          <Input
            type="text"
            placeholder="Region"
            value={newDistrict.region}
            onChange={(e) => setNewDistrict({ ...newDistrict, region: e.target.value })}
            className="text-black"
          />
        </div>
        <Button
          onClick={handleCreateDistrict}
          className="mt-4 bg-blue-600 text-white"
        >
          Create District
        </Button>
      </Card>

      {/* Districts Table */}
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl text-black font-semibold">Districts List</h2>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded border-gray-300"
              />
              Show Inactive
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Region</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Created At</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
            </thead>
            <tbody>
            {districts.map((district) => (
              <tr key={district.id}>
                <td className="px-4 py-2">{district.id}</td>
                <td className="px-4 py-2">{district.name}</td>
                <td className="px-4 py-2">{district.region}</td>
                <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded ${district.status ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                      {district.status ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td className="px-4 py-2">
                  {new Date(district.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2">
                  <Button
                    onClick={() => handleEditDistrict(district)}
                    variant="outline"
                    className="mr-2"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleToggleStatus(district)}
                    variant="outline"
                    className={`mr-2 ${district.status ? 'bg-red-100' : 'bg-green-100'}`}
                  >
                    {district.status ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    onClick={() => handleDeleteDistrict(district.id)}
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
        <div className="flex justify-between items-center mt-4">
          <Button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="bg-blue-600 text-white"
          >
            Previous
          </Button>
          <span className="text-black">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="bg-blue-600 text-white"
          >
            Next
          </Button>
        </div>
      </Card>
      {/* Edit District Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit District</DialogTitle>
            <DialogDescription>
              Make changes to the district here.
            </DialogDescription>
          </DialogHeader>

          {editingDistrict && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-black">Name</label>
                <Input
                  value={editingDistrict.name}
                  onChange={(e) => setEditingDistrict({
                    ...editingDistrict,
                    name: e.target.value
                  })}
                  className="text-black"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-black">Region</label>
                <Input
                  value={editingDistrict.region}
                  onChange={(e) => setEditingDistrict({
                    ...editingDistrict,
                    region: e.target.value
                  })}
                  className="text-black"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-black">Status</label>
                <select
                  value={editingDistrict.status ? "true" : "false"}
                  onChange={(e) => setEditingDistrict({
                    ...editingDistrict,
                    status: e.target.value === "true"
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-black"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setEditingDistrict(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateDistrict}
              className="bg-blue-600 text-white"
              disabled={!editingDistrict?.name.trim() || !editingDistrict?.region.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DistrictsDashboard;