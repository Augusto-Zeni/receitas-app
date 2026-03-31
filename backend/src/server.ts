import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from './routes/auth'
import receitasRoutes from './routes/receitas'
import usuariosRoutes from './routes/usuarios'

dotenv.config()

const app = express()
const port = process.env.port || 3000

app.use(cors())
app.use(express.json())

app.use('/auth', authRoutes)
app.use('/receitas', receitasRoutes)
app.use('/usuarios', usuariosRoutes)

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`)
})
