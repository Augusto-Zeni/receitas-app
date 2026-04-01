import { Request, Response } from 'express'
import prisma from '../prisma'

const TIPOS_VALIDOS = ['D', 'S'] as const

function parseId(param: string | string[]): number | null {
  if (Array.isArray(param)) return null
  const id = Number(param)
  return Number.isInteger(id) && id > 0 ? id : null
}

export async function listar(req: Request, res: Response) {
  const { tipo_receita, nome } = req.query

  const receitas = await prisma.receita.findMany({
    where: {
      ...(tipo_receita ? { tipo_receita: String(tipo_receita) } : {}),
      ...(nome ? { nome: { contains: String(nome), mode: 'insensitive' } } : {}),
    },
    orderBy: { data_registro: 'desc' },
  })

  res.json(receitas)
}

export async function buscarPorId(req: Request, res: Response) {
  const id = parseId(req.params.id)
  if (id === null) {
    res.status(400).json({ error: 'ID inválido' })
    return
  }
  const receita = await prisma.receita.findUnique({ where: { id } })

  if (!receita) {
    res.status(404).json({ error: 'Receita não encontrada' })
    return
  }

  res.json(receita)
}

export async function criar(req: Request, res: Response) {
  const { nome, descricao, custo, tipo_receita } = req.body

  if (!nome || !descricao || custo === undefined || !tipo_receita) {
    res.status(400).json({ error: 'Campos obrigatórios: nome, descricao, custo, tipo_receita' })
    return
  }

  if (!TIPOS_VALIDOS.includes(tipo_receita)) {
    res.status(400).json({ error: 'tipo_receita deve ser D (Doce) ou S (Salgado)' })
    return
  }

  const receita = await prisma.receita.create({
    data: { nome, descricao, custo, tipo_receita },
  })

  res.status(201).json(receita)
}

export async function atualizar(req: Request, res: Response) {
  const id = parseId(req.params.id)
  if (id === null) {
    res.status(400).json({ error: 'ID inválido' })
    return
  }
  const { nome, descricao, custo, tipo_receita } = req.body

  const existe = await prisma.receita.findUnique({ where: { id } })
  if (!existe) {
    res.status(404).json({ error: 'Receita não encontrada' })
    return
  }

  if (tipo_receita && !TIPOS_VALIDOS.includes(tipo_receita)) {
    res.status(400).json({ error: 'tipo_receita deve ser D (Doce) ou S (Salgado)' })
    return
  }

  const receita = await prisma.receita.update({
    where: { id },
    data: {
      ...(nome !== undefined ? { nome } : {}),
      ...(descricao !== undefined ? { descricao } : {}),
      ...(custo !== undefined ? { custo } : {}),
      ...(tipo_receita !== undefined ? { tipo_receita } : {}),
    },
  })

  res.json(receita)
}

export async function remover(req: Request, res: Response) {
  const id = parseId(req.params.id)
  if (id === null) {
    res.status(400).json({ error: 'ID inválido' })
    return
  }

  const existe = await prisma.receita.findUnique({ where: { id } })
  if (!existe) {
    res.status(404).json({ error: 'Receita não encontrada' })
    return
  }

  await prisma.receita.delete({ where: { id } })
  res.status(204).send()
}
