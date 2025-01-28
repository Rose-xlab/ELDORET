import React, { useState, useCallback } from 'react';
// import { useAuth } from '@/lib/auth-context';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
// import { AuthModal } from '@/components/AuthModal';
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, ThumbsDown, Reply, MessageCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';

interface User {
  id: number;
  name: string;
  image?: string;
}

interface CommentReply {
  id: number;
  content: string;
  createdAt: string;
  user: User;
  likes: number;
  dislikes: number;
  userReaction?: boolean;
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  user: User;
  likes: number;
  dislikes: number;
  userReaction?: boolean;
  replies: CommentReply[];
}

interface CommentSectionProps {
  entityId: number;
  entityType: 'nominee' | 'institution';
  comments?: Comment[];
  onSubmitComment: (content: string, parentId?: number) => Promise<void>;
  onReact: (commentId: number, isLike: boolean, isReply?: boolean) => Promise<void>;
}

const CommentComponent: React.FC<{
  comment: Comment;
  isReply?: boolean;
  onReaction: (commentId: number, isLike: boolean, isReply: boolean) => Promise<void>;
  onSubmitReply: (content: string, commentId: number) => Promise<void>;
  isAuthenticated: boolean;
}> = ({
  comment,
  isReply = false,
  onReaction,
  onSubmitReply,
  isAuthenticated
}) => {
  const { toast } = useToast();
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmitReply(replyContent, comment.id);
      setReplyContent('');
      setShowReplyForm(false);
      toast({
        title: "Success",
        description: "Reply posted successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to post reply"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={`p-4 ${isReply ? 'ml-8 mt-2' : ''}`}>
      <div className="flex items-start gap-4">
        <Avatar className="w-10 h-10">
          <Image
            src={comment.user.image || "/placeholder-avatar.png"}
            alt={comment.user.name}
            width={40}
            height={40}
            className="rounded-full"
          />
        </Avatar>

        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-medium">{comment.user.name}</span>
              <span className="text-sm text-gray-500 ml-2">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>

          <p className="mt-2 text-gray-700">{comment.content}</p>

          <div className="flex items-center gap-4 mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReaction(comment.id, true, isReply)}
              className={comment.userReaction === true ? 'text-blue-600' : ''}
            >
              <ThumbsUp className="w-4 h-4 mr-1" />
              {comment.likes}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReaction(comment.id, false, isReply)}
              className={comment.userReaction === false ? 'text-red-600' : ''}
            >
              <ThumbsDown className="w-4 h-4 mr-1" />
              {comment.dislikes}
            </Button>

            {/* Comment out isAuthenticated check */}
            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                <Reply className="w-4 h-4 mr-1" />
                Reply
              </Button>
            )}
          </div>

          {showReplyForm && (
            <form onSubmit={handleSubmitReply} className="mt-4 space-y-4">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply..."
                disabled={isSubmitting}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReplyForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !replyContent.trim()}
                >
                  {isSubmitting ? 'Posting...' : 'Post Reply'}
                </Button>
              </div>
            </form>
          )}

          {!isReply && comment.replies && comment.replies.length > 0 && (
            <div className="space-y-4 mt-4">
              {comment.replies.map((reply) => (
                <CommentComponent
                  key={reply.id}
                  comment={reply as Comment}
                  isReply={true}
                  onReaction={onReaction}
                  onSubmitReply={onSubmitReply}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export function CommentSection({
  entityId,
  entityType,
  comments = [],
  onSubmitComment,
  onReact,
}: CommentSectionProps) {
  // const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentList, setCommentList] = useState<Comment[]>(comments);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
          userId: 0, // Changed from 1 to 0 for anonymous
          nomineeId: entityType === 'nominee' ? entityId : undefined,
          institutionId: entityType === 'institution' ? entityId : undefined,
        }),
      });

      const newCommentData = await response.json();
      setCommentList([newCommentData, ...commentList]);
      setNewComment('');
      toast({
        title: "Success",
        description: "Comment posted successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to post comment"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReaction = useCallback(async (
    commentId: number,
    isLike: boolean,
    isReply: boolean
  ) => {
    /* Comment out auth check
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to react to comments"
      });
      return;
    }
    */

    try {
      await onReact(commentId, isLike, isReply);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update reaction"
      });
    }
  }, [onReact, toast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5" />
        <h3 className="text-lg font-medium">Comments</h3>
      </div>

      {/* Comment out authentication condition */}
      {/* {isAuthenticated ? ( */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            disabled={isSubmitting}
            className="min-h-[120px]"
          />
          <Button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="w-full bg-[#006600] hover:bg-[#005500] text-white"
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </form>
      {/* ) : (
        <AuthModal
          trigger={
            <Button variant="outline" className="w-full">
              Sign in to comment
            </Button>
          }
          mode="comment"
        />
      )} */}

      <div className="space-y-4">
        {commentList.length > 0 ? (
          commentList.map((comment) => (
            <CommentComponent
              key={comment.id}
              comment={comment}
              onReaction={handleReaction}
              onSubmitReply={onSubmitComment}
              isAuthenticated={true} // Changed to always true for anonymous
            />
          ))
        ) : (
          <p className="text-center text-gray-500 py-4">
            No comments yet. Be the first to share your thoughts!
          </p>
        )}
      </div>
    </div>
  );
}