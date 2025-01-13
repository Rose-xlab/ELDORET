// app/(protected)/profile/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
//import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { AuthGuard } from "@/components/auth-guard";
import { Pencil, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Rating {
  id: number;
  score: number;
  comment: string;
  createdAt: string;
  type: 'nominee' | 'institution';
  target: {
    id: number;
    name: string;
    image?: string;
  };
  ratingCategory: {
    id: number;
    name: string;
    icon: string;
  };
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  nominee?: {
    id: number;
    name: string;
  };
  institution?: {
    id: number;
    name: string;
  };
  likes: number;
  dislikes: number;
  replies: CommentReply[];
}

interface CommentReply {
  id: number;
  content: string;
  createdAt: string;
  user: {
    name: string;
    image?: string;
  };
}

const UserProfile = () => {
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.name || '');
  const [userRatings, setUserRatings] = useState<Rating[]>([]);
  const [userComments, setUserComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserActivity = async () => {
      if (!user?.id) return;

      try {
        const [ratingsRes, commentsRes] = await Promise.all([
          fetch(`/api/users/${user.id}/activity/ratings`),
          fetch(`/api/users/${user.id}/activity/comments`)
        ]);

        if (!ratingsRes.ok || !commentsRes.ok) {
          throw new Error('Failed to fetch user activity');
        }

        const [ratingsData, commentsData] = await Promise.all([
          ratingsRes.json(),
          commentsRes.json()
        ]);

        setUserRatings(ratingsData);
        setUserComments(commentsData);
      } catch (error) {
        console.error('Error fetching user activity:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load activity history"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserActivity();
  }, [user?.id, toast]);

  const handleUpdateUsername = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newUsername })
      });

      if (!response.ok) throw new Error('Failed to update username');

      const updatedUser = await response.json();
      setIsEditing(false);
      
      toast({
        title: "Success",
        description: "Username updated successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update username"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p>Loading profile data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Profile Overview */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24">
              <Image
                src={user?.image || "/placeholder-avatar.png"}
                alt={user?.name || "User avatar"}
                width={96}
                height={96}
                className="rounded-full"
              />
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-4">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="max-w-[200px]"
                    />
                    <Button onClick={handleUpdateUsername}>Save</Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false);
                        setNewUsername(user?.name || '');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <CardTitle className="text-2xl">{user?.name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
              <p className="text-gray-500 mt-1">{user?.email}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Activity Tabs */}
      <Tabs defaultValue="ratings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="ratings">My Ratings</TabsTrigger>
          <TabsTrigger value="comments">My Comments</TabsTrigger>
        </TabsList>

        <TabsContent value="ratings">
          <Card>
            <CardContent className="divide-y">
              {userRatings.length > 0 ? (
                userRatings.map((rating) => (
                  <div key={rating.id} className="py-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link
                          href={`/${rating.type}s/${rating.target.id}`}
                          className="font-medium hover:underline"
                        >
                          {rating.target.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-2xl">{rating.ratingCategory.icon}</span>
                          <span className="text-sm text-gray-600">
                            {rating.ratingCategory.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{rating.score}/5</span>
                      </div>
                    </div>
                    {rating.comment && (
                      <p className="mt-2 text-gray-600">{rating.comment}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      {new Date(rating.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-gray-500">
                  You have not rated anything yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments">
          <Card>
            <CardContent className="divide-y">
              {userComments.length > 0 ? (
                userComments.map((comment) => (
                  <div key={comment.id} className="py-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link
                          href={`/${comment.nominee ? 'nominees' : 'institutions'}/${
                            comment.nominee?.id || comment.institution?.id
                          }`}
                          className="font-medium hover:underline"
                        >
                          {comment.nominee?.name || comment.institution?.name}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{comment.likes} likes</span>
                        <span>{comment.dislikes} dislikes</span>
                      </div>
                    </div>
                    <p className="mt-2">{comment.content}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                    {comment.replies.length > 0 && (
                      <div className="ml-6 mt-2 space-y-2">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="bg-gray-50 p-2 rounded">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <Image
                                  src={reply.user.image || "/placeholder-avatar.png"}
                                  alt={reply.user.name}
                                  width={24}
                                  height={24}
                                  className="rounded-full"
                                />
                              </Avatar>
                              <span className="text-sm font-medium">
                                {reply.user.name}
                              </span>
                            </div>
                            <p className="text-sm mt-1">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-gray-500">
                  You have not commented yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default function ProtectedUserProfile() {
  return (
    <AuthGuard>
      <UserProfile />
    </AuthGuard>
  );
}