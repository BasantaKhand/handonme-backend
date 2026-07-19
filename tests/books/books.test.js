const mongoose = require("mongoose");
const request = require("supertest");
const { app } = require("../../server");
const { createUser, createBook } = require("../helpers");

describe("GET /api/books", () => {
  it("returns all books with a count", async () => {
    const { user } = await createUser();
    await createBook(user._id, { title: "Book A" });
    await createBook(user._id, { title: "Book B" });

    const res = await request(app).get("/api/books");
    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(2);
    expect(res.body.data.books).toHaveLength(2);
  });

  it("filters by condition", async () => {
    const { user } = await createUser();
    await createBook(user._id, { condition: "Like New" });
    await createBook(user._id, { condition: "Worn" });

    const res = await request(app).get("/api/books?condition=Worn");
    expect(res.body.data.count).toBe(1);
    expect(res.body.data.books[0].condition).toBe("Worn");
  });

  it("filters by exchangeType", async () => {
    const { user } = await createUser();
    await createBook(user._id, { exchangeType: "Free", price: 0 });
    await createBook(user._id, { exchangeType: "Cash", price: 300 });

    const res = await request(app).get("/api/books?exchangeType=Free");
    expect(res.body.data.count).toBe(1);
    expect(res.body.data.books[0].exchangeType).toBe("Free");
  });

  it("filters by price range", async () => {
    const { user } = await createUser();
    await createBook(user._id, { price: 100 });
    await createBook(user._id, { price: 500 });
    await createBook(user._id, { price: 900 });

    const res = await request(app).get("/api/books?minPrice=200&maxPrice=600");
    expect(res.body.data.count).toBe(1);
    expect(res.body.data.books[0].price).toBe(500);
  });

  it("searches by title", async () => {
    const { user } = await createUser();
    await createBook(user._id, { title: "Organic Chemistry" });
    await createBook(user._id, { title: "Linear Algebra" });

    const res = await request(app).get("/api/books?search=chemistry");
    expect(res.body.data.count).toBe(1);
    expect(res.body.data.books[0].title).toBe("Organic Chemistry");
  });
});

describe("GET /api/books/:id", () => {
  it("returns a book by id and increments views", async () => {
    const { user } = await createUser();
    const book = await createBook(user._id, { views: 0 });

    const first = await request(app).get(`/api/books/${book._id}`);
    expect(first.status).toBe(200);
    expect(first.body.data.views).toBe(1);

    const second = await request(app).get(`/api/books/${book._id}`);
    expect(second.body.data.views).toBe(2);
  });

  it("returns 404 for a non-existent id", async () => {
    const missingId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/books/${missingId}`);
    expect(res.status).toBe(404);
  });
});

describe("POST /api/books", () => {
  it("creates a book when authenticated", async () => {
    const { token } = await createUser();
    const res = await request(app)
      .post("/api/books")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "New Book", author: "Me", condition: "Good", price: 250 });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe("New Book");
  });

  it("rejects creation without a token", async () => {
    const res = await request(app)
      .post("/api/books")
      .send({ title: "No Auth", author: "X", condition: "Good" });
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/books/:id", () => {
  it("updates the owner's own book", async () => {
    const { user, token } = await createUser();
    const book = await createBook(user._id, { price: 100 });
    const res = await request(app)
      .put(`/api/books/${book._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ price: 999 });
    expect(res.status).toBe(200);
    expect(res.body.data.price).toBe(999);
  });

  it("rejects updating another user's book", async () => {
    const owner = await createUser();
    const other = await createUser();
    const book = await createBook(owner.user._id);
    const res = await request(app)
      .put(`/api/books/${book._id}`)
      .set("Authorization", `Bearer ${other.token}`)
      .send({ price: 1 });
    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/books/:id", () => {
  it("deletes the owner's own book", async () => {
    const { user, token } = await createUser();
    const book = await createBook(user._id);
    const res = await request(app)
      .delete(`/api/books/${book._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("rejects deleting another user's book", async () => {
    const owner = await createUser();
    const other = await createUser();
    const book = await createBook(owner.user._id);
    const res = await request(app)
      .delete(`/api/books/${book._id}`)
      .set("Authorization", `Bearer ${other.token}`);
    expect(res.status).toBe(403);
  });
});
