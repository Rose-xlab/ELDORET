import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

interface InstitutionInput {
  name: string;
  comment: string;
  image?: string;
}

interface RatingInput {
  ratingCategoryId: number;
  score: number;
  comment: string;
}

interface RequestBody {
  institutionData: InstitutionInput;
  ratings: RatingInput[];
}

export async function POST(req: NextRequest) {
  try {
    // Parse the incoming JSON body
    const { institutionData, ratings } = (await req.json()) as RequestBody;

    // Validate institutionData
    const { name } = institutionData;
    if (!name) {
      return NextResponse.json({ error: 'Missing required institution fields' }, { status: 400 });
    }

    // Start a Prisma transaction to ensure both institution and ratings are created atomically
    const result = await prisma.$transaction(async (prisma) => {
      // Create the institution
      const institution = await prisma.institution.create({
        data: {
          name,
          image: institutionData.image,
          status: true, // Default to active
        },
      });

      // Hardcode userId for now (replace with actual user ID from auth)
      const userId = 1;

      // Prepare the ratings data
      const ratingsData = ratings.map((rating) => ({
        userId,
        ratingCategoryId: rating.ratingCategoryId,
        score: rating.score,
        comment: rating.comment,
        institutionId: institution.id,
      }));

      // Create multiple ratings at once
      const createdRatings = await prisma.institutionRating.createMany({
        data: ratingsData,
      });

      // Fetch the complete institution with ratings
      const completeInstitution = await prisma.institution.findUnique({
        where: { id: institution.id },
        include: {
          rating: {
            include: {
              ratingCategory: true,
              user: true,
            },
          },
        },
      });

      // Return the institution along with the created ratings
      return {
        institution: completeInstitution,
        ratingsCount: createdRatings.count,
      };
    });

    // Return a response with the institution and ratings
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Error creating institution and ratings' },
      { status: 500 }
    );
  }
}