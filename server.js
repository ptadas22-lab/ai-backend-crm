const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors({
  origin: "https://ptadas22-lab.github.io"
}));

app.use(express.json()); // 
app.post("/generate", (req, res) => {
  try {
    const { budget, location, type, count } = req.body;

    const b = Number(budget);

    if (!b || !location || !type) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const ideas = [];

for (let i = 1; i <= count; i++) {
  ideas.push(`
${type} Idea ${i}
High demand in ${location}
Profit: ₹${Math.floor(b / (8 + i))}K/month
`);
}

res.json({
  result: ideas.join("\n\n")
});
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
