export interface Usuario {
  id: number
  nome: string
  login: string
  situacao: boolean
}

export interface Receita {
  id: number
  nome: string
  descricao: string
  data_registro: string
  custo: number | string
  tipo_receita: 'D' | 'S'
}

export interface LoginPayload {
  login: string
  senha: string
}

export interface LoginResponse {
  token: string
  usuario: Usuario
}

export interface ReceitaPayload {
  nome: string
  descricao: string
  custo: number
  tipo_receita: 'D' | 'S'
}
