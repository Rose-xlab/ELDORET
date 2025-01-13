import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Fetch all approved institutions
    const institutions = await prisma.institution.findMany({
      where: { status: true },
      select: {
        id: true,
        name: true,
        image: true,
        status: true,
        rating: {
          select: {
            id: true,
            score: true,
            user: true,
          },
        },
      },
    });

    // Calculate the average rating for each institution
    const enrichedInstitutions = await Promise.all(
      institutions.map(async (institution) => {
        const ratings = institution.rating;
        const totalRatings = ratings.length;
        const averageRating = totalRatings > 0
          ? ratings.reduce((sum, rating) => sum + rating.score, 0) / totalRatings
          : 0;

        return {
          ...institution,
          totalRatings,
          averageRating: Number(averageRating.toFixed(2)),
        };
      })
    );

    // Sort institutions by averageRating in descending order and take the top 5
    const topInstitutions = enrichedInstitutions
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 5);

    return NextResponse.json(topInstitutions);
  } catch (error) {
    console.error("Error fetching top institutions:", error);
    return NextResponse.error();
  }
}