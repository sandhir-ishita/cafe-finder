const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/auth");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

test("auth middleware attaches the decoded user for valid bearer tokens", async () => {
  const token = jwt.sign({ id: "user-1", email: "test@example.com" }, process.env.JWT_SECRET);
  const req = {
    headers: {
      authorization: `Bearer ${token}`,
    },
  };

  const res = {
    status() {
      throw new Error("status should not be called for a valid token");
    },
  };

  await new Promise((resolve, reject) => {
    authMiddleware(req, res, (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });

  assert.equal(req.user.id, "user-1");
  assert.equal(req.user.email, "test@example.com");
});
