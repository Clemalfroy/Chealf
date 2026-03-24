import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar — fixed width on desktop */}
      <aside className="hidden w-56 shrink-0 border-r border-border lg:block">
        <div className="sticky top-0 h-screen overflow-y-auto">
          <Sidebar />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex min-h-screen flex-1 flex-col">
        <div className="mx-auto w-full max-w-[1120px] flex-1 px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
