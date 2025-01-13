import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const segments = req.url.split('/');
  const id = segments[segments.length - 1];

  if (id && !isNaN(parseInt(id))) {
    try {
      const position = await prisma.position.findUnique({
        where: { id: parseInt(id) },
      });
      if (position) {
        return NextResponse.json(position);
      } else {
        return NextResponse.json({ error: 'Position not found' }, { status: 404 });
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        return NextResponse.json({ error: 'Failed to fetch position' }, { status: 500 });
      }
      return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: 'Invalid position ID' }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const segments = req.url.split('/');
  const id = parseInt(segments[segments.length - 1]);
  const data = await req.json();

  if (!id || isNaN(id)) {
    return NextResponse.json({ error: 'Invalid position ID' }, { status: 400 });
  }

  try {
    const updatedPosition = await prisma.position.update({
      where: { id },
      data,
    });
    return NextResponse.json(updatedPosition);
  } catch (error: unknown) {
    if (error instanceof Error && (error)) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update position' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const segments = req.url.split('/');
  const id = parseInt(segments[segments.length - 1]);
  const data = await req.json();

  if (!id || isNaN(id)) {
    return NextResponse.json({ error: 'Invalid position ID' }, { status: 400 });
  }

  try {
    const updatedPosition = await prisma.position.update({
      where: { id },
      data,
    });
    return NextResponse.json(updatedPosition);
  } catch (error: unknown) {
    if (error instanceof Error && (error)) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update position' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const segments = req.url.split('/');
  const id = parseInt(segments[segments.length - 1]);

  if (!id || isNaN(id)) {
    return NextResponse.json({ error: 'Invalid position ID' }, { status: 400 });
  }

  try {
    await prisma.position.delete({
      where: { id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    if (error instanceof Error && (error)) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete position' }, { status: 500 });
  }
}