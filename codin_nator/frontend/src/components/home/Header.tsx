export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-card border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Welcome, <span className="text-primary">김내현</span>
          </h1>
          <p className="text-sm text-muted-foreground">0000.00.00</p>
        </div>
      </div>
    </header>
  );
}
