const express = require("express");
const cors = require("cors");

const app = express();

// ✅ MUST BE HERE (before routes)
app.use(cors());
app.use(express.json());

app.post("/generate", (req, res) => {
  try {
    const { budget, location, type, count } = req.body;

    const b = Number(budget);
    const c = Number(count) || 3;

    if (!b || !location || !type) {
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
}

else if (type.toLowerCase().includes("online")) {
  baseIdeas = [
    `Instagram store selling trending products`,
    `Dropshipping business`,
    `Digital products (ebooks/templates)`,
    `Affiliate marketing store`,
    `Print-on-demand T-shirt brand`,
    `Local products selling via WhatsApp`
  ];
}

else {
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

    const ideas = [];

    for (let i = 0; i < c; i++) {
      const ideaText = baseIdeas[i % baseIdeas.length];
      const demand = demandTypes[i % demandTypes.length];

     const investment = Math.floor(b * (0.3 + i * 0.05));
const profit = Math.floor(b * (0.08 + i * 0.02));

ideas.push(`
${ideaText}

📍 Location: ${location}
💸 Investment: ₹${investment}
📈 Expected Profit: ₹${profit}/month
🔥 ${demand}

💡 Tip: Start small and scale based on demand
`);

    res.json({
      result: ideas.join("\n\n")
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("NEW VERSION RUNNING");
  console.log("Server running on port", PORT);
});
