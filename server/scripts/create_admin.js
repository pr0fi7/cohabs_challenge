// scripts/create-admin.js
import bcrypt from 'bcrypt'
import { db, initDatabase } from '../db.js' 
import dotenv from 'dotenv'
dotenv.config()

async function createAdmin() {
  await initDatabase() // ensure schema exists, optional if already run elsewhere

  const email = process.env.ADMIN_EMAIL || 'admin@example.com'
  const password = process.env.ADMIN_PASSWORD || 'strongpassword'
  const fullName = process.env.ADMIN_FULL_NAME || 'Admin User'

  const existing = await db.getUserByEmail(email)
  if (existing) {
    console.log(`User ${email} exists. Setting role=admin.`)
    await db.pool.query(
      `UPDATE auth.users SET role='admin' WHERE email=$1`,
      [email]
    )
    process.exit(0)
  }

  const hash = await bcrypt.hash(password, 10)
  const id = await db.createUser(email, hash, fullName, 'admin')
  console.log('Created admin with id', id)
  process.exit(0)
}

createAdmin().catch(err => {
  console.error('Failed to create admin:', err)
  process.exit(1)
})
