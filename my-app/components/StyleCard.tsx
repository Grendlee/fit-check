"use client";

import { motion } from "framer-motion";
import { StyleCategory } from "@/data/styles";
import { useRouter } from "next/navigation";

interface StyleCardProps {
  style: StyleCategory;
  index: number;
}

export function StyleCard({ style, index }: StyleCardProps) {
  const router = useRouter();

  const palettes = [
    "bg-[#e7d9b8]", // sand
    "bg-[#cfd8cc]", // sage
    "bg-[#e2c2bc]", // dusty rose
    "bg-[#d7d0e4]", // lavender
    "bg-[#e4d0bf]", // clay
    "bg-[#d6d6cf]", // stone
  ];

  const bg = palettes[index % palettes.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      onClick={() => router.push(`/camera/${style.id}`)}
      className={[
        "cursor-pointer select-none",
        "rounded-[22px] border-2 border-zinc-900 p-4",
        "shadow-[4px_4px_0_#00000014] hover:shadow-[6px_6px_0_#00000016]",
        "transition-all duration-150",
        bg,
      ].join(" ")}
    >
      <div className="flex flex-col gap-2">
        {/* Label / Title */}
        <h3 className="text-sm font-black tracking-wide uppercase">
          {style.name}
        </h3>

        {/* Divider */}
        <div className="h-px w-10 bg-zinc-900/40" />

        {/* Description */}
        <p className="text-xs leading-relaxed text-zinc-700 [font-family:ui-serif,Georgia,serif] line-clamp-3">
          {style.description}
        </p>
      </div>
    </motion.div>
  );
}
