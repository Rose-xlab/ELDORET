"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface Scandal {
  id: number;
  title: string;
  description: string;
  sourceUrl?: string;
  nominee?: { id: number; name: string };
  institution?: { id: number; name: string };
  status: boolean;
  createdAt: string;
}

export default function ScandalsAdminPage() {
  const { toast } = useToast();
  const [scandals, setScandals] = useState<Scandal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedScandal, setSelectedScandal] = useState<Scandal | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    sourceUrl: '',
    nomineeId: '',
    institutionId: '',
  });

  const fetchScandals = useCallback(async () => {
    try {
      const response = await fetch('/api/scandals');
      const data = await response.json();
      setScandals(data.data);
    } catch (error) {
      console.error('Error fetching scandals:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch scandals",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchScandals();
  }, [fetchScandals]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/scandals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error('Failed to create scandal');

      await fetchScandals();
      setDialogOpen(false);
      setForm({
        title: '',
        description: '',
        sourceUrl: '',
        nomineeId: '',
        institutionId: '',
      });

      toast({
        title: "Success",
        description: "Scandal created successfully",
      });
    } catch (error) {
      console.error('Error creating scandal:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create scandal",
      });
    }
  };

  const handleEdit = (scandal: Scandal) => {
    setSelectedScandal(scandal);
    setForm({
      title: scandal.title,
      description: scandal.description,
      sourceUrl: scandal.sourceUrl || '',
      nomineeId: scandal.nominee?.id.toString() || '',
      institutionId: scandal.institution?.id.toString() || '',
    });
    setDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Scandals</h1>
        <Button onClick={() => setDialogOpen(true)}>Add New Scandal</Button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <p>Loading...</p>
        ) : (
          scandals.map((scandal) => (
            <Card key={scandal.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold">{scandal.title}</h3>
                  <p className="text-gray-600 mt-2">{scandal.description}</p>
                  {scandal.sourceUrl && (
                    <a 
                      href={scandal.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline mt-2 block"
                    >
                      Source Link
                    </a>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    Related to: {scandal.nominee?.name || scandal.institution?.name}
                  </p>
                </div>
                <Button variant="outline" onClick={() => handleEdit(scandal)}>
                  Edit
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedScandal ? 'Edit Scandal' : 'Add New Scandal'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Source URL</label>
              <Input
                type="url"
                value={form.sourceUrl}
                onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nominee ID</label>
              <Input
                type="number"
                value={form.nomineeId}
                onChange={(e) => setForm({ ...form, nomineeId: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Institution ID</label>
              <Input
                type="number"
                value={form.institutionId}
                onChange={(e) => setForm({ ...form, institutionId: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="submit">
                {selectedScandal ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}