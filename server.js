require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ ENV CHECK
console.log("ENV CHECK:", process.env.GEMINI_API_KEY);

// ✅ Gemini setup
const API_KEY = process.env.GEMINI_API_KEY;

let genAI = null;

if (API_KEY && API_KEY.trim() !== "") {
  genAI = new GoogleGenerativeAI(API_KEY);
} else {
  console.log("⚠️ No API key — AI disabled");
}

// =======================================
// ✅ GENERATE IDEAS ROUTE (KEEPING YOUR LOGIC)
// =======================================

app.post("/generate", async (req, res) => {
  try {
    const { budget, location, type, count } = req.body;

    if (!budget || !location || !type) {
      return res.status(400).json({
        error: "Missing fields"
      });
    }

    // -----------------------------
    // 🔥 EXISTING BASE IDEAS
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

    let aiIdeas = [];

    // =======================================
    // ✅ AI GENERATION
    // =======================================

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash"
        });

        const prompt = `
Generate business ideas for India.

Budget: ₹${budget}
Location: ${location}
Business Type: ${type}

Rules:
- Short idea names
- Practical ideas
- Trending ideas
- Realistic for Indian market

Generate ${count || 10} ideas.
`;

        console.log("Calling Gemini...");

        const result = await model.generateContent(prompt);

        let text = "";

        try {
          text = result.response.text();
        } catch (e) {
          text =
            result?.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        }

        console.log("AI RESPONSE:", text);

        aiIdeas = text
          .split("\n")
          .map(i => i.replace(/[-*0-9.]/g, "").trim())
          .filter(i => i.length > 3);
console.log("AI IDEAS COUNT:", aiIdeas.length);
      } catch (err) {
        console.log("Gemini failed, using fallback ideas");
      }
    }

    // =======================================
    // ✅ FINAL OUTPUT
    // =======================================

    const ideas = [];

    const c = Number(count) || 5;
    const b = Number(budget);

    for (let i = 0; i < c; i++) {
      const ideaText =
        aiIdeas[i] || baseIdeas[i % baseIdeas.length];

      const demand =
        demandTypes[i % demandTypes.length];

      const investment =
        Math.floor(b * (0.3 + i * 0.05));

      const profitValue =
        Math.floor(b * (0.08 + i * 0.02));

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
    res.json({
      result: ideas.join("\n\n")
    });

  } catch (err) {
    console.error("GENERATE ERROR:", err);

    res.status(500).json({
      error: "Server error"
    });
  }
});

// =======================================
// ✅ PLAN ROUTE (SAFE VERSION)
// =======================================

app.post("/plan", async (req, res) => {
  try {
    const { name, location, profit } = req.body;

    if (!name || !location) {
      return res.json({
        plan: "Missing required data"
      });
    }

    // =======================================
    // ✅ FALLBACK CONTENT
    // =======================================

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

    // =======================================
    // ✅ AI CONTENT (OPTIONAL)
    // =======================================

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash"
        });

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

        console.log("Calling Gemini PLAN...");

        const result = await model.generateContent(prompt);

        let aiText = "";

        try {
          aiText = result.response.text();
        } catch (e) {
          aiText =
            result?.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        }

        if (aiText && aiText.length > 20) {
          plan = aiText;
        }

      } catch (err) {
  console.error("GEMINI ERROR:", err);
}
    }

    res.json({
      plan
    });

  } catch (err) {
    console.error("PLAN ERROR:", err);

    res.json({
      plan: "Server error occurred"
    });
  }
});

// =======================================
// ✅ START SERVER
// =======================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
