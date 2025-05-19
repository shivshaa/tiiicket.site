export default function MarketplaceEventLoading() {
  return (
    <div className="container py-10">
      <div className="space-y-8 animate-pulse">
        <div className="h-10 bg-muted rounded w-40"></div>
        <div className="rounded-lg overflow-hidden bg-muted h-[400px]"></div>
        <div className="h-8 bg-muted rounded w-1/2"></div>
        <div className="space-y-4">
          <div className="h-4 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-12 bg-muted rounded"></div>
        </div>
        <div className="h-[300px] bg-muted rounded"></div>
      </div>
    </div>
  )
}
