"use client";

import React from 'react';
import { Card } from '../ui/card';
import { AlertTriangle, ExternalLink } from 'lucide-react';

interface Scandal {
  id: number;
  title: string;
  description: string;
  sourceUrl?: string;
  createdAt: string;
}

interface ScandalsSectionProps {
  scandals?: Scandal[] | null;
}

export function ScandalsSection({
  scandals = [],
}: ScandalsSectionProps) {
  const hasScandals = Array.isArray(scandals) && scandals.length > 0;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <AlertTriangle className="w-6 h-6 text-[#cc0000]" />
        <h2 className="text-xl font-bold">Known Scandals</h2>
      </div>
      
      {hasScandals ? (
        <div className="space-y-4">
          {scandals.map((scandal) => (
            <div key={scandal.id} className="border-b pb-4 last:border-b-0">
              <h3 className="font-semibold text-lg mb-2">{scandal.title}</h3>
              <p className="text-gray-600 mb-2">{scandal.description}</p>
              {scandal.sourceUrl && (
                <a
                  href={scandal.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  View Source <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Reported: {new Date(scandal.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center">No scandals reported yet.</p>
      )}
    </Card>
  );
}