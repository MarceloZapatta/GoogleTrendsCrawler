import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('https://trends.google.com.br/trends/trendingsearches/realtime?geo=BR&category=s');

  const feedItemSelector = 'feed-item';
  await page.waitForSelector(feedItemSelector);

  const feedItems = await page.$$eval(feedItemSelector,
    elements => elements.map(element => ({
      id: element.getAttribute('story-id'),
      clickableDiv: element.querySelector('.feed-item-header')
    })));

  const trends = [];

  for (let index = 0; index < feedItems.length; index++) {
    const feedItem = feedItems[index];
    let trend = {}

    trend.id = feedItem.id;

    await page.click(`[story-id="${feedItem.id}"] .feed-item-header`);

    await new Promise(resolve => {
      setTimeout(() => resolve(), 1000)
    });

    try {
      await page.waitForSelector(`[story-id="${feedItem.id}"] .feed-item-body.expanded`, { timeout: 2000 });
      await page.waitForSelector(`[story-id="${feedItem.id}"] .feed-item-body.expanded .chips-list`, { timeout: 2000 });
    } catch (error) {
      continue;
    }

    const selectorFeedItem = `[story-id="${feedItem.id}"]`;

    trend.categories = await page.$$eval(`${selectorFeedItem} .title span`, categories => categories.map(category => category.textContent.replace('•', '').replace("\n", '').trim())
      .filter(category => category));

    trend.newsCards = await page.$$eval(`${selectorFeedItem} feed-item-carousel .carousel-items a`, newsCards => newsCards.map(newsCard => ({
      title: newsCard.querySelector('.item-title').textContent,
      siteName: newsCard.querySelector('.image-text').textContent,
      thumbnail: newsCard.querySelector('img').getAttribute('src'),
      url: newsCard.getAttribute('href'),
    })));

    trend.tags = await page.$$eval(`${selectorFeedItem} .chips-list .list a`, tags => tags.map(tag => tag.textContent.trim()));

    console.log(trend);

    trends.push(trend);

    await page.click(`[story-id="${feedItem.id}"] .feed-item-header`);
    
    await new Promise(resolve => {
      setTimeout(() => resolve(), 100)
    });

    await page.waitForFunction(`document.querySelector('[story-id="${feedItem.id}"] .feed-item-body.expanded') === null`);
    // console.log(trends);
  }


  await browser.close();
})();