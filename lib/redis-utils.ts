import redis from './redis';

interface User {
  id: number;
  name: string;
  image: string | null;
}

interface RatingCategory {
  id: number;
  name: string;
  icon: string;
  description: string;
  weight: number;
  examples: string[];
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Rating {
  id: number;
  score: number;
  comment: string;
  userId: number;  // Changed to number to match Prisma
  ratingCategoryId: number;
  createdAt: Date;
  user: User;
  ratingCategory: RatingCategory;
}

interface Reply {
  id: number;
  content: string;
  userId: number;  // Changed to number to match Prisma
  user: User;
}

interface Reaction {
  id: number;
  type: string;
  userId: number;  // Changed to number to match Prisma
}

interface Comment {
  id: number;
  content: string;
  userId: number;  // Changed to number to match Prisma
  user: User;
  replies: Reply[];
  reactions: Reaction[];
}

export interface CachedEntity {
  id: number;
  rating: Rating[];
  comments: Comment[];
}

// Cache keys
export const keys = {
  entity: (type: string, id: number) => `${type}:${id}:data`,
  ratings: (type: string, id: number) => `${type}:${id}:ratings`,
  rateLimit: (userId: number | string, targetId: number | string, type: string) => 
    `ratelimit:${type}:${userId}:${targetId}`
};

// Cache TTL in seconds
const TTL = {
  ENTITY: 3600,      // 1 hour
  RATE_LIMIT: 86400  // 24 hours
};

export async function getEntityFromCache(type: string, id: number) {
  const key = keys.entity(type, id);
  const cached = await redis.get(key);
  return cached ? (JSON.parse(cached as string) as CachedEntity) : null;
}

export async function setEntityInCache(type: string, id: number, data: CachedEntity) {
  const key = keys.entity(type, id);
  await redis.set(key, JSON.stringify(data), { ex: TTL.ENTITY });
}

export async function invalidateEntityCache(type: string, id: number) {
  const key = keys.entity(type, id);
  await redis.del(key);
}

export async function checkRateLimit(userId: number | string, targetId: number | string, type: string) {
  const key = keys.rateLimit(userId, targetId, type);
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, TTL.RATE_LIMIT);
  }

  return {
    allowed: count <= 5,
    remainingRatings: Math.max(0, 5 - count)
  };
}

export async function cacheRatings(type: string, id: number, ratings: Rating[]) {
  const key = keys.ratings(type, id);
  await redis.set(key, JSON.stringify(ratings), { ex: TTL.ENTITY });
}

export async function getRatingsFromCache(type: string, id: number) {
  const key = keys.ratings(type, id);
  const cached = await redis.get(key);
  return cached ? (JSON.parse(cached as string) as Rating[]) : null;
}