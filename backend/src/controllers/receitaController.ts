import { Request, Response } from 'express'
import prisma from '../prisma'
import { enviarEmailReceita } from '../services/emailService'

const TIPOS_VALIDOS = ['D', 'S'] as const

function parseId(param: string | string[]): number | null {
  if (Array.isArray(param)) return null
  const id = Number(param)
  return Number.isInteger(id) && id > 0 ? id : null
}

function parseDate(value: unknown): Date | null {
  if (!value || typeof value !== 'string') return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

export async function listar(req: Request, res: Response) {
  const { tipo_receita, nome, data_inicio, data_fim } = req.query

  const dataInicio = parseDate(data_inicio)
  const dataFim = parseDate(data_fim)

  // When data_fim is provided, include the entire day
  const dataFimFinal = dataFim
    ? new Date(new Date(dataFim).setHours(23, 59, 59, 999))
    : null

  const receitas = await prisma.receita.findMany({
    where: {
      ...(tipo_receita ? { tipo_receita: String(tipo_receita) } : {}),
      ...(nome ? { nome: { contains: String(nome), mode: 'insensitive' } } : {}),
      ...(dataInicio || dataFimFinal
        ? {
            data_registro: {
              ...(dataInicio ? { gte: dataInicio } : {}),
              ...(dataFimFinal ? { lte: dataFimFinal } : {}),
            },
          }
        : {}),
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

  const destinatario = process.env.EMAIL_NOTIFICACAO
  if (destinatario) {
    void enviarEmailReceita('criada', { ...receita, custo: String(receita.custo), tipo_receita: receita.tipo_receita as 'D' | 'S' }, destinatario)
  }

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

  const destinatario = process.env.EMAIL_NOTIFICACAO
  if (destinatario) {
    void enviarEmailReceita('atualizada', { ...receita, custo: String(receita.custo), tipo_receita: receita.tipo_receita as 'D' | 'S' }, destinatario)
  }

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
