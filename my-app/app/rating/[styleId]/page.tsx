"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { styleCategories } from "@/data/styles";
import { styleRubrics } from "@/data/styleRubrics";
import { geminiModel } from "@/lib/gemini";

type RatingResult = {
  target_style: string;
  detected_style: string;
  match_score: number; // 0-100
  confidence: number;  // 0-1
  reasons: string[];
  suggestions: string[];
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
  return `
Signature items:
- ${rubric.signature_items?.join("\n- ") ?? ""}

Avoid:
- ${rubric.avoid?.join("\n- ") ?? ""}

Palette & materials:
- ${rubric.palette_materials?.join("\n- ") ?? ""}

Silhouette:
- ${rubric.silhouette?.join("\n- ") ?? ""}
`.trim();
}

export default function RatingPage() {
  const router = useRouter();
  const params = useParams();

  // ✅ works whether your folder is [styleid] or [styleId]
  const styleId =
    ((params as any)?.styleid as string) ||
    ((params as any)?.styleId as string) ||
    "";

  const style = useMemo(
    () => styleCategories.find((s) => s.id === styleId),
    [styleId]
  );

  // ✅ tech-bro -> tech_bro to match rubric keys
  const rubricKey = useMemo(() => {
    if (!styleId) return "";
    return styleId.replace(/-/g, "_");
  }, [styleId]);

  const rubric = useMemo(() => {
    return (styleRubrics as any)[rubricKey];
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
    setError(null);
    setResult(null);

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
- Suggestions must explicitly reference rubric items (e.g., replace X with a rubric signature item).

Now analyze the image and output JSON only.
`.trim();

      const resp = await geminiModel.generateVisionRating(prompt, base64);
      const text = getGeminiText(resp);
      if (!text) throw new Error("Empty model response.");

      const json = extractJson(text) as RatingResult;

      // ✅ guard so UI never breaks
      json.target_style = styleId;
      if (!Array.isArray(json.reasons)) json.reasons = [];
      if (!Array.isArray(json.suggestions)) json.suggestions = [];

      setResult(json);
    } catch (e: any) {
      setError(e?.message ?? "Rating failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">Outfit Rating</h1>
          <p className="text-sm text-muted-foreground">
            Target: {style?.name ?? styleId}
          </p>
          {/* keep for debugging; remove later */}
          <p className="text-xs text-muted-foreground">
            Rubric key: {rubricKey || "(none)"}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push(`/camera/${styleId}`)}>
          Retake
        </Button>
      </div>

      {imageDataUrl && (
        <img
          src={imageDataUrl}
          alt="Captured"
          className="w-full rounded-xl border border-white/10 mb-4"
        />
      )}

      {error && <div className="text-sm text-red-500 mb-3">{error}</div>}

      {!result ? (
        <Button className="w-full" onClick={handleRate} disabled={loading || !imageDataUrl}>
          {loading ? "Rating..." : "Rate my fit"}
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 p-4">
            <div className="text-4xl font-bold">{result.match_score}/100</div>
            <div className="text-sm text-muted-foreground">
              Confidence: {Math.round(result.confidence * 100)}%
            </div>
            <div className="text-sm text-muted-foreground">
              Detected: {result.detected_style}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 p-4">
            <div className="font-semibold mb-2">Why</div>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {result.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 p-4">
            <div className="font-semibold mb-2">How to match better</div>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {result.suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>

          <Button className="w-full" onClick={() => router.push(`/suggestions/${styleId}`)}>
            See suggested fits
          </Button>
        </div>
      )}
    </div>
  );
}
