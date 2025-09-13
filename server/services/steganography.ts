import { createHash } from 'crypto';
import sharp from 'sharp';
import { cryptographyService } from './cryptography.js';
import { storage } from '../storage';

interface EmbedResult {
  stegoImageData: string;
  signatureHash: string;
  embedPositions: number[];
}

interface VerificationResult {
  isValid: boolean;
  imageId?: number;
  extractedSignature?: string;
  integrityScore: number;
  method: string;
  errorMessage?: string;
  imageMetadata?: any;
}

class SteganographyService {
  
  async authenticateImage(
    imageBuffer: Buffer,
    metadata: any,
    keyPair: { publicKey: string; privateKey: string }
  ): Promise<EmbedResult> {
    try {
      // Convert image to raw pixel data
      const { data: pixelData, info } = await sharp(imageBuffer)
        .raw()
        .ensureAlpha()
        .toBuffer({ resolveWithObject: true });

      // Generate deterministic embed positions
      const embedPositions = this.generateEmbedPositions(info.width * info.height * info.channels);
      
      // Compute hash of image content (excluding embed positions)
      const imageHash = this.computeImageHash(pixelData, embedPositions);
      
      // Create digital signature
      const signature = await cryptographyService.sign(imageHash, keyPair.privateKey, metadata.signatureType);
      
      // Convert signature to bit string
      const signatureBits = this.signatureToBits(signature);
      
      // Embed signature using LSB steganography
      const stegoPixelData = this.embedLSB(pixelData, signatureBits, embedPositions);
      
      // Convert back to image format
      const stegoImageBuffer = await sharp(stegoPixelData, {
        raw: {
          width: info.width,
          height: info.height,
          channels: info.channels
        }
      }).png().toBuffer();
      
      const stegoImageData = stegoImageBuffer.toString('base64');
      const signatureHash = createHash('sha256').update(signature).digest('hex');
      
      return {
        stegoImageData,
        signatureHash,
        embedPositions
      };
    } catch (error) {
      throw new Error(`Steganographic embedding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async verifyImage(imageBuffer: Buffer): Promise<VerificationResult> {
    try {
      // Extract raw pixel data
      const { data: pixelData, info } = await sharp(imageBuffer)
        .raw()
        .ensureAlpha()
        .toBuffer({ resolveWithObject: true });

      // Try to find matching image in database by attempting extraction
      const extractionAttempts = await this.attemptSignatureExtraction(pixelData, info);
      
      for (const attempt of extractionAttempts) {
        if (attempt.success) {
          // Verify signature against image hash
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
              method: 'LSB_extraction',
              imageMetadata: attempt.metadata
            };
          }
        }
      }
      
      return {
        isValid: false,
        integrityScore: 0,
        method: 'LSB_extraction',
        errorMessage: 'No valid signature found or signature verification failed'
      };
    } catch (error) {
      return {
        isValid: false,
        integrityScore: 0,
        method: 'LSB_extraction',
        errorMessage: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private generateEmbedPositions(totalPixels: number): number[] {
    // Generate deterministic positions using a simple pattern
    // In production, this could use a more sophisticated method
    const positions: number[] = [];
    const step = Math.floor(totalPixels / 2048); // Spread across image
    
    for (let i = 0; i < 2048 && i * step < totalPixels; i++) {
      positions.push(i * step);
    }
    
    return positions;
  }

  private computeImageHash(pixelData: Buffer, embedPositions: number[]): string {
    // Create a copy and zero out embed positions
    const modifiedData = Buffer.from(pixelData);
    
    for (const pos of embedPositions) {
      if (pos < modifiedData.length) {
        modifiedData[pos] = modifiedData[pos] & 0xFE; // Clear LSB
      }
    }
    
    return createHash('sha256').update(modifiedData).digest('hex');
  }

  private signatureToBits(signature: string): string {
    // Convert hex signature to binary string
    return signature
      .split('')
      .map(char => parseInt(char, 16).toString(2).padStart(4, '0'))
      .join('');
  }

  private embedLSB(pixelData: Buffer, bits: string, positions: number[]): Buffer {
    const modifiedData = Buffer.from(pixelData);
    
    for (let i = 0; i < bits.length && i < positions.length; i++) {
      const pos = positions[i];
      if (pos < modifiedData.length) {
        const bit = parseInt(bits[i]);
        modifiedData[pos] = (modifiedData[pos] & 0xFE) | bit;
      }
    }
    
    return modifiedData;
  }

  private extractLSB(pixelData: Buffer, positions: number[]): string {
    let bits = '';
    
    for (const pos of positions) {
      if (pos < pixelData.length) {
        bits += (pixelData[pos] & 1).toString();
      }
    }
    
    return bits;
  }

  private bitsToSignature(bits: string): string {
    // Convert binary string back to hex signature
    let hex = '';
    for (let i = 0; i < bits.length; i += 4) {
      const nibble = bits.substr(i, 4);
      if (nibble.length === 4) {
        hex += parseInt(nibble, 2).toString(16);
      }
    }
    return hex;
  }

  private async attemptSignatureExtraction(pixelData: Buffer, info: any) {
    const attempts = [];
    
    try {
      // Get all authenticated images to try extraction patterns
      const images = await storage.getAllAuthenticatedImages();
      
      for (const image of images) {
        try {
          const embedPositions = image.embedPositions as number[];
          if (!embedPositions) continue;
          
          const extractedBits = this.extractLSB(pixelData, embedPositions);
          const extractedSignature = this.bitsToSignature(extractedBits);
          
          // Calculate integrity score based on bit extraction success
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
          // Continue to next image
          continue;
        }
      }
    } catch (error) {
      console.error('Error in extraction attempts:', error);
    }
    
    return attempts;
  }

  private calculateIntegrityScore(bits: string): number {
    // Simple integrity check - in production this would be more sophisticated
    const totalBits = bits.length;
    const validBits = bits.split('').filter(bit => bit === '0' || bit === '1').length;
    return Math.round((validBits / totalBits) * 100);
  }
  // Add generateKeyPair method to delegate to cryptographyService
  async generateKeyPair(signatureType: string): Promise<{ publicKey: string; privateKey: string }> {
    return await cryptographyService.generateKeyPair(signatureType);
  }
}

export const steganographyService = new SteganographyService();
