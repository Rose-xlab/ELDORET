import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

interface NomineeData {
  name: string;
  institutionId: number;
  positionId: number;
  districtId: number;
}

interface RatingInput {
  score: number;
  comment: string;
  categoryId: number;
}

// POST - Create a nominee and submit multiple ratings
export async function POST(req: NextRequest) {
  try {
    // Parse the incoming JSON body
    const { nomineeData, ratings } = await req.json() as {
      nomineeData: NomineeData;
      ratings: RatingInput[];
    };

    // Validate nomineeData
    const { name, institutionId, positionId, districtId } = nomineeData;
    if (!name || !institutionId || !positionId || !districtId) {
      return NextResponse.json({ error: 'Missing required nominee fields' }, { status: 400 });
    }

    // Start a Prisma transaction to ensure both nominee and ratings are created atomically
    const result = await prisma.$transaction(async (prisma) => {
      // Create the nominee
      const nominee = await prisma.nominee.create({
        data: {
          name,
          institution: {
            connect: { id: institutionId }
          },
          position: {
            connect: { id: positionId }
          },
          district: {
            connect: { id: districtId }
          },
        },
      });

      // Hardcode userId for now (replace with actual user ID from auth)
      const userId = 1;

      // Prepare the ratings data
      const ratingsData = ratings.map((rating) => ({
        userId,
        ratingCategoryId: rating.categoryId,
        score: rating.score,
        comment: rating.comment,
        nomineeId: nominee.id, // Associate each rating with the newly created nominee
      }));

      // Create multiple ratings at once
      const createdRatings = await prisma.nomineeRating.createMany({
        data: ratingsData,
      });

      // Fetch the complete nominee data with ratings
      const completeNominee = await prisma.nominee.findUnique({
        where: { id: nominee.id },
        include: {
          position: true,
          institution: true,
          district: true,
          rating: {
            include: {
              ratingCategory: true,
              user: true
            }
          }
        }
      });

      // Return the nominee along with the created ratings
      return {
        nominee: completeNominee,
        ratingsCount: createdRatings.count
      };
    });

    // Return a response with the nominee and ratings
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating nominee and ratings:', error);
    return NextResponse.json({ error: 'Error creating nominee and ratings' }, { status: 500 });
  }
}