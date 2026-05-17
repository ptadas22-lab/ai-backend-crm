
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
console.log("ENV CHECK:", process.env.GEMINI_API_KEY);


// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Gemini setup (FIXED)
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.log("⚠️ No API key — AI disabled");
}

const genAI = new GoogleGenerativeAI(API_KEY);

// ✅ Route
app.post("/generate", async (req, res) => {
  if (!genAI) {
    return res.json({
      result: "AI not configured yet"
    });
  }
  try {
    const { budget, location, type, count } = req.body;

    if (!budget || !location || !type) {
      return res.status(400).json({ error: "Missing fields" });
    }

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

    let aiIdeas = [];

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
Generate business ideas based on the user's inputs.

User Inputs:
- Budget: ₹${budget}
- Location: ${location}
- Business Type: ${type}

Instructions:
- Give ONLY realistic ideas that work specifically in ${location}
- Match ideas strictly within budget ₹${budget}
- Focus on Indian market
- Avoid generic ideas
- Keep names short and clear

Return ONLY idea names.

Generate ${count || 10} ideas.
`;

      console.log("Calling Gemini...");
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      aiIdeas = text
        .split("\n")
        .map(i => i.replace(/[-*0-9.]/g, "").trim())
        .filter(i => i.length > 3);

    } catch (err) {
      console.error("GEMINI ERROR:", err);
    }

    const ideas = [];
    const c = Number(count) || 5;
    const b = Number(budget);

    for (let i = 0; i < c; i++) {
      const ideaText = aiIdeas[i] || baseIdeas[i % baseIdeas.length];
      const demand = demandTypes[i % demandTypes.length];

      const investment = Math.floor(b * (0.3 + i * 0.05));
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

    res.json({ result: ideas.join("\n\n") });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ✅ PLAN ROUTE (FIXED)
app.post("/plan", async (req, res) => {
   if (!genAI) {
    return res.json({
      plan: "AI not configured yet"
    });
  }
  try {
    const { name, location, profit } = req.body;

    if (!name || !location) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
Create a detailed business article like a newspaper.

Business: ${name}
Location: ${location}
Expected Profit: ${profit}

Include:
- Market demand
- Why it works
- Steps to start
- Cost
- Marketing
- Risks
- Growth
`;

    const result = await model.generateContent(prompt);

    let text = "";

if (result && result.response) {
  try {
    text = result.response.text();
  } catch (e) {
    console.log("Fallback triggered");

    if (
      result.response.candidates &&
      result.response.candidates.length > 0 &&
      result.response.candidates[0].content.parts.length > 0
    ) {
      text = result.response.candidates[0].content.parts[0].text;
    }
  console.log("FINAL PLAN TEXT:", text);

    res.json({
  plan: text || "No AI content generated"
});
  catch (err) {
    console.error("PLAN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ✅ START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
