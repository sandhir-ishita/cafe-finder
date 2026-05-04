const { z } = require("zod");

const importCafeSchema = z
  .object({
    query: z.string().trim().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    radius: z.number().int().positive().max(50000).default(5000),
    limit: z.number().int().positive().max(20).default(10),
  })
  .refine((data) => data.query || (data.lat !== undefined && data.lng !== undefined), {
    message: "Provide either query or lat/lng.",
    path: ["query"],
  });

const directionsQuerySchema = z.object({
  origin: z.string().trim().min(3),
  destination: z.string().trim().min(3),
  mode: z.enum(["driving", "walking", "bicycling", "transit"]).optional(),
});

const placesQuerySchema = z.object({
  query: z.string().trim().min(2),
  lat: z.string().optional(),
  lng: z.string().optional(),
});

module.exports = {
  importCafeSchema,
  directionsQuerySchema,
  placesQuerySchema,
};
