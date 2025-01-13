import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { buildFilters } from '@/utils/filters';
import { paginate } from '@/utils/pagination';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const filters = buildFilters(searchParams, {
      searchFields: ['name'],
      rangeFields: {
        createdAt: { min: new Date(), max: new Date() },
      },
    });
    
    const result = await paginate(prisma.district, { page, limit }, filters);
    
    return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        
        // Validate required fields
        if (!body.name || !body.region) {
            return NextResponse.json(
                { error: 'District name and region are required' },
                { status: 400 }
            );
        }

        // Create new district
        const district = await prisma.district.create({
            data: {
                name: body.name,
                region: body.region,
                status: true,
            }
        });

        return NextResponse.json(district, { status: 201 });
    } catch (error) {
        // Type check if it's a Prisma error
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle unique constraint violation
            if (error.code === 'P2002') {
                return NextResponse.json(
                    { error: 'A district with this name already exists' },
                    { status: 409 }
                );
            }
        }

        console.error('Failed to create district:', error);
        return NextResponse.json(
            { error: 'Failed to create district' },
            { status: 500 }
        );
    }
}