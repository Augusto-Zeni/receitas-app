import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../prisma'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET não configurado')
  return secret
}

export async function login(req: Request, res: Response) {
  const { login, senha } = req.body

  if (!login || !senha) {
    res.status(400).json({ error: 'Login e senha são obrigatórios' })
    return
  }

  const usuario = await prisma.usuario.findUnique({ where: { login } })
  if (!usuario || !usuario.situacao) {
    res.status(401).json({ error: 'Credenciais inválidas' })
    return
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha)
  if (!senhaValida) {
    res.status(401).json({ error: 'Credenciais inválidas' })
    return
  }

  const token = jwt.sign({ userId: usuario.id }, getJwtSecret(), { expiresIn: '8h' })
  res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, login: usuario.login } })
}
