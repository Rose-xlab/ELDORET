// Define an interface for error details
interface ErrorDetails {
  [key: string]: string | number | boolean | null | undefined;
}

// Define an interface for ranking parameters
interface RankingParams {
  id: string;
  categoryId?: string;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: ErrorDetails
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.details
      }),
      { status: error.statusCode }
    );
  }

  return new Response(
    JSON.stringify({
      error: 'Internal Server Error'
    }),
    { status: 500 }
  );
}

export function validateRankingParams(params: RankingParams) {
  const { id, categoryId } = params;

  if (!id || isNaN(parseInt(id))) {
    throw new ApiError(400, 'Invalid ID parameter');
  }

  if (categoryId && isNaN(parseInt(categoryId))) {
    throw new ApiError(400, 'Invalid category ID parameter');
  }
}