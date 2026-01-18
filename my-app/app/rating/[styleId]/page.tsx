"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { styleCategories } from "@/data/styles";
import { styleRubrics } from "@/data/styleRubrics";
import { geminiModel } from "@/lib/gemini";
import { StepIndicator } from "@/components/StepIndicator";

type RatingResult = {
  target_style: string;
  detected_style: string;
  match_score: number;
  confidence: number;
  reasons: string[];
  suggestions: string[];
  top_match: boolean;
  bottom_match: boolean;
};

function extractJson(raw: string) {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Model did not return JSON.");
  return JSON.parse(match[0]);
}

function getGeminiText(resp: any): string {
  const parts = resp?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) return parts.map((p: any) => p?.text ?? "").join("").trim();

  const parts2 = resp?.response?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts2)) return parts2.map((p: any) => p?.text ?? "").join("").trim();

  if (typeof resp?.text === "string") return resp.text;
  return "";
}

function rubricToText(rubric: any) {
  const sig = Array.isArray(rubric?.signature_items) ? rubric.signature_items : [];
  const avoid = Array.isArray(rubric?.avoid) ? rubric.avoid : [];
  const pal = Array.isArray(rubric?.palette_materials) ? rubric.palette_materials : [];
  const sil = Array.isArray(rubric?.silhouette) ? rubric.silhouette : [];

  return `
Signature items:
- ${sig.join("\n- ")}

Avoid:
- ${avoid.join("\n- ")}

Palette & materials:
- ${pal.join("\n- ")}

Silhouette:
- ${sil.join("\n- ")}
`.trim();
}

export default function RatingPage() {
  const router = useRouter();
  const params = useParams();

  const styleId =
    ((params as any)?.styleid as string) ||
    ((params as any)?.styleId as string) ||
    "";

  const style = useMemo(() => styleCategories.find((s) => s.id === styleId), [styleId]);

  const rubricKey = useMemo(() => {
    if (!styleId) return "";
    return styleId.replace(/-/g, "_");
  }, [styleId]);

  const rubric = useMemo(() => {
    return (styleRubrics as any)[rubricKey] ?? null;
  }, [rubricKey]);

  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RatingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("fitcheck:capture");
    if (!stored) {
      setError("No photo found. Please retake your photo.");
      return;
    }
    setImageDataUrl(stored);
  }, []);

  const handleRate = async () => {
    setError(null);
    setResult(null);

    if (!styleId) {
      setError("Missing target style.");
      return;
    }
    if (!rubric) {
      setError(`No rubric found for "${styleId}". Expected key "${rubricKey}".`);
      return;
    }
    if (!imageDataUrl) {
      setError("Missing photo. Please retake.");
      return;
    }

    setLoading(true);

    try {
      const base64 = imageDataUrl.split(",")[1];
      const rubricText = rubricToText(rubric);

      const prompt = `
Return ONLY valid JSON (no markdown, no extra text).

Schema:
{
  "target_style": string,
  "detected_style": string,
  "match_score": number,
  "confidence": number,
  "top_match": boolean,
  "bottom_match": boolean,
  "reasons": string[],
  "suggestions": string[]
}

TARGET STYLE:
- id: "${styleId}"
- name: "${style?.name ?? styleId}"
- description: "${style?.description ?? ""}"

RUBRIC (this is the ONLY definition of the target style; use it as your reference):
${rubricText}

Hard rules:
- You MUST set "target_style" exactly to "${styleId}".
- Your judgments MUST be based on the rubric above. Do not rely on stereotypes or outside knowledge.
- If the outfit is not fully visible (headshot / cropped / shoes not shown), match_score MUST be between 0 and 20 and include "insufficient outfit visibility" in reasons.
- match_score: 0-100, confidence: 0-1.
- Provide 3-6 bullet reasons and 3-6 bullet suggestions.
- Suggestions must be written for everyday users. Do NOT mention “rubric”, “signature items”, “palette & materials”, or any internal categories.
- Suggestions should be specific and actionable (what to swap/add), and consistent with the target vibe.
- Set top_match true only if the TOP clearly matches the rubric.
- Set bottom_match true only if the BOTTOM clearly matches the rubric.
- If top or bottom is not visible / unclear, set that part's match to false.

Now analyze the image and output JSON only.
`.trim();

      const resp = await geminiModel.generateVisionRating(prompt, base64);
      const text = getGeminiText(resp);
      if (!text) throw new Error("Empty model response.");

      const json = extractJson(text) as RatingResult;

      const safe: RatingResult = {
        target_style: styleId,
        detected_style: typeof json?.detected_style === "string" ? json.detected_style : "Unknown",
        match_score: typeof json?.match_score === "number" ? json.match_score : 0,
        confidence: typeof json?.confidence === "number" ? json.confidence : 0,
        reasons: Array.isArray(json?.reasons) ? json.reasons : [],
        suggestions: Array.isArray(json?.suggestions) ? json.suggestions : [],
        top_match: typeof json?.top_match === "boolean" ? json.top_match : false,
        bottom_match: typeof json?.bottom_match === "boolean" ? json.bottom_match : false,
      };

      sessionStorage.setItem("fitcheck:rating", JSON.stringify(safe));

      setResult(safe);
    } catch (e: any) {
      setError(e?.message ?? "Rating failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4eadf] text-zinc-900">
      {/* subtle paper dots */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.12] bg-[radial-gradient(#000_0.8px,transparent_0)] [background-size:22px_22px]" />

      <div className="relative mx-auto w-full max-w-6xl px-6 py-6">
        {/* Step Indicator */}
        <section className="relative px-6 pb-8">
            <div className="mx-auto w-full max-w-6xl rounded-[26px] border-2 border-zinc-900 bg-[#f4eadf] p-4 shadow-[5px_5px_0_#00000012]">
            <StepIndicator currentStep={2} />
            </div>
        </section>
        {/* Top bar */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] tracking-[0.28em] uppercase text-zinc-700">
              Outfit rating
            </div>
            <h1 className="mt-1 text-3xl sm:text-4xl leading-[0.95] tracking-[-0.02em] [font-family:'Bodoni Moda','Didot','Bodoni MT',ui-serif,serif] font-semibold">
              Result
            </h1>
            <div className="mt-2 text-sm text-zinc-700">
              Target vibe:{" "}
              <span className="text-zinc-900 font-medium">
                {style?.name ?? styleId}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => router.push(`/camera/${styleId}`)}
            className="h-11 rounded-full px-6 border-2 border-zinc-900 bg-[#f7f1ea] text-zinc-900 hover:bg-[#eee2d5] shadow-[2px_2px_0_#00000012]"
          >
            Back
          </Button>
        </div>
        
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: image */}
          <div className="lg:col-span-5">
            <div className="rounded-[22px] border-2 border-zinc-900 bg-[#f4eadf] shadow-[4px_4px_0_#00000012] overflow-hidden">
              {imageDataUrl ? (
                <img
                  src={imageDataUrl}
                  alt="Captured"
                  className="w-full aspect-[3/4] object-cover bg-zinc-950"
                />
              ) : (
                <div className="w-full aspect-[3/4] bg-[#eee2d5]" />
              )}
              <div className="px-5 py-4 border-t-2 border-zinc-900/15">
                <div className="text-[10px] tracking-[0.28em] uppercase text-zinc-700">
                  Photo
                </div>
                <div className="mt-1 text-sm text-zinc-800">
                
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-[18px] border-2 border-zinc-900 bg-[#f7f1ea] shadow-[3px_3px_0_#00000010] px-5 py-4">
                <div className="text-[10px] tracking-[0.28em] uppercase text-zinc-700">
                  Error
                </div>
                <div className="mt-1 text-sm text-zinc-900">{error}</div>
              </div>
            )}

            {!result && (
              <div className="mt-4">
                <Button
                  onClick={handleRate}
                  disabled={loading || !imageDataUrl}
                  className="h-12 w-full rounded-full border-2 border-zinc-900 bg-[#e7dccf] text-zinc-900 hover:bg-[#dfd2c4] shadow-[3px_3px_0_#00000014] disabled:opacity-60"
                >
                  {loading ? "Rating..." : "Rate my fit"}
                </Button>

                <div className="mt-3 text-xs text-zinc-700">
                </div>
              </div>
            )}
          </div>

          {/* Right: results */}
          <div className="lg:col-span-7 space-y-5">
            {result && (
              <>
                {/* Summary card (no scores shown) */}
                <div className="rounded-[22px] border-2 border-zinc-900 bg-[#f4eadf] shadow-[4px_4px_0_#00000012] p-5">
                  <div className="text-[10px] tracking-[0.28em] uppercase text-zinc-700">
                    Overview
                  </div>

                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-[18px] border-2 border-zinc-900/70 bg-[#f7f1ea] px-4 py-3 shadow-[2px_2px_0_#00000010]">
                      <div className="text-[10px] tracking-[0.26em] uppercase text-zinc-700">
                        Detected
                      </div>
                      <div className="mt-1 text-sm font-medium text-zinc-900">
                        {result.detected_style}
                      </div>
                    </div>

                    <div className="rounded-[18px] border-2 border-zinc-900/70 bg-[#f7f1ea] px-4 py-3 shadow-[2px_2px_0_#00000010]">
                      <div className="text-[10px] tracking-[0.26em] uppercase text-zinc-700">
                        Top match
                      </div>
                      <div className="mt-1 text-sm font-medium text-zinc-900">
                        {result.top_match ? "Yes" : "No"}
                      </div>
                    </div>

                    <div className="rounded-[18px] border-2 border-zinc-900/70 bg-[#f7f1ea] px-4 py-3 shadow-[2px_2px_0_#00000010]">
                      <div className="text-[10px] tracking-[0.26em] uppercase text-zinc-700">
                        Bottom match
                      </div>
                      <div className="mt-1 text-sm font-medium text-zinc-900">
                        {result.bottom_match ? "Yes" : "No"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Why */}
                <div className="rounded-[22px] border-2 border-zinc-900 bg-[#f4eadf] shadow-[4px_4px_0_#00000012] p-5">
                  <div className="text-[10px] tracking-[0.28em] uppercase text-zinc-700">
                    Notes
                  </div>
                  <h2 className="mt-1 text-xl leading-tight tracking-tight [font-family:'Bodoni Moda','Didot','Bodoni MT',ui-serif,serif] font-semibold">
                    Why it reads that way
                  </h2>

                  <ul className="mt-3 space-y-2 text-sm text-zinc-900">
                    {result.reasons.map((r, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="mt-2 h-[5px] w-[5px] rounded-full bg-zinc-900/70 shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* How to match better */}
                <div className="rounded-[22px] border-2 border-zinc-900 bg-[#f4eadf] shadow-[4px_4px_0_#00000012] p-5">
                  <div className="text-[10px] tracking-[0.28em] uppercase text-zinc-700">
                    Adjustments
                  </div>
                  <h2 className="mt-1 text-xl leading-tight tracking-tight [font-family:'Bodoni Moda','Didot','Bodoni MT',ui-serif,serif] font-semibold">
                    How to match better
                  </h2>

                  <ul className="mt-3 space-y-2 text-sm text-zinc-900">
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="mt-2 h-[5px] w-[5px] rounded-full bg-zinc-900/70 shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={() => router.push(`/suggestions/${styleId}`)}
                  className="h-12 w-full rounded-full border-2 border-zinc-900 bg-[#e7dccf] text-zinc-900 hover:bg-[#dfd2c4] shadow-[3px_3px_0_#00000014]"
                >
                  See suggested fits
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
