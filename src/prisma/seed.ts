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
      createdAt: dayjs().format(),
    },
    update: {
      name: 'Principais notícias'
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
      createdAt: dayjs().format(),
    },
    update: {
      name: 'Tecnologia'
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
      createdAt: dayjs().format(),
    },
    update: {
      name: 'Entretenimento'
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
      createdAt: dayjs().format(),
    },
    update: {
      name: 'Esportes'
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
      createdAt: dayjs().format(),
    },
    update: {
      name: 'Negócios'
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
      createdAt: dayjs().format(),
    },
    update: {
      name: 'Saúde'
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