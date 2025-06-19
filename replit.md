# YouTube Video Downloader Pro

## Overview

This is a modern full-stack YouTube video downloader application built with React, Express, and TypeScript. The application allows users to analyze YouTube videos, view their details, and download them in various formats and qualities. It features a clean, responsive interface with real-time progress tracking and modern UI components.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Style**: REST API with JSON responses
- **Video Processing**: ytdl-core library for YouTube video analysis and downloading
- **Development Server**: Vite middleware integration for seamless dev experience

### Database Layer
- **ORM**: Drizzle ORM with TypeScript-first approach
- **Database**: PostgreSQL (configured via Drizzle config)
- **Migrations**: Drizzle Kit for schema management
- **Connection**: Neon Database serverless driver

## Key Components

### Core Features
1. **URL Analysis**: YouTube URL validation and video metadata extraction
2. **Format Selection**: Support for multiple video and audio formats
3. **Download Management**: Progress tracking and file delivery
4. **Responsive Design**: Mobile-first approach with adaptive layouts

### Data Models
- **Users**: Basic user authentication structure
- **Downloads**: Video metadata and format information storage
- **Schema Validation**: Zod schemas for type-safe data validation

### UI Components
- **Modern Design**: Clean interface with gradient backgrounds and card layouts
- **Interactive Elements**: Form validation, progress indicators, and toast notifications
- **Responsive Grid**: Adaptive layouts for different screen sizes
- **Accessibility**: ARIA-compliant components with keyboard navigation

## Data Flow

1. **URL Input**: User pastes YouTube URL into input field
2. **Validation**: Client-side URL validation before API call
3. **Analysis**: Server fetches video metadata using ytdl-core
4. **Caching**: Video information stored in database for future requests
5. **Format Selection**: User chooses preferred format and quality
6. **Download**: Server streams video data directly to client
7. **Progress Tracking**: Real-time download progress simulation

## External Dependencies

### Core Libraries
- **ytdl-core**: YouTube video downloading and metadata extraction
- **@neondatabase/serverless**: PostgreSQL database connection
- **@tanstack/react-query**: Server state management and caching
- **drizzle-orm**: Type-safe database operations

### UI Libraries
- **@radix-ui/***: Headless UI components for accessibility
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Modern icon library
- **class-variance-authority**: Type-safe CSS class variants

### Development Tools
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **tsx**: TypeScript execution for development
- **esbuild**: Production bundling for server code

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite HMR for instant client updates
- **Server Restart**: tsx watch mode for server changes
- **Database**: Local PostgreSQL or Neon serverless instance
- **Port Configuration**: Client on port 5000, API on same port

### Production Build
- **Client Build**: Vite static asset generation
- **Server Bundle**: esbuild compilation to single file
- **Asset Serving**: Express static file serving
- **Environment Variables**: DATABASE_URL required for deployment

### Replit Integration
- **Auto-scaling**: Configured for Replit's autoscale deployment
- **Module Support**: Node.js 20, Web, and PostgreSQL 16
- **Workflow**: Automated build and start processes

## User Preferences

Preferred communication style: Simple, everyday language.

## Deployment Options

### Replit Deployment
- Configured for Replit's autoscale deployment
- Auto-scaling with Node.js 20, Web, and PostgreSQL 16 modules
- Automated build and start processes

### Render.com Deployment
- Docker configuration added with Dockerfile and .dockerignore
- render.yaml blueprint for automatic deployment
- Health check endpoint at root path
- PORT environment variable support for cloud deployment
- Complete deployment documentation in README.md

## Changelog

Changelog:
- June 19, 2025. Initial setup
- June 19, 2025. Updated to @distube/ytdl-core library for better YouTube compatibility, fixed TypeScript errors, resolved CSS import issues. Application now successfully analyzes YouTube videos and provides download functionality for MP4 video and MP3 audio formats. Ready for deployment.
- June 19, 2025. Added Docker support for Render.com deployment with complete configuration files, health check endpoint, and deployment documentation.
- June 19, 2025. Fixed Docker production build issues by creating dedicated production entry point (server/production-entry.ts) that eliminates dynamic Vite imports. Implemented multi-stage Docker build with separate client and server bundling. Docker deployment now works correctly on Render.com without module resolution errors.
- June 19, 2025. Resolved frontend serving issues by moving health check endpoint from "/" to "/health" allowing React interface to load properly. Added improved error handling for YouTube rate limiting (429 errors) with retry logic and user-friendly error messages. Application now successfully handles video analysis, downloads, and rate limiting gracefully. Production deployment is fully functional.