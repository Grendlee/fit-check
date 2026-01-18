# Fill attributes column for shirts and pants tables using Gemini
# Usage: python fillAttributes.py

import base64
import json
import requests
from google import genai
from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv('.env.local')

# Initialize clients
supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
supabase = create_client(supabase_url, supabase_key)

gemini_client = genai.Client()

def analyze_clothing(image_url: str):
    """Download image and analyze with Gemini"""

    # Download image
    response = requests.get(image_url)
    if response.status_code != 200:
        print(f"Failed to download: {image_url}")
        return None

    image_data = base64.b64encode(response.content).decode("utf-8")

    # Determine mime type
    if image_url.lower().endswith(".png"):
        mime_type = "image/png"
    elif image_url.lower().endswith(".webp"):
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

    try:
        response = gemini_client.models.generate_content(
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

        # Parse JSON response
        result_text = response.text.strip()
        # Remove markdown code blocks if present
        if result_text.startswith("```"):
            result_text = result_text.split("\n", 1)[1]
            result_text = result_text.rsplit("```", 1)[0]

        return json.loads(result_text)
    except Exception as e:
        print(f"Error analyzing image: {e}")
        return None

def process_table(table_name: str):
    """Process all rows in a table that have null attributes"""

    print(f"\n=== Processing {table_name} table ===")

    # Get rows where attributes is null
    result = supabase.table(table_name).select("*").is_("attributes", "null").execute()

    rows = result.data
    print(f"Found {len(rows)} rows without attributes")

    for row in rows:
        print(f"\nProcessing: {row.get('og_file_name', row['id'])}")

        image_url = row['image_url']
        if not image_url:
            print("  No image_url, skipping")
            continue

        # Analyze with Gemini
        attributes = analyze_clothing(image_url)

        if attributes:
            # Update the row
            supabase.table(table_name).update({
                "attributes": attributes
            }).eq("id", row["id"]).execute()

            print(f"  Updated: {attributes.get('type')} - {attributes.get('color')} - {attributes.get('style')}")
        else:
            print("  Failed to analyze")

def main():
    print("Starting attribute fill...")

    # Process both tables
    process_table("shirts")
    process_table("pants")

    print("\n=== Done! ===")

if __name__ == "__main__":
    main()
