# Tekkr Full Stack Chat + Project Plan Preview

LLM-backed chat with multi-chat support, persistence, and inline project plan previews (expandable workstreams/deliverables). Backend is Fastify + TypeScript; frontend is React + React Query + Tailwind/shadcn/ui.

## Features
- Multi-chat sidebar: create/switch chats; selection persists across reloads.
- LLM chat: messages go to Gemini/OpenAI (configurable) with graceful mock fallback.
- Inline project plan preview: when asking for a "project plan", the assistant embeds an expandable/collapsible plan inline (can appear mid-message via `{{PLAN}}` placeholder).
- Loading states and auto-scroll on send.
- Simple auth: `Authorization` header must match one of the test users.

## Screenshots
### Basic chat flow
![Project Plan Preview](./1.png)

### Inline project plan preview
![Project Plan Preview](./2.png)

## Getting Started
### Prerequisites
- Node.js 18+
- API key for Gemini or OpenAI (or rely on the built-in mock responses)

### Environment
Create `server/.env` (or set env vars) with one or both providers:
