"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

const steps = [
  { number: 1, label: "Choose Vibe" },
  { number: 2, label: "Capture Fit" },
  { number: 3, label: "Suggested Fits" },
];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {steps.map((step, index) => {
        const isDone = step.number < currentStep;
        const isCurrent = step.number === currentStep;

        return (
          <div key={step.number} className="flex items-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.08 }}
              className="flex items-center gap-2"
            >
              <div
                className={[
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-black",
                  "border-2 border-zinc-900 shadow-[2px_2px_0_#00000012] transition-all",
                  isDone
                    ? "bg-[#f7f1ea]"
                    : isCurrent
                    ? "bg-[#e7dccf]"
                    : "bg-[#f4eadf] opacity-70",
                ].join(" ")}
              >
                {isDone ? <Check className="w-4 h-4" /> : step.number}
              </div>

              <span
                className={[
                  "text-xs hidden sm:block",
                  "tracking-wide [font-family:ui-serif,Georgia,serif]",
                  isCurrent ? "text-zinc-900" : "text-zinc-600",
                ].join(" ")}
              >
                {step.label}
              </span>
            </motion.div>

            {index < steps.length - 1 && (
              <div
                className={[
                  "w-8 sm:w-12 h-[2px] mx-2 transition-colors",
                  isDone ? "bg-zinc-900/60" : "bg-zinc-900/15",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
