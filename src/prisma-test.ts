import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient();

(async () => {
  await prisma.$connect();

  const source = await prisma.source.create({
    data: {
      name: 'Teste!'
    }
  })

  const category = await prisma.category.create({
    data: {
      name: 'Category'
    }
  })

  const tag = await prisma.tag.create({
    data: {
      name: 'Tag'
    }
  })
  
  const topic = await prisma.topics.create({
    data: {
      trendId: '13ghu2dlsjadkaj',
      title: 'Teste',
      thumbnail: 'hasdjkhasdjk.png',
      url: 'dasdhsajk.com',
      source: source,
      category: category,
      tags: [tag]
    }
  })

  console.log(topic);
})()
