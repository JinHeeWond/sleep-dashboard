"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export async function saveCondition(formData: FormData) {
  const user = await requireUser();
  const date = String(formData.get("date") ?? "");
  const refreshment = Number(formData.get("refreshment") ?? 0);
  const pain_neck = formData.get("pain_neck") === "on";
  const pain_shoulder = formData.get("pain_shoulder") === "on";
  const pain_back = formData.get("pain_back") === "on";
  const memo = String(formData.get("memo") ?? "").slice(0, 500) || null;

  if (!date) throw new Error("date is required");

  const supabase = await createClient();
  const { error } = await supabase.from("morning_conditions").upsert(
    {
      user_id: user.id,
      date,
      refreshment: refreshment >= 1 && refreshment <= 5 ? refreshment : null,
      pain_neck,
      pain_shoulder,
      pain_back,
      memo,
    },
    { onConflict: "user_id,date" }
  );

  if (error) throw error;
  revalidatePath("/dashboard");
}
