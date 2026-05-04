const { z } = require("zod");

const locationSchema = z.object({
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
});

const cafeBaseSchema = z.object({
  id: z.string().trim().min(2),
  name: z.string().trim().min(2),
  area: z.string().trim().min(2),
  city: z.string().trim().min(2),
  rating: z.number().min(0).max(5),
  priceLevel: z.number().int().min(1).max(4),
  wifi: z.boolean(),
  powerSockets: z.boolean(),
  openNow: z.boolean(),
  location: locationSchema.optional(),
  tags: z.array(z.string().trim()).default([]),
  image: z.string().url(),
  description: z.string().trim().min(10),
});

const createCafeSchema = cafeBaseSchema;
const updateCafeSchema = cafeBaseSchema.partial();

const cafeQuerySchema = z.object({
  search: z.string().trim().optional(),
  city: z.string().trim().optional(),
  wifi: z.enum(["true", "false"]).optional(),
  openNow: z.enum(["true", "false"]).optional(),
  page: z.string().optional(),
  pageSize: z.string().optional(),
});

module.exports = {
  createCafeSchema,
  updateCafeSchema,
  cafeQuerySchema,
};
