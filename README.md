# Cohabs Tenant Portal

Welcome to **Cohabs**, the all‑in‑one portal designed to empower tenants with everything they need to manage their community life. Whether you need to report a maintenance issue, stay on top of upcoming events, pay rent, or simply chat with your friendly AI assistant, Cohabs has you covered.

---

## 🚀 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
    - [1. Chat Assistant (RAG‑Enabled)](#1-chat-assistant-rag-enabled)
    - [2. Event Management](#2-event-management)
    - [3. Support Tickets](#3-support-tickets)
    - [4. Billing & Payments](#4-billing--payments)
    - [5. Profile & Account Settings](#5-profile--account-settings)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Getting Started](#-getting-started)
- [Development](#-development)

---

## 📝 Overview

Cohabs is a modern, full‑stack web application built to streamline the tenant experience in co‑living and residential communities. It brings together:

- A **conversational AI assistant** powered by Retrieval‑Augmented Generation (RAG) to answer questions, fetch documents, and help you navigate the portal.
- A **calendar of community events**, with search, filtering, RSVPs, and the ability for tenants to suggest new activities.
- A **ticketing system** for reporting maintenance issues, tracking statuses, and communicating with building management.
- A **billing dashboard** for viewing current rent, payment history, and managing saved payment methods.
- A **profile center** where tenants can update personal information, notification preferences, and lease details.

---

## ✨ Key Features

### 1. Chat Assistant (RAG‑Enabled)

- **Natural‑language interface**: Ask “What’s the rent due date?” or “What are today’s events?”
- **Retrieval‑Augmented Generation**: The assistant combines your chat history with indexed building documents (leases, policies, guides) to provide accurate, context‑aware answers.
- **Quick‑reply buttons**: One‑tap actions like “Report Issue”, “View Events”, or “Check Billing.”
- **Persistent threads**: Your entire conversation is stored in PostgreSQL so you can revisit past chats at any time.

### 2. Event Management

- **Browse & RSVP**: See all upcoming community events, filter by type (social, fitness, educational, maintenance), search by keywords, and mark yourself as “Going” or “Can’t Make It.”
- **Suggest new events**: Fill out a quick form with date/time, description, location, and capacity to propose a gathering.
- **Organizers dashboard**: Admins can review submissions, approve or modify event details, and publish them to the community calendar.

### 3. Support Tickets

- **File a ticket**: Report maintenance issues with titles, descriptions, and optional file attachments (photos, documents).
- **Track status**: Tickets move through statuses—Open, In Progress, Resolved, Closed—with visual badges and icons.
- **Comment & update**: Tenants and staff can exchange messages and upload additional attachments until the issue is resolved.

### 4. Billing & Payments

- **Current bill summary**: View your monthly rent amount, due date, and outstanding status (Pending, Paid, Overdue).
- **Payment history**: A searchable, filterable list of past payments with receipts available for download.
- **Manage payment methods**: Add, remove, and designate a default credit card or bank account.

### 5. Profile & Account Settings

- **Personal info**: Update your name, email, phone number, and avatar.
- **Lease details**: View move‑in/move‑out dates, unit number, and download your lease agreement.
- **Notifications**: Toggle email, push, billing alerts, event reminders, and maintenance updates.
- **Security & privacy**: Change password, review any third‑party integrations, and sign out securely.

---

## 🏗️ Architecture & Tech Stack

| Layer               | Technology                                                                 |
|---------------------|----------------------------------------------------------------------------|
| **Frontend**        | React, TypeScript, Tailwind CSS, Vite                                      |
| **Backend**         | Node.js, Express, TypeScript                                               |
| **Database**        | PostgreSQL (with `pg` & `pgcrypto`)                                        |
| **AI & RAG**        | OpenAI Embeddings & Chat Completions, Pinecone vector store, LangChain     |
| **Authentication**  | JSON Web Tokens (JWT) in HTTP‑only cookies                                 |
| **Containerization**| Docker & Docker Compose                                                    |
| **DevOps**          | Nginx reverse‑proxy (for client), CI/CD pipelines                          |

---

## 📝 Getting Started

1. **Clone the repo**
     ```bash
     git clone https://github.com/your-org/cohabs-tenant-portal.git
     cd cohabs-tenant-portal
     ```

2. **Set up environment variables**

     Copy `.env.example` to `.env` and fill in your:

     - `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE`
     - `JWT_SECRET`
     - `OPENAI_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX`, (optional) `PINECONE_NAMESPACE`

3. **Start with Docker Compose**
     ```bash
     docker-compose up --build
     ```

     - PostgreSQL runs on port **5432**
     - API server on port **3000**
     - Web client on port **80**

4. **Access the App**

     Open your browser to [http://localhost](http://localhost) (or [http://localhost:8080](http://localhost:8080) for local dev).

---

## 🛠️ Development

### Backend

```bash
cd server
npm install
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

Your frontend will hot‑reload on [http://localhost:8080](http://localhost:8080), and the backend on [http://localhost:3000](http://localhost:3000).

---
