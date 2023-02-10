import { PrismaClient } from "@prisma/client";
import PuppetterService from "./services/puppetter.service";
import TopicsService from "./services/topics.service";

const prisma = new PrismaClient();

async function main() {
  const topicsService = new TopicsService(prisma);
  const puppetterService = new PuppetterService(topicsService);
  await puppetterService.initialize();

  const topics = await puppetterService.fetchTopics();

  console.log(topics);
}

main().finally(async () => await prisma.$disconnect());