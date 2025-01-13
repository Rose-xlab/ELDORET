// components/ratings/RatingList.tsx
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { Rating } from "@/types/interfaces"; // Import the global Rating interface

interface RatingListProps {
  ratings: Rating[];
}

export function RatingList({ ratings }: RatingListProps) {
  return (
    <div className="space-y-4">
      {ratings.map((rating) => (
        <Card key={rating.id} className="p-4">
          <div className="flex items-start space-x-4">
            <Avatar className="w-10 h-10">
              <Image
                src={rating.user?.image || "/placeholder-avatar.png"}
                alt={rating.user?.name || "Anonymous User"}
                width={40}
                height={40}
              />
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {rating.user?.name || "Anonymous User"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {rating.createdAt
                      ? formatDistanceToNow(new Date(rating.createdAt), {
                          addSuffix: true,
                        })
                      : "Unknown date"}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-2xl">
                    {rating.ratingCategory?.icon || "⭐"}
                  </span>
                  <div className="text-right">
                    <p className="font-medium">
                      {rating.ratingCategory?.name || "Rating"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Score: {rating.score}/5
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
