import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ids, action } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty nominee ids" },
        { status: 400 }
      );
    }

    switch (action) {
      case 'activate':
      case 'deactivate':
        // Update status for multiple nominees
        await prisma.nominee.updateMany({
          where: {
            id: {
              in: ids
            }
          },
          data: {
            status: action === 'activate'
          }
        });
        break;

      case 'delete':
        // Delete multiple nominees
        await prisma.nominee.deleteMany({
          where: {
            id: {
              in: ids
            }
          }
        });
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully performed ${action} on ${ids.length} nominees`
    });

  } catch (error) {
    console.error('Error in bulk operation:', error);
    return NextResponse.json(
      { error: "Failed to perform bulk operation" },
      { status: 500 }
    );
  }
}