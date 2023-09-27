import { Category } from "@prisma/client";
import puppeteer, { Browser, Page } from "puppeteer";
import { Trend } from "../types/types";
import TopicsService from "./topics.service";

interface EvalElement {
  id: string | null;
  clickableDiv: Element | null;
}

export default class PuppetterService {
  public browser: Browser | null = null;
  public page: Page | null = null;
  private topicsService: TopicsService;

  constructor(topicsService: TopicsService) {
    this.topicsService = topicsService;
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: process.env.HEADLESS === "true" || true,
      args: [
        "--no-sandbox",
        "--disable-extensions",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu",
      ],
    });

    await this.newPage();
  }

  async newPage() {
    this.page = (await this.browser?.newPage()) || null;
  }

  async fetchTopics() {
    if (!this.browser) {
      throw new Error("Browser not initialized");
    }

    if (!this.page) {
      throw new Error("Page not initialized");
    }

    // const categories = [
    //   {
    //     id: '64171dd58fc3bedd9c56149b',
    //     name: 'Saude',
    //     slug: 'saude',
    //     order: 3,
    //     category: 'm',
    //     createdAt: new Date('2023-03-19T14:36:05.000Z'),
    //     updatedAt: new Date('2023-03-19T14:36:05.407Z')
    //   }
    // ];
    const categories = await this.topicsService.getCategories();

    if (categories.length <= 0) {
      console.log("No categories fetched from database.");
    }

    for (const category of categories) {
      await this.goToTrendingSearchPage(category);

      let totalFeedItems = 0;

      for (let index = 1; index <= 2; index++) {
        let feedItems = await this.getFeedItems();

        if (!feedItems) {
          throw new Error("Unable to get feed items!");
        }

        if (index > 1) {
          feedItems = feedItems.slice(totalFeedItems, feedItems.length);
        }

        await this.getTrendsTopicsFromFeedItems(feedItems, category);

        totalFeedItems += feedItems.length;

        if (index < 2) {
          const moreItems = await this.loadMoreFeedItems(totalFeedItems);

          if (!moreItems) {
            break;
          }
        }
      }
    }

    await this.browser.close();
  }

  async loadMoreFeedItems(totalFeedItems: number) {
    if (!this.page) {
      throw new Error("Page not initialized");
    }

    try {
      await this.page.waitForSelector("div.feed-load-more-button", {
        timeout: 500,
      });
    } catch (error) {
      return false;
    }

    await this.page.click("div.feed-load-more-button");
    return await this.waitForFeedItemsLoaded(totalFeedItems);
  }

  async getTrendsTopicsFromFeedItems(
    feedItems: EvalElement[],
    category: Category
  ) {
    if (!this.page) {
      return;
    }

    for (let index = 0; index < feedItems.length; index++) {
      const feedItem = feedItems[index];
      let trend: Trend = {};

      trend.id = feedItem.id;

      const selectorFeedItem = `[story-id="${feedItem.id}"]`;

      try {
        await this.waitForFeedItemFullyExpanded(selectorFeedItem);
      } catch (error) {
        console.error(
          "Error ao esperar feedItem Fully Expanded: " + selectorFeedItem
        );
        console.error(error);
        continue;
      }

      trend.searchTerms = await this.getTrendCategories(selectorFeedItem);
      trend.newsCards = await this.getTrendNewsCards(selectorFeedItem);

      await this.topicsService.create(trend, category);
      console.log(
        `Trend de id inserida: ${trend.id}. Categoria: ${category.name}`
      );
      await this.waitForFeedItemFullyUnexpanded(selectorFeedItem);
    }
  }

  async clickFeedItemHeader(selectorFeedItem: string) {
    if (!this.page) {
      return;
    }

    return this.page.click(`${selectorFeedItem} .feed-item-header`);
  }

  async waitForFeedItemFullyExpanded(selectorFeedItem: string) {
    if (!this.page) {
      return;
    }

    await this.clickFeedItemHeader(selectorFeedItem);
    const waitForNewsCardLinks = `document.querySelector('${selectorFeedItem} .feed-item-carousel .carousel-items a') !== null`;
    await this.page.waitForFunction(waitForNewsCardLinks, { timeout: 10000 });
  }

  async waitForFeedItemFullyUnexpanded(selectorFeedItem: string) {
    if (!this.page) {
      return;
    }

    await this.clickFeedItemHeader(selectorFeedItem);

    const waitForZeroNewsCardLinks = `document.querySelector('${selectorFeedItem} .feed-item-carousel .carousel-items a') === null`;
    await this.page.waitForFunction(waitForZeroNewsCardLinks);
  }

  async getTrendCategories(selectorFeedItem: string) {
    if (!this.page) {
      return;
    }

    return this.page.$$eval(`${selectorFeedItem} .title span`, (searchTerms) =>
      searchTerms
        .filter(Boolean)
        .map((searchTerm) =>
          searchTerm.textContent?.replace("•", "").replace("\n", "").trim()
        )
        .filter(Boolean)
    );
  }

  async getTrendNewsCards(selectorFeedItem: string) {
    if (!this.page) {
      return;
    }

    const selectorNewsCards = `${selectorFeedItem} feed-item-carousel .carousel-items a`;

    return this.page.$$eval(selectorNewsCards, (newsCards) =>
      newsCards.filter(Boolean).map((newsCard) => ({
        title: newsCard.querySelector(".item-title")?.textContent,
        siteName: newsCard.querySelector(".image-text")?.textContent,
        thumbnail: newsCard.querySelector("img")?.getAttribute("src"),
        url: newsCard.getAttribute("href"),
      }))
    );
  }

  async goToTrendingSearchPage(category: Category) {
    if (!this.page) {
      return;
    }

    const googleTrendsUrlPerCategory = `https://trends.google.com.br/trends/trendingsearches/realtime?geo=BR&category=${category.category}`;

    return this.page.goto(googleTrendsUrlPerCategory);
  }

  async getFeedItems(): Promise<EvalElement[] | undefined> {
    if (!this.page) {
      return Promise.reject();
    }

    const feedItemSelector = "feed-item";
    await this.page.waitForSelector(feedItemSelector);

    return this.page.$$eval(feedItemSelector, (elements) =>
      elements.map((element) => ({
        id: element.getAttribute("story-id"),
        clickableDiv: element.querySelector(".feed-item-header"),
      }))
    );
  }

  async waitForFeedItemsLoaded(totalFeedItems: number) {
    if (!this.page) {
      return false;
    }

    const waitForSpinnerLoaderStopped = `document.querySelector('md-progress-circular') !== null`;
    await this.page.waitForFunction(waitForSpinnerLoaderStopped);

    try {
      const waitForNumberNewsBecameBiggerThanLastPage = `document.querySelectorAll('feed-item').length > ${totalFeedItems}`;
      await this.page.waitForFunction(
        waitForNumberNewsBecameBiggerThanLastPage,
        {
          timeout: 3000,
        }
      );
    } catch (error) {
      return false;
    }

    return true;
  }
}
