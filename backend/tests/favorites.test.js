const test = require("node:test");
const assert = require("node:assert/strict");
const Favorite = require("../models/Favorite");
const favoriteController = require("../controllers/favoriteController");

test("favorite delete blocks users from removing someone else's favorite", async () => {
  const originalFindById = Favorite.findById;

  Favorite.findById = async () => ({
    userId: {
      toString: () => "owner-user",
    },
  });

  const req = {
    params: { id: "favorite-1" },
    user: { id: "different-user" },
  };

  let statusCode = 200;
  let payload = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      payload = body;
      return body;
    },
  };

  await favoriteController.removeFavorite(req, res);

  Favorite.findById = originalFindById;

  assert.equal(statusCode, 403);
  assert.equal(payload.message, "You can only delete your own favorites");
});
