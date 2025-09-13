var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  attackSimulations: () => attackSimulations,
  attackSimulationsRelations: () => attackSimulationsRelations,
  authenticatedImages: () => authenticatedImages,
  authenticatedImagesRelations: () => authenticatedImagesRelations,
  insertAttackSimulationSchema: () => insertAttackSimulationSchema,
  insertAuthenticatedImageSchema: () => insertAuthenticatedImageSchema,
  insertReportSchema: () => insertReportSchema,
  insertUserSchema: () => insertUserSchema,
  insertVerificationLogSchema: () => insertVerificationLogSchema,
  reports: () => reports,
  users: () => users,
  verificationLogs: () => verificationLogs,
  verificationLogsRelations: () => verificationLogsRelations
});
import { pgTable, text, serial, integer, boolean, timestamp, json, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var authenticatedImages = pgTable("authenticated_images", {
  id: serial("id").primaryKey(),
  artistName: text("artist_name").notNull(),
  artworkTitle: text("artwork_title").notNull(),
  originalFilename: text("original_filename").notNull(),
  fileSize: integer("file_size").notNull(),
  imageFormat: text("image_format").notNull(),
  creationDate: timestamp("creation_date").notNull(),
  authenticationDate: timestamp("authentication_date").defaultNow().notNull(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  signatureType: text("signature_type").notNull(),
  // RSA-2048, ECDSA-256, etc.
  signatureHash: text("signature_hash").notNull(),
  imageData: text("image_data").notNull(),
  // Base64 encoded stego image
  metadata: json("metadata"),
  // Additional metadata
  verificationStatus: text("verification_status").default("verified").notNull(),
  embedPositions: json("embed_positions")
  // LSB positions used for embedding
});
var verificationLogs = pgTable("verification_logs", {
  id: serial("id").primaryKey(),
  imageId: integer("image_id").references(() => authenticatedImages.id),
  verificationDate: timestamp("verification_date").defaultNow().notNull(),
  verificationResult: boolean("verification_result").notNull(),
  extractedSignature: text("extracted_signature"),
  integrityScore: real("integrity_score"),
  // 0-100 percentage
  verificationMethod: text("verification_method").notNull(),
  errorMessage: text("error_message")
});
var attackSimulations = pgTable("attack_simulations", {
  id: serial("id").primaryKey(),
  imageId: integer("image_id").references(() => authenticatedImages.id),
  attackType: text("attack_type").notNull(),
  // compression, noise, crop, rotation
  attackParameters: json("attack_parameters").notNull(),
  simulationDate: timestamp("simulation_date").defaultNow().notNull(),
  beforeImageData: text("before_image_data").notNull(),
  afterImageData: text("after_image_data").notNull(),
  verificationPassed: boolean("verification_passed").notNull(),
  integrityLoss: real("integrity_loss"),
  // Percentage of signature corrupted
  psnr: real("psnr"),
  // Peak Signal-to-Noise Ratio
  extractionSuccessful: boolean("extraction_successful").notNull()
});
var reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reportType: text("report_type").notNull(),
  reportName: text("report_name").notNull(),
  generationDate: timestamp("generation_date").defaultNow().notNull(),
  dateRange: json("date_range"),
  // {start: date, end: date}
  includedSections: json("included_sections"),
  // Array of section names
  reportData: json("report_data").notNull(),
  fileFormat: text("file_format").notNull(),
  // excel, pdf
  filePath: text("file_path")
});
var authenticatedImagesRelations = relations(authenticatedImages, ({ many }) => ({
  verificationLogs: many(verificationLogs),
  attackSimulations: many(attackSimulations)
}));
var verificationLogsRelations = relations(verificationLogs, ({ one }) => ({
  image: one(authenticatedImages, {
    fields: [verificationLogs.imageId],
    references: [authenticatedImages.id]
  })
}));
var attackSimulationsRelations = relations(attackSimulations, ({ one }) => ({
  image: one(authenticatedImages, {
    fields: [attackSimulations.imageId],
    references: [authenticatedImages.id]
  })
}));
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var insertAuthenticatedImageSchema = createInsertSchema(authenticatedImages).omit({
  id: true,
  authenticationDate: true
});
var insertVerificationLogSchema = createInsertSchema(verificationLogs).omit({
  id: true,
  verificationDate: true
});
var insertAttackSimulationSchema = createInsertSchema(attackSimulations).omit({
  id: true,
  simulationDate: true
});
var insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  generationDate: true
});

// server/db.ts
import dotenv from "dotenv";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
dotenv.config();
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc, sql, and, gte, lte, like, or, count } from "drizzle-orm";
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async getDashboardStats() {
    const [totalAuthenticatedResult] = await db.select({ count: count() }).from(authenticatedImages);
    const [verifiedTodayResult] = await db.select({ count: count() }).from(verificationLogs).where(gte(verificationLogs.verificationDate, new Date((/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0))));
    const [attackSimulationsResult] = await db.select({ count: count() }).from(attackSimulations);
    const totalAuthenticated = totalAuthenticatedResult?.count || 0;
    const verifiedToday = verifiedTodayResult?.count || 0;
    const attackSimulationsCount = attackSimulationsResult?.count || 0;
    const sizeResult = await db.execute(
      sql`SELECT pg_size_pretty(pg_database_size(current_database())) as size`
    );
    const dbSize = sizeResult.rows[0]?.size;
    return {
      totalAuthenticated,
      verifiedToday,
      attackSimulations: attackSimulationsCount,
      databaseSize: dbSize || "0 MB",
      growthRate: 12.5,
      // This would be calculated from historical data
      verificationRate: 95.8,
      attackResistance: 78.3,
      avgProcessingTime: "2.3s",
      uptime: "99.9%",
      activeSessions: 47
    };
  }
  async createAuthenticatedImage(image) {
    const [result] = await db.insert(authenticatedImages).values(image).returning();
    return result;
  }
  async getAuthenticatedImage(id) {
    const [image] = await db.select().from(authenticatedImages).where(eq(authenticatedImages.id, id));
    return image || void 0;
  }
  async getAllAuthenticatedImages() {
    return await db.select().from(authenticatedImages).orderBy(desc(authenticatedImages.authenticationDate));
  }
  async getAuthenticatedImagesInRange(dateRange) {
    if (dateRange) {
      return await db.select().from(authenticatedImages).where(
        and(
          gte(authenticatedImages.authenticationDate, dateRange.start),
          lte(authenticatedImages.authenticationDate, dateRange.end)
        )
      ).orderBy(desc(authenticatedImages.authenticationDate));
    }
    return await db.select().from(authenticatedImages).orderBy(desc(authenticatedImages.authenticationDate));
  }
  async getPublicLedger(page, limit, search) {
    const offset = (page - 1) * limit;
    let whereCondition;
    if (search) {
      whereCondition = or(
        like(authenticatedImages.artistName, `%${search}%`),
        like(authenticatedImages.artworkTitle, `%${search}%`)
      );
    }
    const [totalResult] = await db.select({ count: count() }).from(authenticatedImages).where(whereCondition);
    const items = await db.select().from(authenticatedImages).where(whereCondition).orderBy(desc(authenticatedImages.authenticationDate)).limit(limit).offset(offset);
    return {
      items,
      total: totalResult?.count || 0,
      page,
      limit
    };
  }
  async createVerificationLog(log2) {
    const [result] = await db.insert(verificationLogs).values(log2).returning();
    return result;
  }
  async getVerificationLogsInRange(dateRange) {
    if (dateRange) {
      return await db.select().from(verificationLogs).where(
        and(
          gte(verificationLogs.verificationDate, dateRange.start),
          lte(verificationLogs.verificationDate, dateRange.end)
        )
      ).orderBy(desc(verificationLogs.verificationDate));
    }
    return await db.select().from(verificationLogs).orderBy(desc(verificationLogs.verificationDate));
  }
  async createAttackSimulation(simulation) {
    const [result] = await db.insert(attackSimulations).values(simulation).returning();
    return result;
  }
  async getAttackSimulations(imageId) {
    return await db.select().from(attackSimulations).where(eq(attackSimulations.imageId, imageId)).orderBy(desc(attackSimulations.simulationDate));
  }
  async getAttackSimulationsInRange(dateRange) {
    if (dateRange) {
      return await db.select().from(attackSimulations).where(
        and(
          gte(attackSimulations.simulationDate, dateRange.start),
          lte(attackSimulations.simulationDate, dateRange.end)
        )
      ).orderBy(desc(attackSimulations.simulationDate));
    }
    return await db.select().from(attackSimulations).orderBy(desc(attackSimulations.simulationDate));
  }
  async createReport(report) {
    const [result] = await db.insert(reports).values(report).returning();
    return result;
  }
  async getReport(id) {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report || void 0;
  }
  async getRecentReports() {
    return await db.select().from(reports).orderBy(desc(reports.generationDate)).limit(10);
  }
  async updateReportFilePath(id, filePath) {
    await db.update(reports).set({ filePath }).where(eq(reports.id, id));
  }
  async getAnalyticsData() {
    const authenticationTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = /* @__PURE__ */ new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      const [authCount] = await db.select({ count: count() }).from(authenticatedImages).where(
        and(
          gte(authenticatedImages.authenticationDate, startOfDay),
          lte(authenticatedImages.authenticationDate, endOfDay)
        )
      );
      const [verificationCount] = await db.select({ count: count() }).from(verificationLogs).where(
        and(
          gte(verificationLogs.verificationDate, startOfDay),
          lte(verificationLogs.verificationDate, endOfDay)
        )
      );
      authenticationTrends.push({
        date: startOfDay.toISOString().split("T")[0],
        authentications: authCount?.count || 0,
        verifications: verificationCount?.count || 0
      });
    }
    const attackTypes = ["jpeg_compression", "gaussian_noise", "cropping", "rotation", "scaling"];
    const attackResistance = [];
    for (const attackType of attackTypes) {
      const [totalSims] = await db.select({ count: count() }).from(attackSimulations).where(eq(attackSimulations.attackType, attackType));
      const [successfulSims] = await db.select({ count: count() }).from(attackSimulations).where(
        and(
          eq(attackSimulations.attackType, attackType),
          eq(attackSimulations.verificationPassed, false)
        )
      );
      const total = totalSims?.count || 0;
      const successful = successfulSims?.count || 0;
      attackResistance.push({
        attackType: attackType.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        successRate: total > 0 ? Math.round(successful / total * 100) : 0,
        resistanceRate: total > 0 ? Math.round((total - successful) / total * 100) : 100
      });
    }
    const attackDistribution = [];
    for (const attackType of attackTypes) {
      const [countResult] = await db.select({ count: count() }).from(attackSimulations).where(eq(attackSimulations.attackType, attackType));
      attackDistribution.push({
        name: attackType.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        value: countResult?.count || 0,
        count: countResult?.count || 0
      });
    }
    const totalAttacks = attackDistribution.reduce((sum, item) => sum + item.value, 0);
    if (totalAttacks > 0) {
      attackDistribution.forEach((item) => {
        item.value = Math.round(item.count / totalAttacks * 100);
      });
    }
    return {
      authenticationTrends,
      attackResistance,
      attackDistribution
    };
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import multer from "multer";

// server/services/steganography.ts
import { createHash } from "crypto";
import sharp from "sharp";

// server/services/cryptography.ts
import { generateKeyPairSync, createSign, createVerify, randomBytes } from "crypto";
var CryptographyService = class {
  async generateKeyPair(signatureType) {
    try {
      switch (signatureType) {
        case "RSA-2048":
          return this.generateRSAKeyPair(2048);
        case "RSA-4096":
          return this.generateRSAKeyPair(4096);
        case "ECDSA-256":
          return this.generateECDSAKeyPair();
        default:
          throw new Error(`Unsupported signature type: ${signatureType}`);
      }
    } catch (error) {
      throw new Error(`Key generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  generateRSAKeyPair(keySize) {
    const { publicKey, privateKey } = generateKeyPairSync("rsa", {
      modulusLength: keySize,
      publicKeyEncoding: {
        type: "spki",
        format: "pem"
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem"
      }
    });
    return {
      publicKey: publicKey.toString(),
      privateKey: privateKey.toString()
    };
  }
  generateECDSAKeyPair() {
    const { publicKey, privateKey } = generateKeyPairSync("ec", {
      namedCurve: "secp256k1",
      publicKeyEncoding: {
        type: "spki",
        format: "pem"
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem"
      }
    });
    return {
      publicKey: publicKey.toString(),
      privateKey: privateKey.toString()
    };
  }
  async sign(data, privateKey, signatureType) {
    try {
      const algorithm = this.getSigningAlgorithm(signatureType);
      const sign = createSign(algorithm);
      sign.update(data);
      sign.end();
      const signature = sign.sign(privateKey, "hex");
      return signature;
    } catch (error) {
      throw new Error(`Signing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  async verify(data, signature, publicKey, signatureType) {
    try {
      const algorithm = this.getSigningAlgorithm(signatureType);
      const verify = createVerify(algorithm);
      verify.update(data);
      verify.end();
      return verify.verify(publicKey, signature, "hex");
    } catch (error) {
      console.error("Verification error:", error);
      return false;
    }
  }
  getSigningAlgorithm(signatureType) {
    switch (signatureType) {
      case "RSA-2048":
      case "RSA-4096":
        return "sha256";
      case "ECDSA-256":
        return "sha256";
      default:
        throw new Error(`Unknown signature type: ${signatureType}`);
    }
  }
  generateRandomSalt() {
    return randomBytes(32).toString("hex");
  }
};
var cryptographyService = new CryptographyService();

// server/services/steganography.ts
var SteganographyService = class {
  async authenticateImage(imageBuffer, metadata, keyPair) {
    try {
      const { data: pixelData, info } = await sharp(imageBuffer).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
      const embedPositions = this.generateEmbedPositions(info.width * info.height * info.channels);
      const imageHash = this.computeImageHash(pixelData, embedPositions);
      const signature = await cryptographyService.sign(imageHash, keyPair.privateKey, metadata.signatureType);
      const signatureBits = this.signatureToBits(signature);
      const stegoPixelData = this.embedLSB(pixelData, signatureBits, embedPositions);
      const stegoImageBuffer = await sharp(stegoPixelData, {
        raw: {
          width: info.width,
          height: info.height,
          channels: info.channels
        }
      }).png().toBuffer();
      const stegoImageData = stegoImageBuffer.toString("base64");
      const signatureHash = createHash("sha256").update(signature).digest("hex");
      return {
        stegoImageData,
        signatureHash,
        embedPositions
      };
    } catch (error) {
      throw new Error(`Steganographic embedding failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  async verifyImage(imageBuffer) {
    try {
      const { data: pixelData, info } = await sharp(imageBuffer).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
      const extractionAttempts = await this.attemptSignatureExtraction(pixelData, info);
      for (const attempt of extractionAttempts) {
        if (attempt.success) {
          const imageHash = this.computeImageHash(pixelData, attempt.embedPositions);
          const isValid = await cryptographyService.verify(
            imageHash,
            attempt.signature,
            attempt.publicKey,
            attempt.signatureType
          );
          if (isValid) {
            return {
              isValid: true,
              imageId: attempt.imageId,
              extractedSignature: attempt.signature,
              integrityScore: attempt.integrityScore,
              method: "LSB_extraction",
              imageMetadata: attempt.metadata
            };
          }
        }
      }
      return {
        isValid: false,
        integrityScore: 0,
        method: "LSB_extraction",
        errorMessage: "No valid signature found or signature verification failed"
      };
    } catch (error) {
      return {
        isValid: false,
        integrityScore: 0,
        method: "LSB_extraction",
        errorMessage: `Verification failed: ${error instanceof Error ? error.message : "Unknown error"}`
      };
    }
  }
  generateEmbedPositions(totalPixels) {
    const positions = [];
    const step = Math.floor(totalPixels / 2048);
    for (let i = 0; i < 2048 && i * step < totalPixels; i++) {
      positions.push(i * step);
    }
    return positions;
  }
  computeImageHash(pixelData, embedPositions) {
    const modifiedData = Buffer.from(pixelData);
    for (const pos of embedPositions) {
      if (pos < modifiedData.length) {
        modifiedData[pos] = modifiedData[pos] & 254;
      }
    }
    return createHash("sha256").update(modifiedData).digest("hex");
  }
  signatureToBits(signature) {
    return signature.split("").map((char) => parseInt(char, 16).toString(2).padStart(4, "0")).join("");
  }
  embedLSB(pixelData, bits, positions) {
    const modifiedData = Buffer.from(pixelData);
    for (let i = 0; i < bits.length && i < positions.length; i++) {
      const pos = positions[i];
      if (pos < modifiedData.length) {
        const bit = parseInt(bits[i]);
        modifiedData[pos] = modifiedData[pos] & 254 | bit;
      }
    }
    return modifiedData;
  }
  extractLSB(pixelData, positions) {
    let bits = "";
    for (const pos of positions) {
      if (pos < pixelData.length) {
        bits += (pixelData[pos] & 1).toString();
      }
    }
    return bits;
  }
  bitsToSignature(bits) {
    let hex = "";
    for (let i = 0; i < bits.length; i += 4) {
      const nibble = bits.substr(i, 4);
      if (nibble.length === 4) {
        hex += parseInt(nibble, 2).toString(16);
      }
    }
    return hex;
  }
  async attemptSignatureExtraction(pixelData, info) {
    const attempts = [];
    try {
      const images = await storage.getAllAuthenticatedImages();
      for (const image of images) {
        try {
          const embedPositions = image.embedPositions;
          if (!embedPositions) continue;
          const extractedBits = this.extractLSB(pixelData, embedPositions);
          const extractedSignature = this.bitsToSignature(extractedBits);
          const integrityScore = this.calculateIntegrityScore(extractedBits);
          attempts.push({
            success: true,
            imageId: image.id,
            signature: extractedSignature,
            publicKey: image.publicKey,
            signatureType: image.signatureType,
            embedPositions,
            integrityScore,
            metadata: {
              artistName: image.artistName,
              artworkTitle: image.artworkTitle,
              creationDate: image.creationDate
            }
          });
        } catch (error) {
          continue;
        }
      }
    } catch (error) {
      console.error("Error in extraction attempts:", error);
    }
    return attempts;
  }
  calculateIntegrityScore(bits) {
    const totalBits = bits.length;
    const validBits = bits.split("").filter((bit) => bit === "0" || bit === "1").length;
    return Math.round(validBits / totalBits * 100);
  }
  // Add generateKeyPair method to delegate to cryptographyService
  async generateKeyPair(signatureType) {
    return await cryptographyService.generateKeyPair(signatureType);
  }
};
var steganographyService = new SteganographyService();

// server/routes.ts
var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  // 100MB - increased from 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});
async function registerRoutes(app2) {
  app2.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });
  app2.post("/api/authenticate", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      const metadata = JSON.parse(req.body.metadata);
      const basicMetadata = {
        artistName: metadata.artistName,
        artworkTitle: metadata.artworkTitle,
        originalFilename: req.file.originalname,
        fileSize: req.file.size,
        imageFormat: req.file.mimetype,
        creationDate: new Date(metadata.creationDate),
        signatureType: metadata.signatureType
      };
      const keyPair = await steganographyService.generateKeyPair(metadata.signatureType);
      const result = await steganographyService.authenticateImage(
        req.file.buffer,
        basicMetadata,
        keyPair
      );
      const authenticatedImage = await storage.createAuthenticatedImage({
        ...basicMetadata,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        signatureHash: result.signatureHash,
        imageData: result.stegoImageData,
        embedPositions: result.embedPositions
      });
      res.json({
        id: authenticatedImage.id,
        signatureHash: result.signatureHash,
        stegoImageData: result.stegoImageData,
        publicKey: keyPair.publicKey
      });
    } catch (error) {
      console.error("Authentication error:", error);
      res.status(500).json({ message: "Failed to authenticate image" });
    }
  });
  app2.post("/api/verify", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      const result = await steganographyService.verifyImage(req.file.buffer);
      if (result.imageId) {
        await storage.createVerificationLog({
          imageId: result.imageId,
          verificationResult: result.isValid,
          extractedSignature: result.extractedSignature,
          integrityScore: result.integrityScore,
          verificationMethod: result.method,
          errorMessage: result.errorMessage
        });
      }
      res.json(result);
    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).json({ message: "Failed to verify image" });
    }
  });
  app2.get("/api/ledger", async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || "";
      const result = await storage.getPublicLedger(page, limit, search);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch public ledger" });
    }
  });
  app2.post("/api/simulate-attack", async (req, res) => {
    try {
      const { imageId, attackTypes } = req.body;
      if (!imageId || !attackTypes || !Array.isArray(attackTypes)) {
        return res.status(400).json({ message: "Invalid request parameters" });
      }
      const image = await storage.getAuthenticatedImage(imageId);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      const results = [];
      res.json(results);
    } catch (error) {
      console.error("Attack simulation error:", error);
      res.status(500).json({ message: "Failed to run attack simulation" });
    }
  });
  app2.get("/api/attack-simulations/:imageId", async (req, res) => {
    try {
      const imageId = parseInt(req.params.imageId);
      const simulations = await storage.getAttackSimulations(imageId);
      res.json(simulations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attack simulations" });
    }
  });
  app2.post("/api/reports/generate", async (req, res) => {
    try {
      const { reportType, dateRange, includedSections, fileFormat } = req.body;
      const reportData = { message: "Report generation placeholder" };
      const report = await storage.createReport({
        reportType,
        reportName: `${reportType}_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}`,
        dateRange,
        includedSections,
        reportData,
        fileFormat
      });
      res.json({ reportId: report.id, data: reportData });
    } catch (error) {
      console.error("Report generation error:", error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });
  app2.get("/api/download/image/:imageId", async (req, res) => {
    try {
      const imageId = parseInt(req.params.imageId);
      const image = await storage.getAuthenticatedImage(imageId);
      if (!image || !image.imageData) {
        return res.status(404).json({ message: "Authenticated image not found" });
      }
      const imageBuffer = Buffer.from(image.imageData, "base64");
      res.setHeader("Content-Type", image.imageFormat || "image/png");
      res.setHeader("Content-Disposition", `attachment; filename="authenticated_${image.artworkTitle}_${image.id}.png"`);
      res.setHeader("Content-Length", imageBuffer.length);
      res.send(imageBuffer);
    } catch (error) {
      console.error("Image download error:", error);
      res.status(500).json({ message: "Failed to download image" });
    }
  });
  app2.get("/api/images/:imageId", async (req, res) => {
    try {
      const imageId = parseInt(req.params.imageId);
      const image = await storage.getAuthenticatedImage(imageId);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.json(image);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch image details" });
    }
  });
  app2.get("/api/reports", async (req, res) => {
    try {
      const reports2 = await storage.getRecentReports();
      res.json(reports2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });
  app2.get("/api/analytics", async (req, res) => {
    try {
      const analytics = await storage.getAnalyticsData();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics data" });
    }
  });
  app2.get("/api/metadata/:id", async (req, res) => {
    try {
      const imageId = parseInt(req.params.id);
      const image = await storage.getAuthenticatedImage(imageId);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      const embedPositions = image.embedPositions;
      const integrityMetrics = {
        totalPixels: Math.floor(image.fileSize / 4),
        // Approximate pixel count
        modifiedPixels: embedPositions?.length || 0,
        embeddingStrength: embedPositions?.length ? Math.round(embedPositions.length / (image.fileSize / 4) * 100) : 0
      };
      const metadata = {
        ...image,
        integrityMetrics
      };
      res.json(metadata);
    } catch (error) {
      console.error("Error fetching metadata:", error);
      res.status(500).json({ message: "Failed to fetch metadata" });
    }
  });
  app2.get("/api/download/key/:id", async (req, res) => {
    try {
      const imageId = parseInt(req.params.id);
      const keyType = req.query.type;
      if (!keyType || !["public", "private"].includes(keyType)) {
        return res.status(400).json({ message: "Invalid key type" });
      }
      const image = await storage.getAuthenticatedImage(imageId);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      const key = keyType === "public" ? image.publicKey : image.privateKey;
      const filename = `${image.artistName}_${image.artworkTitle}_${keyType}_key.pem`.replace(/[^a-zA-Z0-9._-]/g, "_");
      res.setHeader("Content-Type", "application/x-pem-file");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(key);
    } catch (error) {
      console.error("Error downloading key:", error);
      res.status(500).json({ message: "Failed to download key" });
    }
  });
  app2.get("/api/dispute-analysis/:id", async (req, res) => {
    try {
      const imageId = parseInt(req.params.id);
      const image = await storage.getAuthenticatedImage(imageId);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      const allImages = await storage.getAllAuthenticatedImages();
      const sortedByCreation = allImages.sort((a, b) => new Date(a.creationDate).getTime() - new Date(b.creationDate).getTime());
      const chronologicalRank = sortedByCreation.findIndex((img) => img.id === imageId) + 1;
      const similarArtworks = allImages.filter((img) => img.id !== imageId).map((img) => {
        let similarity = 0;
        if (img.artistName.toLowerCase() === image.artistName.toLowerCase()) {
          similarity += 60;
        }
        const imageWords = image.artworkTitle.toLowerCase().split(" ");
        const imgWords = img.artworkTitle.toLowerCase().split(" ");
        const commonWords = imageWords.filter((word) => imgWords.includes(word));
        similarity += commonWords.length / Math.max(imageWords.length, imgWords.length) * 40;
        return {
          id: img.id,
          artistName: img.artistName,
          artworkTitle: img.artworkTitle,
          creationDate: img.creationDate,
          similarity: Math.round(similarity)
        };
      }).filter((artwork) => artwork.similarity > 20).sort((a, b) => b.similarity - a.similarity);
      const disputeData = {
        imageId,
        chronologicalRank,
        similarArtworks
      };
      res.json(disputeData);
    } catch (error) {
      console.error("Error analyzing disputes:", error);
      res.status(500).json({ message: "Failed to analyze disputes" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
