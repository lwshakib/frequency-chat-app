# Frequency Chat Server

The backend for the Frequency Chat App, built with Express, Socket.io, and Prisma.

## 🚀 Features

- **RESTful API**: Clean and structured API endpoints for users, conversations, and messages.
- **Real-time Connectivity**: Powered by Socket.io for low-latency messaging.
- **ORM & Database**: Prisma ORM with PostgreSQL for robust data management.
- **Authentication**: Secure auth integration using Better Auth.
- **Media Support**: Cloudinary integration for handling file uploads.
- **Message Queuing**: Kafka integration for scalable message processing.
- **Caching**: Redis for session management and real-time state.
- **Logging**: Structured logging with Winston and Morgan.

## 🛠️ Technologies

- **Runtime**: Bun
- **Framework**: Express 5
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Real-time**: Socket.io
- **Caching**: Redis
- **Message Broker**: Kafka
- **Validation**: Zod
- **Storage**: Cloudinary

## 🏁 Getting Started

### Prerequisites

- [Bun](https://bun.sh/)
- Docker (for Kafka, Redis, Postgres)

### Installation

1. **Install dependencies:**

   ```bash
   bun install
   ```

2. **Environment Variables:**
   Create a `.env` file in the root of the `server/` directory and add the following:

   ```env
   PORT=4000
   NODE_ENV=development
   DATABASE_URL="postgresql://user:password@localhost:5432/frequency"

   # Auth (Better Auth)
   BETTER_AUTH_SECRET=your_secret
   BETTER_AUTH_URL=http://localhost:4000

   # Google OAuth
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret

   # Frontend URL
   WEB_URL=http://localhost:3000

   # Cloudinary
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   CLOUDINARY_CLOUD_NAME=your_cloud_name

   # Kafka
   KAFKA_BROKER=localhost:9092

   # Redis
   REDIS_USERNAME=default
   REDIS_PASSWORD=your_password
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

3. **Database Setup:**

   ```bash
   bun run db:migrate
   ```

4. **Run Development Server:**
   ```bash
   bun dev
   ```

## 📜 Scripts

- `bun dev`: Start development server with watch mode.
- `bun run build`: Build the project for production.
- `bun start`: Run the production build.
- `bun run db:generate`: Generate Prisma client.
- `bun run db:migrate`: Run Prisma migrations.
- `bun run db:studio`: Open Prisma Studio.

## 📂 Structure

- `src/controllers/`: Request handlers.
- `src/routes/`: API route definitions.
- `src/services/`: Business logic and external integrations (Kafka, Redis, etc).
- `src/middlewares/`: Express middlewares (Auth, Error handling).
- `src/utils/`: Helper functions.
- `prisma/`: Database schema and migrations.
