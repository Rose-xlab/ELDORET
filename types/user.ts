// types/user.ts
export interface UserActivity {
    ratings: {
      id: number;
      score: number;
      comment: string;
      createdAt: string;
      type: 'nominee' | 'institution';
      target: {
        id: number;
        name: string;
        image?: string;
      };
      ratingCategory: {
        id: number;
        name: string;
        icon: string;
      };
    }[];
    comments: {
      id: number;
      content: string;
      createdAt: string;
      nominee?: {
        id: number;
        name: string;
      };
      institution?: {
        id: number;
        name: string;
      };
      likes: number;
      dislikes: number;
      replies: {
        id: number;
        content: string;
        createdAt: string;
        user: {
          name: string;
          image?: string;
        };
      }[];
    }[];
  }