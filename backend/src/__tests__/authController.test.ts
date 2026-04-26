import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { login } from '../controllers/authController'
import prisma from '../prisma'

function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response
}

function makeReq(body: Record<string, unknown>): Request {
  return { body } as unknown as Request
}

const usuarioAtivo = {
  id: 1,
  nome: 'Admin',
  login: 'admin',
  senha: bcrypt.hashSync('senha123', 10),
  situacao: true,
}

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret'
})

describe('authController.login', () => {
  test('T15 — retorna 400 quando login ou senha não fornecidos', async () => {
    const res = makeRes()
    await login(makeReq({ login: 'admin' }), res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  test('T16 — retorna 401 quando usuário não existe', async () => {
    ;(prisma.usuario.findUnique as jest.Mock).mockResolvedValue(null)
    const res = makeRes()
    await login(makeReq({ login: 'inexistente', senha: '123' }), res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  test('T17 — retorna 401 quando usuário está inativo', async () => {
    ;(prisma.usuario.findUnique as jest.Mock).mockResolvedValue({ ...usuarioAtivo, situacao: false })
    const res = makeRes()
    await login(makeReq({ login: 'admin', senha: 'senha123' }), res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  test('T18 — retorna 401 quando senha está errada', async () => {
    ;(prisma.usuario.findUnique as jest.Mock).mockResolvedValue(usuarioAtivo)
    const res = makeRes()
    await login(makeReq({ login: 'admin', senha: 'errada' }), res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  test('T19 — retorna token e usuario quando credenciais válidas', async () => {
    ;(prisma.usuario.findUnique as jest.Mock).mockResolvedValue(usuarioAtivo)
    const res = makeRes()
    await login(makeReq({ login: 'admin', senha: 'senha123' }), res)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        token: expect.any(String),
        usuario: expect.objectContaining({ login: 'admin' }),
      }),
    )
  })

  test('T20 — resposta de login não expõe a senha do usuário', async () => {
    ;(prisma.usuario.findUnique as jest.Mock).mockResolvedValue(usuarioAtivo)
    const res = makeRes()
    await login(makeReq({ login: 'admin', senha: 'senha123' }), res)
    const payload = (res.json as jest.Mock).mock.calls[0][0]
    expect(payload.usuario).not.toHaveProperty('senha')
  })
})
