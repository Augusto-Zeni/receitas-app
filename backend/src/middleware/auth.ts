import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET não configurado')
  return secret
}

export interface AuthRequest extends Request {
  userId?: number
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token não informado' })
    return
  }

  const token = authHeader.split(' ')[1]
  try {
    const payload = jwt.verify(token, getJwtSecret()) as { userId: number }
    req.userId = payload.userId
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido' })
  }
}
