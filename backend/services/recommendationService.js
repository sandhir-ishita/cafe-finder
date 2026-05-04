async function fetchOpenAIRecommendation(cafe, reviews) {
  const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const reviewText = reviews.length
    ? reviews.map((review) => `${review.authorName}: ${review.text}`).join("\n")
    : "No written reviews yet.";

  const prompt = `
You are ranking cafes for students and remote workers.
Return JSON with keys: summary, quietness, studySuitability, popularity, highlights.

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
`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name: "cafe_recommendation",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              summary: { type: "string" },
              quietness: { type: "string" },
              studySuitability: { type: "string" },
              popularity: { type: "string" },
              highlights: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["summary", "quietness", "studySuitability", "popularity", "highlights"],
          },
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}`);
  }

  const data = await response.json();
  if (!data.output_text) {
    throw new Error("OpenAI response was empty");
  }

  return {
    ...JSON.parse(data.output_text),
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
