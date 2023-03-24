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
  } catch (error: any|Error) {
    console.error(error);
    console.log(error.stack)
    console.error(error.stack)
    console.log(error.lineNumber)
    console.log(error.getCode())
    console.log(error.getLine())
    console.log(error.getFile())
  }
}

main().finally(async () => await prisma.$disconnect());