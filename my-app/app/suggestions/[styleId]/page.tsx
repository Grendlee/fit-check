"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "@/components/StepIndicator";
import { styleCategories } from "@/data/styles";
import { styleRubrics } from "@/data/styleRubrics";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import {
  fetchClosetItemsForCategory,
  toRubricKey,
  type ClosetItem,
} from "@/lib/closet";

type RankedItem = ClosetItem & {
  score: number;
  reasons: string[];
  slot: "top" | "bottom";
};

type StoredRating = {
  top_match?: boolean;
  bottom_match?: boolean;
  target_style?: string;
};

function tokenize(list: string[] | undefined) {
  if (!Array.isArray(list)) return [];
  return list
    .join(" ")
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter(Boolean);
}

function rankItems(items: ClosetItem[], rubric: any): RankedItem[] {
  const signatureTokens = tokenize(rubric?.signature_items);
  const paletteTokens = tokenize(rubric?.palette_materials);
  const silhouetteTokens = tokenize(rubric?.silhouette);
  const avoidTokens = tokenize(rubric?.avoid);

  const allPositive = new Set([...signatureTokens, ...paletteTokens, ...silhouetteTokens]);
  const allAvoid = new Set([...avoidTokens]);

  return items
    .map((it) => {
      const a = it.attributes || {};
      const blob = [
        it.category,
        it.og_file_name,
        a.type,
        a.style,
        a.fit,
        a.color,
        a.description,
        a.gender_target,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      let score = 0;
      const reasons: string[] = [];

      // + keyword matches
      for (const tok of allPositive) {
        if (tok.length < 3) continue;
        if (blob.includes(tok)) score += 3;
      }

      // + direct weighted hits
      if (signatureTokens.some((t) => blob.includes(t))) {
        score += 10;
        reasons.push("Matches signature items");
      }
      if (paletteTokens.some((t) => blob.includes(t))) {
        score += 4;
        reasons.push("Fits palette/materials");
      }
      if (silhouetteTokens.some((t) => blob.includes(t))) {
        score += 4;
        reasons.push("Fits silhouette");
      }

      // - avoid
      for (const tok of allAvoid) {
        if (tok.length < 3) continue;
        if (blob.includes(tok)) score -= 6;
      }
      if (avoidTokens.some((t) => blob.includes(t))) {
        reasons.push("Has an avoid element");
      }

      const slot: RankedItem["slot"] =
        it.source_table === "tops_generated_v1" ? "top" : "bottom";

      return {
        ...it,
        slot,
        score,
        reasons: Array.from(new Set(reasons)),
      };
    })
    .sort((a, b) => b.score - a.score);
}

function buildOutfits(tops: RankedItem[], bottoms: RankedItem[]) {
  const topPool = tops.slice(0, 8);
  const bottomPool = bottoms.slice(0, 8);

  const outfits: Array<{
    title: string;
    top?: RankedItem;
    bottom?: RankedItem;
    score: number;
  }> = [];

  if (topPool.length === 0 && bottomPool.length === 0) return outfits;

  const max = Math.min(Math.max(topPool.length, bottomPool.length), 10);
  for (let i = 0; i < max; i++) {
    const top = topPool[i % Math.max(topPool.length, 1)];
    const bottom = bottomPool[i % Math.max(bottomPool.length, 1)];
    const score = Math.round((top?.score ?? 0) * 0.55 + (bottom?.score ?? 0) * 0.45);

    outfits.push({
      title: `Outfit ${i + 1}`,
      top,
      bottom,
      score,
    });
  }

  outfits.sort((a, b) => b.score - a.score);
  return outfits;
}

export default function SuggestedFitsPage() {
  const router = useRouter();
  const params = useParams();

  // ✅ supports either [styleid] or [styleId] folder naming
  const styleId =
    ((params as any)?.styleid as string) ||
    ((params as any)?.styleId as string) ||
    "";

  const style = styleCategories.find((s) => s.id === styleId);

  const rubricKey = useMemo(() => toRubricKey(styleId), [styleId]);
  const rubric = useMemo(() => (styleRubrics as any)[rubricKey], [rubricKey]);

  const [items, setItems] = useState<ClosetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // ✅ NEW: decide which suggestions to show based on rating result
  const [needTops, setNeedTops] = useState(true);
  const [needBottoms, setNeedBottoms] = useState(true);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("fitcheck:rating");
      if (!stored) return;

      const rating = JSON.parse(stored) as StoredRating;

      // If we have explicit part matches, use them
      if (typeof rating.top_match === "boolean") setNeedTops(!rating.top_match);
      if (typeof rating.bottom_match === "boolean") setNeedBottoms(!rating.bottom_match);

      // If the rating was for a different style, ignore it
      if (rating.target_style && rating.target_style !== styleId) {
        setNeedTops(true);
        setNeedBottoms(true);
      }
    } catch {
      // ignore
    }
  }, [styleId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);
      try {
        if (!styleId) throw new Error("Missing style in URL.");
        const data = await fetchClosetItemsForCategory(styleId);
        if (!cancelled) setItems(data);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Failed to load closet items.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [styleId]);

  const ranked = useMemo(() => {
    if (!rubric) return [];
    return rankItems(items, rubric);
  }, [items, rubric]);

  const rankedTops = useMemo(() => ranked.filter((r) => r.slot === "top"), [ranked]);
  const rankedBottoms = useMemo(() => ranked.filter((r) => r.slot === "bottom"), [ranked]);

  const topPicks = useMemo(() => {
    const list: RankedItem[] = [];
    if (needTops) list.push(...rankedTops.slice(0, 6));
    if (needBottoms) list.push(...rankedBottoms.slice(0, 6));
    return list.slice(0, 8);
  }, [needTops, needBottoms, rankedTops, rankedBottoms]);

  const outfits = useMemo(() => {
    // Only build outfit combos when we need BOTH
    if (!needTops || !needBottoms) return [];
    return buildOutfits(rankedTops, rankedBottoms);
  }, [needTops, needBottoms, rankedTops, rankedBottoms]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-4 pb-2"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/rating/${styleId}`)}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Shirt className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">
                Closet Suggestions
              </h1>
              <p className="text-xs text-muted-foreground">
                Target: {style?.name || styleId} • suggestions from your closet
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      <StepIndicator currentStep={3} />

      <div className="flex-1 px-4 pb-4">
        {loading ? (
          <div className="text-sm text-muted-foreground py-8">Loading your closet…</div>
        ) : err ? (
          <div className="text-sm text-red-500 py-8">{err}</div>
        ) : !rubric ? (
          <div className="text-sm text-red-500 py-8">
            Missing rubric for <b>{styleId}</b>. Expected key <b>{rubricKey}</b>.
          </div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8">
            No closet items found for category <b>{styleId}</b>.
          </div>
        ) : !needTops && !needBottoms ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">✅</div>
            <div className="text-lg font-semibold text-foreground">
              You already match this style!
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              No suggestions needed.
            </div>

            <div className="mt-6 flex gap-3 justify-center">
              <Button variant="outline" onClick={() => router.push(`/rating/${styleId}`)}>
                Back to rating
              </Button>
              <Button onClick={() => router.push(`/camera/${styleId}`)}>
                Retake photo
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Which parts we’re suggesting */}
            <div className="mb-4 text-sm text-muted-foreground">
              {needTops && needBottoms
                ? "Suggesting tops + bottoms"
                : needTops
                ? "Your bottoms matched — suggesting tops"
                : "Your top matched — suggesting bottoms"}
            </div>

            {/* Top picks (only for needed parts) */}
            <div className="mb-6">
              <h2 className="font-semibold mb-2">Top picks from your closet</h2>

              <div className="grid grid-cols-2 gap-3">
                {topPicks.map((it) => (
                  <div
                    key={it.id}
                    className="rounded-xl border border-white/10 overflow-hidden"
                  >
                    <img
                      src={it.image_url}
                      alt={it.og_file_name || "closet item"}
                      className="w-full h-40 object-cover"
                    />
                    <div className="p-3">
                      <div className="text-sm font-medium line-clamp-2">
                        {it.attributes?.description || it.og_file_name || "Closet item"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {it.slot.toUpperCase()} 
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Outfit combos (only if need BOTH) */}
            {needTops && needBottoms && (
              <div className="mt-2">
                <h2 className="font-semibold mb-2">Suggested outfits</h2>

                {outfits.length > 0 ? (
                  <Carousel opts={{ align: "center", loop: true }} className="w-full max-w-md mx-auto">
                    <CarouselContent className="-ml-2 md:-ml-4">
                      {outfits.map((o, idx) => (
                        <CarouselItem key={idx} className="pl-2 md:pl-4 basis-[85%]">
                          <div className="rounded-xl border border-white/10 p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="font-semibold">{o.title}</div>
                              <div className="text-xs text-muted-foreground">
                                score {o.score}
                              </div>
                            </div>

                            <div className="space-y-3">
                              {o.top && (
                                <div className="flex gap-3 items-center">
                                  <img
                                    src={o.top.image_url}
                                    alt={o.top.og_file_name || "top"}
                                    className="w-16 h-16 rounded-lg object-cover border border-white/10"
                                  />
                                  <div className="text-sm">
                                    <div className="font-medium">
                                      {o.top.attributes?.description || o.top.og_file_name || "Top"}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      TOP • {o.top.attributes?.color || "?"} • {o.top.attributes?.fit || "?"}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {o.bottom && (
                                <div className="flex gap-3 items-center">
                                  <img
                                    src={o.bottom.image_url}
                                    alt={o.bottom.og_file_name || "bottom"}
                                    className="w-16 h-16 rounded-lg object-cover border border-white/10"
                                  />
                                  <div className="text-sm">
                                    <div className="font-medium">
                                      {o.bottom.attributes?.description || o.bottom.og_file_name || "Bottom"}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      BOTTOM • {o.bottom.attributes?.color || "?"} • {o.bottom.attributes?.fit || "?"}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="mt-4 text-xs text-muted-foreground">
                              Built only from your closet items and ranked against the rubric.
                            </div>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>

                    <div className="flex items-center justify-center gap-4 mt-4">
                      <CarouselPrevious className="static translate-y-0" />
                      <span className="text-sm text-muted-foreground">Swipe outfits</span>
                      <CarouselNext className="static translate-y-0" />
                    </div>
                  </Carousel>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Not enough items to build outfits yet — add more tops/bottoms in this category.
                  </div>
                )}
              </div>
            )}

            <div className="mt-6">
              <Button className="w-full" onClick={() => router.push(`/camera/${styleId}`)}>
                Retake & re-rate
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
