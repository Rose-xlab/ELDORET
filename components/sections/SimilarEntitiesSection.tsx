// components/sections/SimilarEntitiesSection.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';

interface SimilarEntity {
  id: number;
  name: string;
  image?: string;
  position?: {
    name: string;
  };
  averageRating: number;
}

interface SimilarEntitiesSectionProps {
  type: 'nominee' | 'institution';
  currentId: number;
}

export function SimilarEntitiesSection({ type, currentId }: SimilarEntitiesSectionProps) {
  const [entities, setEntities] = useState<SimilarEntity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSimilar = async () => {
      try {
        const response = await fetch(`/api/${type}s/${currentId}/similar`);
        const data = await response.json();
        setEntities(data);
      } catch (error) {
        console.error('Error fetching similar entities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilar();
  }, [currentId, type]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (entities.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">No similar {type}s found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {entities.map((entity) => (
        <Link
          key={entity.id}
          href={`/${type}s/${entity.id}`}
          className="block"
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16">
                <Image
  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(entity.name)}&size=128`}
  alt={`${entity.name} placeholder`}
  fill
  className="rounded-lg object-cover"
  priority
/>
                </div>
                <div>
                  <h3 className="font-medium">{entity.name}</h3>
                  {entity.position && (
                    <p className="text-sm text-gray-600">{entity.position.name}</p>
                  )}
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {entity.averageRating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}