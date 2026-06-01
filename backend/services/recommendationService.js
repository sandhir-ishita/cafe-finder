// FIX: Was calling /v1/responses which does not exist.
// Correct endpoint is /v1/chat/completions with messages array.
async function fetchOpenAIRecommendation(cafe, reviews) {
  const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const reviewText = reviews.length
    ? reviews.map((review) => `${review.authorName}: ${review.text}`).join("\n")
    : "No written reviews yet.";

  const prompt = `Analyze this cafe for students and remote workers.

Cafe:
${JSON.stringify(
    {
      name: cafe.name,
      area: cafe.area,
      city: cafe.city,
      rating: cafe.rating,
      wifi: cafe.wifi,
      powerSockets: cafe.powerSockets,
      openNow: cafe.openNow,
      tags: cafe.tags,
      description: cafe.description,
    },
    null,
    2
  )}

Reviews:
${reviewText}

Return a JSON object with exactly these keys:
- summary (string): one-sentence summary
- quietness (string): "High", "Medium", or "Low"
- studySuitability (string): one sentence
- popularity (string): "Very popular", "Popular", or "More niche"
- highlights (array of strings): 3 bullet points`;

  // FIX: Correct endpoint, correct request shape
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      // FIX: response_format replaces the broken text.format field
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a cafe ranking assistant. Always respond with a valid JSON object only — no markdown, no explanation outside JSON.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`OpenAI request failed with status ${response.status}: ${body}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI response was empty");
  }

  return {
    ...JSON.parse(content),
    source: "openai",
  };
}

function buildRecommendationFallback(cafe, reviews, filterHints = {}) {
  const text = [cafe.description, ...(reviews || []).map((review) => review.text)].join(" ");
  const source = text.toLowerCase();

  const quietness =
    source.includes("quiet") || source.includes("calm")
      ? "High"
      : filterHints.search?.toLowerCase().includes("study")
        ? "Medium"
        : cafe.openNow
          ? "Medium"
          : "Low";

  const studySuitability =
    cafe.wifi && cafe.powerSockets
      ? "Strong fit for study/work sessions."
      : cafe.wifi
        ? "Good for short laptop sessions."
        : "Better for casual visits than long work blocks.";

  const popularity =
    cafe.rating >= 4.6 ? "Very popular" : cafe.rating >= 4.2 ? "Popular" : "More niche";

  return {
    summary: `${cafe.name} balances ${popularity.toLowerCase()} appeal with ${quietness.toLowerCase()} quietness potential.`,
    quietness,
    studySuitability,
    popularity,
    highlights: [
      cafe.wifi ? "Wi-Fi available" : "Wi-Fi not listed",
      cafe.powerSockets ? "Power sockets available" : "Power sockets limited",
      cafe.openNow ? "Open right now" : "Currently closed",
    ],
    source: "fallback",
  };
}

module.exports = {
  fetchOpenAIRecommendation,
  buildRecommendationFallback,
};
