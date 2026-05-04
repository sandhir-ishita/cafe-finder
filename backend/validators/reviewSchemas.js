const { z } = require("zod");

const createReviewSchema = z.object({
  cafeId: z.string().trim().min(2),
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().min(5).max(1000),
});

module.exports = {
  createReviewSchema,
};
