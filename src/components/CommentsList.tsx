import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, ChevronDown, ChevronUp, User } from 'lucide-react';
import { InvidiousComment } from '../types';
import { formatPublishedDate } from '../utils/formatters';

interface CommentsListProps {
  comments: InvidiousComment[];
  isLoading: boolean;
}

export const CommentsList: React.FC<CommentsListProps> = ({ comments, isLoading }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [visibleCount, setVisibleCount] = useState(15);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 rounded-2xl bg-zen-card/60 border border-zen-border/40 mt-6">
        <div className="h-5 bg-zen-surface rounded-md w-36 shimmer" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 pt-2">
            <div className="w-9 h-9 rounded-full bg-zen-surface shrink-0 shimmer" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-3.5 bg-zen-surface rounded-md w-1/4 shimmer" />
              <div className="h-3.5 bg-zen-surface rounded-md w-full shimmer" />
              <div className="h-3 bg-zen-surface rounded-md w-1/6 shimmer" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-zen-card/40 border border-zen-border/30 text-center text-sm text-slate-500 mt-6">
        <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-50" />
        Aucun commentaire disponible pour cette vidéo.
      </div>
    );
  }

  const displayedComments = comments.slice(0, visibleCount);

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 rounded-2xl bg-zen-card/60 border border-zen-border/60 mt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-brand" />
          <h3 className="text-base font-bold text-white">
            Commentaires ({comments.length})
          </h3>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-zen-hover transition-colors cursor-pointer"
        >
          <span>{isExpanded ? 'Masquer' : 'Afficher'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* List */}
      {isExpanded && (
        <div className="flex flex-col gap-5 pt-2">
          {displayedComments.map((comment) => {
            const avatar = comment.authorThumbnails?.[0]?.url;

            return (
              <div key={comment.commentId || Math.random()} className="flex gap-3 text-sm">
                {/* Author Avatar */}
                <div className="shrink-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={comment.author}
                      className="w-9 h-9 rounded-full object-cover bg-zen-surface border border-zen-border"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-zen-surface border border-zen-border flex items-center justify-center text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-200 text-xs sm:text-sm">
                      {comment.author}
                    </span>

                    {comment.authorIsChannelOwner && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-brand/20 text-brand">
                        Créateur
                      </span>
                    )}

                    <span className="text-xs text-slate-500">
                      {formatPublishedDate(comment.published, comment.publishedText)}
                    </span>
                  </div>

                  <p className="text-slate-300 text-xs sm:text-sm mt-1 whitespace-pre-line break-words leading-relaxed">
                    {comment.content}
                  </p>

                  {/* Likes & replies */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{comment.likeCount > 0 ? comment.likeCount : ''}</span>
                    </div>

                    {comment.replies && comment.replies.replyCount > 0 && (
                      <span className="text-brand font-medium">
                        {comment.replies.replyCount} réponse
                        {comment.replies.replyCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Load more button */}
          {visibleCount < comments.length && (
            <button
              onClick={() => setVisibleCount((prev) => prev + 15)}
              className="w-full py-2.5 mt-2 rounded-xl bg-zen-surface hover:bg-zen-hover border border-zen-border text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Afficher plus de commentaires ({comments.length - visibleCount} restants)
            </button>
          )}
        </div>
      )}
    </div>
  );
};
