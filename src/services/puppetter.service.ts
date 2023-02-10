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
      executablePath: "google-chrome",
      args: ["--no-sandbox"],
      // headless: false,
      // userDataDir: USER_DATA_DIR_WSL
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

    await this.goToTrendingSearchPage();
    const feedItems = await this.getFeedItems();

    if (!feedItems) {
      throw new Error("Unable to get feed items!");
    }

    this.getTrendsTopicsFromFeedItems(feedItems);
  }

  async getTrendsTopicsFromFeedItems(feedItems: EvalElement[]) {
    if (!this.page) {
      return;
    }

    const trends = [];

    for (let index = 0; index < feedItems.length; index++) {
      const feedItem = feedItems[index];
      let trend: Trend = {};

      trend.id = feedItem.id;

      const selectorFeedItem = `[story-id="${feedItem.id}"]`;
      await this.clickFeedItemHeader(selectorFeedItem);

      try {
        await this.waitForFeedItemFullyExpanded(selectorFeedItem);
      } catch (error) {
        console.error(error);
        continue;
      }

      trend.searchTerms = await this.getTrendCategories(selectorFeedItem);
      trend.newsCards = await this.getTrendNewsCards(selectorFeedItem);
      trend.tags = await this.getTrendNewsTags(selectorFeedItem);

      this.topicsService.create(trend);

      trends.push(trend);

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

    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 100);
    });

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

    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 1000);
    });

    await this.page.waitForSelector(
      `${selectorFeedItem} .feed-item-body.expanded`,
      { timeout: 2000 }
    );

    await this.page.waitForSelector(
      `${selectorFeedItem} .feed-item-body.expanded .chips-list`,
      { timeout: 2000 }
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

  async getTrendNewsTags(selectorFeedItem: string) {
    if (!this.page) {
      return;
    }

    return this.page.$$eval(`${selectorFeedItem} .chips-list .list a`, (tags) =>
      tags
        .filter(Boolean)
        .map((tag) => tag.textContent?.trim())
        .filter(Boolean)
    );
  }

  async goToTrendingSearchPage() {
    if (!this.page) {
      return;
    }

    return this.page.goto(
      "https://trends.google.com.br/trends/trendingsearches/realtime?geo=BR&category=s"
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
}
