const Cafe = require("../models/Cafe");

async function handleChat(req, res) {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ message: "Messages array is required." });
  }

  const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ message: "AI features are currently unavailable (Missing API Key)." });
  }

  // Define a tool that the AI can call to search our MongoDB database
  const tools = [
    {
      type: "function",
      function: {
        name: "search_cafes",
        description: "Search the database for cafes based on location, amenities, and keywords.",
        parameters: {
          type: "object",
          properties: {
            city: { type: "string", description: "City name, e.g., Bangalore, London, New York" },
            query: { type: "string", description: "Vibe or name keyword, e.g., quiet, study, strong coffee" },
            wifi: { type: "boolean", description: "Must have Wi-Fi" },
            powerSockets: { type: "boolean", description: "Must have power sockets" },
            openNow: { type: "boolean", description: "Must be currently open" },
          },
        },
      },
    },
  ];

  const systemMessage = {
    role: "system",
    content: "You are the Smart Cafe Finder AI assistant. Help users find the best cafes to work or study. Be concise, conversational, and friendly. ALWAYS use the search_cafes tool if the user asks for recommendations, asks what cafes are available, or mentions a location. When returning cafes, format them as a readable list and highlight why they fit the user's request based on the data you received from the tool.",
  };

  const payloadMessages = [systemMessage, ...messages];

  try {
    // Initial call to OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: payloadMessages,
        tools: tools,
        tool_choice: "auto",
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const responseMessage = data.choices[0].message;

    // If OpenAI decides it needs to call our search tool
    if (responseMessage.tool_calls) {
      payloadMessages.push(responseMessage); // Add assistant's tool call to history

      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.function.name === "search_cafes") {
          const args = JSON.parse(toolCall.function.arguments);
          
          // Build MongoDB query
          const query = {};
          if (args.city) query.city = { $regex: `^${args.city}$`, $options: "i" };
          if (args.query) query.$text = { $search: args.query };
          if (args.wifi) query.wifi = true;
          if (args.powerSockets) query.powerSockets = true;
          if (args.openNow) query.openNow = true;

          const cafes = await Cafe.find(query).sort({ rating: -1 }).limit(4).lean();
          
          const simplifiedCafes = cafes.map(c => ({
            name: c.name,
            area: c.area,
            rating: c.rating,
            wifi: c.wifi,
            powerSockets: c.powerSockets,
            description: c.description
          }));

          payloadMessages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: "search_cafes",
            content: simplifiedCafes.length ? JSON.stringify(simplifiedCafes) : "No cafes found matching these criteria.",
          });
        }
      }

      // Second call back to OpenAI with the search results
      const secondResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: payloadMessages,
        }),
      });

      const secondData = await secondResponse.json();
      return res.json({ message: secondData.choices[0].message });
    }

    // If OpenAI didn't need to call a tool, just return its normal text response
    return res.json({ message: responseMessage });

  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ message: "Sorry, I hit an error connecting to my brain right now." });
  }
}

module.exports = { handleChat };
