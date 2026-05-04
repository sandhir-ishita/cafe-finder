const cafes = [
  {
    id: "blue-bottle-bandra",
    name: "Blue Bottle Bandra",
    area: "Bandra West",
    city: "Mumbai",
    rating: 4.7,
    priceLevel: 3,
    wifi: true,
    powerSockets: true,
    openNow: true,
    location: { lat: 19.0607, lng: 72.8364 },
    tags: ["specialty coffee", "work-friendly", "quiet"],
    image:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80",
    description:
      "A calm specialty coffee spot with reliable Wi-Fi, good lighting, and enough seating for focused work sessions.",
  },
  {
    id: "third-wave-koramangala",
    name: "Third Wave Coffee",
    area: "Koramangala",
    city: "Bengaluru",
    rating: 4.5,
    priceLevel: 2,
    wifi: true,
    powerSockets: true,
    openNow: true,
    location: { lat: 12.9352, lng: 77.6245 },
    tags: ["espresso", "group study", "brunch"],
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
    description:
      "A lively cafe with flexible seating, quick service, and a solid menu for long study sessions.",
  },
  {
    id: "paper-moon-hauz-khas",
    name: "Paper Moon Cafe",
    area: "Hauz Khas",
    city: "New Delhi",
    rating: 4.2,
    priceLevel: 2,
    wifi: true,
    powerSockets: false,
    openNow: false,
    location: { lat: 28.5494, lng: 77.2001 },
    tags: ["outdoor seating", "casual", "desserts"],
    image:
      "https://images.unsplash.com/photo-1453614512568-c4024d13c247?auto=format&fit=crop&w=900&q=80",
    description:
      "A cozy neighborhood spot with desserts, strong coffee, and a relaxed pace for casual meetups.",
  },
  {
    id: "roastery-banjara-hills",
    name: "The Roastery Coffee House",
    area: "Banjara Hills",
    city: "Hyderabad",
    rating: 4.8,
    priceLevel: 3,
    wifi: true,
    powerSockets: true,
    openNow: true,
    location: { lat: 17.4239, lng: 78.4483 },
    tags: ["garden seating", "single origin", "remote work"],
    image:
      "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=900&q=80",
    description:
      "A spacious cafe with an airy courtyard, well-brewed coffee, and plenty of room to settle in.",
  },
  {
    id: "cha-brew-salt-lake",
    name: "Cha and Brew",
    area: "Salt Lake",
    city: "Kolkata",
    rating: 4.1,
    priceLevel: 1,
    wifi: false,
    powerSockets: false,
    openNow: true,
    location: { lat: 22.5797, lng: 88.4316 },
    tags: ["budget", "tea", "quick bites"],
    image:
      "https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=900&q=80",
    description:
      "A budget-friendly stop for tea, coffee, and snacks when you want a simple local cafe vibe.",
  },
  {
    id: "coastline-brew-fort-kochi",
    name: "Coastline Brew",
    area: "Fort Kochi",
    city: "Kochi",
    rating: 4.6,
    priceLevel: 2,
    wifi: true,
    powerSockets: false,
    openNow: false,
    location: { lat: 9.9666, lng: 76.2422 },
    tags: ["sea breeze", "travel", "all-day breakfast"],
    image:
      "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=900&q=80",
    description:
      "A bright cafe near the waterfront with friendly service, good breakfasts, and a laid-back atmosphere.",
  },
];

module.exports = cafes;
