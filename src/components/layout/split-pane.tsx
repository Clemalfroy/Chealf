import { cn } from "@/lib/utils";

type SplitPaneProps = {
  /** Left pane: main content (recipe preview, calendar) */
  main: React.ReactNode;
  /** Right pane: AI chat panel (fixed 360px) */
  chat: React.ReactNode;
  className?: string;
};

/**
 * Split-pane layout for AI-assisted views (recipe creation, weekly planning).
 * Desktop: 1fr + 360px side-by-side. Mobile: stacked, chat below.
 * Per DESIGN.md spec.
 */
export function SplitPane({ main, chat, className }: SplitPaneProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 lg:grid lg:gap-6",
        className
      )}
      style={{
        gridTemplateColumns: "1fr 360px",
      }}
    >
      <div className="min-h-0 flex-1">{main}</div>
      <div className="lg:h-[calc(100vh-4rem)] lg:sticky lg:top-8">
        <div className="h-full rounded-lg border border-border bg-card overflow-hidden">
          {chat}
        </div>
      </div>
    </div>
  );
}
