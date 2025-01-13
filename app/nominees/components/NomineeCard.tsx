// app/nominees/components/NomineeCard.tsx
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import Link from "next/link";
import Image from "next/image";

interface NomineeCardProps {
  nominee: {
    id: number;
    name: string;
    image?: string;
    position: {
      name: string;
    };
    institution: {
      name: string;
    };
    status: boolean;
    rating: Array<{
      score: number;
    }>;
  };
}

export function NomineeCard({ nominee }: NomineeCardProps) {
  const averageRating = nominee.rating.length 
    ? nominee.rating.reduce((acc, r) => acc + r.score, 0) / nominee.rating.length
    : 0;

  return (
    <Link href={`/nominees/${nominee.id}`}>
      <Card className="p-4 hover:shadow-lg transition-shadow">
        <div className="flex items-start space-x-4">
          <Avatar className="w-16 h-16">
            <Image
              src={nominee.image || "/placeholder.png"}
              alt={nominee.name}
              width={64}
              height={64}
              className="object-cover"
            />
          </Avatar>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-lg">{nominee.name}</h3>
                <p className="text-gray-600">{nominee.position.name}</p>
                <p className="text-gray-500">{nominee.institution.name}</p>
              </div>
              <div className="text-right">
                <Badge variant={nominee.status ? "success" : "warning"}>
                  {nominee.status ? "Active" : "Inactive"}
                </Badge>
                <p className="mt-2 text-lg font-medium">
                  {averageRating.toFixed(1)}/5
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
