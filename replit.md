# replit.md

## Overview

StegoAuth is a steganographic image authentication platform that combines cryptographic signatures with steganographic embedding to authenticate and verify digital images. The system uses Least Significant Bit (LSB) steganography to hide digital signatures within images, providing transparent authentication while preserving image quality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a full-stack architecture with a React frontend, Express.js backend, and PostgreSQL database using Drizzle ORM. The system is built as a monorepo with shared schemas and types between frontend and backend.

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Library**: Radix UI with shadcn/ui components
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack React Query for server state
- **Routing**: Wouter for client-side routing
- **Charts**: Recharts for data visualization
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Digital signatures (RSA-2048, RSA-4096, ECDSA-256)
- **File Processing**: Multer for file uploads, Sharp for image processing
- **Steganography**: Custom LSB embedding implementation
- **Session Management**: PostgreSQL session store

## Key Components

### Authentication System
The core authentication flow involves:
1. **Image Upload**: Users upload original artwork images
2. **Hash Generation**: SHA-256 hash computed from image content
3. **Digital Signature**: Hash signed using artist's private key (RSA/ECDSA)
4. **Steganographic Embedding**: Signature bits embedded using LSB steganography
5. **Storage**: Authenticated image stored with metadata and verification data

### Verification System
The verification process:
1. **Signature Extraction**: LSB bits extracted from suspect image
2. **Hash Verification**: Extracted signature verified against image hash
3. **Integrity Scoring**: Partial matches scored for forensic analysis
4. **Result Logging**: All verification attempts logged for audit trail

### Attack Simulation
Comprehensive robustness testing:
- **JPEG Compression**: Quality reduction attacks
- **Gaussian Noise**: Random noise injection
- **Geometric Attacks**: Cropping, rotation, scaling
- **Automated Testing**: Batch simulation with resistance scoring

### Reporting System
Analytics and compliance features:
- **Dashboard Statistics**: Real-time authentication and verification metrics
- **Trend Analysis**: Time-series data for authentication patterns
- **Attack Resistance Reports**: Detailed robustness analysis
- **Export Capabilities**: Excel/PDF report generation

## Data Flow

1. **Authentication Flow**:
   - Image upload → Hash generation → Digital signing → LSB embedding → Database storage
   
2. **Verification Flow**:
   - Image upload → LSB extraction → Signature verification → Integrity scoring → Result logging

3. **Analytics Flow**:
   - Database aggregation → Trend calculation → Chart data generation → Dashboard rendering

## External Dependencies

### Core Infrastructure
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database ORM
- **sharp**: High-performance image processing
- **multer**: Multipart form handling for file uploads

### Cryptography
- **crypto**: Node.js built-in cryptographic functions
- **RSA/ECDSA**: Digital signature algorithms

### Frontend Libraries
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI components
- **recharts**: Data visualization
- **tailwindcss**: Utility-first CSS framework

### Development Tools
- **vite**: Fast build tool and dev server
- **typescript**: Type safety and developer experience
- **drizzle-kit**: Database migration management

## Deployment Strategy

### Development Environment
- **Vite Dev Server**: Hot module replacement for frontend development
- **Express Server**: Backend API with automatic restarts
- **Database**: PostgreSQL with Drizzle migrations

### Production Build
- **Frontend**: Vite static build to `dist/public`
- **Backend**: ESBuild bundle to `dist/index.js`
- **Database**: Migration-based schema management
- **Environment**: Node.js production server

### Configuration
- **Environment Variables**: `DATABASE_URL` for PostgreSQL connection
- **Build Scripts**: Separate development and production configurations
- **Asset Handling**: Attached assets and static file serving

The system is designed for research and demonstration of steganographic authentication techniques, with comprehensive logging and analysis capabilities for academic and forensic applications.