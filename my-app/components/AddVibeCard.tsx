"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AddVibeCardProps {
  index: number;
}

export function AddVibeCard({ index }: AddVibeCardProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [vibeName, setVibeName] = useState("");

  const handleSubmit = () => {
    if (vibeName.trim()) {
      router.push(
        `/camera/custom-${vibeName.toLowerCase().replace(/\s+/g, "-")}`
      );
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.985 }}
          className="cursor-pointer select-none"
        >
          <div className="rounded-[22px] border-2 border-dashed border-zinc-900/50 bg-[#f7f1ea] p-4 shadow-[4px_4px_0_#00000012] hover:shadow-[6px_6px_0_#00000014] transition">
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-black tracking-wide uppercase">
                Add a Vibe
              </h3>
              <div className="h-px w-10 bg-zinc-900/30" />
              <p className="text-xs text-zinc-700 [font-family:ui-serif,Georgia,serif]">
                Create a custom style target
              </p>
            </div>
          </div>
        </motion.div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-[#f4eadf] border-2 border-zinc-900 shadow-[6px_6px_0_#00000015]">
        <DialogHeader>
          <DialogTitle className="font-black tracking-wide">
            Create a Vibe
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <Input
            placeholder="e.g. Parisian Minimal"
            value={vibeName}
            onChange={(e) => setVibeName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="border-zinc-900 bg-[#faf7f3]"
          />
          <Button
            onClick={handleSubmit}
            disabled={!vibeName.trim()}
            className="w-full border-2 border-zinc-900 bg-[#e7dccf] text-zinc-900 hover:bg-[#dfd2c4]"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
