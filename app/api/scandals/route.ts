import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const nomineeId = searchParams.get("nomineeId");
  const institutionId = searchParams.get("institutionId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  try {
    const where: Prisma.ScandalWhereInput = {};
    if (nomineeId) where.nomineeId = parseInt(nomineeId);
    if (institutionId) where.institutionId = parseInt(institutionId);
    if (userId) where.createdBy = parseInt(userId);

    const [total, items] = await Promise.all([
      prisma.scandal.count({ where }),
      prisma.scandal.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          nominee: true,
          institution: true,
          author: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      data: items,
      count: total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch scandals" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, description, sourceUrl, nomineeId, institutionId } =
      await req.json();
    const scandal = await prisma.scandal.create({
      data: {
        title,
        description,
        sourceUrl,
        nomineeId: nomineeId ? parseInt(nomineeId) : null,
        institutionId: institutionId ? parseInt(institutionId) : null,
        createdBy: 1, // Assuming a default user ID for createdBy
      },
    });

    return NextResponse.json(scandal, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to create scandal" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const scandalId = req.nextUrl.searchParams.get("id");
    if (!scandalId) {
      return NextResponse.json(
        { error: "Scandal ID required" },
        { status: 400 },
      );
    }

    await prisma.scandal.delete({
      where: { id: parseInt(scandalId) },
    });

    return NextResponse.json({ message: "Scandal deleted successfully" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to delete scandal" },
      { status: 500 },
    );
  }
}