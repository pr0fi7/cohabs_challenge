// scripts/init_db.js
import dotenv from 'dotenv'
import { initDatabase } from './db.js'
dotenv.config()

async function main() {
  try {
    console.log(`🔄 Initializing database "${process.env.PG_DATABASE}"…`)
    await initDatabase()
    console.log('✅ Init complete.')
    process.exit(0)
  } catch (err) {
    console.error('❌ Init failed:', err)
    process.exit(1)
  }
}

main()
