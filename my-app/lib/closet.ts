// lib/closet.ts
import { createClient } from "@/lib/supabase/client";

export type ClosetItem = {
  id: string;
  category: string; // e.g. "tech-bro", "ted-talk"
  created_at?: string;
  image_url: string;
  og_file_name?: string;
  attributes: any; // JSON or stringified JSON
  source_table: "tops_generated_v1" | "bottoms_generated_v1";
};

function safeParseAttributes(attributes: any) {
  if (!attributes) return {};
  if (typeof attributes === "object") return attributes;
  if (typeof attributes === "string") {
    try {
      return JSON.parse(attributes);
    } catch {
      return {};
    }
  }
  return {};
}

export function toRubricKey(styleIdFromUrl: string) {
  return (styleIdFromUrl || "").replace(/-/g, "_");
}

export async function fetchClosetItemsForCategory(styleIdFromUrl: string) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase client not configured.");

  const category = styleIdFromUrl || "";
  console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  const [topsRes, bottomsRes] = await Promise.all([
    supabase
      .from("tops_generated_v1")
      .select("id, category, created_at, image_url, og_file_name, attributes")
      .eq("category", category)
      .order("created_at", { ascending: false }),

    supabase
      .from("bottoms_generated_v1")
      .select("id, category, created_at, image_url, og_file_name, attributes")
      .eq("category", category)
      .order("created_at", { ascending: false }),
  ]);

  if (topsRes.error) throw new Error(topsRes.error.message);
  if (bottomsRes.error) throw new Error(bottomsRes.error.message);

  const tops: ClosetItem[] = (topsRes.data ?? []).map((row: any) => ({
    ...row,
    attributes: safeParseAttributes(row.attributes),
    source_table: "tops_generated_v1",
  }));

  const bottoms: ClosetItem[] = (bottomsRes.data ?? []).map((row: any) => ({
    ...row,
    attributes: safeParseAttributes(row.attributes),
    source_table: "bottoms_generated_v1",
  }));

  return [...tops, ...bottoms];
}
