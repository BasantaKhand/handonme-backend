const request = require("supertest");
const { app } = require("../../server");
const { createUser, createBook } = require("../helpers");

describe("POST /api/chats", () => {
  it("creates a new chat", async () => {
    const buyer = await createUser();
    const seller = await createUser();
    const book = await createBook(seller.user._id);

    const res = await request(app)
      .post("/api/chats")
      .set("Authorization", `Bearer ${buyer.token}`)
      .send({ bookId: book._id, sellerId: seller.user._id });

    expect(res.status).toBe(201);
    expect(res.body.data.participants).toHaveLength(2);
  });

  it("returns the existing chat if one already exists", async () => {
    const buyer = await createUser();
    const seller = await createUser();
    const book = await createBook(seller.user._id);
    const payload = { bookId: book._id, sellerId: seller.user._id };

    const first = await request(app)
      .post("/api/chats")
      .set("Authorization", `Bearer ${buyer.token}`)
      .send(payload);
    const second = await request(app)
      .post("/api/chats")
      .set("Authorization", `Bearer ${buyer.token}`)
      .send(payload);

    expect(second.status).toBe(200);
    expect(second.body.data._id).toBe(first.body.data._id);
  });
});

describe("GET /api/chats", () => {
  it("returns the user's chats", async () => {
    const buyer = await createUser();
    const seller = await createUser();
    const book = await createBook(seller.user._id);
    await request(app)
      .post("/api/chats")
      .set("Authorization", `Bearer ${buyer.token}`)
      .send({ bookId: book._id, sellerId: seller.user._id });

    const res = await request(app)
      .get("/api/chats")
      .set("Authorization", `Bearer ${buyer.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe("POST /api/chats/:id/messages", () => {
  it("sends a message as a participant", async () => {
    const buyer = await createUser();
    const seller = await createUser();
    const book = await createBook(seller.user._id);
    const chat = (
      await request(app)
        .post("/api/chats")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ bookId: book._id, sellerId: seller.user._id })
    ).body.data;

    const res = await request(app)
      .post(`/api/chats/${chat._id}/messages`)
      .set("Authorization", `Bearer ${buyer.token}`)
      .send({ content: "Hello there" });
    expect(res.status).toBe(201);
    expect(res.body.data.content).toBe("Hello there");
  });

  it("rejects a non-participant", async () => {
    const buyer = await createUser();
    const seller = await createUser();
    const outsider = await createUser();
    const book = await createBook(seller.user._id);
    const chat = (
      await request(app)
        .post("/api/chats")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ bookId: book._id, sellerId: seller.user._id })
    ).body.data;

    const res = await request(app)
      .post(`/api/chats/${chat._id}/messages`)
      .set("Authorization", `Bearer ${outsider.token}`)
      .send({ content: "Intruder" });
    expect(res.status).toBe(403);
  });
});
