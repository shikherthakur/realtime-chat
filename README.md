# Real-Time Chat Application

A scalable real-time chat application built with Node.js, Express.js, Socket.IO, MongoDB, Redis, and Docker.

## Overview

This project is a full-stack real-time messaging application that supports one-to-one conversations, group chats, real-time message delivery, online/offline presence, message persistence, pagination, and file/image sharing.

The application uses Socket.IO for bidirectional real-time communication and MongoDB for persistent storage of users, conversations, and messages.

Redis is used for user presence management and the Socket.IO Redis adapter, allowing real-time communication to work across multiple Node.js server instances.

The application also includes JWT-based authentication, protected HTTP and Socket.IO connections, rate limiting, graceful shutdown, file validation, and Docker-based deployment with persistent volumes for MongoDB data and uploaded files.

## Features

### Authentication & Security
- User registration and login
- Password hashing using bcrypt
- JWT-based authentication using HTTP-only cookies
- Protected REST API routes
- Authentication for Socket.IO connections
- API rate limiting

### Real-Time Messaging
- One-to-one real-time messaging
- Group conversations
- Real-time message delivery using Socket.IO
- Socket.IO rooms for conversation-based communication
- Persistent message history using MongoDB

### Presence Management
- Real-time online/offline user status
- Redis-based presence tracking
- Presence updates across connected clients

### Scalability
- Socket.IO Redis adapter for communication across multiple server instances
- Redis Pub/Sub for distributed real-time communication
- Architecture designed to support horizontal scaling

### Messages & Media
- Message history pagination
- File and image sharing
- File type validation
- Local file storage support
- AWS S3 storage support using presigned URLs

### Infrastructure & Reliability
- Dockerized Node.js application
- Docker Compose setup for Node.js, MongoDB, and Redis
- Persistent Docker volumes for MongoDB data and uploaded files
- Graceful server shutdown
- MongoDB indexes for efficient queries

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime for the backend |
| Express.js | REST API and HTTP server framework |
| Socket.IO | Real-time bidirectional communication |
| MongoDB | Persistent storage for users, conversations, and messages |
| Mongoose | MongoDB object modeling and schema management |
| Redis | User presence tracking and distributed Socket.IO communication |
| JWT | User authentication |
| bcrypt | Password hashing |
| Multer | File upload handling |
| AWS S3 | Optional cloud storage for uploaded files |
| Docker | Containerization of the application |
| Docker Compose | Running the backend, MongoDB, and Redis together |

## Architecture

The application separates HTTP-based operations from real-time communication.

- **Express.js** handles REST APIs such as authentication, conversations, message history, and file uploads.
- **Socket.IO** handles real-time events such as sending messages and presence updates.
- **MongoDB** stores users, conversations, and messages persistently.
- **Redis** manages online user presence and enables Socket.IO communication across multiple backend instances.
- **Docker Compose** runs the backend, MongoDB, and Redis as separate containers.

### Message Flow

When a user sends a message:

1. The authenticated client establishes a Socket.IO connection.
2. The client joins the appropriate conversation room.
3. The sender emits a message event through Socket.IO.
4. The backend validates the user and conversation.
5. The message is stored in MongoDB.
6. The server emits the message to the corresponding Socket.IO room.
7. Connected conversation members receive the message instantly.

### Scaled Socket.IO Flow

When multiple backend instances are running, users may be connected to different servers.

```text
User A
  │
  ▼
Backend Instance 1
  │
  │
  ├──────── Redis ────────┐
  │    Socket.IO Adapter  │
  │                       ▼
  │                Backend Instance 2
  │                       │
  │                       ▼
  │                     User B
  │
  └────── MongoDB
          Messages
``` 

## Project Structure

```text
realtime-chat/
│
├── config/
│   ├── allowedFileTypes.js
│   ├── database.js
│   └── redis.js
│
├── controllers/
│   ├── conversation.js
│   ├── message.js
│   └── user.js
│
├── middleware/
│   ├── auth.js
│   ├── rateLimit.js
│   ├── socketAuth.js
│   └── upload.js
│
├── models/
│   ├── conversation.js
│   ├── message.js
│   └── user.js
│
├── routes/
│   ├── conversation.js
│   ├── message.js
│   └── user.js
│
├── services/
│   ├── message.js
│   └── user.js
│
├── storage/
│   ├── index.js
│   ├── localStorage.js
│   └── s3Storage.js
│
├── public/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── chat.js
│   └── index.html
│
├── Dockerfile
├── docker-compose.yml
├── publisher.js
├── subscriber.js
├── server.js
├── package.json
└── README.md
```

## Environment Variables

Create a `.env` file in the project root using `.env.example` as a reference.

```env
MONGO_URI=
REDIS_URL=
JWT_SECRET=

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=
```

### Local Development Example

When MongoDB and Redis are running directly on your machine:

```env
MONGO_URI=mongodb://localhost:27017/chat-app
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
```

> Never commit the actual `.env` file or real credentials to version control.

## Installation and Setup

### Prerequisites

Make sure the following are installed:

- Git
- Docker
- Docker Compose

### 1. Clone the Repository

```bash
git clone https://github.com/shikherthakur/realtime-chat.git
cd realtime-chat
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Update the required values, especially:

```env
JWT_SECRET=your_secure_jwt_secret
```

If AWS S3 storage is being used, also configure the AWS environment variables.

### 3. Start the Application with Docker

```bash
docker compose up --build
```

Docker Compose starts:

- Node.js backend
- MongoDB
- Redis

The application will be available at:

```text
http://localhost:8000
```

### 4. Stop the Application

```bash
docker compose down
```

MongoDB data and locally uploaded files are stored in named Docker volumes, so they remain available after the containers are stopped or recreated.

### Persistent Docker Volumes

```text
mongo_data    → MongoDB database data
uploads_data  → Uploaded files
```

To rebuild the application after changing backend source code:

```bash
docker compose up --build
```

> Avoid using `docker compose down -v` unless you intentionally want to delete the persistent Docker volumes and their stored data.

## API Overview

The backend exposes REST APIs for authentication, conversations, messages and uploads.

### User APIs
- Register a new user
- Login and authenticate a user
- Retrieve the currently authenticated user

### Conversation APIs
- Create one-to-one conversations
- Create group conversations
- Retrieve conversations for the authenticated user
- Validate conversation membership and access

### Message APIs
- Retrieve conversation message history
- Paginate older messages
- Upload files and images
- Generate storage URLs for uploaded media

## Real-Time Communication

Socket.IO is used alongside the REST API for real-time functionality.

The Socket.IO layer handles:

- Authenticated socket connections
- Joining conversation rooms
- Real-time message delivery
- Online/offline presence updates
- Communication across backend instances through Redis

A simplified connection flow is:

```text
User Login
    │
    ▼
JWT Cookie
    │
    ▼
Socket.IO Handshake
    │
    ▼
Socket Authentication Middleware
    │
    ▼
Authenticated Socket Connection
    │
    ▼
Join Conversation Room
    │
    ▼
Send / Receive Real-Time Messages

```

## Scalability and Reliability

The application includes several design choices intended to support reliability and future scaling:

- Redis-backed Socket.IO adapter for communication between multiple backend instances
- Redis-based user presence tracking
- MongoDB indexes for commonly queried data
- Message pagination to avoid loading an entire conversation at once
- Rate limiting for API protection
- Graceful shutdown to safely close server resources
- Persistent Docker volumes for database and uploaded-file data
- Storage abstraction supporting both local storage and AWS S3
- Authentication and authorization for both REST and Socket.IO communication

## Future Improvements

Possible future improvements include:

- Message read receipts
- Typing indicators
- Message reactions
- Message editing and deletion
- Push notifications
- Improved group administration
- Search across conversations and messages
- Automated testing
- CI/CD pipeline
- Production deployment with multiple backend instances
- Dedicated reverse proxy/load balancer such as Nginx

## Learning Goals

This project was built to explore backend concepts involved in building a production-oriented real-time application, including:

- REST API design
- Authentication and authorization
- WebSocket-based communication
- Socket.IO rooms and events
- Database modeling with MongoDB
- Redis and distributed application concepts
- Horizontal scaling of real-time applications
- File storage abstraction
- Docker containerization
- Persistent storage
- Graceful shutdown and application reliability

## Author

**Shikher Thakur**

GitHub: [shikherthakur](https://github.com/shikherthakur)