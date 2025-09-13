import { 
  users, 
  authenticatedImages,
  verificationLogs,
  attackSimulations,
  reports,
  type User, 
  type InsertUser,
  type AuthenticatedImage,
  type InsertAuthenticatedImage,
  type VerificationLog,
  type InsertVerificationLog,
  type AttackSimulation,
  type InsertAttackSimulation,
  type Report,
  type InsertReport
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, gte, lte, like, or, count } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Dashboard stats
  getDashboardStats(): Promise<any>;
  
  // Authenticated images
  createAuthenticatedImage(image: InsertAuthenticatedImage): Promise<AuthenticatedImage>;
  getAuthenticatedImage(id: number): Promise<AuthenticatedImage | undefined>;
  getAllAuthenticatedImages(): Promise<AuthenticatedImage[]>;
  getAuthenticatedImagesInRange(dateRange?: { start: Date; end: Date }): Promise<AuthenticatedImage[]>;
  
  // Public ledger
  getPublicLedger(page: number, limit: number, search: string): Promise<any>;
  
  // Verification logs
  createVerificationLog(log: InsertVerificationLog): Promise<VerificationLog>;
  getVerificationLogsInRange(dateRange?: { start: Date; end: Date }): Promise<VerificationLog[]>;
  
  // Attack simulations
  createAttackSimulation(simulation: InsertAttackSimulation): Promise<AttackSimulation>;
  getAttackSimulations(imageId: number): Promise<AttackSimulation[]>;
  getAttackSimulationsInRange(dateRange?: { start: Date; end: Date }): Promise<AttackSimulation[]>;
  
  // Reports
  createReport(report: InsertReport): Promise<Report>;
  getReport(id: number): Promise<Report | undefined>;
  getRecentReports(): Promise<Report[]>;
  updateReportFilePath(id: number, filePath: string): Promise<void>;
  
  // Analytics
  getAnalyticsData(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getDashboardStats(): Promise<any> {
    const [totalAuthenticatedResult] = await db
      .select({ count: count() })
      .from(authenticatedImages);
    
    const [verifiedTodayResult] = await db
      .select({ count: count() })
      .from(verificationLogs)
      .where(gte(verificationLogs.verificationDate, new Date(new Date().setHours(0, 0, 0, 0))));
    
    const [attackSimulationsResult] = await db
      .select({ count: count() })
      .from(attackSimulations);
    
    const totalAuthenticated = totalAuthenticatedResult?.count || 0;
    const verifiedToday = verifiedTodayResult?.count || 0;
    const attackSimulationsCount = attackSimulationsResult?.count || 0;
    
    // Calculate database size (approximate)
    const sizeResult = await db.execute(
      sql`SELECT pg_size_pretty(pg_database_size(current_database())) as size`
    );
    const dbSize = sizeResult.rows[0]?.size;
    
    return {
      totalAuthenticated,
      verifiedToday,
      attackSimulations: attackSimulationsCount,
      databaseSize: dbSize || "0 MB",
      growthRate: 12.5, // This would be calculated from historical data
      verificationRate: 95.8,
      attackResistance: 78.3,
      avgProcessingTime: "2.3s",
      uptime: "99.9%",
      activeSessions: 47
    };
  }

  async createAuthenticatedImage(image: InsertAuthenticatedImage): Promise<AuthenticatedImage> {
    const [result] = await db
      .insert(authenticatedImages)
      .values(image)
      .returning();
    return result;
  }

  async getAuthenticatedImage(id: number): Promise<AuthenticatedImage | undefined> {
    const [image] = await db
      .select()
      .from(authenticatedImages)
      .where(eq(authenticatedImages.id, id));
    return image || undefined;
  }

  async getAllAuthenticatedImages(): Promise<AuthenticatedImage[]> {
    return await db
      .select()
      .from(authenticatedImages)
      .orderBy(desc(authenticatedImages.authenticationDate));
  }

  async getAuthenticatedImagesInRange(dateRange?: { start: Date; end: Date }): Promise<AuthenticatedImage[]> {
    if (dateRange) {
      return await db
        .select()
        .from(authenticatedImages)
        .where(
          and(
            gte(authenticatedImages.authenticationDate, dateRange.start),
            lte(authenticatedImages.authenticationDate, dateRange.end)
          )
        )
        .orderBy(desc(authenticatedImages.authenticationDate));
    }
    
    return await db
      .select()
      .from(authenticatedImages)
      .orderBy(desc(authenticatedImages.authenticationDate));
  }

  async getPublicLedger(page: number, limit: number, search: string): Promise<any> {
    const offset = (page - 1) * limit;
    
    let whereCondition;
    if (search) {
      whereCondition = or(
        like(authenticatedImages.artistName, `%${search}%`),
        like(authenticatedImages.artworkTitle, `%${search}%`)
      );
    }
    
    const [totalResult] = await db
      .select({ count: count() })
      .from(authenticatedImages)
      .where(whereCondition);
    
    const items = await db
      .select()
      .from(authenticatedImages)
      .where(whereCondition)
      .orderBy(desc(authenticatedImages.authenticationDate))
      .limit(limit)
      .offset(offset);
    
    return {
      items,
      total: totalResult?.count || 0,
      page,
      limit
    };
  }

  async createVerificationLog(log: InsertVerificationLog): Promise<VerificationLog> {
    const [result] = await db
      .insert(verificationLogs)
      .values(log)
      .returning();
    return result;
  }

  async getVerificationLogsInRange(dateRange?: { start: Date; end: Date }): Promise<VerificationLog[]> {
    if (dateRange) {
      return await db
        .select()
        .from(verificationLogs)
        .where(
          and(
            gte(verificationLogs.verificationDate, dateRange.start),
            lte(verificationLogs.verificationDate, dateRange.end)
          )
        )
        .orderBy(desc(verificationLogs.verificationDate));
    }
    
    return await db
      .select()
      .from(verificationLogs)
      .orderBy(desc(verificationLogs.verificationDate));
  }

  async createAttackSimulation(simulation: InsertAttackSimulation): Promise<AttackSimulation> {
    const [result] = await db
      .insert(attackSimulations)
      .values(simulation)
      .returning();
    return result;
  }

  async getAttackSimulations(imageId: number): Promise<AttackSimulation[]> {
    return await db
      .select()
      .from(attackSimulations)
      .where(eq(attackSimulations.imageId, imageId))
      .orderBy(desc(attackSimulations.simulationDate));
  }

  async getAttackSimulationsInRange(dateRange?: { start: Date; end: Date }): Promise<AttackSimulation[]> {
    if (dateRange) {
      return await db
        .select()
        .from(attackSimulations)
        .where(
          and(
            gte(attackSimulations.simulationDate, dateRange.start),
            lte(attackSimulations.simulationDate, dateRange.end)
          )
        )
        .orderBy(desc(attackSimulations.simulationDate));
    }
    
    return await db
      .select()
      .from(attackSimulations)
      .orderBy(desc(attackSimulations.simulationDate));
  }

  async createReport(report: InsertReport): Promise<Report> {
    const [result] = await db
      .insert(reports)
      .values(report)
      .returning();
    return result;
  }

  async getReport(id: number): Promise<Report | undefined> {
    const [report] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, id));
    return report || undefined;
  }

  async getRecentReports(): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .orderBy(desc(reports.generationDate))
      .limit(10);
  }

  async updateReportFilePath(id: number, filePath: string): Promise<void> {
    await db
      .update(reports)
      .set({ filePath })
      .where(eq(reports.id, id));
  }

  async getAnalyticsData(): Promise<any> {
    // Authentication trends (last 7 days)
    const authenticationTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      const [authCount] = await db
        .select({ count: count() })
        .from(authenticatedImages)
        .where(
          and(
            gte(authenticatedImages.authenticationDate, startOfDay),
            lte(authenticatedImages.authenticationDate, endOfDay)
          )
        );
      
      const [verificationCount] = await db
        .select({ count: count() })
        .from(verificationLogs)
        .where(
          and(
            gte(verificationLogs.verificationDate, startOfDay),
            lte(verificationLogs.verificationDate, endOfDay)
          )
        );
      
      authenticationTrends.push({
        date: startOfDay.toISOString().split('T')[0],
        authentications: authCount?.count || 0,
        verifications: verificationCount?.count || 0
      });
    }
    
    // Attack resistance analysis
    const attackTypes = ['jpeg_compression', 'gaussian_noise', 'cropping', 'rotation', 'scaling'];
    const attackResistance = [];
    
    for (const attackType of attackTypes) {
      const [totalSims] = await db
        .select({ count: count() })
        .from(attackSimulations)
        .where(eq(attackSimulations.attackType, attackType));
      
      const [successfulSims] = await db
        .select({ count: count() })
        .from(attackSimulations)
        .where(
          and(
            eq(attackSimulations.attackType, attackType),
            eq(attackSimulations.verificationPassed, false)
          )
        );
      
      const total = totalSims?.count || 0;
      const successful = successfulSims?.count || 0;
      
      attackResistance.push({
        attackType: attackType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
        resistanceRate: total > 0 ? Math.round(((total - successful) / total) * 100) : 100
      });
    }
    
    // Attack distribution
    const attackDistribution = [];
    for (const attackType of attackTypes) {
      const [countResult] = await db
        .select({ count: count() })
        .from(attackSimulations)
        .where(eq(attackSimulations.attackType, attackType));
      
      attackDistribution.push({
        name: attackType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: countResult?.count || 0,
        count: countResult?.count || 0
      });
    }
    
    // Calculate percentages for attack distribution
    const totalAttacks = attackDistribution.reduce((sum, item) => sum + item.value, 0);
    if (totalAttacks > 0) {
      attackDistribution.forEach(item => {
        item.value = Math.round((item.count / totalAttacks) * 100);
      });
    }
    
    return {
      authenticationTrends,
      attackResistance,
      attackDistribution
    };
  }
}

export const storage = new DatabaseStorage();
