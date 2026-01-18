"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, RotateCcw, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { styleCategories } from "@/data/styles";
import { StepIndicator } from "@/components/StepIndicator";

export function CameraView({ styleId }: { styleId: string }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  const style = styleCategories.find((s) => s.id === styleId);
  const styleName =
    style?.name ||
    (styleId?.startsWith("custom-")
      ? styleId.replace("custom-", "").replace(/-/g, " ")
      : "Custom");

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    try {
      if (stream) stream.getTracks().forEach((t) => t.stop());

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: false,
      });

      setStream(newStream);
      if (videoRef.current) videoRef.current.srcObject = newStream;
    } catch (error) {
      console.error("Camera error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, stream]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    setPhoto(imageData);
  };

  const retakePhoto = () => setPhoto(null);

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const confirmPhoto = () => {
    if (!photo) return;

    // ✅ temp in-tab storage ONLY (not uploaded anywhere)
    sessionStorage.setItem("fitcheck:capture", photo);

    // ✅ go to rating
    router.push(`/rating/${styleId}`);
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 left-0 right-0 z-10 glass-panel"
      >
        <div className="p-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>

          <div className="text-center">
            <span className="text-2xl">{style?.emoji || "✨"}</span>
            <h2 className="font-display font-semibold text-sm capitalize">{styleName}</h2>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCamera}
            className="rounded-full"
            disabled={!!photo}
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>
        <StepIndicator currentStep={2} />
      </motion.div>

      {/* Camera / Photo */}
      <div className="flex-1 relative overflow-hidden">
        {isLoading && !photo && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {photo ? (
          <motion.img
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            src={photo}
            alt="Captured outfit"
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={() => setIsLoading(false)}
            className="w-full h-full object-contain bg-black"
          />
        )}

        {!photo && (
          <div className="absolute inset-40 bottom-80 translate-y-40 flex items-center justify-center pointer-events-none">
            <img src="/s3.png" alt="Align your body" className="scale-1 h-[250%] w-auto object-contain" />
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 flex items-center justify-center gap-6"
      >
        {photo ? (
          <>
            <Button variant="outline" size="lg" onClick={retakePhoto} className="rounded-full px-8">
              <RotateCcw className="w-5 h-5 mr-2" />
              Retake
            </Button>
            <Button size="lg" onClick={confirmPhoto} className="rounded-full px-8 bg-primary hover:bg-primary/90">
              <Check className="w-5 h-5 mr-2" />
              Use Photo
            </Button>
          </>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={capturePhoto}
            disabled={isLoading}
            className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg disabled:opacity-50"
          >
            <div className="w-16 h-16 rounded-full border-4 border-primary-foreground flex items-center justify-center">
              <Camera className="w-8 h-8 text-primary-foreground" />
            </div>
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
