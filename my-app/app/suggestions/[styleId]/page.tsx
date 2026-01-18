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

  const allPositive = new Set([
    ...signatureTokens,
    ...paletteTokens,
    ...silhouetteTokens,
  ]);
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

      for (const tok of allPositive) {
        if (tok.length < 3) continue;
        if (blob.includes(tok)) score += 3;
      }

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

  const [needTops, setNeedTops] = useState(true);
  const [needBottoms, setNeedBottoms] = useState(true);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("fitcheck:rating");
      if (!stored) return;

      const rating = JSON.parse(stored) as StoredRating;

      if (typeof rating.top_match === "boolean") setNeedTops(!rating.top_match);
      if (typeof rating.bottom_match === "boolean") setNeedBottoms(!rating.bottom_match);

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
    if (!needTops || !needBottoms) return [];
    return buildOutfits(rankedTops, rankedBottoms);
  }, [needTops, needBottoms, rankedTops, rankedBottoms]);

  return (
    <div className="min-h-screen bg-[#f4eadf] text-zinc-900 flex flex-col">
      {/* subtle paper dots */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.12] bg-[radial-gradient(#000_0.8px,transparent_0)] [background-size:22px_22px]" />

      {/* Progress first */}
      <div className="relative mx-auto w-full max-w-6xl px-6 pt-4">
        <div className="rounded-[18px] border-2 border-zinc-900 bg-[#f4eadf] shadow-[3px_3px_0_#00000012] px-3 py-2">
          <div className="scale-[0.94] origin-top">
            <StepIndicator currentStep={3} />
          </div>
        </div>
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mx-auto w-full max-w-6xl px-6 pt-4 pb-3"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/rating/${styleId}`)}
              className="h-10 w-10 rounded-full border-2 border-zinc-900 bg-[#f7f1ea] hover:bg-[#eee2d5] text-zinc-900 shadow-[2px_2px_0_#00000012]"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full border-2 border-zinc-900 bg-[#e7dccf] shadow-[2px_2px_0_#00000012] flex items-center justify-center">
                <Shirt className="w-5 h-5" />
              </div>

              <div>
                <div className="text-[10px] tracking-[0.28em] uppercase text-zinc-700">
                  Suggested fits
                </div>
                <h1 className="mt-1 text-3xl sm:text-4xl leading-[0.95] tracking-[-0.02em] [font-family:'Bodoni Moda','Didot','Bodoni MT',ui-serif,serif] font-semibold">
                  Closet picks
                </h1>
                <div className="mt-2 text-sm text-zinc-700">
                  Target vibe:{" "}
                  <span className="text-zinc-900 font-medium">
                    {style?.name || styleId}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => router.push(`/camera/${styleId}`)}
            className="h-11 rounded-full px-6 border-2 border-zinc-900 bg-[#f7f1ea] text-zinc-900 hover:bg-[#eee2d5] shadow-[2px_2px_0_#00000012]"
          >
            Retake
          </Button>
        </div>
      </motion.header>

      <div className="relative mx-auto w-full max-w-6xl px-6 pb-8 flex-1">
        {loading ? (
          <div className="mt-8 rounded-[22px] border-2 border-zinc-900 bg-[#f7f1ea] shadow-[3px_3px_0_#00000010] px-5 py-4 text-sm text-zinc-900">
            Loading your closet…
          </div>
        ) : err ? (
          <div className="mt-8 rounded-[22px] border-2 border-zinc-900 bg-[#f7f1ea] shadow-[3px_3px_0_#00000010] px-5 py-4 text-sm text-zinc-900">
            {err}
          </div>
        ) : !rubric ? (
          <div className="mt-8 rounded-[22px] border-2 border-zinc-900 bg-[#f7f1ea] shadow-[3px_3px_0_#00000010] px-5 py-4 text-sm text-zinc-900">
            Missing style definition for <b>{styleId}</b>.
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-[22px] border-2 border-zinc-900 bg-[#f7f1ea] shadow-[3px_3px_0_#00000010] px-5 py-4 text-sm text-zinc-900">
            No closet items found for <b>{styleId}</b>.
          </div>
        ) : !needTops && !needBottoms ? (
          <div className="mt-10 rounded-[26px] border-2 border-zinc-900 bg-[#f4eadf] shadow-[4px_4px_0_#00000012] px-6 py-10 text-center">
            <div className="text-[10px] tracking-[0.28em] uppercase text-zinc-700">
              Status
            </div>
            <div className="mt-2 text-2xl [font-family:'Bodoni Moda','Didot','Bodoni MT',ui-serif,serif] font-semibold">
              You’re already on target
            </div>
            <div className="mt-2 text-sm text-zinc-700">
              No closet suggestions needed for this vibe.
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => router.push(`/rating/${styleId}`)}
                className="h-11 rounded-full px-6 border-2 border-zinc-900 bg-[#f7f1ea] text-zinc-900 hover:bg-[#eee2d5] shadow-[2px_2px_0_#00000012]"
              >
                Back to rating
              </Button>
              <Button
                onClick={() => router.push(`/camera/${styleId}`)}
                className="h-11 rounded-full px-6 border-2 border-zinc-900 bg-[#e7dccf] text-zinc-900 hover:bg-[#dfd2c4] shadow-[2px_2px_0_#00000012]"
              >
                Retake photo
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Which parts */}
            <div className="mt-6 rounded-[18px] border-2 border-zinc-900 bg-[#f7f1ea] shadow-[3px_3px_0_#00000010] px-5 py-4">
              <div className="text-[10px] tracking-[0.28em] uppercase text-zinc-700">
                Focus
              </div>
              <div className="mt-1 text-sm text-zinc-900">
                {needTops && needBottoms
                  ? "Tops and bottoms"
                  : needTops
                  ? "Tops"
                  : "Bottoms"}
              </div>
            </div>

            {/* Top picks */}
            <div className="mt-6">
              <div className="flex items-end justify-between gap-4 mb-3">
                <div>
                  <div className="text-[10px] tracking-[0.28em] uppercase text-zinc-700">
                    From your closet
                  </div>
                  <h2 className="mt-1 text-xl tracking-tight [font-family:'Bodoni Moda','Didot','Bodoni MT',ui-serif,serif] font-semibold">
                    Top picks
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {topPicks.map((it) => (
                  <div
                    key={it.id}
                    className="rounded-[22px] border-2 border-zinc-900 bg-[#f4eadf] shadow-[3px_3px_0_#00000012] overflow-hidden"
                  >
                    <div className="relative">
                      <img
                        src={it.image_url}
                        alt={it.og_file_name || "closet item"}
                        className="w-full h-44 object-cover bg-zinc-950"
                      />
                      <div className="absolute top-3 left-3 rounded-full border-2 border-zinc-900 bg-[#f7f1ea] px-3 py-1 text-[10px] tracking-[0.22em] uppercase shadow-[2px_2px_0_#00000010]">
                        {it.slot}
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="text-sm font-medium text-zinc-900 line-clamp-2">
                        {it.attributes?.description || it.og_file_name || "Closet item"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Outfit combos */}
            {needTops && needBottoms && (
              <div className="mt-8">
                <div className="mb-3">
                  <div className="text-[10px] tracking-[0.28em] uppercase text-zinc-700">
                    Combinations
                  </div>
                  <h2 className="mt-1 text-xl tracking-tight [font-family:'Bodoni Moda','Didot','Bodoni MT',ui-serif,serif] font-semibold">
                    Suggested outfits
                  </h2>
                </div>

                {outfits.length > 0 ? (
                  <Carousel
                    opts={{ align: "center", loop: true }}
                    className="w-full max-w-3xl mx-auto"
                  >
                    <CarouselContent className="-ml-2 md:-ml-4">
                      {outfits.map((o, idx) => (
                        <CarouselItem key={idx} className="pl-2 md:pl-4 basis-[92%] md:basis-[70%]">
                          <div className="rounded-[26px] border-2 border-zinc-900 bg-[#f4eadf] shadow-[4px_4px_0_#00000012] p-5">
                            <div className="flex items-center justify-between mb-4">
                              <div className="text-lg [font-family:'Bodoni Moda','Didot','Bodoni MT',ui-serif,serif] font-semibold">
                                {o.title}
                              </div>
                            </div>

                            <div className="space-y-4">
                              {o.top && (
                                <div className="flex gap-4 items-center">
                                  <img
                                    src={o.top.image_url}
                                    alt={o.top.og_file_name || "top"}
                                    className="w-20 h-20 rounded-[18px] object-cover border-2 border-zinc-900 bg-zinc-950 shadow-[2px_2px_0_#00000010]"
                                  />
                                  <div className="text-sm">
                                    <div className="font-medium text-zinc-900">
                                      {o.top.attributes?.description || o.top.og_file_name || "Top"}
                                    </div>
                                    <div className="text-xs text-zinc-700 mt-1">
                                      TOP • {o.top.attributes?.color || "?"} • {o.top.attributes?.fit || "?"}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {o.bottom && (
                                <div className="flex gap-4 items-center">
                                  <img
                                    src={o.bottom.image_url}
                                    alt={o.bottom.og_file_name || "bottom"}
                                    className="w-20 h-20 rounded-[18px] object-cover border-2 border-zinc-900 bg-zinc-950 shadow-[2px_2px_0_#00000010]"
                                  />
                                  <div className="text-sm">
                                    <div className="font-medium text-zinc-900">
                                      {o.bottom.attributes?.description || o.bottom.og_file_name || "Bottom"}
                                    </div>
                                    <div className="text-xs text-zinc-700 mt-1">
                                      BOTTOM • {o.bottom.attributes?.color || "?"} • {o.bottom.attributes?.fit || "?"}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="mt-5 text-xs text-zinc-700">
                              Built from your closet items.
                            </div>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>

                    <div className="flex items-center justify-center gap-4 mt-4">
                      <CarouselPrevious className="static translate-y-0 h-10 w-10 rounded-full border-2 border-zinc-900 bg-[#f7f1ea] shadow-[2px_2px_0_#00000012]" />
                      <span className="text-sm text-zinc-700">Swipe outfits</span>
                      <CarouselNext className="static translate-y-0 h-10 w-10 rounded-full border-2 border-zinc-900 bg-[#f7f1ea] shadow-[2px_2px_0_#00000012]" />
                    </div>
                  </Carousel>
                ) : (
                  <div className="rounded-[22px] border-2 border-zinc-900 bg-[#f7f1ea] shadow-[3px_3px_0_#00000010] px-5 py-4 text-sm text-zinc-900">
                    Not enough items to build outfits yet — add more tops/bottoms in this category.
                  </div>
                )}
              </div>
            )}

            <div className="mt-8">
              <Button
                className="h-12 w-full rounded-full border-2 border-zinc-900 bg-[#e7dccf] text-zinc-900 hover:bg-[#dfd2c4] shadow-[3px_3px_0_#00000014]"
                onClick={() => router.push(`/camera/${styleId}`)}
              >
                Retake & re-rate
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
