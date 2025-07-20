// db.js
import { Client, Pool } from 'pg'
import dotenv from 'dotenv'
dotenv.config()

// ─── Config from .env ──────────────────────────────────────────────────────────
const {
  PG_HOST,
  PG_PORT,
  PG_USER,
  PG_PASSWORD,
  PG_DATABASE = 'cohabs'
} = process.env

// ─── Retry‐connect helper ─────────────────────────────────────────────────────
export async function initDatabase(dbName = PG_DATABASE) {
  const client = new Client({
    host:     PG_HOST,
    port:     PG_PORT,
    user:     PG_USER,
    password: PG_PASSWORD,
    database: dbName
  })
  await client.connect()
  await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`)

  const ddl = `
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE SCHEMA IF NOT EXISTS events;
    CREATE SCHEMA IF NOT EXISTS billing;
    CREATE SCHEMA IF NOT EXISTS tickets;
    CREATE SCHEMA IF NOT EXISTS chats;

    SET search_path = auth;
    CREATE TABLE IF NOT EXISTS users (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name     TEXT NOT NULL,
      role          TEXT NOT NULL CHECK (role IN ('tenant','admin')),
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_login    TIMESTAMPTZ
    );
    CREATE TABLE IF NOT EXISTS tenants (
      user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      room_number   TEXT,
      move_in_date  DATE,
      move_out_date DATE
    );
    CREATE TABLE IF NOT EXISTS admins (
      user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      title   TEXT
    );

    SET search_path = chats;
    CREATE TABLE IF NOT EXISTS chat_messages (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      messages    JSONB NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    SET search_path = events;
    CREATE TABLE IF NOT EXISTS events (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title       TEXT NOT NULL,
      description TEXT,
      location    TEXT,
      starts_at   TIMESTAMPTZ NOT NULL,
      ends_at     TIMESTAMPTZ,
      capacity    INT,
      created_by  UUID NOT NULL REFERENCES auth.users(id)
    );
    CREATE TABLE IF NOT EXISTS rsvps (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id   UUID NOT NULL REFERENCES events.events(id) ON DELETE CASCADE,
      user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      status     TEXT NOT NULL CHECK (status IN ('yes','no','maybe')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(event_id,user_id)
    );

    SET search_path = billing;
    CREATE TABLE IF NOT EXISTS invoices (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id    UUID NOT NULL REFERENCES auth.tenants(user_id),
      amount_cents BIGINT NOT NULL,
      issued_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      due_at       DATE NOT NULL,
      status       TEXT NOT NULL CHECK (status IN ('pending','paid','overdue')),
      paid_at      TIMESTAMPTZ
    );
    CREATE TABLE IF NOT EXISTS payments (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      invoice_id   UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      amount_cents BIGINT NOT NULL,
      method       TEXT,
      paid_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    SET search_path = tickets;
    CREATE TABLE IF NOT EXISTS tickets (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id    UUID NOT NULL REFERENCES auth.tenants(user_id),
      title        TEXT NOT NULL,
      description  TEXT,
      priority     TEXT NOT NULL CHECK (priority IN ('low','medium','high','urgent')),
      status       TEXT NOT NULL CHECK (status IN ('open','in_progress','closed')),
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS ticket_attachments (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_id   UUID NOT NULL REFERENCES tickets.tickets(id) ON DELETE CASCADE,
      file_url    TEXT NOT NULL,
      uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS ticket_comments (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_id   UUID NOT NULL REFERENCES tickets.tickets(id) ON DELETE CASCADE,
      user_id     UUID NOT NULL REFERENCES auth.users(id),
      comment     TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    SET search_path = auth;
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

    SET search_path = events;
    CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events.events(starts_at);
    CREATE INDEX IF NOT EXISTS idx_rsvps_event_user ON rsvps(event_id,user_id);

    SET search_path = billing;
    CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);

    SET search_path = tickets;
    CREATE INDEX IF NOT EXISTS idx_tickets_tenant ON tickets(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_comments_ticket ON ticket_comments(ticket_id);
  `
  await client.query(ddl)
  console.log('✅ Database initialized.')
  await client.end()

}
      

// ─── CohabDB wraps a Pool for CRUD operations ─────────────────────────────────
export class CohabDB {
  constructor() {
    this.pool = new Pool({
      host:     PG_HOST,
      port:     PG_PORT,
      user:     PG_USER,
      password: PG_PASSWORD,
      database: PG_DATABASE
    })
  
    }

  // ── Chats: ──────────────────────────────────────────────────────────────
  async createChatMessage(userId, messages) {
    const { rows } = await this.pool.query(
      `INSERT INTO chats.chat_messages (user_id, messages)
       VALUES($1, $2) RETURNING id`,
      [userId, messages]
    )
    return rows[0].id
  }

  async getChats() {
    const { rows } = await this.pool.query(
      `SELECT * FROM chats.chat_messages ORDER BY created_at DESC`
    )
    return rows
  }

  async getChatById(id) {
    const { rows } = await this.pool.query(
      `SELECT * FROM chats.chat_messages WHERE id=$1`, [id]
    )
    return rows[0] || null
  }

  async updateChatMessage(id, messages) {
    await this.pool.query(
      `UPDATE chats.chat_messages
         SET messages=$1, created_at=now()
       WHERE id=$2`,
      [messages, id]
    )
  }

  // ── AUTH: USERS ─────────────────────────────────────────────────────────────
  async createUser(email, passwordHash, fullName, role) {
    const { rows } = await this.pool.query(
      `INSERT INTO auth.users (email,password_hash,full_name,role)
       VALUES($1,$2,$3,$4) RETURNING id`,
      [email, passwordHash, fullName, role]
    )
    return rows[0].id
  }

  async getUserById(id) {
    const { rows } = await this.pool.query(
      `SELECT id,email,full_name,role,created_at,last_login
       FROM auth.users WHERE id=$1`,
      [id]
    )
    return rows[0] || null
  }
  async getUserByEmail(email) {
    const { rows } = await this.pool.query(
      `SELECT id,email,full_name,role,password_hash,last_login
       FROM auth.users WHERE email=$1`,
      [email]
    )
    return rows[0] || null
  }

  async updateUserLastLogin(id) {
    await this.pool.query(
      `UPDATE auth.users SET last_login=now() WHERE id=$1`,
      [id]
    )
  }

  // ── AUTH: TENANTS ────────────────────────────────────────────────────────────
  async createTenant(userId, roomNumber, moveIn, moveOut) {
    const { rows } = await this.pool.query(
      `INSERT INTO auth.tenants (user_id,room_number,move_in_date,move_out_date)
       VALUES($1,$2,$3,$4) RETURNING user_id`,
      [userId, roomNumber, moveIn, moveOut]
    )
    return rows[0].user_id
  }

  async getTenantByUserId(userId) {
    const { rows } = await this.pool.query(
      `SELECT user_id,room_number,move_in_date,move_out_date
       FROM auth.tenants WHERE user_id=$1`,
      [userId]
    )
    return rows[0] || null
  }

  async updateTenant(userId, roomNumber, moveIn, moveOut) {
    await this.pool.query(
      `UPDATE auth.tenants
         SET room_number=$1, move_in_date=$2, move_out_date=$3
       WHERE user_id=$4`,
      [roomNumber, moveIn, moveOut, userId]
    )
  }

  async deleteTenant(userId) {
    await this.pool.query(
      `DELETE FROM auth.tenants WHERE user_id=$1`,
      [userId]
    )
  }

  // ── EVENTS & RSVPS ──────────────────────────────────────────────────────────
  async createEvent(title, desc, loc, startsAt, endsAt, cap, createdBy) {
    const { rows } = await this.pool.query(
      `INSERT INTO events.events
         (title,description,location,starts_at,ends_at,capacity,created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [title, desc, loc, startsAt, endsAt, cap, createdBy]
    )
    return rows[0].id
  }

  async getAllEvents() {
    const { rows } = await this.pool.query(
      `SELECT * FROM events.events ORDER BY starts_at`
    )
    return rows
  }

  async getEventById(id) {
    const { rows } = await this.pool.query(
      `SELECT * FROM events.events WHERE id=$1`, [id]
    )
    return rows[0] || null
  }

  async updateEvent(id, title, desc, loc, startsAt, endsAt, cap) {
    await this.pool.query(
      `UPDATE events.events
         SET title=$1,description=$2,location=$3,starts_at=$4,ends_at=$5,capacity=$6
       WHERE id=$7`,
      [title, desc, loc, startsAt, endsAt, cap, id]
    )
  }

  async deleteEvent(id) {
    await this.pool.query(
      `DELETE FROM events.events WHERE id=$1`, [id]
    )
  }

  async createRsvp(eventId, userId, status) {
    const { rows } = await this.pool.query(
      `INSERT INTO events.rsvps (event_id,user_id,status)
       VALUES($1,$2,$3) RETURNING id`,
      [eventId, userId, status]
    )
    return rows[0].id
  }

  async getRsvpByEventUser(eventId, userId) {
    const { rows } = await this.pool.query(
      `SELECT * FROM events.rsvps WHERE event_id=$1 AND user_id=$2`,
      [eventId, userId]
    )
    return rows[0] || null
  }

  async updateRsvp(id, status) {
    await this.pool.query(
      `UPDATE events.rsvps SET status=$1 WHERE id=$2`, [status, id]
    )
  }

  async deleteRsvp(id) {
    await this.pool.query(
      `DELETE FROM events.rsvps WHERE id=$1`, [id]
    )
  }

  // ── BILLING: INVOICES & PAYMENTS ────────────────────────────────────────────
  async createInvoice(tenantId, amountCents, dueAt, status = 'pending') {
    const { rows } = await this.pool.query(
      `INSERT INTO billing.invoices
         (tenant_id,amount_cents,due_at,status)
       VALUES($1,$2,$3,$4) RETURNING id`,
      [tenantId, amountCents, dueAt, status]
    )
    return rows[0].id
  }

  async getInvoicesByTenant(tenantId) {
    const { rows } = await this.pool.query(
      `SELECT * FROM billing.invoices WHERE tenant_id=$1 ORDER BY issued_at DESC`,
      [tenantId]
    )
    return rows
  }

  async getAllBillingInfo() {
    const { rows } = await this.pool.query(
      `SELECT i.id, i.tenant_id, i.amount_cents, i.due_at, i.status,
              t.room_number, t.move_in_date, t.move_out_date
       FROM billing.invoices i
       JOIN auth.tenants t ON i.tenant_id = t.user_id
       ORDER BY i.issued_at DESC`
    )
    return rows
  }

  async getInvoiceById(id) {
    const { rows } = await this.pool.query(
      `SELECT * FROM billing.invoices WHERE id=$1`, [id]
    )
    return rows[0] || null
  }

  async updateInvoice(id, amountCents, dueAt, status) {
    await this.pool.query(
      `UPDATE billing.invoices
         SET amount_cents=$1, due_at=$2, status=$3
       WHERE id=$4`,
      [amountCents, dueAt, status, id]
    )
  }

  async deleteInvoice(id) {
    await this.pool.query(
      `DELETE FROM billing.invoices WHERE id=$1`, [id]
    )
  }

  async createPayment(invoiceId, amountCents, method) {
    const { rows } = await this.pool.query(
      `INSERT INTO billing.payments
         (invoice_id,amount_cents,method)
       VALUES($1,$2,$3) RETURNING id`,
      [invoiceId, amountCents, method]
    )
    return rows[0].id
  }

  async getPaymentById(id) {
    const { rows } = await this.pool.query(
      `SELECT * FROM billing.payments WHERE id=$1`, [id]
    )
    return rows[0] || null
  }

  async updatePayment(id, amountCents, method) {
    await this.pool.query(
      `UPDATE billing.payments
         SET amount_cents=$1, method=$2
       WHERE id=$3`,
      [amountCents, method, id]
    )
  }

  async deletePayment(id) {
    await this.pool.query(
      `DELETE FROM billing.payments WHERE id=$1`, [id]
    )
  }

  // ── TICKETS: tickets, attachments, comments ─────────────────────────────────
  async createTicket(tenantId, title, desc, priority, status = 'open') {
    const { rows } = await this.pool.query(
      `INSERT INTO tickets.tickets
         (tenant_id,title,description,priority,status)
       VALUES($1,$2,$3,$4,$5) RETURNING id`,
      [tenantId, title, desc, priority, status]
    )
    return rows[0].id
  }

  async getTickets() {
    const { rows } = await this.pool.query(
      `SELECT * FROM tickets.tickets ORDER BY created_at DESC`
    )
    return rows
  }

  async getTicketById(id) {
    const { rows } = await this.pool.query(
      `SELECT * FROM tickets.tickets WHERE id=$1`, [id]
    )
    return rows[0] || null
  }

  async updateTicket(id, title, desc, priority, status) {
    await this.pool.query(
      `UPDATE tickets.tickets
         SET title=$1,description=$2,priority=$3,status=$4,updated_at=now()
       WHERE id=$5`,
      [title, desc, priority, status, id]
    )
  }

  async deleteTicket(id) {
    await this.pool.query(
      `DELETE FROM tickets.tickets WHERE id=$1`, [id]
    )
  }

  async createTicketAttachment(ticketId, fileUrl) {
    const { rows } = await this.pool.query(
      `INSERT INTO tickets.ticket_attachments
         (ticket_id,file_url)
       VALUES($1,$2) RETURNING id`,
      [ticketId, fileUrl]
    )
    return rows[0].id
  }

  async listTicketAttachments(ticketId) {
    const { rows } = await this.pool.query(
      `SELECT * FROM tickets.ticket_attachments WHERE ticket_id=$1`,
      [ticketId]
    )
    return rows
  }

  async deleteTicketAttachment(id) {
    await this.pool.query(
      `DELETE FROM tickets.ticket_attachments WHERE id=$1`, [id]
    )
  }

  async createTicketComment(ticketId, userId, comment) {
    const { rows } = await this.pool.query(
      `INSERT INTO tickets.ticket_comments
         (ticket_id,user_id,comment)
       VALUES($1,$2,$3) RETURNING id`,
      [ticketId, userId, comment]
    )
    return rows[0].id
  }

  async getTicketCommentsByTicketId(ticketId) {
    const { rows } = await this.pool.query(
      `SELECT * FROM tickets.ticket_comments WHERE ticket_id=$1 ORDER BY created_at`,
      [ticketId]
    )
    return rows
  }

  async deleteTicketComment(id) {
    await this.pool.query(
      `DELETE FROM tickets.ticket_comments WHERE id=$1`, [id]
    )
  }

  // Call when your app shuts down
  async close() {
    await this.pool.end()
  }
}

// ─── Export a shared instance for your server to use ──────────────────────────
export const db = new CohabDB()
