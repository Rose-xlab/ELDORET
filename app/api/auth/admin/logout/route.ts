import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function POST() {
  try {
    // Verify that it's actually an admin making the logout request
    const token = cookies().get('token')?.value;
    
    if (token) {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );

      if (payload.role === 'ADMIN') {
        // Clear the admin token
        cookies().delete('token');
        return NextResponse.json({ message: 'Admin logged out successfully' });
      }
    }

    return NextResponse.json(
      { error: 'Not authorized' },
      { status: 403 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
}