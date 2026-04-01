import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.receita.createMany({
    data: [
      { nome: 'Bolo de Chocolate', descricao: 'Bolo fofo de chocolate com cobertura de ganache', custo: 35.00, tipo_receita: 'D' },
      { nome: 'Pão de Queijo', descricao: 'Pão de queijo mineiro cremoso por dentro', custo: 12.50, tipo_receita: 'S' },
      { nome: 'Brigadeiro', descricao: 'Brigadeiro tradicional de chocolate ao leite', custo: 8.00, tipo_receita: 'D' },
      { nome: 'Coxinha de Frango', descricao: 'Coxinha crocante recheada com frango desfiado e catupiry', custo: 18.00, tipo_receita: 'S' },
      { nome: 'Mousse de Maracujá', descricao: 'Mousse leve e cremosa de maracujá com calda', custo: 22.00, tipo_receita: 'D' },
      { nome: 'Esfirra de Carne', descricao: 'Esfirra aberta com tempero árabe', custo: 15.00, tipo_receita: 'S' },
      { nome: 'Torta de Limão', descricao: 'Torta gelada de limão com merengue', custo: 40.00, tipo_receita: 'D' },
      { nome: 'Quiche de Alho-Poró', descricao: 'Quiche cremosa de alho-poró com queijo gruyère', custo: 30.00, tipo_receita: 'S' },
      { nome: 'Pudim de Leite', descricao: 'Pudim de leite condensado com calda de caramelo', custo: 25.00, tipo_receita: 'D' },
      { nome: 'Pastel de Forno', descricao: 'Pastel de forno recheado com presunto e queijo', custo: 14.00, tipo_receita: 'S' },
    ],
    skipDuplicates: true,
  });

  const senhaHash = await bcrypt.hash('admin123', 10);

  await prisma.usuario.upsert({
    where: { login: 'admin' },
    update: {},
    create: {
      nome: 'Administrador',
      login: 'admin',
      senha: senhaHash,
      situacao: true,
    },
  });

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
