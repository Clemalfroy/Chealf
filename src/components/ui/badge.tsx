import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-border bg-muted text-muted-foreground",
        success:
          "border-[#C2D4C2] bg-[#E8F0E8] text-[#2D3A2D]",
        warning:
          "border-[#E8D5A8] bg-[#FDF3E0] text-[#7A5A1A]",
        error:
          "border-[#E8B8B8] bg-[#FDE8E8] text-[#8A2E2E]",
        info:
          "border-[#B8CDE0] bg-[#E4EEF6] text-[#2E4458]",
        accent:
          "border-[#D4A574] bg-[#FDF3E0] text-[#7A5530]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
