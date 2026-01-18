"use client";

import { useParams } from "next/navigation";
import { CameraView } from "@/components/CameraView";

export default function CameraPage() {
  const params = useParams();
  const styleId = params?.styleId as string;

  return <CameraView styleId={styleId} />;
}
