import React, { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from '@/lib/auth-context';
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
  const { isAuthenticated } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showOfficialsModal, setShowOfficialsModal] = useState(false);

  const rankDisplay = entity.overallRank
    ? `#${entity.overallRank}`
    : "Not ranked";

  const handleVoteClick = () => {
    setShowRatingModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
      <Card className="mb-6 md:mb-8 p-4 md:p-6">
        <div className="flex justify-between items-start mb-4">
          {/* Image and content wrapper */}
          <div className="flex flex-1 gap-4 md:gap-6">
            {/* Image section */}
            <div className="relative w-20 h-20 md:w-32 md:h-32 shrink-0">
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

            {/* Content section */}
            <div className="flex-1 min-w-0">
              {/* Title and details */}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{entity.name}</h1>
                <div className="mt-2 text-gray-600 flex flex-col gap-1.5">
                  {type === "nominee" && (
                    <div className="flex flex-wrap gap-2 md:gap-4 text-sm md:text-base">
                      <p>{entity.position.name}</p>
                      <p className="font-semibold">{entity.institution.name}</p>
                    </div>
                  )}
                  <p className="text-purple-500 text-sm md:text-base">{entity.district.name}</p>
                  {type === "institution" && (
                    <button 
                      onClick={() => setShowOfficialsModal(true)}
                      className="text-gray-600 hover:text-blue-600 transition-colors text-sm md:text-base text-left"
                    >
                      {entity.nominees?.length || 0} Official(s)
                    </button>
                  )}
                </div>
              </div>

              {/* Description */}
              {entity.description && (
                <p className="mt-2 text-gray-600 text-sm md:text-base">{entity.description}</p>
              )}

              {/* Rating and vote section - Updated for better mobile layout */}
              <div className="mt-4 flex flex-wrap items-center gap-3 md:gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-sm md:text-base">
                    <span className="font-semibold">
                      {calculateAverageRating(entity.rating)}
                    </span>
                    /5
                  </div>
                  <span className="text-gray-600 text-sm md:text-base">
                    {entity.rating.length} {entity.rating.length === 1 ? "rating" : "ratings"}
                  </span>
                </div>
                <div className="ml-auto">
                  {isAuthenticated ? (
                    <Button
                      onClick={handleVoteClick}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      Vote
                    </Button>
                  ) : (
                    <AuthModal
                      trigger={
                        <Button className="bg-red-500 hover:bg-red-600 text-white">
                          Vote
                        </Button>
                      }
                      mode="rating"
                      onSuccess={handleVoteClick}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Overall Rank - consistently positioned at top right */}
          <div className="text-right shrink-0 ml-4">
            <span className="text-blue-600 text-lg md:text-xl font-bold">{rankDisplay}</span>
            <div className="text-xs md:text-sm text-gray-500">Overall Rank</div>
          </div>
        </div>
      </Card>


      <Tabs defaultValue="overview" className="space-y-4 md:space-y-6">
        <TabsList className="w-full overflow-x-auto flex flex-nowrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scandals">
            Scandals {entity.scandals?.length > 0 && `(${entity.scandals.length})`}
          </TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="similar">
            Similar {type === "nominee" ? "Officials" : "Institutions"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
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