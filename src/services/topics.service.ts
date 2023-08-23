import { Category, PrismaClient, Tag, Topics } from "@prisma/client";
import dayjs from "dayjs";
import slugify from "slugify";
import { NewsCard, Trend } from "../types/types";
import urlMetadata from "url-metadata";

export default class TopicsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async create(trend: Trend, category: Category) {
    let tagsCreated: Tag[] = [];

    if (trend.searchTerms) {
      let tags: string[] = [];
      tags = [...(trend.searchTerms?.filter(Boolean) as string[])];

      tagsCreated = await this.createTags(tags);
    }

    if (trend.newsCards) {
      for (const newsCard of trend.newsCards) {
        await this.createTopic(
          newsCard,
          tagsCreated,
          String(trend.id),
          category
        );
      }
    }
  }

  async createTags(tags: string[]) {
    return await this.prisma.$transaction(
      tags.map((tag) => {
        const slugTag = slugify(tag);
        return this.prisma.tag.upsert({
          where: {
            slug: slugTag,
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
        });
      })
    );
  }

  async createTopic(
    newCard: NewsCard,
    tags: Tag[],
    trendId: string,
    category: Category
  ) {
    const source = await this.prisma.source.upsert({
      where: {
        name: String(newCard.siteName),
      },
      create: {
        name: String(newCard.siteName),
        createdAt: dayjs().format(),
      },
      update: {
        name: String(newCard.siteName),
      },
    });

    const slugifiedTitle = await this.generateUniqueSlugName(
      String(newCard.title),
      category.id
    );

    return await this.prisma.$transaction(async (transaction) => {
      const topic = await transaction.topics.findFirst({
        where: {
          url: String(newCard.url),
          category: {
            is: {
              id: category.id,
            },
          },
        },
      });

      if (!topic) {
        newCard = await this.getPageMetadata(newCard);

        return await this.prisma.topics.create({
          data: {
            trendId: trendId,
            title: String(newCard.title),
            description: newCard.description ? newCard.description : null,
            author: newCard.author ? newCard.author : null,
            slug: slugifiedTitle,
            thumbnail: newCard.thumbnail ? String(newCard.thumbnail) : null,
            url: String(newCard.url),
            source: source,
            category: category,
            tags: tags,
            createdAt: dayjs().format(),
          },
        });
      }
    });
  }

  async getPageMetadata(newCard: NewsCard): Promise<NewsCard> {
    if (newCard.url) {
      const metadata: any = await urlMetadata(newCard.url);

      if (metadata) {
        if (metadata.author) {
          newCard.author = String(metadata.author || "");
        }

        if (metadata.description) {
          newCard.description = String(metadata.description);
        }

        if (
          metadata.jsonld &&
          metadata.jsonld.articleBody &&
          newCard.description &&
          metadata.jsonld.articleBody.length > newCard.description.length
        ) {
          newCard.description = String(metadata.jsonld.articleBody);
        }
      }
    }

    return newCard;
  }

  async getCategories(): Promise<Category[]> {
    return await this.prisma.category.findMany({ orderBy: [{ order: "asc" }] });
  }

  async generateUniqueSlugName(
    title: string,
    categoryId: string
  ): Promise<string> {
    let topic: Topics | null = null;
    let attempts = 0;
    let slugifiedTitle = "";

    do {
      const shortTitle = title.substring(0, 30);
      const shortTitleAttempts =
        shortTitle + (attempts > 0 ? ` ${attempts}` : "");
      slugifiedTitle = slugify(shortTitleAttempts, {
        remove: /[^A-Za-z0-9\ ]/g,
        lower: true,
      });

      topic = await this.prisma.topics.findFirst({
        where: {
          slug: slugifiedTitle,
          category: {
            is: {
              id: categoryId,
            },
          },
        },
      });
      attempts++;
    } while (topic);

    return slugifiedTitle;
  }
}
