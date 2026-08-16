import React from 'react';

export const VideoCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-3 group rounded-2xl overflow-hidden bg-zen-card/40 border border-zen-border/40 p-3">
      {/* Thumbnail skeleton */}
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zen-surface shimmer" />

      {/* Info skeleton */}
      <div className="flex gap-3 mt-1">
        {/* Avatar skeleton */}
        <div className="w-10 h-10 rounded-full bg-zen-surface shrink-0 shimmer" />

        {/* Text lines skeleton */}
        <div className="flex flex-col gap-2 flex-1 pt-1">
          <div className="h-4 bg-zen-surface rounded-md w-11/12 shimmer" />
          <div className="h-3.5 bg-zen-surface rounded-md w-7/12 shimmer" />
          <div className="flex gap-2 items-center mt-1">
            <div className="h-3 bg-zen-surface rounded-md w-1/3 shimmer" />
            <div className="h-3 bg-zen-surface rounded-md w-1/4 shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const VideoGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <VideoCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const PlayerSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-5 w-full animate-fade-in">
      {/* Main player box */}
      <div className="aspect-video w-full rounded-2xl bg-zen-surface border border-zen-border/60 shimmer flex items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-zen-card/80 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      </div>

      {/* Title & Info */}
      <div className="flex flex-col gap-3 p-2">
        <div className="h-7 bg-zen-surface rounded-lg w-4/5 shimmer" />
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-zen-surface shimmer" />
            <div className="flex flex-col gap-2">
              <div className="h-4 bg-zen-surface rounded-md w-32 shimmer" />
              <div className="h-3 bg-zen-surface rounded-md w-24 shimmer" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-28 bg-zen-surface rounded-xl shimmer" />
            <div className="h-10 w-24 bg-zen-surface rounded-xl shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
};
