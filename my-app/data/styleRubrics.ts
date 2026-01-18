export const styleRubrics = {
  tech_bro: {
    signature_items: [
      "Patagonia or North Face vest",
      "quarter zip or performance tee",
      "slim chinos or dark jeans",
      "Allbirds or minimal sneakers",
      "simple backpack or tote"
    ],
    avoid: [
      "loud graphics",
      "baggy streetwear",
      "formal tailoring"
    ],
    palette_materials: [
      "neutral colors (gray, navy, black)",
      "performance or tech fabrics",
      "clean basics"
    ],
    silhouette: [
      "clean",
      "fitted-to-relaxed",
      "light layering"
    ]
  },

  techwear: {
    signature_items: [
      "technical jacket or shell",
      "cargo or tactical pants",
      "utility straps or pockets",
      "futuristic sneakers or boots"
    ],
    avoid: [
      "bright colors",
      "classic tailoring",
      "soft casual knits"
    ],
    palette_materials: [
      "black, charcoal, dark gray",
      "nylon, gore-tex, synthetic fabrics"
    ],
    silhouette: [
      "structured",
      "layered",
      "functional"
    ]
  },

  teacher: {
    signature_items: [
      "cardigan or knit sweater",
      "blouse or button-down",
      "straight-leg pants or midi skirt",
      "comfortable flats or loafers"
    ],
    avoid: [
      "revealing silhouettes",
      "heavy streetwear",
      "overly formal suits"
    ],
    palette_materials: [
      "soft neutrals",
      "earth tones",
      "cotton or knit fabrics"
    ],
    silhouette: [
      "approachable",
      "modest",
      "comfortable"
    ]
  },

  baggy: {
    signature_items: [
      "oversized t-shirt or hoodie",
      "wide-leg pants or cargos",
      "chunky sneakers",
      "beanie or cap"
    ],
    avoid: [
      "slim-fit tailoring",
      "formal shoes",
      "tight silhouettes"
    ],
    palette_materials: [
      "muted or monochrome tones",
      "cotton, fleece, denim"
    ],
    silhouette: [
      "oversized",
      "relaxed",
      "streetwear-forward"
    ]
  },

  business_formal: {
    signature_items: [
      "tailored suit jacket",
      "dress shirt or blouse",
      "dress pants or pencil skirt",
      "oxfords or heels"
    ],
    avoid: [
      "casual sneakers",
      "denim",
      "oversized streetwear"
    ],
    palette_materials: [
      "navy, black, gray",
      "wool, structured fabrics"
    ],
    silhouette: [
      "tailored",
      "structured",
      "polished"
    ]
  },

  ted_talk: {
    signature_items: [
      "smart blazer or jacket",
      "simple top",
      "dark jeans or trousers",
      "clean sneakers or boots"
    ],
    avoid: [
      "flashy branding",
      "extreme streetwear",
      "overly formal suits"
    ],
    palette_materials: [
      "neutral or warm tones",
      "soft structure"
    ],
    silhouette: [
      "intentional",
      "confident",
      "approachable"
    ]
  },

  goth: {
    signature_items: [
      "black layered clothing",
      "leather or lace elements",
      "boots",
      "dark accessories"
    ],
    avoid: [
      "bright colors",
      "athleisure",
      "preppy basics"
    ],
    palette_materials: [
      "black, charcoal, deep red",
      "leather, mesh, velvet"
    ],
    silhouette: [
      "dramatic",
      "layered",
      "expressive"
    ]
  },

  pinterest_girly: {
    signature_items: [
      "cardigans or blouses",
      "skirts or relaxed jeans",
      "hair accessories",
      "mary janes or ballet flats"
    ],
    avoid: [
      "heavy streetwear",
      "technical fabrics",
      "harsh color blocking"
    ],
    palette_materials: [
      "pastels",
      "cream and soft browns",
      "knits and flowy fabrics"
    ],
    silhouette: [
      "soft",
      "feminine",
      "curated"
    ]
  },

  preppy: {
    signature_items: [
      "collared shirt",
      "sweater vest or blazer",
      "pleated skirt or chinos",
      "loafers"
    ],
    avoid: [
      "distressed clothing",
      "streetwear bagginess",
      "athletic sneakers"
    ],
    palette_materials: [
      "navy, cream, plaid",
      "cotton, wool"
    ],
    silhouette: [
      "neat",
      "structured",
      "classic"
    ]
  },

  rapper: {
    signature_items: [
      "statement outerwear",
      "graphic tee or hoodie",
      "baggy pants",
      "bold sneakers",
      "chains or accessories"
    ],
    avoid: [
      "minimalist basics",
      "formal tailoring",
      "muted outfits without accents"
    ],
    palette_materials: [
      "black, bold colors, metallics",
      "denim, leather"
    ],
    silhouette: [
      "bold",
      "confident",
      "attention-grabbing"
    ]
  }
};
export type StyleRubricKey = keyof typeof styleRubrics;
