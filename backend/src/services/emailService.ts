import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface ReceitaEmailData {
  nome: string
  descricao: string
  custo: string | number
  tipo_receita: 'D' | 'S'
  data_registro?: string | Date
}

function tipoLabel(tipo: 'D' | 'S') {
  return tipo === 'D' ? 'Doce' : 'Salgado'
}

function formatCusto(custo: string | number) {
  return Number(custo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export async function enviarEmailReceita(
  acao: 'criada' | 'atualizada',
  receita: ReceitaEmailData,
  destinatario: string,
) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return

  const data = receita.data_registro
    ? new Date(receita.data_registro).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR')

  await transporter.sendMail({
    from: `"Receitas App" <${process.env.SMTP_USER}>`,
    to: destinatario,
    subject: `Receita ${acao}: ${receita.nome}`,
    html: `
      <h2>Receita ${acao}</h2>
      <table style="border-collapse:collapse;width:100%;max-width:500px">
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Nome</td><td style="padding:8px;border:1px solid #ddd">${receita.nome}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Descrição</td><td style="padding:8px;border:1px solid #ddd">${receita.descricao}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Tipo</td><td style="padding:8px;border:1px solid #ddd">${tipoLabel(receita.tipo_receita)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Custo</td><td style="padding:8px;border:1px solid #ddd">${formatCusto(receita.custo)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Data</td><td style="padding:8px;border:1px solid #ddd">${data}</td></tr>
      </table>
    `,
  })
}
