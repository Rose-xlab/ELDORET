import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Rename the local interface to avoid conflicts
interface UserPayload {
  id: number;
  name: string;
  email: string;
  image?: string | null;
}

export async function getUser(): Promise<UserPayload | null> {
  const token = cookies().get('token')?.value;

  if (!token) return null;

  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in the environment variables');
      return null;
    }

    const verified = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    // Cast payload to the expected UserPayload type
    const user = verified.payload as unknown as UserPayload;

    // Optionally validate that required fields exist
    if (!user.id || !user.name || !user.email) {
      console.error('Decoded token payload is missing required fields');
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}
