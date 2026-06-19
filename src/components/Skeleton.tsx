export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="h-full w-full bg-gradient-to-r from-ink-100 via-ink-50 to-ink-100 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 rounded-2xl overflow-hidden">
          <Skeleton />
        </div>
        <div className="w-20 h-5 rounded-full overflow-hidden">
          <Skeleton />
        </div>
      </div>
      <div className="h-6 w-3/4 rounded-lg overflow-hidden mb-2">
        <Skeleton />
      </div>
      <div className="h-4 w-1/2 rounded-lg overflow-hidden mb-4">
        <Skeleton />
      </div>
      <div className="h-4 w-full rounded-lg overflow-hidden mb-2">
        <Skeleton />
      </div>
      <div className="h-4 w-5/6 rounded-lg overflow-hidden">
        <Skeleton />
      </div>
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
        <Skeleton />
      </div>
      <div className="flex-1">
        <div className="h-4 w-24 rounded-lg overflow-hidden mb-2">
          <Skeleton />
        </div>
        <div className="h-4 w-3/4 rounded-lg overflow-hidden mb-1">
          <Skeleton />
        </div>
        <div className="h-4 w-1/2 rounded-lg overflow-hidden">
          <Skeleton />
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-ink-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="h-8 w-32 rounded-lg overflow-hidden">
            <Skeleton />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full overflow-hidden">
              <Skeleton />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
