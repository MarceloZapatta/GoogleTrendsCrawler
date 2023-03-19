import { PrismaClient } from "@prisma/client";
import PuppetterService from "./services/puppetter.service";
import TopicsService from "./services/topics.service";
import * as dotenv from 'dotenv'
dotenv.config()

const prisma = new PrismaClient();

async function main() {
  try {
    const topicsService = new TopicsService(prisma);
    const puppetterService = new PuppetterService(topicsService);
    
    await puppetterService.initialize();
    await puppetterService.fetchTopics();

    Promise.resolve();
  } catch (error) {
    console.error(error);
  }
}

main().finally(async () => await prisma.$disconnect());