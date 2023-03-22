import { Category } from "@prisma/client";
import puppeteer, { Browser, Page } from "puppeteer";
import { Trend } from "../types/types";
import TopicsService from "./topics.service";
const fs = require("fs");

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
      args: ["--no-sandbox", "--disable-extensions"]
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

    const categories = await this.topicsService.getCategories();

    for (const category of categories) {
      await this.goToTrendingSearchPage(category);

      let totalFeedItems = 0;

      for (let index = 1; index <= 2; index++) {
        let feedItems = await this.getFeedItems();

        if (!feedItems) {
          throw new Error("Unable to get feed items!");
        }

        if (index > 1) {
          feedItems = feedItems.slice(totalFeedItems, feedItems.length)
        }
        await this.getTrendsTopicsFromFeedItems(feedItems, category);

        totalFeedItems += feedItems.length;

        if (index < 3) {
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
      await this.page.waitForSelector('div.feed-load-more-button');
    } catch (error) {
      return false;
    }

    await this.page.click('div.feed-load-more-button');
    return await this.waitForFeedItemsLoaded(totalFeedItems);
  }

  async getTrendsTopicsFromFeedItems(feedItems: EvalElement[], category: Category) {
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
        continue;
      }

      trend.searchTerms = await this.getTrendCategories(selectorFeedItem);
      trend.newsCards = await this.getTrendNewsCards(selectorFeedItem);

      await this.topicsService.create(trend, category);
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

    await this.page.waitForFunction(
      `document.querySelector('${selectorFeedItem} .feed-item-carousel .carousel-items a') !== null`
    );

    await this.page.waitForFunction(
      `document.querySelector('${selectorFeedItem} .chips-list .list a') !== null`
    );
  }

  async waitForFeedItemFullyUnexpanded(selectorFeedItem: string) {
    if (!this.page) {
      return;
    }

    await this.clickFeedItemHeader(selectorFeedItem);

    await this.page.waitForFunction(
      `document.querySelector('${selectorFeedItem} .feed-item-carousel .carousel-items a') === null`
    );

    await this.page.waitForFunction(
      `document.querySelector('${selectorFeedItem} .chips-list .list a') === null`
    );
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

    return this.page.$$eval(
      `${selectorFeedItem} feed-item-carousel .carousel-items a`,
      (newsCards) =>
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

    return this.page.goto(
      `https://trends.google.com.br/trends/trendingsearches/realtime?geo=BR&category=${category.category}`
    );
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

    await this.page.waitForFunction(
      `document.querySelector('md-progress-circular') !== null`
    );

    try {
      await this.page.waitForFunction(
        `document.querySelectorAll('feed-item').length > ${totalFeedItems}`
      );
    } catch (error) {
      return false;
    }

    return true;
  }
}
