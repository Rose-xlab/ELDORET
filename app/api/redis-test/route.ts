import { NextResponse } from 'next/server';
import redis from '@/lib/redis';

export async function GET() {
  try {
    // Simple test
    await redis.set('test-key', 'hello world', { ex: 60 });
    const value = await redis.get('test-key');
    
    return NextResponse.json({ 
      success: true,
      testValue: value,
      message: 'Redis connection successful'
    });
  } catch (error) {
    console.error('Redis test error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}