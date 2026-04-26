import { Request, Response } from 'express'
import * as controller from '../controllers/receitaController'
import prisma from '../prisma'

// Mock helpers
function makeRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  } as unknown as Response
  return res
}

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    params: {},
    query: {},
    ...overrides,
  } as unknown as Request
}

const receitaBase = {
  id: 1,
  nome: 'Brigadeiro',
  descricao: 'Doce tradicional',
  custo: '15.00',
  tipo_receita: 'D',
  data_registro: new Date('2026-01-15T10:00:00Z'),
}

beforeEach(() => {
  process.env.EMAIL_NOTIFICACAO = ''
})

// ─── listar ──────────────────────────────────────────────────────────────────

describe('listar', () => {
  test('T01 — retorna lista de receitas sem filtros', async () => {
    ;(prisma.receita.findMany as jest.Mock).mockResolvedValue([receitaBase])
    const req = makeReq({ query: {} })
    const res = makeRes()
    await controller.listar(req, res)
    expect(res.json).toHaveBeenCalledWith([receitaBase])
  })

  test('T02 — filtra por tipo_receita quando fornecido', async () => {
    ;(prisma.receita.findMany as jest.Mock).mockResolvedValue([])
    const req = makeReq({ query: { tipo_receita: 'S' } })
    const res = makeRes()
    await controller.listar(req, res)
    expect(prisma.receita.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tipo_receita: 'S' }),
      }),
    )
  })

  test('T03 — aplica filtro de data_inicio e data_fim', async () => {
    ;(prisma.receita.findMany as jest.Mock).mockResolvedValue([])
    const req = makeReq({ query: { data_inicio: '2026-01-01', data_fim: '2026-01-31' } })
    const res = makeRes()
    await controller.listar(req, res)
    const call = (prisma.receita.findMany as jest.Mock).mock.calls[0][0]
    expect(call.where.data_registro).toHaveProperty('gte')
    expect(call.where.data_registro).toHaveProperty('lte')
  })

  test('T04 — ignora data_fim inválida (string não parseável)', async () => {
    ;(prisma.receita.findMany as jest.Mock).mockResolvedValue([])
    const req = makeReq({ query: { data_fim: 'nao-e-data' } })
    const res = makeRes()
    await controller.listar(req, res)
    const call = (prisma.receita.findMany as jest.Mock).mock.calls[0][0]
    expect(call.where).not.toHaveProperty('data_registro')
  })
})

// ─── buscarPorId ─────────────────────────────────────────────────────────────

describe('buscarPorId', () => {
  test('T05 — retorna 400 para ID inválido', async () => {
    const req = makeReq({ params: { id: 'abc' } })
    const res = makeRes()
    await controller.buscarPorId(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  test('T06 — retorna 404 quando receita não existe', async () => {
    ;(prisma.receita.findUnique as jest.Mock).mockResolvedValue(null)
    const req = makeReq({ params: { id: '99' } })
    const res = makeRes()
    await controller.buscarPorId(req, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })

  test('T07 — retorna receita quando encontrada', async () => {
    ;(prisma.receita.findUnique as jest.Mock).mockResolvedValue(receitaBase)
    const req = makeReq({ params: { id: '1' } })
    const res = makeRes()
    await controller.buscarPorId(req, res)
    expect(res.json).toHaveBeenCalledWith(receitaBase)
  })
})

// ─── criar ────────────────────────────────────────────────────────────────────

describe('criar', () => {
  test('T08 — retorna 400 quando campos obrigatórios faltam', async () => {
    const req = makeReq({ body: { nome: 'Teste' } })
    const res = makeRes()
    await controller.criar(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  test('T09 — retorna 400 para tipo_receita inválido', async () => {
    const req = makeReq({
      body: { nome: 'X', descricao: 'Y', custo: 10, tipo_receita: 'Z' },
    })
    const res = makeRes()
    await controller.criar(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  test('T10 — cria receita e retorna 201', async () => {
    ;(prisma.receita.create as jest.Mock).mockResolvedValue(receitaBase)
    const req = makeReq({
      body: { nome: 'Brigadeiro', descricao: 'Doce', custo: 15, tipo_receita: 'D' },
    })
    const res = makeRes()
    await controller.criar(req, res)
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(receitaBase)
  })
})

// ─── atualizar ────────────────────────────────────────────────────────────────

describe('atualizar', () => {
  test('T11 — retorna 404 quando receita não existe', async () => {
    ;(prisma.receita.findUnique as jest.Mock).mockResolvedValue(null)
    const req = makeReq({ params: { id: '99' }, body: { nome: 'Novo' } })
    const res = makeRes()
    await controller.atualizar(req, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })

  test('T12 — atualiza receita e retorna dados atualizados', async () => {
    const atualizada = { ...receitaBase, nome: 'Brigadeiro Premium' }
    ;(prisma.receita.findUnique as jest.Mock).mockResolvedValue(receitaBase)
    ;(prisma.receita.update as jest.Mock).mockResolvedValue(atualizada)
    const req = makeReq({ params: { id: '1' }, body: { nome: 'Brigadeiro Premium' } })
    const res = makeRes()
    await controller.atualizar(req, res)
    expect(res.json).toHaveBeenCalledWith(atualizada)
  })
})

// ─── remover ─────────────────────────────────────────────────────────────────

describe('remover', () => {
  test('T13 — retorna 404 quando receita não existe', async () => {
    ;(prisma.receita.findUnique as jest.Mock).mockResolvedValue(null)
    const req = makeReq({ params: { id: '99' } })
    const res = makeRes()
    await controller.remover(req, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })

  test('T14 — remove receita e retorna 204', async () => {
    ;(prisma.receita.findUnique as jest.Mock).mockResolvedValue(receitaBase)
    ;(prisma.receita.delete as jest.Mock).mockResolvedValue(receitaBase)
    const req = makeReq({ params: { id: '1' } })
    const res = makeRes()
    await controller.remover(req, res)
    expect(res.status).toHaveBeenCalledWith(204)
  })
})
