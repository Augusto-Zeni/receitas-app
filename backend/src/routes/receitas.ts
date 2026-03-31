import { Router } from 'express'
import { listar, buscarPorId, criar, atualizar, remover } from '../controllers/receitaController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.get('/', listar)
router.get('/:id', buscarPorId)
router.post('/', authMiddleware, criar)
router.put('/:id', authMiddleware, atualizar)
router.delete('/:id', authMiddleware, remover)

export default router
