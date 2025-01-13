// components/ratings/StatsComponent.tsx
import React from 'react';
import { Card } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line 
} from 'recharts';

export interface Rating {
  id: number;
  score: number;
  severity: number;
  createdAt: string;
  ratingCategory: {
    id: number;
    name: string;
    weight: number;
  };
}

interface Category {
  id: number;
  name: string;
  weight: number;
  description: string;
  examples: string[];
}

interface StatsComponentProps {
  ratings: Rating[];
  categories: Category[];
}

export default function StatsComponent({ 
  ratings, 
  categories
}: StatsComponentProps) {
  // Calculate statistics
  const totalRatings = ratings.length;
  const averageScore = totalRatings > 0
    ? ratings.reduce((acc: number, r: Rating) => acc + r.score, 0) / totalRatings
    : 0;
  
  // Prepare data for category breakdown
  const categoryBreakdown = categories.map(category => {
    const categoryRatings = ratings.filter(r => 
      r.ratingCategory && r.ratingCategory.id === category.id
    );
    const avgScore = categoryRatings.length > 0
      ? categoryRatings.reduce((acc: number, r: Rating) => acc + r.score, 0) / categoryRatings.length
      : 0;
    
    return {
      name: category.name,
      averageScore: parseFloat(avgScore.toFixed(2)),
      count: categoryRatings.length
    };
  });

  // Prepare timeline data
  const timelineData = ratings.reduce((acc: Record<string, {
    date: string;
    count: number;
    averageScore: number;
    total: number;
  }>, rating: Rating) => {
    const date = new Date(rating.createdAt).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = { 
        date, 
        count: 0, 
        averageScore: 0, 
        total: 0 
      };
    }
    acc[date].count += 1;
    acc[date].total += rating.score;
    acc[date].averageScore = acc[date].total / acc[date].count;
    return acc;
  }, {});

  const timelineArray = Object.values(timelineData)
    .map(item => ({
      ...item,
      averageScore: parseFloat(item.averageScore.toFixed(2))
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="text-lg font-medium text-gray-500">Total Ratings</h3>
          <p className="text-3xl font-bold text-gray-900">{totalRatings}</p>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-lg font-medium text-gray-500">Average Score</h3>
          <p className="text-3xl font-bold text-gray-900">
            {averageScore.toFixed(2)}/5
          </p>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-lg font-medium text-gray-500">Recent Activity</h3>
          <p className="text-3xl font-bold text-gray-900">
            {timelineArray[timelineArray.length - 1]?.count || 0} today
          </p>
        </Card>
      </div>

      {/* Category Breakdown Chart */}
      <Card className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Rating Categories</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="averageScore" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Timeline Chart */}
      <Card className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Rating Timeline</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineArray}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date"
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="averageScore" 
                stroke="#2563eb" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}