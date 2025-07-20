import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { db } from './db.js'
import 'dotenv/config'
import OpenAI from 'openai'
import { Pinecone } from '@pinecone-database/pinecone';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { OpenAIEmbeddings } from "@langchain/openai";
import multer from 'multer'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import { randomInt } from 'crypto'


const JWT_SECRET = process.env.JWT_SECRET

// Initialize Express app
const app = express()

app.use(helmet())
app.use(morgan('dev'))
app.use(express.json())

app.use(cors({
  origin:      'http://localhost:8080',  // or whatever your React URL is
  credentials: true
}))

app.use(cookieParser())

const PORT = process.env.PORT || 3000
const upload = multer({ storage: multer.memoryStorage() })

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Initialize Pinecone client
const pine = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
})

// TODO - THIS CHECK DOES NOT WORK

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

// Health check route
app.get('/', (req, res) => {
  res.send({ status: 'OK', message: 'Cohabs Chatbot API' })
})

// Keyword-based chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message } = req.body
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are Cohabs’ friendly community assistant.' },
      { role: 'user', content: message }
    ],
  })
  res.json({
    id: Date.now().toString(),
    content: completion.choices[0].message.content.trim()
  })
})

// Test echo endpoint
app.post('/api/test', (req, res) => {
  const { message } = req.body
  res.json({ id: Date.now().toString(), content: `Echo: ${message}` })
})

// Escalation stub
app.post('/api/escalate', (req, res) => {
  console.log('Escalation request:', req.body)
  res.sendStatus(204)
})

// Registration stub
app.post('/api/register_tenant', async (req, res) => {
  const { email, password, fullName } = req.body

  const hashed = await bcrypt.hash(password, 10)   // hash password…

  const id = await db.createUser(email, hashed, fullName, 'tenant')
  const room_number = randomInt(100, 999) // generate random room number
  const start_date = new Date().toISOString().split('T')[0] // current date in YYYY-MM-DD format
  const end_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days later
  const tenantId = await db.createTenant(id, room_number, start_date, end_date)

  res.json({ id, tenantId })
})

// server.js

app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.cookies.token
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    // verify the existing JWT
    const payload = jwt.verify(token, JWT_SECRET)
    // payload: { userId, role, iat, exp }

    // fetch user & tenant
    const user = await db.getUserById(payload.userId)
    console.log('user1 :', user)
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    let tenantRec = null
    if (user.role === 'tenant') {
      console.log('user is tenant')
      tenantRec = await db.getTenantByUserId(user.id)
    }
    console.log('tenantRec :', tenantRec)

    // send back the same shape as your login response
    res.json({
      id:       user.id,
      email:    user.email,
      fullName: user.full_name,
      role:     user.role,
      tenantId: tenantRec?.user_id || null
    })
  } catch (err) {
    console.error(err)
    res.status(401).json({ error: 'Invalid or expired token' })
  }
})

// server.js

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body
  const user = await db.getUserByEmail(email)
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

  // update last_login...
  await db.updateUserLastLogin(user.id)

  // sign and set cookie:
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  )
  res.cookie('token', token, {
    httpOnly: true,
    secure:   true,      // in dev on http://localhost this is OK
    sameSite: 'none',
    path:     '/',
    maxAge:   1000 * 60 * 60
  })

  // return public user info (including tenantId if you like)
  const tenantRec = user.role === 'tenant'
    ? await db.getTenantByUserId(user.id)
    : null

  res.json({
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    tenantId: tenantRec?.user_id || null
  })
})


app.get('/api/get_tickets', async (req, res) => {
  try {
    const tickets = await db.getTickets()
    res.json(tickets)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch tickets' })
  }
})

app.post('/api/create_ticket', async (req, res) => {
  const { title, description, userId, priority, status } = req.body
  try {
    const ticketId = await db.createTicket(userId, title, description, priority, status)
    res.status(201).json({ id: ticketId })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create ticket' })
  }
})

app.get('/api/get_billing_info', async (req, res) => {
  try {
    const billingInfo = await db.getAllBillingInfo()
    res.json(billingInfo)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch billing info' })
  }
})

app.get('/api/get_all_payments', async (req, res) => {
  try {
    const payments = await db.getInvoicesByTenant(req.tenantId)
    res.json(payments)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch payments' })
  }
})

app.get('/api/events', async (req, res) => {
  try {
    const events = await db.getAllEvents()
    res.json(events)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch events' })
  }
})

app.post('/api/add_event', async (req, res) => {
  const { title, description, startsAt, endsAt, location, capacity, tenantId } = req.body
  try {
    const eventId = await db.createEvent(title, description, location, new Date(startsAt), new Date(endsAt), capacity, tenantId)
    res.status(201).json({ id: eventId })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create event' })
  }
})

// Ingestion endpoint: upload file, split into chunks, embed, and upsert to Pinecone

app.post('/api/ingest', upload.single('doc'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }
    const raw = req.file.buffer.toString('utf8')
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 })
    const docs = await splitter.createDocuments([raw])
    const embeddings = new OpenAIEmbeddings({}, { openai })
    console.log(`Ingesting ${docs.length} chunks from ${req.file.originalname}`)
    console.log(`Raw text: ${raw.slice(0, 200)}...`)


    // Batch upsert documents
    for (let i = 0; i < docs.length; i += 50) {
      const batch = docs.slice(i, i + 50)
      const vectors = (await embeddings.embedDocuments(batch.map(d => d.pageContent)))
        .map((values, idx) => ({
          id: `${req.file.originalname}-${i + idx}`,
          values,
          metadata: {
  source: req.file.originalname,
  text:   batch[idx].pageContent    // <-- this is the actual chunk
}
        }))
      console.log(`Upserting batch: `, vectors)

    await index.namespace(DefaultNamespace).upsert([
        ...vectors
      ])
      console.log(`Upserted ${batch.length} chunks from ${req.file.originalname}`)
    }
    
    res.json({ status: 'ingestion complete', file: req.file.originalname, chunks: docs.length })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ingestion failed' })
  }
})

// Retrieval endpoint: query docs + generate answer
app.post('/api/query', async (req, res) => {
  try {
    const question = typeof req.body === 'string' ? req.body : req.body.message

    console.log(`Received query: ${question}`)
    // Embed user question
    const embeddings = new OpenAIEmbeddings({}, { openai })
    const qVector = (await embeddings.embedQuery(question))
    console.log('qVector:', qVector) // Log first 10 dimensions for brevit
    // Retrieve top-k
    const namespace = pine.index(indexName).namespace(DefaultNamespace);

    const result = await namespace.query({
        vector: qVector,
        topK: 5,
        includeMetadata: true
      })
    console.log('result:', result)
    console.log('metadata:', result.matches.map(m => m.metadata))
    console.log('sparse values:', result.matches.map(m => m.sparseValues ?? 'N/A'))

    const context = result.matches
      .map((m,i) => {
        const chunk = m.metadata.text
          ?? m.metadata.chunk_text
          ?? '<chunk missing>';
        return `(${i+1}) ${m.metadata.source}: ${chunk.slice(0,200)}…`;
      })
      .join('\n\n');

    // 4) Assemble & call ChatGPT
    const systemPrompt = `
You are Cohabs’ friendly assistant. Use the context snippets below to answer.

Context:
${context}

Question:
${question}
    `.trim();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }],
      temperature: 0.0
    })
    res.json({
      answer: completion.choices[0].message.content.trim(),
      sources: result.matches.map(m => m.metadata.source)
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Query failed' })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
