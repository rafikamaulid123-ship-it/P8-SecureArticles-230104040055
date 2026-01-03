const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../app"); // <--- PERUBAHAN DISINI (sesuai struktur folder Anda)

// Load env agar variable terbaca (terutama jika ada config lain)
require("dotenv").config();

// Variabel global untuk instance database simulasi
let mongoServer;

// ============================================================================
// 1. SETUP & TEARDOWN
// ============================================================================

beforeAll(async () => {
  // A. Setup Environment Variables untuk Testing
  process.env.JWT_ACCESS_SECRET = "test_secret_access_123";
  process.env.JWT_REFRESH_SECRET = "test_secret_refresh_123";
  process.env.JWT_ACCESS_EXPIRES = "15m";
  process.env.JWT_REFRESH_EXPIRES = "7d";

  // B. Nyalakan MongoDB Memory Server (Database di RAM)
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // C. Hubungkan Mongoose ke Database RAM tersebut
  // Kita connect manual di sini agar tidak pakai database asli/lokal yg di .env
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });
});

afterAll(async () => {
  // D. Putuskan koneksi dan matikan database RAM setelah selesai
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // E. Bersihkan data antar test (supaya test A tidak mengganggu test B)
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// ============================================================================
// 2. TEST SUITES
// ============================================================================

describe("Auth Endpoints", () => {
  
  // Data dummy user
  const mockUser = {
    name: "Test User",
    email: "test@example.com",
    password: "password123",
  };

  // --- TEST REGISTER ---
  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send(mockUser);

      expect(res.statusCode).toEqual(201); // Created
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("email", mockUser.email);
    });

    it("should reject duplicate email", async () => {
      // 1. Daftar dulu sekali
      await request(app).post("/api/auth/register").send(mockUser);

      // 2. Daftar lagi
      const res = await request(app)
        .post("/api/auth/register")
        .send(mockUser);

      expect(res.statusCode).toEqual(409); // Conflict
    });
  });

  // --- TEST LOGIN ---
  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/auth/register").send(mockUser);
    });

    it("should login successfully", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: mockUser.email,
        password: mockUser.password,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toHaveProperty("accessToken");
    });

    it("should reject wrong password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: mockUser.email,
        password: "wrongpassword",
      });

      expect(res.statusCode).toEqual(401);
    });
  });

  // --- TEST GET PROFILE (PROTECTED) ---
  describe("GET /api/auth/me", () => {
    let token;

    beforeEach(async () => {
      // Register & Login untuk dapat token
      await request(app).post("/api/auth/register").send(mockUser);
      const loginRes = await request(app).post("/api/auth/login").send({
        email: mockUser.email,
        password: mockUser.password,
      });
      token = loginRes.body.data.accessToken;
    });

    it("should access profile with token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.email).toEqual(mockUser.email);
    });
  });
});