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

interface Position {
  id: number;
  name: string;
  status: boolean;
  createdAt: Date;
}

interface ApiError {
  error: string;
  message?: string;
}

const PositionsDashboard: React.FC = () => {
  const { toast } = useToast();
  const [positions, setPositions] = useState<Position[]>([]);
  const [newPosition, setNewPosition] = useState({ name: '' });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showInactive, setShowInactive] = useState(false);

  const fetchPositions = useCallback(async (page: number) => {
    try {
      const response = await axios.get(`/api/positions?page=${page}&includeInactive=${showInactive}`);
      setPositions(response.data.data);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error fetching positions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch positions",
      });
    }
  }, [showInactive, toast]);

  useEffect(() => {
    fetchPositions(currentPage);
  }, [currentPage, fetchPositions]);

  const handleCreatePosition = async () => {
    try {
      if (!newPosition.name.trim()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please enter a position name",
        });
        return;
      }

      await axios.post('/api/positions', newPosition);
      fetchPositions(currentPage);
      setNewPosition({ name: '' });
      toast({
        title: "Success",
        description: "Position created successfully",
      });
    } catch (error) {
      console.error('Error creating position:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create position",
      });
    }
  };

  const handleEditPosition = (position: Position) => {
    setEditingPosition(position);
    setEditDialogOpen(true);
  };

  const handleUpdatePosition = async () => {
    if (!editingPosition) return;

    try {
      await axios.patch(`/api/positions/${editingPosition.id}`, {
        name: editingPosition.name,
      });
      fetchPositions(currentPage);
      setEditDialogOpen(false);
      setEditingPosition(null);
      toast({
        title: "Success",
        description: "Position updated successfully",
      });
    } catch (error) {
      console.error('Error updating position:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update position",
      });
    }
  };

  const handleToggleStatus = async (position: Position) => {
    try {
      await axios.patch(`/api/positions/${position.id}`, {
        status: !position.status,
      });
      fetchPositions(currentPage);
      toast({
        title: "Success",
        description: `Position ${position.status ? 'deactivated' : 'activated'} successfully`,
      });
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      console.error('Error toggling position status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.error || "Failed to update position status",
      });
    }
  };

  const handleDeletePosition = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this position?")) {
      return;
    }

    try {
      await axios.delete(`/api/positions/${id}`);
      fetchPositions(currentPage);
      toast({
        title: "Success",
        description: "Position deleted successfully",
      });
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      console.error('Error deleting position:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.error || "Failed to delete position",
      });
    }
  };
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl text-black font-bold mb-4">Positions Dashboard</h1>

      {/* Create Position Form */}
      <Card className="p-4 mb-4">
        <h2 className="text-xl text-black font-semibold mb-4">Create Position</h2>
        <div className="flex gap-4">
          <Input
            type="text"
            placeholder="Position Name"
            value={newPosition.name}
            onChange={(e) => setNewPosition({ name: e.target.value })}
            className="text-black"
          />
          <Button
            onClick={handleCreatePosition}
            className="bg-blue-600 text-white"
          >
            Create Position
          </Button>
        </div>
      </Card>

      {/* Positions Table */}
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl text-black font-semibold">Positions List</h2>
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
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Created At</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
            </thead>
            <tbody>
            {positions.map((position) => (
              <tr key={position.id}>
                <td className="px-4 py-2">{position.id}</td>
                <td className="px-4 py-2">{position.name}</td>
                <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded ${position.status ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                      {position.status ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td className="px-4 py-2">
                  {new Date(position.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2">
                  <Button
                    onClick={() => handleEditPosition(position)}
                    variant="outline"
                    className="mr-2"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleToggleStatus(position)}
                    variant="outline"
                    className={`mr-2 ${position.status ? 'bg-red-100' : 'bg-green-100'}`}
                  >
                    {position.status ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    onClick={() => handleDeletePosition(position.id)}
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

      {/* Edit Position Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Position</DialogTitle>
            <DialogDescription>
              Make changes to the position here.
            </DialogDescription>
          </DialogHeader>

          {editingPosition && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-black">Name</label>
                <Input
                  value={editingPosition.name}
                  onChange={(e) => setEditingPosition({
                    ...editingPosition,
                    name: e.target.value
                  })}
                  className="text-black"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-black">Status</label>
                <select
                  value={editingPosition.status ? "true" : "false"}
                  onChange={(e) => setEditingPosition({
                    ...editingPosition,
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
                setEditingPosition(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePosition}
              className="bg-blue-600 text-white"
              disabled={!editingPosition?.name.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PositionsDashboard;