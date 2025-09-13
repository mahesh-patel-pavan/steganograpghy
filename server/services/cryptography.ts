import { generateKeyPairSync, createSign, createVerify, randomBytes } from 'crypto';
import * as crypto from 'crypto';

interface KeyPair {
  publicKey: string;
  privateKey: string;
}

class CryptographyService {
  
  async generateKeyPair(signatureType: string): Promise<KeyPair> {
    try {
      switch (signatureType) {
        case 'RSA-2048':
          return this.generateRSAKeyPair(2048);
        case 'RSA-4096':
          return this.generateRSAKeyPair(4096);
        case 'ECDSA-256':
          return this.generateECDSAKeyPair();
        default:
          throw new Error(`Unsupported signature type: ${signatureType}`);
      }
    } catch (error) {
      throw new Error(`Key generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private generateRSAKeyPair(keySize: number): KeyPair {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: keySize,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    return {
      publicKey: publicKey.toString(),
      privateKey: privateKey.toString()
    };
  }

  private generateECDSAKeyPair(): KeyPair {
    const { publicKey, privateKey } = generateKeyPairSync('ec', {
      namedCurve: 'secp256k1',
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    return {
      publicKey: publicKey.toString(),
      privateKey: privateKey.toString()
    };
  }

  async sign(data: string, privateKey: string, signatureType: string): Promise<string> {
    try {
      const algorithm = this.getSigningAlgorithm(signatureType);
      const sign = createSign(algorithm);
      sign.update(data);
      sign.end();
      
      const signature = sign.sign(privateKey, 'hex');
      return signature;
    } catch (error) {
      throw new Error(`Signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async verify(data: string, signature: string, publicKey: string, signatureType: string): Promise<boolean> {
    try {
      const algorithm = this.getSigningAlgorithm(signatureType);
      const verify = createVerify(algorithm);
      verify.update(data);
      verify.end();
      
      return verify.verify(publicKey, signature, 'hex');
    } catch (error) {
      console.error('Verification error:', error);
      return false;
    }
  }

  private getSigningAlgorithm(signatureType: string): string {
    switch (signatureType) {
      case 'RSA-2048':
      case 'RSA-4096':
        return 'sha256';
      case 'ECDSA-256':
        return 'sha256';
      default:
        throw new Error(`Unknown signature type: ${signatureType}`);
    }
  }

  generateRandomSalt(): string {
    return randomBytes(32).toString('hex');
  }
}

export const cryptographyService = new CryptographyService();
