type EntityType = 'nominee' | 'institution';

interface RateLimitResponse {
  allowed: boolean;
  message?: string;
  remainingRatings: number;
}

export async function checkRateLimit(
  _userId: number,
  _entityId: number,
  _entityType: EntityType
): Promise<RateLimitResponse> {
  // Always allow ratings with no limits
  return {
    allowed: true,
    remainingRatings: Number.MAX_SAFE_INTEGER
  };
}