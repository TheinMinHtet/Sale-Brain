# Architecture Overview

> **Project:** Sales Brain AI - AI-Powered Telegram Commerce Bot
> **Last Updated:** 2025-05-28

This document provides a comprehensive overview of the Sales Brain AI codebase architecture. It serves as a reference for developers and AI agents to understand the system design, make informed decisions, and contribute effectively.

---

## 1. Project Structure

```
[Project Root]/
├── server.ts              # Express backend + Vite SSR server (monolithic)
├── src/                   # React frontend source
│   ├── App.tsx            # Main React app entry (~110KB, primary UI)
│   ├── main.tsx           # React DOM renderer
│   ├── index.css          # Tailwind CSS entry
│   ├── types.ts           # TypeScript interfaces (SystemState, Product, Order, etc.)
│   ├── components/        # React components
│   │   ├── Onboarding.tsx          # Multi-step shop setup wizard (767 lines)
│   │   ├── SmartMarketing.tsx       # AI marketing campaign generator
│   │   ├── TelegramSimulator.tsx   # Telegram bot UI simulator
│   │   └── CustomChart.tsx          # Data visualization components
│   └── utils/
│       └── supabase.ts    # Supabase client (future DB integration)
├── .agents/               # AI agent instructions and skills
├── architecture-design/   # Architecture documentation
├── decision-log/          # Architectural Decision Records (ADRs)
├── sales_brain_state.json # Persistent state file (JSON)
├── package.json           # Dependencies: React 19, Vite, Express, Gemini API
├── vite.config.ts         # Vite + React configuration
└── tsconfig.json          # TypeScript configuration
```

---

## 2. High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        User (Browser)                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Express Server (server.ts)                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │ API Endpoints   │  │ Vite SSR Middleware │ │ Static Files  │  │
│  │ /api/*          │  │ (dev mode)       │  │ /assets       │  │
│  └────────┬────────┘  └────────┬────────┘  └───────┬────────┘  │
└───────────┼──────────────────────┼────────────────────┼───────────┘
            │                      │                    │
            ▼                      ▼                    ▼
┌──────────────────┐    ┌──────────────────┐    ┌────────────────┐
│   Gemini AI      │    │  File System     │    │   Supabase     │
│   (@google/genai)│    │  (state JSON)    │    │   (Optional)   │
│   - Bot logic    │    │  - Products      │    │   - Future     │
│   - Responses    │    │  - Orders        │    │     DB layer   │
│   - Cart handling│    │  - Sessions      │    │                │
└──────────────────┘    └──────────────────┘    └────────────────┘
            │
            ▼
┌──────────────────┐
│   Telegram       │
│   Bot (External)  │
│   - User messages│
│   - Live takeover │
└──────────────────┘
```

---

## 3. Core Components

### 3.1 Frontend - React Application

**Name:** Sales Brain AI Web Dashboard

**Description:** A React 19 dashboard for shop owners to configure their Telegram commerce bot, view orders, manage products, and create AI-powered marketing campaigns. Features a multi-step onboarding wizard, real-time order tracking, and Telegram chat simulator.

**Key Features:**
- Multi-step onboarding wizard for shop configuration
- Product catalog management (CRUD)
- Order management with status tracking
- Telegram bot simulator for testing
- AI-powered marketing campaign generator (via Gemini)
- Data visualization with custom charts
- Localization support (English / Burmese)

**Technologies:**
- React 19 (with TypeScript)
- Vite (build tool + dev server)
- Tailwind CSS 4
- Motion (animation library, formerly Framer Motion)
- Lucide React (icons)
- @supabase/supabase-js (client ready)

**Deployment:** Local development with `npm run dev`

### 3.2 Backend - Express Server

**Name:** Sales Brain API Server

**Description:** A monolithic Express.js server embedded in `server.ts` that handles API requests, serves the React frontend, and manages system state. Integrates with Google Gemini API for AI-powered bot responses.

**Key Features:**
- RESTful API endpoints for state management
- Vite SSR middleware for development
- File-based state persistence
- Gemini AI integration for natural language processing
- Telegram bot webhook handlers (ready for integration)

**Technologies:**
- Express.js 4.x
- Google Generative AI SDK (@google/genai)
- Node.js built-in modules (fs, path)
- dotenv (environment configuration)

**Endpoint Examples:**
- `GET /api/state` - Get full system state
- `POST /api/products` - Add new product
- `POST /api/orders` - Create new order
- `POST /api/ai/chat` - Send message to Gemini AI

---

## 4. Data Stores

### 4.1 Primary State Storage

**Name:** Sales Brain State File

**Type:** JSON file (`sales_brain_state.json`)

**Purpose:** Stores all application state including shop configuration, products, delivery zones, orders, and Telegram sessions. Acts as the primary database in the current implementation.

**Key Schema:**

```typescript
interface SystemState {
  config: ShopConfig;
  products: Product[];
  deliveryZones: DeliveryZone[];
  orders: Order[];
  sessions: { [id: string]: TelegramSession };
}

interface ShopConfig {
  shopName: string;
  ownerName: string;
  phone: string;
  currency: string;
  telegramBotToken: string;
  telegramBotUsername: string;
  messengerPageAccessToken: string;
  messengerVerifyToken: string;
  messengerBotId: string;
  messengerBotName: string;
  onboardingCompleted: boolean;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number; // in MMK (Myanmar Kyat)
  description: string;
  stock: number;
  image: string;
}

interface Order {
  id: string;
  invoiceId: string;
  customerName: string;
  customerPhone: string;
  customerTelegramId: string;
  township: string;
  addressDetails?: string;
  deliveryFee: number;
  paymentMethod: 'cod' | 'prepay';
  totalAmount: number;
  status: 'pending' | 'verifying' | 'confirmed' | 'completed' | 'cancelled';
  items: OrderItem[];
  paymentDetails?: PaymentDetails;
  createdAt: string;
}

interface TelegramSession {
  sessionId: string;
  customerName: string;
  customerPhone: string;
  customerTelegramId: string;
  messages: ChatMessage[];
  lastActive: string;
  currentStep: SessionStep;
  cart: CartItem[];
  liveTakeoverActive: boolean;
  activeOrderId?: string;
}

type SessionStep = 'greeting' | 'browsing' | 'ordering' | 'selecting_township' | 
                   'selecting_payment' | 'prepayment_pending' | 'verifying' | 
                   'completed' | 'live_takeover';
```

### 4.2 Cache Layer (Future)

**Name:** Supabase (Reserved for Future)

**Type:** PostgreSQL via Supabase

**Purpose:** Reserved for future database migration. The `src/utils/supabase.ts` client is ready for integration when scaling beyond file-based persistence.

---

## 5. External Integrations / APIs

### 5.1 Google Gemini AI

**Service:** Google Generative AI (Gemini 2.4.0)

**Purpose:** Powers the AI-powered Telegram bot that handles:
- Natural language product queries
- Cart management through conversation
- Order processing automation
- Marketing campaign generation

**Integration Method:** Official SDK (`@google/genai`)

**Example Usage:**
```typescript
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const response = await ai.models.generateContent({
  model: "gemini-3.1-flash-lite",
  contents: [{ role: "user", parts: [{ text: userMessage }] }],
});
```

### 5.2 Telegram Bot API (Ready)

**Service:** Telegram Bot API

**Purpose:** Enables the shop to communicate with customers via Telegram. The system is designed to integrate with Telegram webhooks.

**Integration Method:** Bot Token + Webhook endpoints

### 5.3 Supabase (Reserved)

**Service:** Supabase

**Purpose:** Future backend-as-a-service for database, authentication, and real-time subscriptions.

**Integration Method:** `@supabase/supabase-js` client (already in dependencies)

---

## 6. Deployment & Infrastructure

**Development Environment:**
- Local machine: `npm run dev` starts both Express backend and Vite frontend
- Build: `npm run build` compiles Vite app and creates production server bundle
- Start: `npm run start` runs the compiled Express server

**Key Commands:**
```bash
npm install     # Install dependencies
npm run dev     # Development mode (tsx hot reload)
npm run build   # Production build
npm run start   # Run production server
npm run lint    # TypeScript type checking
```

---

## 7. Security Considerations

**Current Implementation:**
- Environment variables via `dotenv` (`.env` file not committed)
- No authentication on API endpoints (local development)
- No encryption on state file (JSON plaintext)

**Recommendations for Production:**
- Add JWT/Session authentication
- Implement API rate limiting
- Enable HTTPS/TLS
- Consider database encryption via Supabase
- Add input validation (Zod recommended)

---

## 8. Development & Testing

**Local Setup:**
1. Clone repository
2. Run `npm install`
3. Create `.env` file with required API keys:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   ```
4. Run `npm run dev`
5. Access at http://localhost:3000

**Testing:**
- TypeScript type checking: `npm run lint`
- Manual testing via browser at localhost:3000

**Code Quality:**
- ESLint (via Vite)
- TypeScript strict mode
- Prettier (config in vite.config.ts)

---

## 9. Future Considerations / Roadmap

### Near-term:
- [ ] Supabase database integration (replace file-based state)
- [ ] Telegram Bot API webhook integration
- [ ] User authentication for dashboard
- [ ] Real-time order updates via WebSocket/Supabase Realtime

### Long-term:
- [ ] Microservices separation (Auth, Orders, Products, AI)
- [ ] Multi-shop support (SaaS)
- [ ] Mobile app (React Native)
- [ ] Payment gateway integration (KBPay, WavePay, etc.)

---

## 10. Project Identification

**Project Name:** Sales Brain AI

**Repository:** (Local repository)

**Primary Purpose:** AI-powered Telegram commerce bot that enables Myanmar businesses to sell products via Telegram with AI-assisted customer service

**Primary Tech Stack:**
- Frontend: React 19, Vite, Tailwind CSS 4, Motion
- Backend: Express.js, Node.js
- AI: Google Gemini API
- Database: File-based JSON (current) / Supabase (future)

---

## 11. Glossary / Acronyms

| Acronym | Full Definition |
|---------|-----------------|
| **RSC** | React Server Component (not used in this project - client-side React only) |
| **SSR** | Server-Side Rendering (Vite dev mode) |
| **MMK** | Myanmar Kyat (currency) |
| **CoD** | Cash on Delivery |
| **AI** | Artificial Intelligence |
| **Gemini** | Google Generative AI model |
| **ADR** | Architectural Decision Record |
| **SKU** | Stock Keeping Unit |
| **Telegram Session** | Conversation state between a customer and the bot |

---

*Maintained by: Development Team*
*Last Updated: 2025-05-28*