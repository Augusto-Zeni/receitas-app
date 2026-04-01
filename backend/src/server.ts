import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from './routes/auth'
import receitasRoutes from './routes/receitas'
import usuariosRoutes from './routes/usuarios'
import prisma from './prisma'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())

app.use('/auth', authRoutes)
app.use('/receitas', receitasRoutes)
app.use('/usuarios', usuariosRoutes)

const server = app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})

function shutdown() {
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
