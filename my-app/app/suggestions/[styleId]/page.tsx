"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "@/components/StepIndicator";
import { FitCard } from "@/components/FitCard";
import { FitFilterChat } from "@/components/FitFilterChat";
import { sampleFits } from "@/data/fits";
import { styleCategories } from "@/data/styles";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function SuggestedFitsPage() {
  const router = useRouter();
  const params = useParams();
  const styleId = params?.styleId as string;
  const [filterQuery, setFilterQuery] = useState("");

  const style = styleCategories.find((s) => s.id === styleId);

  // Filter fits based on query
  const filteredFits = useMemo(() => {
    let fits = sampleFits;

    // Filter by style if specified
    if (styleId && !styleId.startsWith("custom-")) {
      const styleFits = fits.filter((fit) => fit.style === styleId);
      if (styleFits.length > 0) {
        fits = styleFits;
      }
    }

    // Apply text filter
    if (filterQuery.trim()) {
      const query = filterQuery.toLowerCase();

      // Check for exclusion queries like "no hats" or "without glasses"
      const excludeMatch = query.match(/(?:no|without|remove)\s+(\w+)/i);
      if (excludeMatch) {
        const excludeTerm = excludeMatch[1].toLowerCase();
        fits = fits.filter((fit) => {
          const hasExcludedItem = fit.items.some(
            (item) =>
              (item.type.toLowerCase().includes(excludeTerm) ||
                item.name.toLowerCase().includes(excludeTerm) ||
                item.color.toLowerCase().includes(excludeTerm)) &&
              item.color !== "none"
          );
          return !hasExcludedItem;
        });
      }
      // Check for inclusion queries like "only black pants"
      else if (query.match(/(?:only|with)\s+/i)) {
        const includeMatch = query.match(/(?:only|with)\s+(.+)/i);
        if (includeMatch) {
          const searchTerms = includeMatch[1].toLowerCase();
          fits = fits.filter((fit) =>
            fit.items.some(
              (item) =>
                item.name.toLowerCase().includes(searchTerms) ||
                item.color.toLowerCase().includes(searchTerms) ||
                searchTerms.includes(item.color.toLowerCase()) ||
                searchTerms.includes(item.type.toLowerCase())
            )
          );
        }
      }
      // General search
      else {
        fits = fits.filter((fit) =>
          fit.items.some(
            (item) =>
              item.name.toLowerCase().includes(query) ||
              item.color.toLowerCase().includes(query) ||
              item.type.toLowerCase().includes(query)
          )
        );
      }
    }

    return fits;
  }, [styleId, filterQuery]);

  const handleFilter = (query: string) => {
    setFilterQuery(query);
  };

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
            onClick={() => router.push(`/camera/${styleId}`)}
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
                Suggested Fits
              </h1>
              <p className="text-xs text-muted-foreground">
                {style?.name || "Custom Vibe"} • {filteredFits.length} fits
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Step Indicator */}
      <StepIndicator currentStep={3} />

      {/* Carousel */}
      <div className="flex-1 px-4 pb-4">
        {filteredFits.length > 0 ? (
          <Carousel
            opts={{
              align: "center",
              loop: true,
            }}
            className="w-full max-w-md mx-auto"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {filteredFits.map((fit) => (
                <CarouselItem key={fit.id} className="pl-2 md:pl-4 basis-[85%]">
                  <FitCard fit={fit} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex items-center justify-center gap-4 mt-4">
              <CarouselPrevious className="static translate-y-0" />
              <span className="text-sm text-muted-foreground">
                Swipe to browse fits
              </span>
              <CarouselNext className="static translate-y-0" />
            </div>
          </Carousel>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex items-center justify-center text-center py-12"
          >
            <div>
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-muted-foreground">
                No fits match your filter. Try a different search!
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setFilterQuery("")}
              >
                Clear Filter
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Filter Chat */}
      <div className="px-4 pb-6">
        <FitFilterChat onFilter={handleFilter} />
      </div>
    </div>
  );
}
