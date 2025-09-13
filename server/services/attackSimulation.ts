import sharp from 'sharp';
import { steganographyService } from './steganography';

interface AttackParameters {
  [key: string]: any;
}

interface AttackResult {
  attackType: string;
  parameters: AttackParameters;
  beforeImageData: string;
  afterImageData: string;
  verificationPassed: boolean;
  integrityLoss: number;
  psnr: number;
  extractionSuccessful: boolean;
}

class AttackSimulationService {
  
  async runSimulations(image: any, attackTypes: string[]): Promise<AttackResult[]> {
    const results: AttackResult[] = [];
    
    // Convert base64 image to buffer
    const originalBuffer = Buffer.from(image.imageData, 'base64');
    
    for (const attackType of attackTypes) {
      try {
        const result = await this.simulateAttack(originalBuffer, attackType, image);
        results.push(result);
      } catch (error) {
        console.error(`Attack simulation failed for ${attackType}:`, error);
        // Add failed result
        results.push({
          attackType,
          parameters: {},
          beforeImageData: image.imageData,
          afterImageData: image.imageData,
          verificationPassed: false,
          integrityLoss: 100,
          psnr: 0,
          extractionSuccessful: false
        });
      }
    }
    
    return results;
  }

  private async simulateAttack(originalBuffer: Buffer, attackType: string, image: any): Promise<AttackResult> {
    let attackedBuffer: Buffer;
    let parameters: AttackParameters;
    
    switch (attackType) {
      case 'jpeg_compression':
        parameters = { quality: 70 };
        attackedBuffer = await this.applyJPEGCompression(originalBuffer, parameters.quality);
        break;
        
      case 'gaussian_noise':
        parameters = { sigma: 0.1 };
        attackedBuffer = await this.applyGaussianNoise(originalBuffer, parameters.sigma);
        break;
        
      case 'cropping':
        parameters = { cropPercentage: 10 };
        attackedBuffer = await this.applyCropping(originalBuffer, parameters.cropPercentage);
        break;
        
      case 'rotation':
        parameters = { angle: 5 };
        attackedBuffer = await this.applyRotation(originalBuffer, parameters.angle);
        break;
        
      case 'scaling':
        parameters = { scaleFactor: 0.8 };
        attackedBuffer = await this.applyScaling(originalBuffer, parameters.scaleFactor);
        break;
        
      default:
        throw new Error(`Unknown attack type: ${attackType}`);
    }
    
    // Convert buffers to base64
    const beforeImageData = originalBuffer.toString('base64');
    const afterImageData = attackedBuffer.toString('base64');
    
    // Verify attacked image
    const verificationResult = await steganographyService.verifyImage(attackedBuffer);
    
    // Calculate PSNR
    const psnr = await this.calculatePSNR(originalBuffer, attackedBuffer);
    
    return {
      attackType,
      parameters,
      beforeImageData,
      afterImageData,
      verificationPassed: verificationResult.isValid,
      integrityLoss: 100 - verificationResult.integrityScore,
      psnr,
      extractionSuccessful: verificationResult.extractedSignature !== undefined
    };
  }

  private async applyJPEGCompression(buffer: Buffer, quality: number): Promise<Buffer> {
    return await sharp(buffer)
      .jpeg({ quality })
      .toBuffer();
  }

  private async applyGaussianNoise(buffer: Buffer, sigma: number): Promise<Buffer> {
    // Get image info
    const { data, info } = await sharp(buffer)
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Apply Gaussian noise
    const noisyData = Buffer.from(data);
    for (let i = 0; i < noisyData.length; i++) {
      const noise = this.gaussianRandom() * sigma * 255;
      const newValue = Math.max(0, Math.min(255, noisyData[i] + noise));
      noisyData[i] = Math.round(newValue);
    }
    
    // Convert back to image
    return await sharp(noisyData, {
      raw: {
        width: info.width,
        height: info.height,
        channels: info.channels
      }
    }).png().toBuffer();
  }

  private async applyCropping(buffer: Buffer, cropPercentage: number): Promise<Buffer> {
    const metadata = await sharp(buffer).metadata();
    const cropSize = Math.floor(Math.min(metadata.width!, metadata.height!) * (cropPercentage / 100));
    
    return await sharp(buffer)
      .extract({
        left: cropSize,
        top: cropSize,
        width: metadata.width! - 2 * cropSize,
        height: metadata.height! - 2 * cropSize
      })
      .toBuffer();
  }

  private async applyRotation(buffer: Buffer, angle: number): Promise<Buffer> {
    return await sharp(buffer)
      .rotate(angle)
      .toBuffer();
  }

  private async applyScaling(buffer: Buffer, scaleFactor: number): Promise<Buffer> {
    const metadata = await sharp(buffer).metadata();
    const newWidth = Math.floor(metadata.width! * scaleFactor);
    const newHeight = Math.floor(metadata.height! * scaleFactor);
    
    return await sharp(buffer)
      .resize(newWidth, newHeight)
      .toBuffer();
  }

  private async calculatePSNR(original: Buffer, modified: Buffer): Promise<number> {
    try {
      // Get raw pixel data for both images
      const originalData = await sharp(original).raw().toBuffer();
      const modifiedData = await sharp(modified).raw().toBuffer();
      
      // Resize modified to match original if needed
      const originalMeta = await sharp(original).metadata();
      const modifiedResized = await sharp(modified)
        .resize(originalMeta.width, originalMeta.height)
        .raw()
        .toBuffer();
      
      // Calculate MSE
      let mse = 0;
      const minLength = Math.min(originalData.length, modifiedResized.length);
      
      for (let i = 0; i < minLength; i++) {
        const diff = originalData[i] - modifiedResized[i];
        mse += diff * diff;
      }
      
      mse /= minLength;
      
      // Calculate PSNR
      if (mse === 0) return 100; // Perfect match
      
      const maxPixelValue = 255;
      const psnr = 20 * Math.log10(maxPixelValue / Math.sqrt(mse));
      
      return Math.round(psnr * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error('PSNR calculation error:', error);
      return 0;
    }
  }

  private gaussianRandom(): number {
    // Box-Muller transform for Gaussian random numbers
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }
}

export const attackSimulationService = new AttackSimulationService();
