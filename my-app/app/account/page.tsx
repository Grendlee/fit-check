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


            <div className="mt-5 border-t border-zinc-900/15" />
          </div>
        </motion.header>

        {/* Hero */}
        <section className="relative px-6 pt-10 pb-6">
          <div className="mx-auto w-full max-w-6xl text-center">
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-zinc-700 [font-family:'Didot','Bodoni MT','Playfair Display',ui-serif,serif]">
              Here are your account details:
            </p>
          </div>
        </section>

        {/* Style Grid */}
        <section className="relative px-6 pb-14">
          <div className="mx-auto w-full max-w-6xl">
            <div className="rounded-[30px] border-2 border-zinc-900 bg-[#f4eadf] p-5 shadow-[7px_7px_0_#00000012] sm:p-6">
                <div className="mb-5 flex items-center gap-2">
                    <div className="h-9 w-9 rounded-full border-2 border-zinc-900 bg-[#f7f1ea] flex items-center justify-center shadow-[2px_2px_0_#00000012]">
                        @
                    </div>
                    <h2 className="text-sm font-black tracking-[0.18em] uppercase">
                        email
                    </h2>
                </div>

                <div className="mb-5 flex items-center gap-2">
                    <div className="h-9 w-9 rounded-full border-2 border-zinc-900 bg-[#f7f1ea] flex items-center justify-center shadow-[2px_2px_0_#00000012]">
                        #
                    </div>
                    <h2 className="text-sm font-black tracking-[0.18em] uppercase">
                        phone number
                    </h2>
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
