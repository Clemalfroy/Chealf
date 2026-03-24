import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Verify the current session server-side.
 * Wrapped in React.cache() so it's deduplicated within a single request.
 * Call this in every page, Server Action, and Route Handler that needs auth.
 */
export const verifySession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return { user };
});
