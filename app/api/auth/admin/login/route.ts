import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function POST(request: Request) {
 try {
   const { email, password } = await request.json();
   console.log('Admin login attempt with email:', email);

   // Find the user
   const user = await prisma.user.findFirst({
     where: {
       email,
       role: UserRole.ADMIN
     }
   });
   
   console.log('Database query result:', {
     userFound: !!user,
     role: user?.role,
     emailMatched: user?.email === email
   });

   if (!user) {
     console.log('No admin user found with these credentials');
     return NextResponse.json(
       { error: 'Invalid credentials' },
       { status: 401 }
     );
   }

   // Verify password
   const isPasswordValid = await bcrypt.compare(password, user.password);
   console.log('Password validation result:', isPasswordValid);

   if (!isPasswordValid) {
     console.log('Password validation failed for admin user');
     return NextResponse.json(
       { error: 'Invalid credentials' },
       { status: 401 }
     );
   }

   console.log('Password validated successfully, creating JWT token');

   // Create JWT token
   const token = await new SignJWT({
     userId: user.id,
     email: user.email,
     role: user.role
   })
     .setProtectedHeader({ alg: 'HS256' })
     .setExpirationTime('24h')
     .sign(new TextEncoder().encode(process.env.JWT_SECRET));

   console.log('JWT token created successfully');

   // Set cookie
   cookies().set('token', token, {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     sameSite: 'lax',
     maxAge: 60 * 60 * 24 // 24 hours
   });

   console.log('Cookie set successfully, sending success response');

   return NextResponse.json({
     message: 'Logged in successfully'
   });

 } catch (error) {
   console.error('Login error:', error);
   return NextResponse.json(
     { error: 'Internal server error' },
     { status: 500 }
   );
 }
}