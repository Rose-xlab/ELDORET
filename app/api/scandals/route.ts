import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function GET(req: NextRequest) {
 const { searchParams } = new URL(req.url);
 const userId = searchParams.get('userId');
 const page = parseInt(searchParams.get('page') || '1');
 const limit = parseInt(searchParams.get('limit') || '10');

 try {
   const where = userId ? { createdBy: parseInt(userId) } : {};

   const [total, items] = await Promise.all([
     prisma.scandal.count({ where }),
     prisma.scandal.findMany({
       where,
       skip: (page - 1) * limit,
       take: limit,
       include: {
         nominee: true,
         institution: true,
         author: true
       },
       orderBy: { createdAt: 'desc' }
     })
   ]);

   return NextResponse.json({
     data: items,
     count: total,
     pages: Math.ceil(total / limit),
     currentPage: page
   });
 } catch (error) {
   console.error('Error:', error);
   return NextResponse.json({ error: 'Failed to fetch scandals' }, { status: 500 });
 }
}

export async function POST(req: NextRequest) {
 const token = cookies().get('token')?.value;
 if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 try {
   const verified = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET!));
   const { userId, role } = verified.payload as { userId: number; role: string };

   if (role !== 'ADMIN') {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }

   const { title, description, sourceUrl, nomineeId, institutionId } = await req.json();
   const scandal = await prisma.scandal.create({
     data: {
       title,
       description,
       sourceUrl,
       nomineeId: nomineeId ? parseInt(nomineeId) : null,
       institutionId: institutionId ? parseInt(institutionId) : null,
       createdBy: userId
     }
   });

   return NextResponse.json(scandal, { status: 201 });
 } catch (error) {
   console.error('Error:', error);
   return NextResponse.json({ error: 'Failed to create scandal' }, { status: 500 });
 }
}

export async function DELETE(req: NextRequest) {
 const token = cookies().get('token')?.value;
 if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 try {
   const verified = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET!));
   const { role } = verified.payload as { userId: number; role: string };

   if (role !== 'ADMIN') {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }

   const scandalId = req.nextUrl.searchParams.get('id');
   if (!scandalId) {
     return NextResponse.json({ error: 'Scandal ID required' }, { status: 400 });
   }

   await prisma.scandal.delete({
     where: { id: parseInt(scandalId) }
   });

   return NextResponse.json({ message: 'Scandal deleted successfully' });
 } catch (error) {
   console.error('Error:', error);
   return NextResponse.json({ error: 'Failed to delete scandal' }, { status: 500 });
 }
}