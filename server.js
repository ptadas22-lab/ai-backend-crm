require("dotenv").config();
const axios = require("axios");
const express = require("express");
const cors = require("cors");
 
const app = express();
app.use(cors());
app.use(express.json());
 
// ── HuggingFace config ─────────────────────────────────
const HF_TOKEN = process.env.HF_TOKEN;
const HF_MODEL = process.env.HF_MODEL || "google/flan-t5-large";
const HF_URL   = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
 
const hasHfConfig = Boolean(HF_TOKEN && HF_TOKEN.trim() !== "");
 
if (!hasHfConfig) {
  console.log("⚠️ No HF token found — AI enhancement disabled");
}
 
async function generateWithHuggingFace(prompt) {
  if (!hasHfConfig) return "";
 
  const response = await axios.post(
    HF_URL,
    { inputs: prompt },
    {
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`
      }
    }
  );
 
  return response.data?.[0]?.generated_text || "";
}
 
// ══════════════════════════════════════════════════════
// POST /generate  →  return N business ideas
// ══════════════════════════════════════════════════════
app.post("/generate", async (req, res) => {
  try {
    const { budget, location, type, count } = req.body;
 
    if (!budget || !location || !type) {
      return res.status(400).json({ error: "Missing fields" });
    }
 
    // Base ideas fallback by type
    let baseIdeas = [];
 
    if (type.toLowerCase().includes("food")) {
      baseIdeas = [
        `Cloud kitchen for ${location}`,
        `Street food cart (evening crowd focus)`,
        `Healthy tiffin service for offices`,
        `Late-night snacks delivery`,
        `Homemade sweets business`,
        `Juice & smoothie bar`,
        `College area fast food stall`
      ];
    } else if (type.toLowerCase().includes("online")) {
      baseIdeas = [
        `Instagram store selling trending products`,
        `Dropshipping business`,
        `Digital products (ebooks/templates)`,
        `Affiliate marketing store`,
        `Print-on-demand T-shirt brand`,
        `Local products selling via WhatsApp`
      ];
    } else {
      baseIdeas = [
        `Local service business for ${type}`,
        `${type} consulting service`,
        `${type} reselling`,
        `${type} for small businesses`,
        `Freelance ${type} services`,
        `Subscription-based ${type}`
      ];
    }
 
    const demandTypes = [
      "High demand in local markets",
      "Growing demand among young customers",
      "Popular in residential areas",
      "High repeat customers potential",
      "Trending business in urban areas",
      "Good demand near colleges/offices",
      "Increasing demand via online orders"
    ];
 
    // Try AI generation
    let aiIdeas = [];
 
    try {
      const prompt = `
Generate ${count || 10} unique business ideas.
 
Budget: ₹${budget}
Location: ${location}
Business Type: ${type}
 
Return only idea names, one per line.
`;
      const text = await generateWithHuggingFace(prompt);
 
      aiIdeas = text
        .split("\n")
        .map(i => i.replace(/[-*0-9.]/g, "").trim())
        .filter(i => i.length > 3);
    } catch (aiErr) {
      console.error("HF ERROR:", aiErr.message);
    }
 
    // Build final output
    const ideas = [];
    const c = Number(count) || 5;
    const b = Number(budget);
 
    for (let i = 0; i < c; i++) {
      const ideaText    = aiIdeas[i] || baseIdeas[i % baseIdeas.length];
      const demand      = demandTypes[i % demandTypes.length];
      const investment  = Math.floor(b * (0.3 + i * 0.05));
      const profitValue = Math.floor(b * (0.08 + i * 0.02));
 
      ideas.push(`
${ideaText}
 
📍 Location: ${location}
💸 Investment: ₹${investment}
📈 Expected Profit: ₹${profitValue}/month
🔥 ${demand}
 
💡 Tip: Start small and scale based on demand
`);
    }
 
    console.log("FINAL AI IDEAS USED:", aiIdeas);
 
    res.json({ result: ideas.join("\n\n") });
 
  } catch (err) {
    console.error("GENERATE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});
 
// ══════════════════════════════════════════════════════
// POST /plan  →  return full business plan
// ══════════════════════════════════════════════════════
app.post("/plan", async (req, res) => {
  try {
    const { name, location, profit } = req.body;
 
    if (!name || !location) {
      return res.json({ plan: "Missing required data" });
    }
 
    // Fallback plan content
    let plan = `
📰 ${name} Business Guide
 
📍 Location: ${location}
💰 Expected Profit: ${profit}
 
📊 Market Demand:
This business has strong demand in ${location} because customers are actively looking for affordable and quality services.
 
💡 Why This Business Works:
This idea fits current trends and can attract repeat customers if managed properly.
 
🛠️ How To Start:
- Research local competitors
- Start with minimum setup
- Focus on first customers
- Improve based on feedback
 
📣 Marketing Strategy:
- Promote through WhatsApp
- Use Instagram reels
- Offer launch discounts
- Collect customer reviews
 
⚠️ Risks:
- Initial competition
- Slow growth in beginning
- Customer trust building
 
📈 Growth Opportunities:
Expand using referrals, online platforms, and repeat customers.
`;
 
    // Try AI enhancement
    try {
      const prompt = `
Write a detailed business guide.
 
Business: ${name}
Location: ${location}
Expected Profit: ${profit}
 
Include:
- Market demand
- Why it works
- How to start
- Marketing
- Risks
- Growth
`;
      console.log("Calling Hugging Face PLAN...");
      const aiText = await generateWithHuggingFace(prompt);
 
      if (aiText && aiText.length > 20) {
        plan = aiText;
      }
    } catch (err) {
      console.error("HF PLAN ERROR:", err.message);
    }
 
    res.json({ plan });
 
  } catch (err) {
    console.error("PLAN ERROR:", err);
    res.json({ plan: "Server error occurred" });
  }
});
 
// ══════════════════════════════════════════════════════
// GET /test-ai  →  quick HuggingFace connectivity check
// ══════════════════════════════════════════════════════
app.get("/test-ai", async (req, res) => {
  try {
    const text = await generateWithHuggingFace("Say hello in one short sentence.");
    res.json({ text: text || "AI not configured" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
 
// ══════════════════════════════════════════════════════
// START SERVER
// ══════════════════════════════════════════════════════
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
 
