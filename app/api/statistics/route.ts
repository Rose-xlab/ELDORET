// app/api/statistics/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Fetch total number of institutions
    const totalInstitutions = await prisma.institution.count();

    // Fetch total number of nominees
    const totalNominees = await prisma.nominee.count();

    // Fetch total number of institution ratings
    const totalInstitutionRatings = await prisma.institutionRating.count();

    // Fetch total number of nominee ratings
    const totalNomineeRatings = await prisma.nomineeRating.count();

    // Fetch total number of users
    const totalUsers = await prisma.user.count();

    // Fetch total number of ratings
    const totalRatings = totalInstitutionRatings + totalNomineeRatings;

    // Fetch ratings per user
    const ratingsPerUser = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            nominated: true,
            reported: true,
          },
        },
      },
    });

    const statistics = {
      totalInstitutions,
      totalNominees,
      totalInstitutionRatings,
      totalNomineeRatings,
      totalUsers,
      totalRatings,
      ratingsPerUser: ratingsPerUser.map(user => ({
        userId: user.id,
        userName: user.name,
        totalRatings: user._count.nominated + user._count.reported,
      })),
    };

    return NextResponse.json(statistics);
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return NextResponse.error();
  }
}