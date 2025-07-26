// server/auth.js
import jwt from 'jsonwebtoken'
export function requireAuth(req, res, next) {
  try {
    const token = req.cookies.token
    if (!token) return res.status(401).json({ error: 'Not authenticated' })
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: payload.userId, role: payload.role }
    next()
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
