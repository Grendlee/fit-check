"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );

  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<number | null>(null);

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
      if (countdownRef.current) window.clearInterval(countdownRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const capturePhoto = useCallback(() => {
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
  }, []);

  const startCountdownCapture = () => {
    if (isLoading || photo) return;
    if (countdown !== null) return;

    if (countdownRef.current) window.clearInterval(countdownRef.current);

    setCountdown(4);

    countdownRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;

        if (prev <= 1) {
          window.clearInterval(countdownRef.current!);
          countdownRef.current = null;

          setTimeout(() => {
            setCountdown(null);
            capturePhoto();
          }, 150);

          return 0;
        }

        return prev - 1;
      });
    }, 1000);
  };

  const retakePhoto = () => {
    setPhoto(null);
    setCountdown(null);
    if (countdownRef.current) window.clearInterval(countdownRef.current);
    countdownRef.current = null;
    startCamera();
  };

  const toggleCamera = () => {
    if (countdown !== null) return;
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const confirmPhoto = () => {
    if (!photo) return;

    sessionStorage.setItem("fitcheck:capture", photo);
    router.push(`/rating/${styleId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f4eadf] text-zinc-900">
      {/* subtle paper dots */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.12] bg-[radial-gradient(#000_0.8px,transparent_0)] [background-size:22px_22px]" />

      {/* Header (thinner) */}
      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10"
      >
        <div className="mx-auto w-full max-w-6xl px-6 pt-3">
          <div className="rounded-[18px] border-2 border-zinc-900 bg-[#f4eadf] shadow-[3px_3px_0_#00000012]">
            <div className="px-4 py-1.5 flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/")}
                className="h-10 w-10 rounded-full border-2 border-zinc-900 bg-[#f7f1ea] hover:bg-[#eee2d5] text-zinc-900 shadow-[2px_2px_0_#00000012]"
                disabled={countdown !== null}
              >
                <X className="w-5 h-5" />
              </Button>

              <div className="text-center">
                <div className="text-[9px] tracking-[0.28em] uppercase text-zinc-700">
                  Target vibe
                </div>
                <h2 className="mt-0.5 text-[15px] font-semibold capitalize tracking-tight [font-family:'Bodoni Moda','Didot','Bodoni MT',ui-serif,serif]">
                  {styleName}
                </h2>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCamera}
                className="h-10 w-10 rounded-full border-2 border-zinc-900 bg-[#f7f1ea] hover:bg-[#eee2d5] text-zinc-900 shadow-[2px_2px_0_#00000012]"
                disabled={!!photo || countdown !== null}
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            </div>

            {/* Make indicator thinner without touching its logic */}
            <div className="px-3 pb-1 -mt-1 scale-[0.92] origin-top">
              <StepIndicator currentStep={2} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Camera / Photo (more vertical room) */}
      <div className="flex-1 relative overflow-hidden pt-[10px]">
        {isLoading && !photo && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#eee2d5]">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-700" />
          </div>
        )}

        {photo ? (
          <motion.img
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 0.95 }}
            src={photo}
            alt="Captured outfit"
            className="w-full h-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={() => setIsLoading(false)}
            className="w-full h-full object-contain bg-zinc-950 border-y-2 border-zinc-900"
          />
        )}

        {!photo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative flex flex-col items-center">
              <div className="mb-2 text-[10px] tracking-[0.28em] uppercase text-white/75">
                Align your body
              </div>
              <img
                src="/s3.png"
                alt="Align your body"
                className="h-[82vh] max-h-[880px] w-auto object-contain opacity-35"
              />
            </div>
          </div>
        )}

        {/* Countdown overlay */}
        <AnimatePresence>
          {countdown !== null && !photo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="rounded-full bg-[#f4eadf] px-9 py-5 border-2 border-zinc-900 shadow-[6px_6px_0_#00000018]">
                <motion.div
                  key={countdown}
                  initial={{ scale: 0.75, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.95 }}
                  className="text-6xl font-bold text-white text-center"
                >
                  {countdown === 0 ? "" : countdown}
                </motion.div>
                {countdown === 0 && (
                  <div className="text-[9px] tracking-[0.28em] uppercase text-zinc-700 text-center">
                    capturing
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls (thinner) */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pb-4 pt-2"
      >
        <div className="mx-auto w-full max-w-6xl rounded-[20px] border-2 border-zinc-900 bg-[#f4eadf] shadow-[4px_4px_0_#00000012] px-4 py-3 flex items-center justify-center gap-3">
          {photo ? (
            <>
              <Button
                variant="outline"
                size="lg"
                onClick={retakePhoto}
                className="h-12 rounded-full px-7 border-2 border-zinc-900 bg-[#f7f1ea] text-zinc-900 hover:bg-[#eee2d5] shadow-[2px_2px_0_#00000012]"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Retake
              </Button>

              <Button
                size="lg"
                onClick={confirmPhoto}
                className="h-12 rounded-full px-7 border-2 border-zinc-900 bg-[#e7dccf] text-zinc-900 hover:bg-[#dfd2c4] shadow-[2px_2px_0_#00000012]"
              >
                <Check className="w-5 h-5 mr-2" />
                Use Photo
              </Button>
            </>
          ) : (
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={startCountdownCapture}
              disabled={isLoading || countdown !== null}
              className="h-12 px-7 rounded-full border-2 border-zinc-900 bg-[#e7dccf] shadow-[3px_3px_0_#00000014] hover:bg-[#dfd2c4] disabled:opacity-50 disabled:shadow-none disabled:hover:bg-[#e7dccf] transition flex items-center gap-3"
            >
              <Camera className="w-5 h-5" />
              <span className="text-sm font-black tracking-wide uppercase">
                Capture
              </span>
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
