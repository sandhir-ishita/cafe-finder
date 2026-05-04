const { z } = require("zod");

const createFavoriteSchema = z.object({
  cafeId: z.string().trim().min(2),
});

module.exports = {
  createFavoriteSchema,
};
