// utils/validations.ts
export interface RatingValidationError {
  field: string;
  message: string;
}

export interface RatingInput {
  categoryId: number;
  score: number;
  comment?: string;
}

export function validateRating(rating: RatingInput): RatingValidationError[] {
  const errors: RatingValidationError[] = [];

  if (!rating.categoryId) {
    errors.push({
      field: 'categoryId',
      message: 'Category is required'
    });
  }

  if (typeof rating.score !== 'number' || rating.score < 1 || rating.score > 5) {
    errors.push({
      field: 'score',
      message: 'Score must be between 1 and 5'
    });
  }

  if (rating.comment && typeof rating.comment !== 'string') {
    errors.push({
      field: 'comment',
      message: 'Comment must be a string'
    });
  }

  return errors;
}

export function validateMultipleRatings(ratings: RatingInput[]): RatingValidationError[] {
  if (!Array.isArray(ratings) || ratings.length === 0) {
    return [{
      field: 'ratings',
      message: 'At least one rating is required'
    }];
  }

  return ratings.flatMap((rating, index) => 
    validateRating(rating).map(error => ({
      ...error,
      field: `ratings[${index}].${error.field}`
    }))
  );
}