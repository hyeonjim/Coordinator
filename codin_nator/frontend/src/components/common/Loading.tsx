export default function LoadingPage() {
  return (
    <div
      className="flex items-center justify-center h-screen bg-background"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">앱을 준비하고 있어요...</p>
      </div>
    </div>
  );
}
