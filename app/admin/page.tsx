'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const AdminDashboard: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const models = [
    { name: 'Users', path: '/admin/users' },
    { name: 'Nominees', path: '/admin/nominees' },
    { name: 'Positions', path: '/admin/positions' },
    { name: 'Institutions', path: '/admin/institutions' },
    { name: 'Districts', path: '/admin/districts' },
    { name: 'Departments', path: '/admin/departments' },
    { name: 'Impact Areas', path: '/admin/impact-areas' },
    { name: 'Rating Categories', path: '/admin/rating-categories' },
    { name: 'Institution Rating Categories', path: '/admin/institution-rating-categories' },
    { name: 'Scandals', path: '/admin/scandals' },
    { name: 'Evidence', path: '/admin/evidence' },
  ];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/verify-admin', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Not authenticated');
        }
        
        setIsLoading(false);
      } catch (error) {
        router.push('/admin/login');
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/admin/logout', {
        method: 'POST',
        credentials: 'include'
      });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl text-black font-bold">Admin Dashboard</h1>
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {models.map((model) => (
          <Card key={model.name} className="p-6">
            <h2 className="text-xl text-blue-500 font-semibold mb-4">{model.name}</h2>
            <Link href={model.path}>
              <Button className="w-full">Manage {model.name}</Button>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;