import { Category, PrismaClient, Tag, Topics } from "@prisma/client";
import dayjs from "dayjs";
import slugify from "slugify";
import { NewsCard, Trend } from "../types/types";

export default class TopicsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async create(trend: Trend, category: Category) {
    let tagsCreated: Tag[] = []

    if (trend.searchTerms) {
      let tags: string[] = [];
      tags = [...trend.searchTerms?.filter(Boolean) as string[]];

      tagsCreated = await this.createTags(tags);
    }

    if (trend.newsCards) {
      for (const newsCard of trend.newsCards) {
        await this.createTopic(newsCard, tagsCreated, String(trend.id), category)
      }
    }
  }

  async createTags(tags: string[]) {
    return await this.prisma.$transaction(
      tags.map((tag) => {
        const slugTag = slugify(tag);
        return this.prisma.tag.upsert({
          where: {
            slug: slugTag
          },
          create: {
            name: tag,
            slug: slugTag,
            createdAt: dayjs().format(),
          },
          update: {
            name: tag,
            slug: slugTag,
          },
        })
      }
      )
    );
  }

  async createTopic(newCard: NewsCard, tags: Tag[], trendId: string, category: Category) {
    const source = await this.prisma.source.upsert({
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
    });

    const slugifiedTitle = await this.generateUniqueSlugName(String(newCard.title));

    return await this.prisma.$transaction(async transaction => {
      const topic = transaction.topics.findFirst({
        where: {
          url: String(newCard.url),
          category: {
            is: {
              id: category.id
            }
          }
        }
      });

      if (!topic) {
        return await this.prisma.topics.create({
          data: {
            trendId: trendId,
            title: String(newCard.title),
            slug: slugifiedTitle,
            thumbnail: newCard.thumbnail ? String(newCard.thumbnail) : null,
            url: String(newCard.url),
            source: source,
            category: category,
            tags: tags,
            createdAt: dayjs().format(),
          }
        })
      }
    })
  }

  async getCategories(): Promise<Category[]> {
    return await this.prisma.category.findMany({ orderBy: [{ order: 'asc' }] });
  }

  async generateUniqueSlugName(title: string): Promise<string> {
    let topic: Topics | null = null;
    let attempts = 0;
    let slugifiedTitle = '';

    do {
      const shortTitle = title.substring(0, 30);
      const shortTitleAttempts = shortTitle + (attempts > 0 ? ` ${attempts}` : '')
      slugifiedTitle = slugify(shortTitleAttempts, {
        remove: /[^A-Za-z0-9\ ]/g,
        lower: true
      });

      topic = await this.prisma.topics.findFirst({
        where: {
          slug: slugifiedTitle
        }
      });
      attempts++;
    } while (topic);

    return slugifiedTitle;
  }
}
