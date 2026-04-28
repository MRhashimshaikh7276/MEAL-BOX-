export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-40 w-full rounded-none" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-2/3" />
        <div className="flex justify-between items-center mt-3">
          <div className="skeleton h-5 w-16" />
          <div className="skeleton h-8 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export function OrderCardSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex justify-between">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
      <div className="skeleton h-3 w-48" />
      <div className="skeleton h-3 w-full" />
      <div className="flex justify-between">
        <div className="skeleton h-5 w-24" />
        <div className="skeleton h-9 w-28 rounded-xl" />
      </div>
    </div>
  )
}

export function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div className="skeleton w-16 h-16 rounded-2xl" />
      <div className="skeleton h-3 w-12" />
    </div>
  )
}

export function DashboardStatSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex justify-between">
        <div className="skeleton h-4 w-28" />
        <div className="skeleton w-10 h-10 rounded-xl" />
      </div>
      <div className="skeleton h-8 w-20" />
      <div className="skeleton h-3 w-32" />
    </div>
  )
}
