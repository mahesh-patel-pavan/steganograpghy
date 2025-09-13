import { pgTable, text, serial, integer, boolean, timestamp, json, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const authenticatedImages = pgTable("authenticated_images", {
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
  signatureType: text("signature_type").notNull(), // RSA-2048, ECDSA-256, etc.
  signatureHash: text("signature_hash").notNull(),
  imageData: text("image_data").notNull(), // Base64 encoded stego image
  metadata: json("metadata"), // Additional metadata
  verificationStatus: text("verification_status").default("verified").notNull(),
  embedPositions: json("embed_positions"), // LSB positions used for embedding
});

export const verificationLogs = pgTable("verification_logs", {
  id: serial("id").primaryKey(),
  imageId: integer("image_id").references(() => authenticatedImages.id),
  verificationDate: timestamp("verification_date").defaultNow().notNull(),
  verificationResult: boolean("verification_result").notNull(),
  extractedSignature: text("extracted_signature"),
  integrityScore: real("integrity_score"), // 0-100 percentage
  verificationMethod: text("verification_method").notNull(),
  errorMessage: text("error_message"),
});

export const attackSimulations = pgTable("attack_simulations", {
  id: serial("id").primaryKey(),
  imageId: integer("image_id").references(() => authenticatedImages.id),
  attackType: text("attack_type").notNull(), // compression, noise, crop, rotation
  attackParameters: json("attack_parameters").notNull(),
  simulationDate: timestamp("simulation_date").defaultNow().notNull(),
  beforeImageData: text("before_image_data").notNull(),
  afterImageData: text("after_image_data").notNull(),
  verificationPassed: boolean("verification_passed").notNull(),
  integrityLoss: real("integrity_loss"), // Percentage of signature corrupted
  psnr: real("psnr"), // Peak Signal-to-Noise Ratio
  extractionSuccessful: boolean("extraction_successful").notNull(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reportType: text("report_type").notNull(),
  reportName: text("report_name").notNull(),
  generationDate: timestamp("generation_date").defaultNow().notNull(),
  dateRange: json("date_range"), // {start: date, end: date}
  includedSections: json("included_sections"), // Array of section names
  reportData: json("report_data").notNull(),
  fileFormat: text("file_format").notNull(), // excel, pdf
  filePath: text("file_path"),
});

// Relations
export const authenticatedImagesRelations = relations(authenticatedImages, ({ many }) => ({
  verificationLogs: many(verificationLogs),
  attackSimulations: many(attackSimulations),
}));

export const verificationLogsRelations = relations(verificationLogs, ({ one }) => ({
  image: one(authenticatedImages, {
    fields: [verificationLogs.imageId],
    references: [authenticatedImages.id],
  }),
}));

export const attackSimulationsRelations = relations(attackSimulations, ({ one }) => ({
  image: one(authenticatedImages, {
    fields: [attackSimulations.imageId],
    references: [authenticatedImages.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertAuthenticatedImageSchema = createInsertSchema(authenticatedImages).omit({
  id: true,
  authenticationDate: true,
});

export const insertVerificationLogSchema = createInsertSchema(verificationLogs).omit({
  id: true,
  verificationDate: true,
});

export const insertAttackSimulationSchema = createInsertSchema(attackSimulations).omit({
  id: true,
  simulationDate: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  generationDate: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type AuthenticatedImage = typeof authenticatedImages.$inferSelect;
export type InsertAuthenticatedImage = z.infer<typeof insertAuthenticatedImageSchema>;

export type VerificationLog = typeof verificationLogs.$inferSelect;
export type InsertVerificationLog = z.infer<typeof insertVerificationLogSchema>;

export type AttackSimulation = typeof attackSimulations.$inferSelect;
export type InsertAttackSimulation = z.infer<typeof insertAttackSimulationSchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
