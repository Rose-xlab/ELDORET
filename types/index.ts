export interface RatingData {
    id: number;
    score: number;
    comment?: string;
    ratingCategoryId: number;
    userId: string;
    createdAt: Date;
  }
  
  export interface Entity {
    id: number;
    rating: RatingData[];
    comments: Comment[];
    // Add other entity fields as needed
  }
  
  export interface Comment {
    id: number;
    content: string;
    userId: string;
    replies: Reply[];
    reactions: Reaction[];
    createdAt: Date;
  }
  
  export interface Reply {
    id: number;
    content: string;
    userId: string;
    createdAt: Date;
  }
  
  export interface Reaction {
    id: number;
    type: string;
    userId: string;
  }