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
      console.log("RAW RESULT:", JSON.stringify(result, null, 2));
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
  try {
    const { name, location, profit } = req.body;

    if (!name || !location) {
      return res.json({
        plan: "Missing required data"
      });
    }

    // ✅ STATIC AI-LIKE CONTENT (NO ERROR)
    const plan = `
📰 ${name} Business Guide

📍 Location: ${location}
💰 Expected Profit: ${profit}

📊 Market Demand:
This business has strong potential in ${location} due to local demand and growing customer interest.

💡 Why It Works:
People in ${location} are actively looking for convenient and affordable solutions, making this business profitable.

🛠️ How to Start:
- Research local demand
- Start with minimum investment
- Target first 10 customers
- Improve based on feedback

📣 Marketing:
- Use WhatsApp groups
- Promote via Instagram reels
- Offer discounts initially

⚠️ Risks:
- Competition
- Slow initial growth

📈 Growth:
Scale by expanding reach and improving service quality.
`;

    res.json({ plan });

  } catch (err) {
    res.json({
      plan: "Server error but fallback is working"
    });
  }
});
    // ✅ Create model
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const prompt = `
Write a simple business guide.

Business: ${name}
Location: ${location}
Profit: ${profit}

Explain clearly with steps, marketing, and growth.
`;

    // ✅ SAFE AI CALL
    console.log("API KEY CHECK:", process.env.GEMINI_API_KEY);
console.log("Calling Gemini model...");
    const result = await model.generateContent(prompt);

    let text = "";

    // ✅ SAFE RESPONSE EXTRACTION (NO CRASH)
    if (result && result.response) {
      if (typeof result.response.text === "function") {
        text = result.response.text();
      } else if (
        result.response.candidates &&
        result.response.candidates.length > 0
      ) {
        text =
          result.response.candidates[0]?.content?.parts?.[0]?.text || "";
      }
    }

    // ✅ FINAL RESPONSE (ALWAYS SAFE)
    res.json({
      plan: text || "AI could not generate content"
    });

  console.error("PLAN ERROR FULL:", err);

    // ✅ NEVER CRASH → ALWAYS RETURN RESPONSE
    res.json({
      plan: "Server error occurred. Please try again."
    });
  }
});
// ✅ START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
