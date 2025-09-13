import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import multer from "multer";
import { steganographyService } from "./services/steganography";
import { insertAuthenticatedImageSchema, insertVerificationLogSchema, insertAttackSimulationSchema } from "@shared/schema";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB - increased from 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get dashboard statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  // Authenticate image with steganographic embedding
  app.post("/api/authenticate", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const metadata = JSON.parse(req.body.metadata);
      
      // Validate basic metadata first
      const basicMetadata = {
        artistName: metadata.artistName,
        artworkTitle: metadata.artworkTitle,
        originalFilename: req.file.originalname,
        fileSize: req.file.size,
        imageFormat: req.file.mimetype,
        creationDate: new Date(metadata.creationDate),
        signatureType: metadata.signatureType
      };

      // Generate key pair using steganography service
      const keyPair = await steganographyService.generateKeyPair(metadata.signatureType);
      
      // Create signature and embed it steganographically
      const result = await steganographyService.authenticateImage(
        req.file.buffer,
        basicMetadata,
        keyPair
      );

      // Now create the complete authenticated image record
      const authenticatedImage = await storage.createAuthenticatedImage({
        ...basicMetadata,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        signatureHash: result.signatureHash,
        imageData: result.stegoImageData,
        embedPositions: result.embedPositions,
      });

      res.json({
        id: authenticatedImage.id,
        signatureHash: result.signatureHash,
        stegoImageData: result.stegoImageData,
        publicKey: keyPair.publicKey,
      });
    } catch (error) {
      console.error("Authentication error:", error);
      res.status(500).json({ message: "Failed to authenticate image" });
    }
  });

  // Verify image authenticity
  app.post("/api/verify", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const result = await steganographyService.verifyImage(req.file.buffer);
      
      // Log verification attempt
      if (result.imageId) {
        await storage.createVerificationLog({
          imageId: result.imageId,
          verificationResult: result.isValid,
          extractedSignature: result.extractedSignature,
          integrityScore: result.integrityScore,
          verificationMethod: result.method,
          errorMessage: result.errorMessage,
        });
      }

      res.json(result);
    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).json({ message: "Failed to verify image" });
    }
  });

  // Get public ledger with pagination and search
  app.get("/api/ledger", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string || "";
      
      const result = await storage.getPublicLedger(page, limit, search);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch public ledger" });
    }
  });

  // Run attack simulation
  app.post("/api/simulate-attack", async (req, res) => {
    try {
      const { imageId, attackTypes } = req.body;
      
      if (!imageId || !attackTypes || !Array.isArray(attackTypes)) {
        return res.status(400).json({ message: "Invalid request parameters" });
      }

      const image = await storage.getAuthenticatedImage(imageId);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      // For now, return a simple attack simulation response
      const results: any[] = []; // Placeholder until attack simulation service is implemented
      
      // Store simulation results (placeholder for now)
      // for (const result of results) {
      //   await storage.createAttackSimulation({...});
      // }

      res.json(results);
    } catch (error) {
      console.error("Attack simulation error:", error);
      res.status(500).json({ message: "Failed to run attack simulation" });
    }
  });

  // Get attack simulation results
  app.get("/api/attack-simulations/:imageId", async (req, res) => {
    try {
      const imageId = parseInt(req.params.imageId);
      const simulations = await storage.getAttackSimulations(imageId);
      res.json(simulations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attack simulations" });
    }
  });

  // Generate reports (simplified)
  app.post("/api/reports/generate", async (req, res) => {
    try {
      const { reportType, dateRange, includedSections, fileFormat } = req.body;
      
      // Simplified report generation
      const reportData = { message: "Report generation placeholder" };

      const report = await storage.createReport({
        reportType,
        reportName: `${reportType}_${new Date().toISOString().split('T')[0]}`,
        dateRange,
        includedSections,
        reportData,
        fileFormat,
      });

      res.json({ reportId: report.id, data: reportData });
    } catch (error) {
      console.error("Report generation error:", error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  // Download authenticated image with embedded steganographic signature
  app.get("/api/download/image/:imageId", async (req, res) => {
    try {
      const imageId = parseInt(req.params.imageId);
      const image = await storage.getAuthenticatedImage(imageId);
      
      if (!image || !image.imageData) {
        return res.status(404).json({ message: "Authenticated image not found" });
      }

      // Convert base64 imageData back to buffer
      const imageBuffer = Buffer.from(image.imageData, 'base64');
      
      // Set appropriate headers
      res.setHeader('Content-Type', image.imageFormat || 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="authenticated_${image.artworkTitle}_${image.id}.png"`);
      res.setHeader('Content-Length', imageBuffer.length);
      
      res.send(imageBuffer);
    } catch (error) {
      console.error("Image download error:", error);
      res.status(500).json({ message: "Failed to download image" });
    }
  });

  // Get authenticated image details
  app.get("/api/images/:imageId", async (req, res) => {
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

  // Get recent reports
  app.get("/api/reports", async (req, res) => {
    try {
      const reports = await storage.getRecentReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // Get analytics data
  app.get("/api/analytics", async (req, res) => {
    try {
      const analytics = await storage.getAnalyticsData();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics data" });
    }
  });

  // Metadata API route
  app.get('/api/metadata/:id', async (req, res) => {
    try {
      const imageId = parseInt(req.params.id);
      const image = await storage.getAuthenticatedImage(imageId);
      
      if (!image) {
        return res.status(404).json({ message: 'Image not found' });
      }

      // Calculate steganographic metrics
      const embedPositions = image.embedPositions as number[];
      const integrityMetrics = {
        totalPixels: Math.floor(image.fileSize / 4), // Approximate pixel count
        modifiedPixels: embedPositions?.length || 0,
        embeddingStrength: embedPositions?.length ? Math.round((embedPositions.length / (image.fileSize / 4)) * 100) : 0
      };

      const metadata = {
        ...image,
        integrityMetrics
      };

      res.json(metadata);
    } catch (error) {
      console.error('Error fetching metadata:', error);
      res.status(500).json({ message: 'Failed to fetch metadata' });
    }
  });

  // Key download route
  app.get('/api/download/key/:id', async (req, res) => {
    try {
      const imageId = parseInt(req.params.id);
      const keyType = req.query.type as 'public' | 'private';
      
      if (!keyType || !['public', 'private'].includes(keyType)) {
        return res.status(400).json({ message: 'Invalid key type' });
      }

      const image = await storage.getAuthenticatedImage(imageId);
      if (!image) {
        return res.status(404).json({ message: 'Image not found' });
      }

      const key = keyType === 'public' ? image.publicKey : image.privateKey;
      const filename = `${image.artistName}_${image.artworkTitle}_${keyType}_key.pem`.replace(/[^a-zA-Z0-9._-]/g, '_');

      res.setHeader('Content-Type', 'application/x-pem-file');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(key);
    } catch (error) {
      console.error('Error downloading key:', error);
      res.status(500).json({ message: 'Failed to download key' });
    }
  });

  // Dispute analysis route
  app.get('/api/dispute-analysis/:id', async (req, res) => {
    try {
      const imageId = parseInt(req.params.id);
      const image = await storage.getAuthenticatedImage(imageId);
      
      if (!image) {
        return res.status(404).json({ message: 'Image not found' });
      }

      // Get all images for chronological analysis
      const allImages = await storage.getAllAuthenticatedImages();
      
      // Sort by creation date to determine chronological rank
      const sortedByCreation = allImages
        .sort((a, b) => new Date(a.creationDate).getTime() - new Date(b.creationDate).getTime());
      
      const chronologicalRank = sortedByCreation.findIndex(img => img.id === imageId) + 1;

      // Find similar artworks (simple similarity based on artist name or title keywords)
      const similarArtworks = allImages
        .filter(img => img.id !== imageId)
        .map(img => {
          let similarity = 0;
          
          // Check artist name similarity
          if (img.artistName.toLowerCase() === image.artistName.toLowerCase()) {
            similarity += 60;
          }
          
          // Check title word overlap
          const imageWords = image.artworkTitle.toLowerCase().split(' ');
          const imgWords = img.artworkTitle.toLowerCase().split(' ');
          const commonWords = imageWords.filter(word => imgWords.includes(word));
          similarity += (commonWords.length / Math.max(imageWords.length, imgWords.length)) * 40;
          
          return {
            id: img.id,
            artistName: img.artistName,
            artworkTitle: img.artworkTitle,
            creationDate: img.creationDate,
            similarity: Math.round(similarity)
          };
        })
        .filter(artwork => artwork.similarity > 20) // Only show if >20% similar
        .sort((a, b) => b.similarity - a.similarity);

      const disputeData = {
        imageId,
        chronologicalRank,
        similarArtworks
      };

      res.json(disputeData);
    } catch (error) {
      console.error('Error analyzing disputes:', error);
      res.status(500).json({ message: 'Failed to analyze disputes' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
