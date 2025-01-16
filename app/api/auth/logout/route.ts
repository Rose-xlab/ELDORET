//import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { NextResponse } from "next/server";

export async function POST() {
  // Remove the token cookie
  cookies().delete('token');


  return NextResponse.json({ message: 'Logged out successfully' });
}