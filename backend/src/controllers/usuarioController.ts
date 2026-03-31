import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import prisma from '../prisma'

export async function listar(req: Request, res: Response) {
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, nome: true, login: true, situacao: true },
    orderBy: { nome: 'asc' },
  })
  res.json(usuarios)
}

export async function buscarPorId(req: Request, res: Response) {
  const id = Number(req.params.id)
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: { id: true, nome: true, login: true, situacao: true },
  })

  if (!usuario) {
    res.status(404).json({ error: 'Usuário não encontrado' })
    return
  }

  res.json(usuario)
}

export async function criar(req: Request, res: Response) {
  const { nome, login, senha } = req.body

  if (!nome || !login || !senha) {
    res.status(400).json({ error: 'Campos obrigatórios: nome, login, senha' })
    return
  }

  const existente = await prisma.usuario.findUnique({ where: { login } })
  if (existente) {
    res.status(409).json({ error: 'Login já cadastrado' })
    return
  }

  const senhaHash = await bcrypt.hash(senha, 10)
  const usuario = await prisma.usuario.create({
    data: { nome, login, senha: senhaHash },
    select: { id: true, nome: true, login: true, situacao: true },
  })

  res.status(201).json(usuario)
}

export async function atualizar(req: Request, res: Response) {
  const id = Number(req.params.id)
  const { nome, login, senha, situacao } = req.body

  const existe = await prisma.usuario.findUnique({ where: { id } })
  if (!existe) {
    res.status(404).json({ error: 'Usuário não encontrado' })
    return
  }

  if (login && login !== existe.login) {
    const conflito = await prisma.usuario.findUnique({ where: { login } })
    if (conflito) {
      res.status(409).json({ error: 'Login já cadastrado' })
      return
    }
  }

  const senhaHash = senha ? await bcrypt.hash(senha, 10) : undefined

  const usuario = await prisma.usuario.update({
    where: { id },
    data: {
      ...(nome !== undefined ? { nome } : {}),
      ...(login !== undefined ? { login } : {}),
      ...(senhaHash !== undefined ? { senha: senhaHash } : {}),
      ...(situacao !== undefined ? { situacao } : {}),
    },
    select: { id: true, nome: true, login: true, situacao: true },
  })

  res.json(usuario)
}

export async function remover(req: Request, res: Response) {
  const id = Number(req.params.id)

  const existe = await prisma.usuario.findUnique({ where: { id } })
  if (!existe) {
    res.status(404).json({ error: 'Usuário não encontrado' })
    return
  }

  await prisma.usuario.delete({ where: { id } })
  res.status(204).send()
}
