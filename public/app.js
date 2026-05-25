const form = document.getElementById("idea-form");
const result = document.getElementById("result");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  result.textContent = "Generating ideas...";

  const payload = {
    budget: document.getElementById("budget").value,
    location: document.getElementById("location").value,
    type: document.getElementById("type").value,
    count: document.getElementById("count").value
  };

  try {
    const response = await fetch("/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to generate ideas");
    }

    result.textContent = data.result;
  } catch (error) {
    result.textContent = `Error: ${error.message}`;
  }
});
