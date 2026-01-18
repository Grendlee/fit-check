'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { geminiModel } from '@/lib/gemini'

export default function VirtualTryOnPage() {
  const [step, setStep] = useState<'camera' | 'upload' | 'result'>('camera')
  const [bodyImage, setBodyImage] = useState<string | null>(null)
  const [clothingImage, setClothingImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // --- Camera & Capture logic (Standard) ---
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (err) { setError("Camera access denied.") }
  }, [])

  useEffect(() => {
    if (step === 'camera') startCamera()
    return () => streamRef.current?.getTracks().forEach(t => t.stop())
  }, [step, startCamera])

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    setBodyImage(canvas.toDataURL('image/jpeg'))
    setStep('upload')
    setCountdown(null)
  }, [])

  useEffect(() => {
    if (countdown === 0) {
      setTimeout(takePhoto, 150)
    } else if (countdown && countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [countdown, takePhoto])

  // --- AI Generation Logic ---
  const handleTryOn = async () => {
    if (!bodyImage || !clothingImage) return
    setIsAnalyzing(true); setStep('result'); setError(null)
    
    try {
      const prompt = "Generate a photorealistic image of this person wearing this clothing item."
      const bodyB64 = bodyImage.split(',')[1]
      const garmentB64 = clothingImage.split(',')[1]

      const response = await geminiModel.generateTryOn(prompt, bodyB64, garmentB64)
      
      // Iterate through parts to find the image part
      const parts = response.candidates?.[0]?.content?.parts
      const imagePart = parts?.find(p => p.inlineData)

      if (imagePart?.inlineData) {
        setGeneratedImage(`data:image/jpeg;base64,${imagePart.inlineData.data}`)
      } else {
        throw new Error("AI only returned text. Check API region/billing.")
      }
    } catch (err: any) {
      setError(err.message)
    } finally { setIsAnalyzing(false) }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center">
      {step === 'camera' && (
        <div className="relative">
          <video ref={videoRef} autoPlay playsInline className="rounded-3xl border-2 border-white/10" />
          {countdown !== null && <div className="absolute inset-0 flex items-center justify-center text-8xl font-bold">{countdown}</div>}
          <button onClick={() => setCountdown(3)} className="mt-4 w-full py-4 bg-white text-black rounded-xl font-bold">START TIMER</button>
        </div>
      )}

      {step === 'upload' && (
        <div className="w-full max-w-md space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {bodyImage && <img src={bodyImage} className="rounded-xl" alt="Person" />}
            <div className="bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-xl flex items-center justify-center min-h-[150px]">
              <input type="file" onChange={(e) => {
                const f = e.target.files?.[0]; if (f) {
                  const r = new FileReader(); r.onload = (ev) => setClothingImage(ev.target?.result as string); r.readAsDataURL(f)
                }
              }} />
            </div>
          </div>
          <button onClick={handleTryOn} className="w-full py-4 bg-blue-600 rounded-xl font-bold">GENERATE</button>
        </div>
      )}

      {step === 'result' && (
        <div className="w-full max-w-md text-center">
          {isAnalyzing ? <p className="animate-pulse">Tailoring Outfit...</p> : (
            <>
              {/* Conditional rendering prevents empty src errors */}
              {generatedImage ? (
                <img src={generatedImage} className="w-full rounded-2xl" alt="AI Generated Result" />
              ) : (
                <div className="h-64 bg-zinc-800 rounded-2xl flex items-center justify-center">No image generated.</div>
              )}
            </>
          )}
          {error && <p className="text-red-500 mt-4">{error}</p>}
          <button onClick={() => setStep('camera')} className="mt-4 underline">Restart</button>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}