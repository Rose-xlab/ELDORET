import React, { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import DetailedRatingSection from "@/components/ratings/DetailedRatingSection";
import { CommentSection } from "@/components/comments/CommentSection";
import { ScandalsSection } from "./ScandalsSection";
import { EvidenceSubmissionSection } from "./EvidenceSubmissionSection";
import { SimilarEntitiesSection } from "./SimilarEntitiesSection";
import SuccessToast from "@/components/ui/SuccessToast";
import { RatingComponent } from "@/components/ratings/RatingComponent";
import OfficialsListModal from "./OfficialsListModal";

const calculateAverageRating = (ratings: Array<{ score: number }>) => {
  if (!ratings?.length) return 0;
  const sum = ratings.reduce((acc, curr) => acc + curr.score, 0);
  return (sum / ratings.length).toFixed(1);
};

interface RatingCategory {
  id: number;
  name: string;
  icon: string;
  description: string;
  weight: number;
  examples: string[];
}

interface Rating {
  id: number;
  score: number;
  comment?: string;
  createdAt: string;
  ratingCategory: RatingCategory;
}

interface User {
  id: number;
  name: string;
  image?: string;
}

interface Comment {
  id: number;
  content: string;
  userId: string;
  user: User;
  createdAt: string;
  likes: number;
  dislikes: number;
  userReaction?: boolean;
  replies: Comment[];
}

interface Scandal {
  id: number;
  title: string;
  description: string;
  sourceUrl?: string;
  createdAt: string;
  verified: boolean;
}

interface EntityData {
  position: { id: number; name: string };
  institution: { id: number; name: string };
  district: {
    id: number;
    name: string;
    region: string;
    status: string;
  };
  id: number;
  name: string;
  image?: string;
  description?: string;
  rating: Rating[];
  scandals: Scandal[];
  comments: Comment[];
  overallRank?: number;
  ratingCategories: RatingCategory[];
  nominees?: {
    id: number;
    name: string;
    image?: string;
  }[];
}

interface RatingSubmission {
  categoryId: number;
  score: number;
  comment?: string;
}

interface EntityDetailProps {
  entity: EntityData;
  type: "nominee" | "institution";
  onSubmitRating: (ratings: RatingSubmission[]) => Promise<void>;
  onSubmitComment: (content: string, parentId?: number) => Promise<void>;
  onReact: (
    commentId: number,
    isLike: boolean,
    isReply?: boolean
  ) => Promise<void>;
}

export function EntityDetail({
  entity,
  type,
  onSubmitRating,
  onSubmitComment,
  onReact,
}: EntityDetailProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showOfficialsModal, setShowOfficialsModal] = useState(false);

  const rankDisplay = entity.overallRank
    ? `#${entity.overallRank}`
    : "Not ranked";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Card className="mb-8 p-6">
        <div className="flex items-start gap-6">
          <div className="relative w-32 h-32">
            {entity.image ? (
              <Image
                src={entity.image}
                alt={entity.name}
                fill
                className="object-cover rounded-lg"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-xl">{entity.name[0]}</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold">{entity.name}</h1>
                <div className="mt-2 text-gray-600 flex flex-col gap-2">
                  {type === "nominee" && (
                    <div className="flex gap-4">
                      <p>{entity.position.name}</p>
                      <p className="font-bold">{entity.institution.name}</p>
                    </div>
                  )}
                  <p className="text-purple-500">{entity.district.name}</p>
                  {type === "institution" && (
                    <p 
                      className="text-gray-600 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => setShowOfficialsModal(true)}
                    >
                      {entity.nominees?.length || 0} Official(s)
                    </p>
                  )}
                  {entity.description && (
                    <p className="text-gray-600">{entity.description}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{rankDisplay}</div>
                <div className="text-sm text-gray-500">Overall Rank</div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                <span className="font-semibold">
                  {calculateAverageRating(entity.rating)}
                </span>
                /5
              </div>
              <span className="text-gray-600">
                {entity.rating.length}{" "}
                {entity.rating.length === 1 ? "rating" : "ratings"}
              </span>
              <Button
                onClick={() => setShowRatingModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Vote
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scandals">
            Scandals{" "}
            {entity.scandals?.length > 0 && `(${entity.scandals.length})`}
          </TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="similar">
            Similar {type === "nominee" ? "Officials" : "Institutions"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <DetailedRatingSection
                entity={entity}
                categories={entity.ratingCategories}
                type={type}
                onSubmitRating={onSubmitRating}
              />
            </div>
            <div>
              <CommentSection
                entityId={entity.id}
                entityType={type}
                comments={entity.comments}
                onSubmitComment={onSubmitComment}
                onReact={onReact}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="scandals">
          <ScandalsSection scandals={entity.scandals} />
        </TabsContent>

        <TabsContent value="evidence">
          <EvidenceSubmissionSection
            type={type}
            entityId={entity.id}
            onSuccess={() => setShowSuccess(true)}
          />
        </TabsContent>

        <TabsContent value="similar">
          <SimilarEntitiesSection type={type} currentId={entity.id} />
        </TabsContent>
      </Tabs>

      {showRatingModal && (
        <RatingComponent
          type={type}
          entityId={entity.id}
          categories={entity.ratingCategories}
          onClose={() => setShowRatingModal(false)}
          onSubmit={onSubmitRating}
        />
      )}

      {type === "institution" && (
        <OfficialsListModal
          isOpen={showOfficialsModal}
          onClose={() => setShowOfficialsModal(false)}
          officials={entity.nominees || []}
          institutionName={entity.name}
        />
      )}

      <SuccessToast
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
    </div>
  );
}