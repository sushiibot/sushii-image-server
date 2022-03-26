import Koa from "koa";
import mount from "koa-mount";
import serve from "koa-static";
import Router from "@koa/router";
import bodyParser from "koa-bodyparser";
import puppeteer from "puppeteer";
import logger from "koa-logger";
import { ScreenshotOptions } from "./types";
import Config from "./config";
import Handlebars from "handlebars";
import fs from "fs";
import util from "util";
import path from "path";
import dotenv from "dotenv";
import client from "prom-client";

const METRICS_PREFIX = "sushii_image_server_";

export async function compileTemplates(
  templatesDir: string
): Promise<Map<string, HandlebarsTemplateDelegate>> {
  const readdir = util.promisify(fs.readdir);
  const readFile = util.promisify(fs.readFile);

  const files = await readdir(templatesDir, "utf-8");
  const templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(templatesDir, files[i]);
    const content = await readFile(filePath);

    const fileName = path
      .basename(filePath)
      .replace(path.extname(filePath), "");

    templates.set(fileName, Handlebars.compile(content.toString()));
  }

  return templates;
}

function getMetricsRegistry(): client.Registry {
  const register = new client.Registry();
  client.collectDefaultMetrics({ register, prefix: METRICS_PREFIX });

  return register;
}

export interface Context {
  browser: puppeteer.Browser;
  templates: Map<string, HandlebarsTemplateDelegate>;
}

export async function getApp(
  config: Config
): Promise<Koa<Koa.DefaultState, Context>> {
  const app = new Koa<Koa.DefaultState, Context>();
  const router = new Router<Koa.DefaultState, Context>();

  // Add templates to context
  app.context.templates = await compileTemplates(config.templatesDir).catch(
    (e) => {
      console.log("Error compiling templates: ", e);
      process.exit(1);
    }
  );

  if (config.browserArgs.length > 0) {
    console.log("Using browser args:", config.browserArgs);
  }

  app.context.browser = await puppeteer.launch({
    headless: config.headless,
    args: config.browserArgs,
  });

  const register = getMetricsRegistry();
  const requestsCounter = new client.Counter({
    name: `${METRICS_PREFIX}http_requests_total`,
    help: "total HTTP requests",
    labelNames: ["endpoint", "method", "status"],
    registers: [register],
  });

  register.registerMetric(requestsCounter);

  router.get("/metrics", async (ctx: Koa.Context) => {
    ctx.body = await register.metrics();
  });

  router.post("/url", async (ctx: Koa.Context) => {
    const page = await ctx.browser.newPage();
    const body = ctx.request.body;
    const { url } = body;

    const { width, height } = config.getDimensions(body);

    await page.setViewport({ width, height });
    await page.goto(url);

    const imageFormat = config.getImageFormat(body);
    const screenshotOptions: ScreenshotOptions = {
      omitBackground: true,
      type: imageFormat,
    };

    if (imageFormat == "jpeg") {
      screenshotOptions.quality = config.getQuality(body);
    }

    ctx.body = await page.screenshot(screenshotOptions);
    ctx.type = config.getResponseType(body);
    ctx.res.end();

    await page.close();
  });

  async function renderHtml(ctx: Koa.Context, html: string) {
    const page = await ctx.browser.newPage();
    const body = ctx.request.body;

    const { width, height } = config.getDimensions(body);

    await page.setViewport({ width, height });
    try {
      // 5 Second timeout, default is 30 seconds which is too long
      await page.setContent(html, {
        timeout: 5000,
      });

      const imageFormat = config.getImageFormat(body);
      const screenshotOptions: ScreenshotOptions = {
        omitBackground: true,
        type: imageFormat,
      };

      if (imageFormat == "jpeg") {
        screenshotOptions.quality = config.getQuality(body);
      }

      // 10s screenshot timeout
      ctx.body = await Promise.race([
        page.screenshot(screenshotOptions),
        new Promise((_, reject) =>
          setTimeout(function () {
            reject("Screenshot timeout");
          }, 10000)
        ),
      ]);
      ctx.type = config.getResponseType(body);
    } finally {
      ctx.res.end();
      await page.close();
    }
  }

  router.post("/html", async (ctx: Koa.Context) => {
    await renderHtml(ctx, ctx.request.body.html);
  });

  router.post("/template", async (ctx: Koa.Context) => {
    const { templateName, templateHtml } = ctx.request.body;
    let { context } = ctx.request.body;

    if (!templateName && !templateHtml) {
      throw Error("Missing templateName or templateHtml");
    }

    let template;

    // Name of template
    if (templateName) {
      template = ctx.templates.get(templateName);

      if (!template) {
        throw Error(`No template named ${templateName} found`);
      }
    }

    // String template
    if (templateHtml) {
      template = Handlebars.compile(templateHtml);
    }

    if (typeof context === "string") {
      context = JSON.parse(context);
    }

    const html = template(context);

    await renderHtml(ctx, html);
  });

  app
    .use(logger())
    .use(async (ctx, next) => {
      await next();

      // After response created
      requestsCounter.inc({
        method: ctx.method,
        status: ctx.status,
        endpoint: ctx.path,
      });
    })
    .use(mount("/static", serve("./static")))
    .use(bodyParser())
    .use(router.routes())
    .use(router.allowedMethods());

  return app;
}

export async function main(): Promise<void> {
  dotenv.config();
  const config = new Config();

  const app = await getApp(config);
  app.listen(config.port, config.interface);

  console.log(`Listening on: ${config.interface}:${config.port}`);
}

if (require.main === module) {
  main();
}
