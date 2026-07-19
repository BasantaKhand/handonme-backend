const request = require("supertest");
const { app } = require("../../server");
const User = require("../../models/User");
const { createUser } = require("../helpers");

describe("POST /api/auth/register", () => {
  it("registers a new user successfully", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Alice",
      email: "alice@example.com",
      password: "password123",
      location: "Kathmandu",
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe("alice@example.com");
  });

  it("returns an error for a duplicate email", async () => {
    await createUser({ email: "dupe@example.com" });
    const res = await request(app).post("/api/auth/register").send({
      name: "Bob",
      email: "dupe@example.com",
      password: "password123",
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns a validation error for missing fields", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "nope@example.com" });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });
});

describe("POST /api/auth/verify", () => {
  async function registerAndGetOtp(email) {
    await request(app).post("/api/auth/register").send({
      name: "Verify Me",
      email,
      password: "password123",
    });
    const user = await User.findOne({ email }).select("+otp +otpExpires");
    return user;
  }

  it("verifies a valid OTP", async () => {
    const user = await registerAndGetOtp("verify@example.com");
    const res = await request(app)
      .post("/api/auth/verify")
      .send({ email: "verify@example.com", otp: user.otp });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.isVerified).toBe(true);
  });

  it("rejects an invalid OTP", async () => {
    await registerAndGetOtp("badotp@example.com");
    const res = await request(app)
      .post("/api/auth/verify")
      .send({ email: "badotp@example.com", otp: "000000" });
    expect(res.status).toBe(400);
  });

  it("rejects an expired OTP", async () => {
    const user = await registerAndGetOtp("expired@example.com");
    user.otpExpires = new Date(Date.now() - 60 * 1000);
    await user.save();
    const res = await request(app)
      .post("/api/auth/verify")
      .send({ email: "expired@example.com", otp: user.otp });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("logs in a verified user", async () => {
    await createUser({ email: "login@example.com", password: "password123" });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@example.com", password: "password123" });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  it("rejects a wrong password", async () => {
    await createUser({ email: "wrong@example.com", password: "password123" });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "wrong@example.com", password: "nope" });
    expect(res.status).toBe(401);
  });

  it("rejects an unverified user with needsVerification", async () => {
    await createUser({ email: "unverified@example.com", isVerified: false });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "unverified@example.com", password: "password123" });
    expect(res.status).toBe(403);
    expect(res.body.needsVerification).toBe(true);
  });
});

describe("GET /api/auth/me", () => {
  it("returns the user with a valid token", async () => {
    const { token, user } = await createUser({ email: "me@example.com" });
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(user.email);
  });

  it("rejects a request without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});
