# Analyze clothing images with Gemini
# Usage: python analyzeClothing.py shirt1.jpg

import sys
import base64
from google import genai
from dotenv import load_dotenv

load_dotenv('.env.local')

def analyze_clothing(image_path: str):
    client = genai.Client()

    # Read and encode the image
    with open(image_path, "rb") as f:
        image_data = base64.b64encode(f.read()).decode("utf-8")

    # Determine mime type
    if image_path.lower().endswith(".png"):
        mime_type = "image/png"
    elif image_path.lower().endswith(".webp"):
        mime_type = "image/webp"
    else:
        mime_type = "image/jpeg"

    prompt = """Analyze this clothing item and return a JSON object with these attributes.
Infer based on visible design cues. Use null if cannot determine.

{
  "type": "t-shirt/shirt/pants/jeans/jacket/hoodie/sweater/shorts/skirt/dress/shoes/hat/etc",
  "gender_target": "male/female/unisex",
  "gender_cues": "brief explanation (e.g. 'pink color, cropped length' or 'neutral oversized fit')",
  "color": "primary color",
  "colors": ["all", "visible", "colors"],
  "color_tone": "pastel/muted/bright/neutral/dark",
  "pattern": "solid/striped/plaid/floral/graphic/camo/etc",
  "style": "casual/formal/athletic/streetwear/minimalist/vintage/etc",
  "material": "cotton/denim/leather/polyester/wool/etc or null",
  "fit": "slim/regular/relaxed/oversized",
  "length": "cropped/regular/longline or null",
  "neckline": "crew/v-neck/scoop/collared/hooded or null (for tops)",
  "rise": "low/mid/high or null (for bottoms)",
  "leg_style": "skinny/slim/straight/wide/flared or null (for pants)",
  "hem_style": "raw/hemmed/cuffed/stacked or null (for pants)",
  "details": ["cropped", "distressed", "ribbed", "pleated", "elastic-waist", "etc"] or [],
  "brand": "brand name if visible, otherwise null",
  "description": "one concise sentence"
}

Return ONLY valid JSON, no markdown or extra text."""

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=[
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": image_data
                        }
                    }
                ]
            }
        ]
    )

    return response.text

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python analyzeClothing.py <image_path>")
        sys.exit(1)

    image_path = sys.argv[1]
    result = analyze_clothing(image_path)
    print(result)
