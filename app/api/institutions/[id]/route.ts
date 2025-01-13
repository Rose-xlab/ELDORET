import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Define interface for transformed nominee data
interface TransformedNominee {
  id: number;
  name: string;
  image: string | null;
  role: string;
}

// Define the full institution response type
type _InstitutionWithRelations = Prisma.InstitutionGetPayload<{
  include: {
    nominees: {
      include: {
        position: true;
      };
    };
    rating: {
      include: {
        ratingCategory: true;
        user: {
          select: {
            id: true;
            name: true;
            image: true;
          };
        };
      };
    };
    comments: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
            image: true;
          };
        };
        replies: {
          include: {
            user: {
              select: {
                id: true;
                name: true;
                image: true;
              };
            };
            reactions: true;
          };
        };
        reactions: true;
      };
    };
    scandals: {
      where: {
        verified: true;
      };
    };
    evidences: {
      where: {
        status: "VERIFIED";
      };
      include: {
        user: {
          select: {
            id: true;
            name: true;
            image: true;
          };
        };
      };
    };
  };
}>;

// GET - Get institution by ID
export async function GET(req: NextRequest) {
  try {
    const id = parseInt(req.nextUrl.pathname.split('/')[3], 10);

    const institution = await prisma.institution.findUnique({
      where: { id },
      include: {
        nominees: {
          include: {
            position: true
          }
        },
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
            },
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true
                  }
                },
                reactions: true
              }
            },
            reactions: true
          },
          orderBy: { createdAt: 'desc' }
        },
        scandals: {
          where: { verified: true },
          orderBy: { createdAt: 'desc' }
        },
        evidences: {
          where: { status: 'VERIFIED' },
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

    if (!institution) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
    }

    // Calculate overall rank
    const allInstitutions = await prisma.institution.findMany({
      include: {
        rating: true
      }
    });

    const rankedInstitutions = allInstitutions
      .map(inst => ({
        id: inst.id,
        averageRating: inst.rating.length > 0
          ? inst.rating.reduce((acc, r) => acc + r.score, 0) / inst.rating.length
          : 0
      }))
      .sort((a, b) => b.averageRating - a.averageRating);

    const rank = rankedInstitutions.findIndex(inst => inst.id === id) + 1;

    // Transform nominees data
    const transformedNominees: TransformedNominee[] = institution.nominees.map(nominee => ({
      id: nominee.id,
      name: nominee.name,
      image: nominee.image,
      role: nominee.position.name
    }));

    // Combine all data
    const response = {
      ...institution,
      overallRank: rank,
      nominees: transformedNominees
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching institution:', error);
    return NextResponse.json({ error: 'Error fetching institution' }, { status: 500 });
  }
}

// PATCH - Update institution
export async function PATCH(req: NextRequest) {
  try {
    const id = parseInt(req.url.split('/').pop() as string, 10);
    const dataToUpdate = await req.json();

    const updatedInstitution = await prisma.institution.update({
      where: { id },
      data: dataToUpdate,
      include: {
        nominees: {
          include: {
            position: true
          }
        },
        rating: true
      }
    });

    // Transform nominees data
    const transformedNominees: TransformedNominee[] = updatedInstitution.nominees.map(nominee => ({
      id: nominee.id,
      name: nominee.name,
      image: nominee.image,
      role: nominee.position.name
    }));

    const response = {
      ...updatedInstitution,
      nominees: transformedNominees
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating institution:', error);
    return NextResponse.json({ 
      error: 'Error updating institution: ' + error 
    }, { status: 500 });
  }
}

// DELETE - Delete institution
export async function DELETE(req: NextRequest) {
  try {
    const id = parseInt(req.url.split('/').pop() as string, 10);

    await prisma.institution.delete({
      where: { id },
    });

    return NextResponse.json({ 
      message: 'Institution deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting institution:', error);
    return NextResponse.json({ 
      error: 'Error deleting institution: ' + error 
    }, { status: 500 });
  }
}