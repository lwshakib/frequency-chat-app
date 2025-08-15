# Frequency Chat App

A real-time chat application built with Node.js, Express, React, and Socket.IO, featuring modern authentication with Clerk and a beautiful UI powered by Tailwind CSS.

## 🚀 Features

- **Real-time Messaging**: Instant message delivery using Socket.IO
- **User Authentication**: Secure authentication powered by Clerk
- **File Sharing**: Support for file uploads and sharing
- **Conversation Management**: Create and manage individual and group conversations
- **Search Functionality**:
  - Search conversations by name, user names, or email addresses
  - Real-time search with debounced input
  - Search result highlighting
  - Keyboard shortcut (Ctrl/Cmd + K) to focus search
  - Search in add contact/group dialogs
- **Notifications**: Real-time notifications for new messages
- **Responsive Design**: Mobile-first design with dark/light theme support
- **Modern UI**: Built with Radix UI components and Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM for data management

## 🛠️ Tech Stack

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **Clerk** - Authentication service
- **ImageKit** - File storage and CDN
- **Helmet** - Security middleware
- **Morgan** - HTTP request logger

### Frontend

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible UI components
- **Socket.IO Client** - Real-time communication
- **React Router** - Client-side routing
- **Zustand** - State management
- **Axios** - HTTP client
- **Lucide React** - Icon library

## 📁 Project Structure

```
frequency-chat-app/
├── controllers/          # Route controllers
├── middlewares/          # Express middlewares
│   └── auth.middleware.js
├── prisma/              # Database schema and migrations
│   └── schema.prisma
├── routes/              # API routes
│   ├── conversations.js
│   ├── imagekit.js
│   ├── index.js
│   ├── messages.js
│   ├── notifications.js
│   └── users.js
├── services/            # Business logic services
│   ├── prisma.js
│   └── socket.js
├── web/                 # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # React contexts
│   │   ├── hooks/       # Custom hooks
│   │   ├── lib/         # Utility functions
│   │   ├── types/       # TypeScript types
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── index.js             # Server entry point
├── package.json
└── README.md
```

## 🗄️ Database Schema

The application uses PostgreSQL with the following main entities:

- **User**: User profiles with Clerk integration
- **Conversation**: Chat conversations (single or group)
- **Message**: Individual messages with file support
- **Notifications**: Message notifications system

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Clerk account for authentication
- ImageKit account for file storage

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/lwshakib/frequency-chat-app.git
   cd frequency-chat-app
   ```

2. **Install backend dependencies**

   ```bash
   npm install
   ```

3. **Install frontend dependencies**

   ```bash
   cd web
   npm install
   cd ..
   ```

4. **Environment Setup**

   Create a `.env` file in the root directory:

   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/frequency_chat"

   # Clerk Authentication
   CLERK_SECRET_KEY=your_clerk_secret_key
   CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

   # ImageKit
   IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
   IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
   IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint

   # Server
   PORT=8000
   NODE_ENV=development
   ```

5. **Database Setup**

   ```bash
   # Generate Prisma client
   npm run generate

   # Run database migrations
   npm run migrate:dev
   ```

6. **Start the Development Server**

   ```bash
   # Start backend server
   npm run dev

   # In another terminal, start frontend
   cd web
   npm run dev
   ```

The application will be available at:

- Backend API: `http://localhost:8000`
- Frontend: `http://localhost:5173`

## 📝 Available Scripts

### Backend Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run build` - Build frontend for production
- `npm run migrate:dev` - Run database migrations in development
- `npm run migrate:prod` - Run database migrations in production
- `npm run generate` - Generate Prisma client

### Frontend Scripts (in `web/` directory)

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔧 Configuration

### Clerk Authentication

The app uses Clerk for authentication. Configure your Clerk application in the dashboard and update the environment variables.

### ImageKit File Storage

Set up an ImageKit account for file uploads and configure the environment variables.

### Database

The app uses PostgreSQL. Make sure to have a PostgreSQL instance running and update the `DATABASE_URL` in your environment variables.

## 🚀 Deployment

### Production Build

```bash
# Build frontend
npm run build

# Set NODE_ENV to production
export NODE_ENV=production

# Start server
npm start
```

### Environment Variables for Production

Make sure to set all required environment variables in your production environment:

- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `CLERK_PUBLISHABLE_KEY`
- `IMAGEKIT_PUBLIC_KEY`
- `IMAGEKIT_PRIVATE_KEY`
- `IMAGEKIT_URL_ENDPOINT`
- `NODE_ENV=production`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**lwshakib**

- GitHub: [@lwshakib](https://github.com/lwshakib)
