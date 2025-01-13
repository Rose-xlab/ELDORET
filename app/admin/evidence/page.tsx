"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs";
import Image from 'next/image';

interface Evidence {
  id: number;
  title: string;
  description: string;
  fileUrl?: string;
  status: boolean;
  createdAt: string;
  user: {
    id: number;
    name: string;
    image?: string;
  };
  nominee?: { id: number; name: string };
  institution?: { id: number; name: string };
}

export default function EvidenceAdminPage() {
  const { toast } = useToast();
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  const fetchEvidence = useCallback(async () => {
    try {
      const response = await fetch(`/api/evidence?status=${activeTab === 'approved'}`);
      const data = await response.json();
      setEvidence(data.data);
    } catch (error) {
      console.error('Error fetching evidence:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch evidence",
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab, toast]);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  const handleStatusChange = async (evidenceId: number, newStatus: boolean) => {
    try {
      const response = await fetch(`/api/evidence/${evidenceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update evidence status');

      await fetchEvidence();
      toast({
        title: "Success",
        description: `Evidence ${newStatus ? 'approved' : 'rejected'} successfully`,
      });
    } catch (error) {
      console.error('Error updating evidence status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update evidence status",
      });
    }
  };

  const EvidenceCard: React.FC<{ evidence: Evidence }> = ({ evidence }) => (
    <Card className="p-4">
      <div className="flex gap-4">
        <div className="relative w-12 h-12 flex-shrink-0">
          <Image
            src={evidence.user.image || "/placeholder-avatar.png"}
            alt={evidence.user.name}
            fill
            className="rounded-full object-cover"
          />
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold">{evidence.title}</h3>
              <p className="text-sm text-gray-500">
                Submitted by {evidence.user.name}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(evidence.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <Badge variant={evidence.status ? "success" : "warning"}>
              {evidence.status ? 'Approved' : 'Pending'}
            </Badge>
          </div>

          <p className="mt-2 text-gray-700">{evidence.description}</p>
          
          {evidence.fileUrl && (
            <a 
              href={evidence.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline mt-2 block"
            >
              View Evidence File
            </a>
          )}

          <div className="mt-4">
            {evidence.nominee && (
              <p className="text-sm text-gray-600">
                Related to Official: {evidence.nominee.name}
              </p>
            )}
            {evidence.institution && (
              <p className="text-sm text-gray-600">
                Related to Institution: {evidence.institution.name}
              </p>
            )}
          </div>

          {!evidence.status && (
            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => handleStatusChange(evidence.id, true)}
              >
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleStatusChange(evidence.id, false)}
              >
                Reject
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Manage Evidence</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {loading ? (
            <p>Loading...</p>
          ) : evidence.length > 0 ? (
            <div className="space-y-4">
              {evidence.map((item) => (
                <EvidenceCard key={item.id} evidence={item} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No pending evidence to review</p>
          )}
        </TabsContent>

        <TabsContent value="approved">
          {loading ? (
            <p>Loading...</p>
          ) : evidence.length > 0 ? (
            <div className="space-y-4">
              {evidence.map((item) => (
                <EvidenceCard key={item.id} evidence={item} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No approved evidence yet</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}