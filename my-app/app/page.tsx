"use client";

import { motion } from "framer-motion";
import { styleCategories } from "@/data/styles";
import { StyleCard } from "@/components/StyleCard";
import { AddVibeCard } from "@/components/AddVibeCard";
import { StepIndicator } from "@/components/StepIndicator";
import { Shirt, Sparkles } from "lucide-react";
import RequireAuth from "@/components/RequireAuth";

export default function Home() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-[#f4eadf] text-zinc-900">
        {/* subtle paper grain */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.14] bg-[radial-gradient(#000_0.8px,transparent_0)] [background-size:22px_22px]" />

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative px-6 pt-6 pb-4"
        >
          <div className="mx-auto w-full max-w-6xl">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full border-2 border-zinc-900 bg-[#f4eadf] flex items-center justify-center shadow-[2px_2px_0_#00000012]">
                <Shirt className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <h1 className="text-2xl font-black tracking-tight [font-family:ui-serif,Georgia,serif]">
                  Fit Check
                </h1>
                <p className="text-sm text-zinc-700 [font-family:ui-serif,Georgia,serif]">
                  Choose a vibe. Match the look.
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-zinc-900/15" />
          </div>
        </motion.header>

        {/* Hero */}
        <section className="relative px-6 pt-10 pb-6">
          <div className="mx-auto w-full max-w-6xl text-center">
            <motion.h2
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[70px] sm:text-[92px] md:text-[110px] leading-[0.9] font-semibold
                text-zinc-900
                [font-family:'Didot','Bodoni MT','Playfair Display',ui-serif,serif]
              "
            >
              CHOOSE A VIBE
            </motion.h2>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-zinc-700 [font-family:'Didot','Bodoni MT','Playfair Display',ui-serif,serif]">
              Pick the style you’re aiming for — we’ll rate your outfit against
              that vibe and suggest small tweaks to get closer.
            </p>
          </div>
        </section>

        {/* Step Indicator */}
        <section className="relative px-6 pb-8">
          <div className="mx-auto w-full max-w-6xl rounded-[26px] border-2 border-zinc-900 bg-[#f4eadf] p-4 shadow-[5px_5px_0_#00000012]">
            <StepIndicator currentStep={1} />
          </div>
        </section>

        {/* Style Grid */}
        <section className="relative px-6 pb-14">
          <div className="mx-auto w-full max-w-6xl">
            <div className="mb-5 flex items-center gap-2">
              <div className="h-9 w-9 rounded-full border-2 border-zinc-900 bg-[#f7f1ea] flex items-center justify-center shadow-[2px_2px_0_#00000012]">
                <Sparkles className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-black tracking-[0.18em] uppercase">
                Vibes
              </h2>
            </div>

            <div className="rounded-[30px] border-2 border-zinc-900 bg-[#f4eadf] p-5 shadow-[7px_7px_0_#00000012] sm:p-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {styleCategories.map((style, index) => (
                  <StyleCard key={style.id} style={style} index={index} />
                ))}
                <AddVibeCard index={styleCategories.length} />
              </div>
            </div>
          </div>
        </section>

        {/* keep as-is but hidden */}
        <div className="sr-only">Home</div>
      </div>
    </RequireAuth>
  );
}
