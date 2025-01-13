import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Institution, Nominee, InstitutionRating } from '@prisma/client';

interface WhereClause {
 name?: { contains: string; mode: 'insensitive' };
 status?: boolean;
 type?: string;
}

interface InstitutionWithRating extends Institution {
 nominees: Nominee[];
 rating: (InstitutionRating & {
   ratingCategory: {
     id: number;
     name: string;
     weight: number;
   }
 })[];
 averageRating?: number;
}

export async function GET(req: NextRequest) {
 const { searchParams } = new URL(req.url);
 const page = parseInt(searchParams.get('page') || '1');
 const limit = parseInt(searchParams.get('limit') || '10');
 const search = searchParams.get('search') || '';
 const status = searchParams.get('status');
 const rating = searchParams.get('rating');
 const type = searchParams.get('type');

 try {
   const where: WhereClause = {};

   if (search) {
     where.name = { contains: search, mode: 'insensitive' };
   }

   if (status === 'active') {
     where.status = true;
   } else if (status === 'inactive') {
     where.status = false;
   }

   if (type) {
     where.type = type;
   }

   const total = await prisma.institution.count({ where });
   const pages = Math.ceil(total / limit);
   const skip = (page - 1) * limit;

   let institutions = await prisma.institution.findMany({
     where,
     skip,
     take: limit,
     include: {
       nominees: true,
       rating: {
         include: {
           ratingCategory: true
         }
       }
     },
     orderBy: rating === 'high'
       ? { rating: { _count: 'desc' } }
       : rating === 'low'
       ? { rating: { _count: 'asc' } }
       : { createdAt: 'desc' }
   }) as InstitutionWithRating[];

   institutions = institutions.map(institution => ({
     ...institution,
     averageRating: institution.rating.length
       ? institution.rating.reduce((acc, r) => acc + r.score, 0) / institution.rating.length
       : 0
   }));

   if (rating) {
     institutions.sort((a, b) => {
       const aRating = a.averageRating || 0;
       const bRating = b.averageRating || 0;
       return rating === 'high' ? bRating - aRating : aRating - bRating;
     });
   }

   return NextResponse.json({
     data: institutions,
     count: total,
     pages,
     currentPage: page
   });
 } catch (error) {
   console.error('Error fetching institutions:', error);
   return NextResponse.json(
     { error: 'Failed to fetch institutions' },
     { status: 500 }
   );
 }
}

export async function POST(req: NextRequest) {
 try {
   const { name, image } = await req.json();

   if (!name?.trim()) {
     return NextResponse.json(
       { error: 'Institution name is required' },
       { status: 400 }
     );
   }

   const newInstitution = await prisma.institution.create({
     data: {
       name: name.trim(),
       image,
       status: true
     },
   });

   return NextResponse.json(newInstitution, { status: 201 });
 } catch (error) {
   console.error('Error creating institution:', error);
   return NextResponse.json(
     { error: 'Failed to create institution' },
     { status: 500 }
   );
 }
}