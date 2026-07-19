const request = require("supertest");
const { app } = require("../../server");
const { createUser, createBook } = require("../helpers");

// Helper: set up a buyer, seller, book, and a chat between them.
async function setupChat() {
  const buyer = await createUser();
  const seller = await createUser();
  const book = await createBook(seller.user._id);
  const chat = (
    await request(app)
      .post("/api/chats")
      .set("Authorization", `Bearer ${buyer.token}`)
      .send({ bookId: book._id, sellerId: seller.user._id })
  ).body.data;
  return { buyer, seller, book, chat };
}

function propose(token, chatId) {
  return request(app)
    .post("/api/meetups")
    .set("Authorization", `Bearer ${token}`)
    .send({
      chatId,
      date: "2026-08-01",
      time: "3:00 PM",
      location: "TU Campus Gate",
      safeSpot: true,
    });
}

describe("POST /api/meetups", () => {
  it("creates a meetup proposal", async () => {
    const { buyer, chat } = await setupChat();
    const res = await propose(buyer.token, chat._id);
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("proposed");
    expect(res.body.data.proposedTo).toBeDefined();
  });
});

describe("PUT /api/meetups/:id/respond", () => {
  it("confirms a meetup (by the recipient)", async () => {
    const { buyer, seller, chat } = await setupChat();
    const meetup = (await propose(buyer.token, chat._id)).body.data;
    const res = await request(app)
      .put(`/api/meetups/${meetup._id}/respond`)
      .set("Authorization", `Bearer ${seller.token}`)
      .send({ action: "confirm" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("confirmed");
  });

  it("cancels a meetup (by the recipient)", async () => {
    const { buyer, seller, chat } = await setupChat();
    const meetup = (await propose(buyer.token, chat._id)).body.data;
    const res = await request(app)
      .put(`/api/meetups/${meetup._id}/respond`)
      .set("Authorization", `Bearer ${seller.token}`)
      .send({ action: "cancel" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("cancelled");
  });

  it("rejects a response from the proposer", async () => {
    const { buyer, chat } = await setupChat();
    const meetup = (await propose(buyer.token, chat._id)).body.data;
    const res = await request(app)
      .put(`/api/meetups/${meetup._id}/respond`)
      .set("Authorization", `Bearer ${buyer.token}`)
      .send({ action: "confirm" });
    expect(res.status).toBe(403);
  });
});

describe("PUT /api/meetups/:id/complete", () => {
  it("marks complete by a participant", async () => {
    const { buyer, chat } = await setupChat();
    const meetup = (await propose(buyer.token, chat._id)).body.data;
    const res = await request(app)
      .put(`/api/meetups/${meetup._id}/complete`)
      .set("Authorization", `Bearer ${buyer.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.completedBy).toContain(buyer.user._id.toString());
  });

  it("completes the exchange when both participants mark complete", async () => {
    const { buyer, seller, chat } = await setupChat();
    const meetup = (await propose(buyer.token, chat._id)).body.data;
    await request(app)
      .put(`/api/meetups/${meetup._id}/complete`)
      .set("Authorization", `Bearer ${buyer.token}`);
    const res = await request(app)
      .put(`/api/meetups/${meetup._id}/complete`)
      .set("Authorization", `Bearer ${seller.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("completed");
  });
});
