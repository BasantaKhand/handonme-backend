/**
 * Database seeder for HandOnMe.
 *
 * Usage:  npm run seed
 *
 * Wipes the Users, Books, Chats, Messages, and Reviews collections, then
 * repopulates them with realistic demo data so the UI has plenty to render.
 * Safe to re-run any time — it always resets to a known state.
 *
 * Demo login after seeding:  basanta@example.com  /  password123
 */
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/db");

const User = require("./models/User");
const Book = require("./models/Book");
const Chat = require("./models/Chat");
const Message = require("./models/Message");
const Review = require("./models/Review");

const CITIES = ["Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara"];
const CONDITIONS = ["Like New", "Good", "Fair", "Worn"];
const EXCHANGE = ["Cash", "Swap", "Both", "Free"];
const STATUS = ["Available", "Available", "Available", "Reserved", "Sold"];
const BADGES = ["Email", "Student", "Student", "Trusted", "None"];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ---- Demo users (password is the same for all: "password123") ----
const USERS = [
  { name: "Basanta Khand", email: "basanta@example.com", verificationBadge: "Student" },
  { name: "Aarav Shrestha", email: "aarav@example.com", verificationBadge: "Trusted" },
  { name: "Nisha Tamang", email: "nisha@example.com", verificationBadge: "Student" },
  { name: "Rohan Adhikari", email: "rohan@example.com", verificationBadge: "Email" },
  { name: "Priya Karki", email: "priya@example.com", verificationBadge: "Trusted" },
  { name: "Dipesh Thapa", email: "dipesh@example.com", verificationBadge: "Student" },
  { name: "Anita Maharjan", email: "anita@example.com", verificationBadge: "Trusted" },
  { name: "Sita Gurung", email: "sita@example.com", verificationBadge: "None" },
  { name: "Bikram Rai", email: "bikram@example.com", verificationBadge: "Email" },
  { name: "Sunita K.C.", email: "sunita@example.com", verificationBadge: "Student" },
];

// ---- Book catalogue (title / author / subject) ----
const CATALOG = [
  ["Engineering Mathematics", "S.S. Sabharwal", "Engineering"],
  ["Higher Engineering Mathematics", "B.S. Grewal", "Engineering"],
  ["C++ Programming", "BPB Publications", "Computer Science"],
  ["Data Structures & Algorithms", "Thomas Cormen", "Computer Science"],
  ["Introduction to Algorithms", "Cormen, Leiserson", "Computer Science"],
  ["Clean Code", "Robert C. Martin", "Computer Science"],
  ["The Pragmatic Programmer", "Andrew Hunt", "Computer Science"],
  ["Operating System Concepts", "Silberschatz", "Computer Science"],
  ["Database System Concepts", "Korth & Sudarshan", "Computer Science"],
  ["Computer Networks", "Andrew Tanenbaum", "Computer Science"],
  ["Chemistry Vol. I", "Dinesh Publications", "Science"],
  ["Chemistry Vol. II", "Dinesh Publications", "Science"],
  ["Concepts of Physics Vol. I", "H.C. Verma", "Science"],
  ["Concepts of Physics Vol. II", "H.C. Verma", "Science"],
  ["Fundamentals of Physics", "Halliday & Resnick", "Science"],
  ["Organic Chemistry", "Morrison & Boyd", "Science"],
  ["Mechanical Engineering", "R.K. Rajput", "Engineering"],
  ["Thermodynamics", "P.K. Nag", "Engineering"],
  ["Strength of Materials", "R.K. Bansal", "Engineering"],
  ["Civil Engineering Handbook", "M.L. Gambhir", "Engineering"],
  ["Fluid Mechanics", "R.K. Bansal", "Engineering"],
  ["Basic Electrical Engineering", "V.K. Mehta", "Engineering"],
  ["Business Studies Gr. 12", "Mero Guide Publication", "Commerce"],
  ["Principles of Economics", "N. Gregory Mankiw", "Commerce"],
  ["Financial Accounting", "T.S. Grewal", "Commerce"],
  ["Fundamentals of Management", "Stephen Robbins", "Commerce"],
  ["Marketing Management", "Philip Kotler", "Commerce"],
  ["Wings of Fire", "A.P.J. Abdul Kalam", "Arts & Humanities"],
  ["The Alchemist", "Paulo Coelho", "Arts & Humanities"],
  ["Sapiens", "Yuval Noah Harari", "Arts & Humanities"],
  ["Rich Dad Poor Dad", "Robert Kiyosaki", "Commerce"],
  ["English Grammar in Use", "Raymond Murphy", "Arts & Humanities"],
  ["Let Us C", "Yashavant Kanetkar", "Computer Science"],
  ["Head First Java", "Kathy Sierra", "Computer Science"],
  ["Digital Logic & Design", "M. Morris Mano", "Engineering"],
  ["Microprocessors", "Ramesh Gaonkar", "Engineering"],
  ["Discrete Mathematics", "Kenneth Rosen", "Computer Science"],
  ["Signals and Systems", "Alan Oppenheim", "Engineering"],
  ["Numerical Methods", "E. Balagurusamy", "Engineering"],
  ["Statistics for Management", "Levin & Rubin", "Commerce"],
];

async function seed() {
  await connectDB();
  console.log("Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Book.deleteMany({}),
    Chat.deleteMany({}),
    Message.deleteMany({}),
    Review.deleteMany({}),
  ]);

  // Create users (User.create runs the pre-save hook so passwords are hashed).
  console.log("Creating users...");
  const users = [];
  for (const u of USERS) {
    const user = await User.create({
      name: u.name,
      email: u.email,
      password: "password123",
      location: pick(CITIES),
      isVerified: u.verificationBadge !== "None",
      verificationBadge: u.verificationBadge,
      rating: Math.round((rand(38, 50) / 10) * 10) / 10,
      totalExchanges: rand(0, 40),
    });
    users.push(user);
  }
  const basanta = users[0];

  // Create books. Give the demo account (basanta) a solid set of listings.
  console.log("Creating books...");
  const bookDocs = CATALOG.map(([title, author, subject], i) => {
    const exchangeType = pick(EXCHANGE);
    const isFree = exchangeType === "Free";
    // First 5 books belong to the demo account so the dashboard is populated.
    const seller = i < 5 ? basanta._id : pick(users)._id;
    return {
      title,
      author,
      subject,
      edition: pick(["1st Edition", "2nd Edition", "3rd Edition", ""]),
      condition: pick(CONDITIONS),
      price: isFree ? 0 : rand(80, 800),
      exchangeType,
      location: pick(CITIES),
      status: pick(STATUS),
      views: rand(0, 120),
      photos: [],
      seller,
      description:
        "Well-kept copy, used for one semester. No missing pages. Meet-up in a public spot preferred.",
    };
  });
  const books = await Book.insertMany(bookDocs);

  // A few conversations so the dashboard "Recent Messages" has content.
  console.log("Creating chats and messages...");
  const partners = users.slice(1, 4); // Aarav, Nisha, Rohan
  const previews = [
    "Is the Business Studies book still available?",
    "Can we meet at Koteshwor tomorrow?",
    "Thank you! Great exchange 👍",
  ];
  for (let i = 0; i < partners.length; i++) {
    const chat = await Chat.create({
      participants: [basanta._id, partners[i]._id],
      book: books[i]._id,
    });
    const msg = await Message.create({
      chat: chat._id,
      sender: partners[i]._id,
      content: previews[i],
    });
    chat.lastMessage = msg._id;
    await chat.save();
  }

  // Some reviews to make ratings feel real.
  console.log("Creating reviews...");
  for (let i = 0; i < 12; i++) {
    const reviewer = pick(users);
    let reviewee = pick(users);
    while (reviewee._id.equals(reviewer._id)) reviewee = pick(users);
    await Review.create({
      rating: rand(3, 5),
      comment: pick([
        "Smooth exchange, friendly seller!",
        "Book was exactly as described.",
        "Quick to respond and easy to meet.",
        "Great condition, would deal again.",
      ]),
      reviewer: reviewer._id,
      reviewee: reviewee._id,
    });
  }

  console.log("\n✅ Seed complete");
  console.log(`   Users:   ${users.length}`);
  console.log(`   Books:   ${books.length}`);
  console.log(`   Chats:   ${partners.length}`);
  console.log("\n   Demo login →  basanta@example.com  /  password123\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error("Seed failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});
