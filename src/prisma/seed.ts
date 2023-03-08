import { PrismaClient } from '@prisma/client'
import dayjs from 'dayjs';
const prisma = new PrismaClient()
async function main() {
  await prisma.category.upsert({
    where: {
      name: 'Principais notícias'
    },
    create: {
      name: 'Principais notícias',
      order: 1,
      category: 'h',
      slug: 'principais',
      createdAt: dayjs().format(),
    },
    update: {
      name: 'Principais notícias',
      order: 1,
      category: 'h',
      slug: 'principais',
    }
  });
  await prisma.category.upsert({
    where: {
      name: 'Tecnologia'
    },
    create: {
      name: 'Tecnologia',
      order: 2,
      category: 't',
      slug: 'tecnologia',
      createdAt: dayjs().format(),
    },
    update: {
      name: 'Tecnologia',
      order: 2,
      category: 't',
      slug: 'tecnologia',
    }
  });
  await prisma.category.upsert({
    where: {
      name: 'Entretenimento'
    },
    create: {
      name: 'Entretenimento',
      order: 3,
      category: 'e',
      slug: 'entretenimento',
      createdAt: dayjs().format(),
    },
    update: {
      name: 'Entretenimento',
      order: 3,
      category: 'e',
      slug: 'entretenimento',
    }
  });
  await prisma.category.upsert({
    where: {
      name: 'Esportes'
    },
    create: {
      name: 'Esportes',
      order: 4,
      category: 's',
      slug: 'esportes',
      createdAt: dayjs().format(),
    },
    update: {
      name: 'Esportes',
      order: 4,
      category: 's',
      slug: 'esportes',
    }
  });
  await prisma.category.upsert({
    where: {
      name: 'Negócios'
    },
    create: {
      name: 'Negócios',
      order: 5,
      category: 'b',
      slug: 'negocios',
      createdAt: dayjs().format(),
    },
    update: {
      name: 'Negócios',
      order: 5,
      category: 'b',
      slug: 'negocios',
    }
  });
  await prisma.category.upsert({
    where: {
      name: 'Saúde'
    },
    create: {
      name: 'Saúde',
      order: 6,
      category: 'm',
      slug: 'saude',
      createdAt: dayjs().format(),
    },
    update: {
      name: 'Saúde',
      order: 6,
      category: 'm',
      slug: 'saude',
    }
  });
}
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })