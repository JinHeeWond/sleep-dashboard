import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user;
}

export function displayName(user: { user_metadata?: { full_name?: string; name?: string }; email?: string | null }) {
  return (
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "User"
  );
}
