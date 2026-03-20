# Frequency Chat Server

The robust backend for the Frequency Chat App, built with Express, Socket.io, and Prisma.

## 🚀 Features

- **RESTful API**: Clean and structured API endpoints for users, conversations, and messages.
- **Real-time Connectivity**: Powered by Socket.io for low-latency messaging.
- **ORM & Database**: Prisma ORM with PostgreSQL for type-safe data management.
- **In-App Notifications**: Seamless integration with Socket.io and Prisma to track missed alerts.
- **Authentication**: Secure auth integration using Better Auth.
- **Media Support**: Cloudinary integration for handling high-performance file uploads.
- **Message Queuing**: Kafka integration for scalable message processing and delivery.
- **Caching**: Redis for session management and real-time state synchronization.
- **Logging**: Structured logging with Winston and Morgan.
- **Automated Testing**: Built-in API testing with Bun Test and Supertest.

## 🛠️ Technologies

- **Runtime**: Bun
- **Framework**: Express 5.x
- **Database**: PostgreSQL (Prisma ORM)
- **Real-time**: Socket.io
- **Caching**: Redis
- **Message Broker**: Kafka
- **Validation**: Zod
- **Storage**: Cloudinary
- **Email**: Resend

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
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. **Database Setup:**
   ```bash
   bun run db:migrate
   ```

4. **Run Development Server:**
   ```bash
   bun dev
   ```

## 🧪 Testing
```bash
bun test        # Run all tests
bun test:watch  # Run tests in watch mode
```

## 📜 Scripts

- `bun dev`: Start development server with watch mode.
- `bun run build`: Build the project for production.
- `bun run db:generate`: Generate Prisma client.
- `bun run db:migrate`: Run Prisma migrations.
- `bun run db:studio`: Open Prisma Studio.
- `bun run format`: Format code with Prettier.
- `bun run format:check`: Check code formatting.

## 📂 Structure

- `src/controllers/`: Request handlers.
- `src/__tests__/`: Unit and API tests.
- `src/routes/`: API route definitions.
- `src/services/`: Business logic and external integrations (Kafka, Redis, etc).
- `src/middlewares/`: Express middlewares (Auth, Error handling).
- `src/utils/`: Helper functions.
- `prisma/`: Database schema and migrations.
- `generated/`: Output for generated Prisma client.
