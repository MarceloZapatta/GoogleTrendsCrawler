import { PrismaClient, Tag } from "@prisma/client";
import dayjs from "dayjs";
import { NewsCard, Trend } from "../types/types";

export default class TopicsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async create(trend: Trend) {
    let tagsCreated: Tag[] = []

    if (trend.tags || trend.searchTerms) {
      let tags: string[] = [];
      tags = [...trend.tags?.filter(Boolean) as string[], ...trend.searchTerms?.filter(Boolean) as string[]];

      tagsCreated = await this.createTags(tags);
    }

    if (trend.newsCards) {
      for (const newsCard of trend.newsCards) {
        await this.createTopic(newsCard, tagsCreated, String(trend.id))
      }
    }
  }

  async createTags(tags: string[]) {
    const date = new Date();
    return await this.prisma.$transaction(
      tags.map((tag) =>
        this.prisma.tag.upsert({
          where: {
            name: tag,
          },
          create: {
            name: tag,
            createdAt: dayjs().format(),
          },
          update: {
            name: tag,
          },
        })
      )
    );
  }

  async createTopic(newCard: NewsCard, tags: Tag[], trendId: string) {
    const [category, source] = await this.prisma.$transaction([
      this.prisma.category.upsert({
        where: {
          name: 'Esportes'
        },
        create: {
          name: 'Esportes',
          
            createdAt: dayjs().format(),
        },
        update: {
          name: 'Esportes'
        }
      }),
      this.prisma.source.upsert({
        where: {
          name: String(newCard.siteName)
        },
        create: {
          name: String(newCard.siteName),
          
            createdAt: dayjs().format(),
        },
        update: {
          name: String(newCard.siteName)
        }
      })
    ]);

    return await this.prisma.$transaction([
      this.prisma.topics.upsert({
        where: {
          url: String(newCard.url)
        },
        create: {
          trendId: trendId,
          title: String(newCard.title),
          thumbnail: String(newCard.thumbnail),
          url: String(newCard.url),
          source: source,
          category: category,
          tags: tags,
          
            createdAt: dayjs().format(),
        },
        update: {
          trendId: trendId,
          title: String(newCard.title),
          thumbnail: String(newCard.thumbnail),
          source: source,
          category: category,
          tags: tags
        }
      })
    ]);
  }
}
