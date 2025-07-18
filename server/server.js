// index.js
import express from 'express'
import cors    from 'cors'
import helmet  from 'helmet'
import morgan  from 'morgan'
import 'dotenv/config';   // auto-loads .env into process.env
import OpenAI from "openai";

console.log('Loading environment variables...')
console.log('OpenAI API Key:', process.env.OPENAI_API_KEY ? 'Loaded' : 'Not set');
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(helmet())           // basic security headers
app.use(cors())             // allow cross‑origin requests
app.use(morgan('dev'))      // log each request
app.use(express.json())     // parse JSON bodies

// Routes
app.get('/', (req, res) => {
  res.send({ status: 'OK', message: 'Cohabs Chatbot API' })
})

app.post('/api/chat', async (req, res) => {
  const { message } = req.body
  const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: message
        }
      ],
  });
  console.log('Received message:', message)
  const responseMessage = {
    id: Date.now().toString(),
    content: completion.choices[0].message.content
  }
  res.json(responseMessage)
})

app.post('/api/test', async (req, res) => {
  const { message } = req.body
  console.log('Test message received:', message)
  
  // Simulate a response
  const response = {
    id: Date.now().toString(),
    content: `Echo: ${message}`
  }
  
  res.json(response)
})

// (Optional) escalate endpoint stub
app.post('/api/escalate', (req, res) => {
  console.log('Escalation request:', req.body)
  res.sendStatus(204)
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
