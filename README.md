# LLM Gateway API

A Node.js/Express backend that acts as the central gateway for an AI chat application. It handles user authentication, persists conversation history, manages chat context, and proxies requests to a separate PDF/RAG microservice — all backed by PostgreSQL via Prisma ORM and Google's Gemini API for language model inference.

---

## What this does

Users register, log in, and receive a JWT. They create named conversations, then send messages. On each request the server:

1. Verifies ownership of the conversation.
2. Saves the user message to the database with a `PENDING` status.
3. Loads the conversation history and uses the **Gemini `countTokens` API** to binary-search the largest amount of history that fits within a 4 000-token budget.
4. Calls **Gemini** to generate a response, with a 30-second timeout and up to 3 retries using exponential back-off + jitter.
5. Persists the assistant reply and marks the user message `COMPLETED`.
6. If generation ultimately fails, the message is marked `FAILED` and a retry endpoint lets the user re-trigger generation for that specific message.

For PDF chat, the gateway authenticates the user and forwards both the PDF file and query to an internal RAG microservice over a shared secret (`X-Internal-Key`). The RAG service handles chunking, embedding, and Qdrant vector search independently — this backend only acts as the authenticated proxy.

---

## Architecture

```
Client
  │
  ▼
LLM Gateway API  (this repo — Express, port 3000)
  ├── PostgreSQL  (Prisma ORM — users, conversations, messages)
  │
  └── PDF / RAG Service  (internal — http://localhost:8000/api/internal)
        ├── Qdrant  (vector store)
        └── Gemini Embeddings + Generation
```

The two backend services communicate over HTTP with a pre-shared key. The gateway never exposes the RAG service directly to the public.

---

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| ORM | Prisma 6 + PostgreSQL 16 |
| Auth | JWT (7-day expiry) + bcrypt password hashing |
| LLM | Google Gemini (`@google/genai`) |
| File upload | `express-fileupload` |
| Containerisation | Docker Compose (Postgres only) |

> The OpenAI SDK is installed as a dependency but the `openai.service.js` is not wired into any active route — it appears to be an early prototype.

---

## Project structure

```
llm-gateway-api/
├── server.js                   # Express app bootstrap, route mounting
├── docker-compose.yml          # PostgreSQL 16 container
├── prisma/
│   ├── schema.prisma           # User, Conversation, Message, Document models
│   └── migrations/             # Full migration history
└── src/
    ├── controllers/
    │   ├── auth.controller.js          # register, login
    │   ├── chat.controller.js          # main chat (context + LLM call)
    │   ├── chatpdf-controller.js       # PDF upload + PDF query proxy
    │   ├── conversation.controller.js  # create conversation
    │   ├── message.controller.js       # retry a failed message
    │   └── user.controller.js          # dev-time helper
    ├── services/
    │   ├── llm.service.js      # retryWithBackoff + withTimeout wrapper
    │   ├── gemini.service.js   # Gemini content generation + message format conversion
    │   ├── token.service.js    # Gemini countTokens (used for context window management)
    │   ├── context.service.js  # binary-search history trimming to stay within token budget
    │   └── chatpdf.service.js  # HTTP proxy to RAG microservice
    ├── middlewares/
    │   └── auth.middleware.js  # JWT Bearer token verification
    ├── routes/                 # one file per resource
    └── utils/
        ├── retry.js            # exponential back-off with jitter, retryable error detection
        └── withTimeout.js      # Promise.race-based timeout wrapper
```

---

## Database schema

Three production models and one prepared model:

```prisma
model User {
  id            Int            @id @default(autoincrement())
  email         String         @unique
  name          String
  passwordHash  String
  createdAt     DateTime       @default(now())
  conversations Conversation[]
}

model Conversation {
  id        Int       @id @default(autoincrement())
  title     String?
  userId    Int
  user      User      @relation(...)  // CASCADE delete
  messages  Message[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Message {
  id             Int           @id @default(autoincrement())
  role           String        // "user" | "assistant"
  content        String
  status         MessageStatus @default(COMPLETED)  // PENDING | COMPLETED | FAILED
  conversationId Int
  conversation   Conversation  @relation(...)
  createdAt      DateTime      @default(now())
}

// Document model scaffolded for tracking uploaded PDFs
model Document {
  id       String   @id @default(uuid())
  userId   Int
  fileName String
  ...
}
```

Cascade deletes are set on both `Conversation → User` and `Message → Conversation`.

---

## API endpoints

All protected routes require `Authorization: Bearer <token>`.

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ✗ | Create account (`email`, `password`, `name`) |
| `POST` | `/api/auth/login` | ✗ | Returns JWT |

### Conversations

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/conversations` | ✓ | Create a new conversation (optional `title`) |

### Chat

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/chat` | ✓ | Send a message (`message`, `conversationId`) |

### Messages

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/messages/:messageId/retry` | ✓ | Re-trigger generation for a `FAILED` message |

### PDF Chat

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/chatpdf/upload` | ✓ | Upload a PDF (multipart `pdf` field) |
| `POST` | `/api/chatpdf/chat` | ✓ | Query an uploaded document (`query`, `documentId`) |

---

## Context window management

The `context.service.js` implements a binary search over the stored conversation history to find the maximum number of past messages that fit within a 4 000-token budget. Token counting is done with the real Gemini `countTokens` API rather than a character-based estimate, so the limit is precise. Only `COMPLETED` messages are included in context — `PENDING` and `FAILED` ones are skipped.

---

## Resilience — retry + timeout

`llm.service.js` wraps every Gemini call with:

- **30-second hard timeout** via `Promise.race`
- **Up to 3 attempts** with exponential back-off (1 s → 2 s → 4 s, capped at 8 s)
- **Per-attempt jitter** (0–300 ms) to avoid thundering herd on rate-limit recovery
- **Retryable error detection** for HTTP 429, 5xx, `ETIMEDOUT`, `ECONNRESET`, and `TimeoutError`

If all attempts fail the message is persisted as `FAILED` and the client receives a `503` with the `messageId`, enabling a targeted retry via `POST /api/messages/:messageId/retry`.

---

## Getting started

### Prerequisites

- Node.js 18+
- Docker (for the database)

### 1. Clone and install

```bash
git clone <repo-url>
cd llm-gateway-api
npm install
```

### 2. Configure environment

Create a `.env` file at the project root:

```env
PORT=3000

DATABASE_URL="postgresql://postgres:postgres@localhost:5433/llm_gateway?schema=public"

GEMINI_API_KEY=your_gemini_api_key

JWT_SECRET=your_jwt_secret

# URL of the PDF/RAG microservice internal API
CHAT_PDF_ENDPOINT=http://localhost:8000/api/internal
# Shared secret for service-to-service auth
INTERNAL_SERVICE_KEY=your_internal_service_key
```

### 3. Start PostgreSQL

```bash
docker compose up -d
```

### 4. Run migrations

```bash
npx prisma migrate deploy
```

### 5. Start the server

```bash
node server.js
```

The API will be available at `http://localhost:3000`.

---

## Example flow

```bash
# 1. Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret","name":"Alice"}'

# 2. Login → get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret"}'

# 3. Create conversation
curl -X POST http://localhost:3000/api/conversations \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"My first chat"}'

# 4. Send a message
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message":"Explain how binary search works","conversationId":1}'

# 5. Upload a PDF and chat with it
curl -X POST http://localhost:3000/api/chatpdf/upload \
  -H "Authorization: Bearer <token>" \
  -F "pdf=@/path/to/document.pdf"

curl -X POST http://localhost:3000/api/chatpdf/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"query":"Summarise the key findings","documentId":"<id-from-upload>"}'
```

---

## Related

This gateway is designed to work alongside a separate **PDF/RAG microservice** (not in this repo) that handles:

- PDF parsing and text chunking
- Generating embeddings via Gemini
- Storing and searching vectors in Qdrant
- Returning grounded answers to the gateway's proxy calls
