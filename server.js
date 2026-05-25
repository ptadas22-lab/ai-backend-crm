require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const API_KEY = process.env.GEMINI_API_KEY;
let genAI = null;

if (API_KEY && API_KEY.trim() !== "") {
  genAI = new GoogleGenerativeAI(API_KEY);
  console.log("Gemini enabled");
} else {
  console.log("No API key detected. Using local AI-style generator.");
}

function buildLocalAiIdeas(type, location, count) {
  const starters = [
    "Smart",
    "Hyperlocal",
    "Lean",
    "Quick-start",
    "Digital-first",
    "Community-driven"
  ];

  const offers = [
    "subscription packs",
    "weekend offers",
    "premium upsell",
    "wholesale tie-ups",
    "delivery bundles",
    "corporate plans"
  ];

  return Array.from({ length: count }, (_, i) => {
    const starter = starters[i % starters.length];
    const offer = offers[(i + 2) % offers.length];
    return `${starter} ${type} business in ${location} with ${offer}`;
  });
}

app.post("/generate", async (req, res) => {
  try {
    const { budget, location, type, count } = req.body;

    if (!budget || !location || !type) {
      return res.status(400).json({ error: "Missing fields" });
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

    const c = Math.min(Math.max(Number(count) || 5, 1), 20);
    const b = Number(budget);

    let aiIdeas = [];

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const prompt = `Generate ${c} short practical business ideas for India. Budget: ₹${budget}, Location: ${location}, Type: ${type}.`;
        const result = await model.generateContent(prompt);
        const text = result?.response?.text?.() || "";

        aiIdeas = text
          .split("\n")
          .map((i) => i.replace(/[-*0-9.]/g, "").trim())
          .filter((i) => i.length > 3)
          .slice(0, c);
      } catch (aiErr) {
        console.error("AI ERROR:", aiErr.message);
      }
    }

    if (aiIdeas.length === 0) {
      aiIdeas = buildLocalAiIdeas(type, location, c);
    }

    const ideas = aiIdeas.map((ideaText, i) => {
      const investment = Math.floor(b * (0.3 + i * 0.05));
      const profitValue = Math.floor(b * (0.08 + i * 0.02));

      return `${ideaText}\n\n📍 Location: ${location}\n💸 Investment: ₹${investment}\n📈 Expected Profit: ₹${profitValue}/month\n🔥 ${demandTypes[i % demandTypes.length]}\n\n💡 Tip: Start small and scale based on demand`;
    });

    return res.json({
      mode: genAI ? "gemini" : "local",
      result: ideas.join("\n\n")
    });
  } catch (err) {
    console.error("GENERATE ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

app.post("/plan", async (req, res) => {
  try {
    const { name, location, profit } = req.body;

    if (!name || !location) {
      return res.json({ plan: "Missing required data" });
    }

    let plan = `\n📰 ${name} Business Guide\n\n📍 Location: ${location}\n💰 Expected Profit: ${profit}\n\n📊 Market Demand:\nThis business has strong demand in ${location} because customers are actively looking for affordable and quality services.\n\n💡 Why This Business Works:\nThis idea fits current trends and can attract repeat customers if managed properly.\n\n🛠️ How To Start:\n- Research local competitors\n- Start with minimum setup\n- Focus on first customers\n- Improve based on feedback\n\n📣 Marketing Strategy:\n- Promote through WhatsApp\n- Use Instagram reels\n- Offer launch discounts\n- Collect customer reviews\n\n⚠️ Risks:\n- Initial competition\n- Slow growth in beginning\n- Customer trust building\n\n📈 Growth Opportunities:\nExpand using referrals, online platforms, and repeat customers.\n`;

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(
          `Write a detailed business guide for ${name} in ${location} with expected profit ${profit}.`
        );
        const aiText = result?.response?.text?.() || "";
        if (aiText.length > 20) {
          plan = aiText;
        }
      } catch (err) {
        console.error("GEMINI PLAN ERROR:", err.message);
      }
    }

    return res.json({ plan });
  } catch (err) {
    console.error("PLAN ERROR:", err);
    return res.json({ plan: "Server error occurred" });
  }
});

app.get("/test-ai", async (_req, res) => {
  if (!genAI) {
    return res.json({ mode: "local", text: "AI key not configured, local mode is active." });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("Say hello");
    return res.json({ mode: "gemini", text: result.response.text() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
