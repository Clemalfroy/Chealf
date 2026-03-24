"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChefHat, CalendarDays, ShoppingCart, Home, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";
import { logout } from "@/app/(auth)/actions";

const NAV_ITEMS = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/recipes", label: "Recettes", icon: ChefHat },
  { href: "/planning", label: "Planning", icon: CalendarDays },
  { href: "/shopping", label: "Courses", icon: ShoppingCart },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <nav className="flex h-full flex-col gap-1 px-3 py-4">
      {/* Logo */}
      <div className="mb-6 px-2">
        <span className="font-display text-xl font-bold text-foreground tracking-tight">
          Chealf
        </span>
      </div>

      {/* Nav links */}
      <ul className="flex flex-1 flex-col gap-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-border/50 hover:text-foreground"
                )}
              >
                <Icon size={16} strokeWidth={1.75} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* User area */}
      <div className="border-t border-border pt-3">
        {user && (
          <div className="mb-2 px-3 py-1">
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-border/50 hover:text-foreground"
          >
            <LogOut size={16} strokeWidth={1.75} />
            Se déconnecter
          </button>
        </form>
      </div>
    </nav>
  );
}
