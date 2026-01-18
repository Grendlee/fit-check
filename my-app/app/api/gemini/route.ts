import { NextRequest, NextResponse } from "next/server";
import { geminiModel } from "@/lib/gemini";

// Required for long-running image generation tasks
export const maxDuration = 60; 

export async function POST(request: NextRequest) {
  try {
    const { prompt, bodyImage, clothingImage } = await request.json();
    
    // Validate that all required data is present
    if (!prompt || !bodyImage || !clothingImage) {
      return NextResponse.json(
        { error: "Prompt and both base64 images are required" }, 
        { status: 400 }
      );
    }
    
    // Call the Gemini 3 model with multimodal parts
    const result = await geminiModel.generateTryOn(prompt, bodyImage, clothingImage);
    
    // Gemini 3 returns a 'candidates' array with 'content.parts'
    const parts = result.candidates?.[0]?.content?.parts;
    
    // Find the part containing the actual generated image data
    const imagePart = parts?.find(p => p.inlineData);
    const textPart = parts?.find(p => p.text);
    
    if (imagePart?.inlineData) {
      return NextResponse.json({ 
        success: true,
        image: imagePart.inlineData.data, // This is the base64 image string
        description: textPart?.text || "Try-on generated" 
      });
    }
    
    // Handle cases where the model only returns text
    return NextResponse.json({ 
      error: "AI returned text but no image. Ensure your region and model support image generation." 
    }, { status: 500 });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}