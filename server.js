const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Gemini setup
const genAI = new GoogleGenerativeAI("AIzaSyBdSPthdn2KvP0cMRSfNR1zBXGMXfNgTHg"); // ⚠️ keep your key

// ✅ Route
app.post("/generate", async (req, res) => {
  try {
    const { budget, location, type, count } = req.body;

    if (!budget || !location || !type) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // -----------------------------
    // 🔥 EXISTING BASE IDEAS (KEPT)
    // -----------------------------
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

    // -----------------------------
    // 🤖 AI PART (IMPROVED)
    // -----------------------------
    let aiIdeas = [];

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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

Return ONLY idea names (no explanation, no numbering, no symbols).

Generate ${count || 10} ideas.
`;

      console.log("Calling Gemini...");
      const result = await model.generateContent(prompt);
      const response = await result.response;
text = response.text();

      console.log("Gemini response:", text);

      aiIdeas = text
        .split("\n")
        .map(i => i.replace(/[-*0-9.]/g, "").trim())
        .filter(i => i.length > 3);

    } catch (err) {
      console.error("GEMINI ERROR:", err);
    }

    // -----------------------------
    // 🔁 FINAL OUTPUT (UNCHANGED LOGIC)
    // -----------------------------
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

    res.json({
      result: ideas.join("\n\n")
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.post("/plan", async (req, res) => {
  try {
    const { name, location, profit } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
Create a detailed business article like a newspaper.

Business: ${name}
Location: ${location}
Expected Profit: ${profit}

Write clearly and practically.

Include:
- Market demand in this location
- Why this business works here
- Step-by-step how to start
- Cost breakdown
- Marketing strategy
- Risks and challenges
- Growth opportunities

Use headings and keep it structured.
`;
const result = await model.generateContent(prompt);

// ✅ FORCE SAFE TEXT EXTRACTION
let text = "";

try {
  const response = await result.response;   // ✅ FIX 1
  text = response.text();
} catch (e) {
  console.log("Fallback used");


  text =
    result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "No content generated";
}

// ✅ ALWAYS RETURN STRING
res.json({ plan: String(text || "No content generated") }); // ✅ FIX 2
    
   } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
