// server.js
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import 'dotenv/config'

import OpenAI from 'openai'
import { Pinecone } from '@pinecone-database/pinecone'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { OpenAIEmbeddings } from '@langchain/openai'
import multer from 'multer'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { initDatabase, db } from './db.js'
import { requireAuth } from './auth.js'

const JWT_SECRET = process.env.JWT_SECRET
const upload     = multer({ storage: multer.memoryStorage() })
const pine = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
})
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })


async function main() {
  // 1) Ensure all schemas & tables exist
  await initDatabase()

  // 2) Create Express app
  const app  = express()
  const PORT = process.env.PORT || 3000

  // 3) Global middleware
  const allowedOrigins = [
    'http://localhost:8080',  // your dev server
    'http://localhost'        // your dockerized client
  ]
  app.use(cors({ origin: allowedOrigins, credentials: true }))
  app.use(helmet())
  app.use(morgan('dev'))
  app.use(express.json())
  app.use(cookieParser())


  const indexName     = process.env.PINECONE_INDEX;
  const DefaultNamespace = process.env.PINECONE_NAMESPACE || 'DefaultNamespace'; // default namespace if not set
  const pineconeEnvironment = process.env.PINECONE_ENVIRONMENT || 'us-east-1'; // default to us-east-1 if not set
  const listResponse  = await pine.listIndexes();
  const existingNames = Array.isArray(listResponse)
    ? listResponse
    : listResponse.indexes;
  if (!existingNames.includes(indexName)) {
    console.log(`Index "${indexName}" not found. Creating...`);
    try {

    await pine.createIndex({
      name:           indexName,      // required
      dimension:      1536,           // replace with your embedding size
      metric:         'cosine',       // or 'dotproduct' / 'euclidean'
        spec: {
      serverless: {
        cloud: 'aws',
        region: pineconeEnvironment, // e.g. 'us-west1-gcp'
      }
    },
    deletionProtection: 'disabled',
    tags: { environment: 'development' },           // optional: blocks until the index is ready
    });
    console.log(`Index "${indexName}" created.`);
  } catch (err) {
      // If it already exists, that's fine; otherwise re‐throw
      if (err.name === 'PineconeConflictError' && err.message.includes('ALREADY_EXISTS')) {
        console.log(`Index "${indexName}" already exists—continuing.`);
      } else {
        throw err;
      }
    }
  }

  const index = pine.Index(indexName);

  
  // 4) Health check
  app.get('/', (req, res) => {
    res.json({ status: 'OK', message: 'Cohabs Chatbot API' })
  })

  // 5) Authentication endpoints
  app.post('/api/register_tenant', async (req, res) => {
    try {
      const { email, password, fullName } = req.body
      if (!email || !password || !fullName) {
        return res.status(400).json({ error: 'email, password & fullName are required' })
      }

      const existing = await db.getUserByEmail(email)
      if (existing) return res.status(409).json({ error: 'Email already in use' })

      const password_hash = await bcrypt.hash(password, 10)
      const userId = await db.createUser(email, password_hash, fullName, 'tenant')
      await db.createTenant(userId, null, null, null)

      const token = jwt.sign({ userId, role: 'tenant' }, JWT_SECRET, { expiresIn: '1h' })
      res.cookie('token', token, {
        httpOnly: true,
        secure:   true,
        sameSite: 'none',
        maxAge:   1000*60*60
      })

      res.status(201).json({ id: userId, email, fullName, role: 'tenant', tenantId: userId })
    } catch (err) {
      console.error('REGISTER ERROR:', err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body
      const user = await db.getUserByEmail(email)
      if (!user) return res.status(401).json({ error: 'Invalid credentials' })

      const ok = await bcrypt.compare(password, user.password_hash)
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

      await db.updateUserLastLogin(user.id)
      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' })
      res.cookie('token', token, {
        httpOnly: true,
        secure:   true,
        sameSite: 'none',
        path:     '/',
        maxAge:   1000*60*60
      })

      const tenantRec = user.role === 'tenant'
        ? await db.getTenantByUserId(user.id)
        : null

      res.json({
        id: user.id,
        email:    user.email,
        fullName: user.full_name,
        role:     user.role,
        tenantId: tenantRec?.user_id || null
      })
    } catch (err) {
      console.error('LOGIN ERROR:', err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  app.post('/api/logout', requireAuth, (req, res) => {
    res.clearCookie('token', {
      httpOnly: true,
      secure:   true,
      sameSite: 'none',
      path:     '/'
    })
    res.json({ ok: true })
  })

  app.get('/api/auth/me', requireAuth, async (req, res) => {
    try {
      const userRec   = await db.getUserById(req.user.id)
      const tenantRec = userRec.role === 'tenant'
        ? await db.getTenantByUserId(userRec.id)
        : null

      res.json({
        id:       userRec.id,
        email:    userRec.email,
        fullName: userRec.full_name,
        role:     userRec.role,
        tenantId: tenantRec?.user_id || null
      })
    } catch (err) {
      console.error('AUTH ME ERROR:', err)
      res.status(500).json({ error: 'Failed to fetch user' })
    }
  })

  // 6) Chat endpoints
  app.get('/api/chats', requireAuth, async (req, res) => {
    try {
      const userId = req.user.id
      console.log('Fetching chat history for user:', userId)
      const threads = await db.getChatsByUserId(userId)
      // Map into { id, snippet, updatedAt }
      const summary = threads.map(t => ({
        id:        t.id,
        snippet:   t.messages && t.messages[0]?.content ? t.messages[0].content.slice(0, 50) : 'No messages',
        updatedAt: t.created_at.toISOString()

      }))
      console.log('Chat history fetched from: ', req.user.id)

      res.json(summary)
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Failed to fetch chats' })
    }
  })

  app.get('/api/get_all_payments', requireAuth, async (req, res) => {
  const tenantId = req.user.tenantId   // <— same ID you saw in /api/auth/me
  const payments = await db.getInvoicesByTenant(tenantId)
  res.json(payments)
})

app.get('/api/get_tickets', requireAuth, async (req, res) => {
  const allTickets = await db.getTickets()
  res.json(allTickets)
})

app.post('/api/create_ticket', requireAuth, async (req, res) => {
  try {
    const { tenantId, title, description, priority, status } = req.body
    if (!tenantId || !title || !description || !priority || !status) {
      return res.status(400).json({ error: 'All fields are required' })
    }
    const id = await db.createTicket(tenantId, title, description, priority, status)
    res.status(201).json({ id })
  } catch (err) {
    console.error('CREATE TICKET ERROR:', err)
    res.status(500).json({ error: 'Failed to create ticket' })
  }
})

  app.get('/api/chats/:threadId', requireAuth, async (req, res) => {
    try {
      const { threadId } = req.params
      const threads = await db.getChatsByUserId(req.user.id)
      const thread  = threads.find(t => t.id === threadId)
      if (!thread) return res.status(404).json({ error: 'Thread not found' })
      res.json(thread.messages)
    } catch (err) {
      console.error('GET CHAT ERROR:', err)
      res.status(500).json({ error: 'Failed to fetch thread' })
    }
  })

// server.js (or wherever your routes live)

// CREATE
app.post('/api/create_chats', requireAuth, async (req, res) => {
  try {
    let { messages } = req.body;
    if (typeof messages === 'string') {
      messages = JSON.parse(messages);
    }
    // debug
    console.log('CREATE_CHAT incoming messages:', messages);
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages must be an array' });
    }
    const id = await db.createChatMessage(req.user.id, messages); // pass array directly
    res.status(201).json({ id });
  } catch (err) {
    console.error('CREATE_CHAT ERROR:', err);
    res.status(500).json({ error: 'Could not create chat' });
  }
});

// UPDATE
app.patch('/api/update_chats/:threadId', requireAuth, async (req, res) => {
  try {
    let { messages } = req.body;
    if (typeof messages === 'string') {
      messages = JSON.parse(messages);
    }
    console.log('UPDATE_CHAT incoming messages:', messages);
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages must be an array' });
    }
    await db.updateChatMessage(req.params.threadId, messages); // pass array directly
    res.sendStatus(204);
  } catch (err) {
    console.error('UPDATE_CHAT ERROR:', err);
    res.status(500).json({ error: 'Could not update chat' });
  }
});



  // 7) Events & RSVPs
  app.get('/api/events', async (req, res) => {
    try {
      const rows = await db.getAllEvents()
      res.json(rows)
    } catch (err) {
      console.error('GET EVENTS ERROR:', err)
      res.status(500).json({ error: 'Failed to fetch events' })
    }
  })

  app.post('/api/add_event', async (req, res) => {
    try {
      const { tenantId, title, description, location, capacity, startsAt, endsAt } = req.body
      const starts = new Date(startsAt)
      const ends   = endsAt ? new Date(endsAt) : null
      const id     = await db.createEvent(title, description, location, starts, ends, capacity, tenantId)
      res.status(201).json({ id })
    } catch (err) {
      console.error('ADD EVENT ERROR:', err)
      res.status(500).json({ error: 'Failed to create event' })
    }
  })

// simple admin-check middleware (requires requireAuth to have run first)
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: admin only' })
  }
  next()
}

const ALLOWED_MIMES = ['text/plain', 'text/markdown', 'application/pdf']

app.post(
  '/api/ingest',
  requireAuth,
  requireAdmin,
  upload.single('doc'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' })
      }

      if (!ALLOWED_MIMES.includes(req.file.mimetype)) {
        return res
          .status(400)
          .json({ error: `Unsupported file type: ${req.file.mimetype}` })
      }

      const raw = req.file.buffer.toString('utf8')

      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200
      })
      const docs = await splitter.createDocuments([raw])

      const embeddings = new OpenAIEmbeddings({}, { openai })

      console.log(
        `Ingesting ${docs.length} chunks from ${req.file.originalname}`
      )
      console.log(`Raw text: ${raw.slice(0, 200)}...`)

      // Batch upsert documents
      for (let i = 0; i < docs.length; i += 50) {
        const batch = docs.slice(i, i + 50)
        const embedded = await embeddings.embedDocuments(
          batch.map(d => d.pageContent)
        )
        const vectors = embedded.map((values, idx) => ({
          id: `${req.file.originalname}-${i + idx}`,
          values,
          metadata: {
            source: req.file.originalname,
            text: batch[idx].pageContent
          }
        }))

        console.log(`Upserting batch: `, vectors)

        await index
          .namespace(DefaultNamespace)
          .upsert([...vectors])

        console.log(
          `Upserted ${batch.length} chunks from ${req.file.originalname}`
        )
      }

      res.json({
        status: 'ingestion complete',
        file: req.file.originalname,
        chunks: docs.length
      })
    } catch (err) {
      console.error('INGEST ERROR:', err)
      res.status(500).json({ error: 'Ingestion failed' })
    }
  }
)

  app.post('/api/query', requireAuth, async (req, res) => {
    try {
      const { message: question, threadId } = req.body
      // 1) Load chat history
      const thread = await db.getChatById(threadId)
      const history = Array.isArray(thread?.messages) ? thread.messages : []

      // 2) Build LLM message array
      const messagesForLLM = [
        { role: 'system', content: 'You are Cohabs’ friendly assistant. Use history & context.' },
        ...history.map(m => ({
          role: m.type === 'user' ? 'user' : 'assistant',
          content: m.content
        }))
      ]

      // 3) Retrieve domain context
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const pine   = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
      const qVec   = await new OpenAIEmbeddings({}, { openai }).embedQuery(question)
      const ns     = pine.Index(process.env.PINECONE_INDEX)
                          .namespace(process.env.PINECONE_NAMESPACE || 'DefaultNamespace')
      const result = await ns.query({ vector:qVec, topK:5, includeMetadata:true })

      const context = result.matches
        .map((m,i) => `(${i+1}) ${m.metadata.source}: ${m.metadata.text.slice(0,200)}…`)
        .join('\n\n')

      messagesForLLM.push({ role:'system', content:`Context:\n${context}` })
      messagesForLLM.push({ role:'user',   content: question })

      // 4) Call ChatGPT
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messagesForLLM,
        temperature: 0.0
      })

      res.json({ answer: completion.choices[0].message.content.trim() })
    } catch (err) {
      console.error('QUERY ERROR:', err)
      res.status(500).json({ error: 'Query failed' })
    }
  })

  // 8) Start listening
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
}

main().catch(err => {
  console.error('❌ Failed to start server:', err)
  process.exit(1)
})
