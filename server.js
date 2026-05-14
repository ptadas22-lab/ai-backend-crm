const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Gemini setup
const genAI = new GoogleGenerativeAI("YOUR_API_KEY");

// ✅ Route
app.post("/generate", async (req, res) => {
  try {
    const { budget, location, type, count } = req.body;

    if (!budget || !location || !type) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // -----------------------------
    // 🔥 YOUR EXISTING LOGIC (KEEP)
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
    // 🤖 AI PART (NEW)
    // -----------------------------
    let aiIdeas = [];

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `
Give ${count || 5} business idea names only.

Budget: ₹${budget}
Location: ${location}
Type: ${type}

Only short names. No explanation.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      aiIdeas = text
        .split("\n")
        .map(i => i.replace(/[-*0-9.]/g, "").trim())
        .filter(i => i.length > 3);

    } catch (err) {
      console.log("AI failed, using manual ideas");
    }

    // -----------------------------
    // 🔁 FINAL OUTPUT
    // -----------------------------
    const ideas = [];
    const c = Number(count) || 3;
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
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
