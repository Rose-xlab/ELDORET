import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entityId, ratings, type } = await req.json();

    // Validate input
    if (!entityId || !ratings || !type || !Array.isArray(ratings)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    if (!['nominee', 'institution'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // Create ratings based on type
    if (type === 'nominee') {
      // Create nominee ratings
      const createdRatings = await Promise.all(
        ratings.map(async (rating) => {
          return await prisma.nomineeRating.create({
            data: {
              userId: user.id,
              nomineeId: entityId,
              score: rating.score,
              comment: rating.comment || '',
              ratingCategoryId: rating.categoryId
            },
            include: {
              ratingCategory: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true
                }
              }
            }
          });
        })
      );

      // Fetch updated entity data
      const updatedNominee = await prisma.nominee.findUnique({
        where: { id: entityId },
        include: {
          rating: {
            include: {
              ratingCategory: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true
                }
              }
            }
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true
                }
              }
            }
          }
        }
      });

      return NextResponse.json({ 
        ratings: createdRatings,
        entity: updatedNominee
      });

    } else {
      // Create institution ratings
      const createdRatings = await Promise.all(
        ratings.map(async (rating) => {
          return await prisma.institutionRating.create({
            data: {
              userId: user.id,
              institutionId: entityId,
              score: rating.score,
              comment: rating.comment || '',
              ratingCategoryId: rating.categoryId
            },
            include: {
              ratingCategory: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true
                }
              }
            }
          });
        })
      );

      // Fetch updated entity data
      const updatedInstitution = await prisma.institution.findUnique({
        where: { id: entityId },
        include: {
          rating: {
            include: {
              ratingCategory: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true
                }
              }
            }
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true
                }
              }
            }
          }
        }
      });

      return NextResponse.json({ 
        ratings: createdRatings,
        entity: updatedInstitution
      });
    }

  } catch (error) {
    console.error('Rating submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit rating' }, 
      { status: 500 }
    );
  }
}