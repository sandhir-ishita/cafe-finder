/**
 * Integration Test Suite — Smart Cafe Finder API
 *
 * Uses mongodb-memory-server to spin up a real in-memory MongoDB instance
 * so tests never touch the production Atlas database. Uses supertest to
 * make real HTTP requests against the Express app.
 *
 * Run with: npm test
 */

const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const supertest = require("supertest");
const createApp = require("../app");

// --- Test Setup ---

let mongod;
let app;
let request;

// Set required env vars before anything else loads
process.env.JWT_SECRET = "integration-test-secret-do-not-use-in-prod";
process.env.NODE_ENV = "test";

before(async () => {
  // 1. Boot an in-memory MongoDB server
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // 2. Connect mongoose to it
  await mongoose.connect(uri);

  // 3. Build Express app with this mongoose connection
  app = createApp({ mongooseInstance: mongoose });
  request = supertest(app);
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

// ─────────────────────────────────────────────────────────────────────────────
// AUTH ROUTES  /api/auth/register  &  /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  it("registers a new user and returns a JWT", async () => {
    const res = await request.post("/api/auth/register").send({
      name: "Test User",
      email: "testuser@example.com",
      password: "Password123!",
    });

    assert.equal(res.status, 201);
    assert.ok(res.body.token, "response should include a JWT token");
    assert.ok(res.body.user, "response should include the user object");
    assert.equal(res.body.user.email, "testuser@example.com");
    // Password must NEVER be returned
    assert.equal(res.body.user.password, undefined, "password must not be exposed");
  });

  it("rejects registration with a duplicate email", async () => {
    // First registration
    await request.post("/api/auth/register").send({
      name: "Dupe User",
      email: "dupe@example.com",
      password: "Password123!",
    });

    // Second registration with same email
    const res = await request.post("/api/auth/register").send({
      name: "Dupe User Again",
      email: "dupe@example.com",
      password: "AnotherPassword!",
    });

    assert.equal(res.status, 409);
  });

  it("returns 400 for a missing required field", async () => {
    const res = await request.post("/api/auth/register").send({
      email: "noemail@example.com",
      // name and password missing
    });

    assert.equal(res.status, 400);
  });
});

describe("POST /api/auth/login", () => {
  before(async () => {
    // Seed a known user for login tests
    await request.post("/api/auth/register").send({
      name: "Login Tester",
      email: "login@example.com",
      password: "CorrectPassword1!",
    });
  });

  it("returns a JWT on valid credentials", async () => {
    const res = await request.post("/api/auth/login").send({
      email: "login@example.com",
      password: "CorrectPassword1!",
    });

    assert.equal(res.status, 200);
    assert.ok(res.body.token, "valid login must return a JWT");
  });

  it("returns 401 on wrong password", async () => {
    const res = await request.post("/api/auth/login").send({
      email: "login@example.com",
      password: "WrongPassword!",
    });

    assert.equal(res.status, 401);
  });

  it("returns 401 for a non-existent email", async () => {
    const res = await request.post("/api/auth/login").send({
      email: "ghost@example.com",
      password: "AnyPassword!",
    });

    assert.equal(res.status, 401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CAFE ROUTES  /api/cafes
// ─────────────────────────────────────────────────────────────────────────────

describe("GET /api/cafes", () => {
  it("returns a paginated response object with items and pagination keys", async () => {
    const res = await request.get("/api/cafes");

    assert.equal(res.status, 200);
    // API returns { items: [...], pagination: {...} } — not a bare array
    assert.ok(Array.isArray(res.body.items), "res.body.items should be an array");
    assert.ok(res.body.pagination, "res.body.pagination should exist");
    assert.ok(typeof res.body.pagination.total === "number", "pagination.total should be a number");
  });

  it("does not require authentication", async () => {
    const res = await request.get("/api/cafes");
    // Must succeed without Authorization header
    assert.equal(res.status, 200);
  });

  it("accepts a search query param without crashing", async () => {
    const res = await request.get("/api/cafes?search=wifi");
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.items));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FAVORITES ROUTES  /api/favorites
// ─────────────────────────────────────────────────────────────────────────────

describe("Favorites: authenticated flows", () => {
  let authToken;
  let userId;

  before(async () => {
    // Register + login to get a real token and userId for these tests
    const reg = await request.post("/api/auth/register").send({
      name: "Fav Tester",
      email: "favtester@example.com",
      password: "FavPassword1!",
    });
    authToken = reg.body.token;
    userId = reg.body.user._id || reg.body.user.id;
  });

  it("GET /api/favorites/:userId returns 401 without a token", async () => {
    // Route is /:userId — a bare GET /api/favorites has no matching route (404)
    const res = await request.get(`/api/favorites/${userId}`);
    assert.equal(res.status, 401);
  });

  it("GET /api/favorites/:userId returns 200 with a valid token", async () => {
    const res = await request
      .get(`/api/favorites/${userId}`)
      .set("Authorization", `Bearer ${authToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body), "favorites should be an array");
  });

  it("POST /api/favorites returns 401 without a token", async () => {
    const res = await request.post("/api/favorites").send({ cafeId: "some-id" });
    assert.equal(res.status, 401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM  /
// ─────────────────────────────────────────────────────────────────────────────

describe("GET / (health check)", () => {
  it("returns a 200 status response", async () => {
    const res = await request.get("/");
    assert.equal(res.status, 200);
  });
});

describe("Unknown routes", () => {
  it("returns 404 for a route that does not exist", async () => {
    const res = await request.get("/api/does-not-exist");
    assert.equal(res.status, 404);
  });
});
