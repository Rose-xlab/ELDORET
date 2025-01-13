import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import Link from "next/link";
import Image from "next/image";

interface Nominee {
  id: number;
  name: string;
  image?: string;
  positionId: number;
  institutionId: number;
  districtId: number;
  status: boolean;
}

interface InstitutionCardProps {
  institution: {
    id: number;
    name: string;
    image?: string;
    status: boolean;
    rating: Array<{
      score: number;
    }>;
    nominees?: Nominee[];
  };
}

export function InstitutionCard({ institution }: InstitutionCardProps) {
  const averageRating = institution.rating.length
    ? institution.rating.reduce((acc, r) => acc + r.score, 0) / institution.rating.length
    : 0;

  return (
    <Link href={`/institutions/${institution.id}`}>
      <Card className="p-4 hover:shadow-lg transition-shadow">
        <div className="flex items-start space-x-4">
          <Avatar className="w-16 h-16">
            <Image
              src={institution.image || "/placeholder.png"}
              alt={institution.name}
              width={64}
              height={64}
              className="object-cover"
            />
          </Avatar>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-lg">{institution.name}</h3>
                <p className="text-gray-500">
                  {institution.nominees?.length || 0} Official(s)
                </p>
              </div>
              <div className="text-right">
                <Badge variant={institution.status ? "success" : "warning"}>
                  {institution.status ? "Active" : "Inactive"}
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