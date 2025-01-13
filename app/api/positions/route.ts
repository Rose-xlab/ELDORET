import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
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
    
    const result = await paginate(prisma.position, { page, limit }, filters);
    
    return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        
        // Validate required fields
        if (!body.name) {
            return NextResponse.json(
                { error: 'Position name is required' },
                { status: 400 }
            );
        }

        // Create new position
        const position = await prisma.position.create({
            data: {
                name: body.name,
                status: true, // Using the default value from your schema
                // createdAt and updatedAt are handled automatically by Prisma
            }
        });

        return NextResponse.json(position, { status: 201 });
    } catch (error) {
        console.error('Failed to create position:', error);
        return NextResponse.json(
            { error: 'Failed to create position' },
            { status: 500 }
        );
    }
}