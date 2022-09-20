import puppeteer, { Page } from "puppeteer";
import Config from "./config";
import Handlebars from "handlebars";
import fs from "fs";
import util from "util";
import path from "path";
import dotenv from "dotenv";
import client from "prom-client";
import express, { Request, Response, Express } from "express";
import pino from "pino";
import pinoHttp from "pino-http";
import http from "http";
import { createTerminus, TerminusState } from "@godaddy/terminus";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
});

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

function timeout<T>(
  prom: Promise<T>,
  ms: number,
  errMessage?: string
): Promise<T> {
  return Promise.race([
    prom,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(`method call timed out: ${errMessage}`), ms)
    ),
  ]);
}

export interface Context {
  browser: puppeteer.Browser;
  templates: Map<string, HandlebarsTemplateDelegate>;
}

export async function getApp(config: Config): Promise<Express> {
  const app = express();

  // body parser
  app.use(pinoHttp());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Add templates to context
  const templates = await compileTemplates(config.templatesDir).catch((e) => {
    logger.error("Error compiling templates: ", e);
    process.exit(1);
  });

  if (config.browserArgs.length > 0) {
    logger.info(config.browserArgs, "Using browser args");
  }

  const browser = await puppeteer.launch({
    headless: config.headless,
    args: config.browserArgs,
    // False to prevent overriding terminus shutdown
    // https://github.com/godaddy/terminus/issues/103
    handleSIGINT: false,
    dumpio: true,
  });

  app.set("browser", browser);

  const register = getMetricsRegistry();
  const requestsCounter = new client.Counter({
    name: `${METRICS_PREFIX}http_requests_total`,
    help: "total HTTP requests",
    labelNames: ["endpoint", "method", "status"],
    registers: [register],
  });

  register.registerMetric(requestsCounter);

  app.get("/metrics", async (req: Request, res: Response) => {
    try {
      res.set("Content-Type", register.contentType);
      res.end(await register.metrics());
    } catch (ex) {
      res.status(500).end(ex);
    }
  });

  app.post("/url", async (req: Request, res: Response) => {
    const page = await browser.newPage();
    const {
      body,
      body: { url },
    } = req;

    const { width, height } = config.getDimensions(body);

    await page.setViewport({ width, height });
    await page.goto(url);

    const imageFormat = config.getImageFormat(body);
    const screenshotOptions: puppeteer.ScreenshotOptions = {
      omitBackground: true,
      type: imageFormat,
    };

    if (imageFormat == "jpeg") {
      screenshotOptions.quality = config.getQuality(body);
    }

    res.set("Content-Type", config.getResponseType(body));
    res.send(await page.screenshot(screenshotOptions));

    await page.close();
  });

  async function renderHtml(req: Request, res: Response, html: string) {
    let page: Page;

    try {
      logger.debug("opening new browser page");
      page = await timeout(browser.newPage(), 2000);

      logger.debug("setting viewport");
      const { body } = req;
      const { width, height } = config.getDimensions(body);
      await page.setViewport({ width, height });

      // 5 Second timeout, default is 30 seconds which is too long
      await page.setContent(html, {
        timeout: 5000,
      });

      const imageFormat = config.getImageFormat(body);
      const screenshotOptions: puppeteer.ScreenshotOptions = {
        omitBackground: true,
        type: imageFormat,
      };

      if (imageFormat == "jpeg") {
        screenshotOptions.quality = config.getQuality(body);
      }

      // 10s screenshot timeout
      const screenshot = await timeout(
        page.screenshot(screenshotOptions),
        10000,
        "screenshot timed out"
      );

      res.set("Content-Type", config.getResponseType(body));
      res.send(screenshot);
    } catch (err) {
      logger.error(err, "Error rendering html: ");
      res.status(500).send("Error rendering html");
    } finally {
      res.end();

      if (page && !page.isClosed()) {
        logger.debug("closing page");
        await page.close();
      }
    }
  }

  app.post("/html", async (req: Request, res: Response) => {
    if (!req.body.html) {
      res.status(400).send("Invalid body html");

      return;
    }

    await renderHtml(req, res, req.body.html);
  });

  app.post("/template", async (req: Request, res: Response) => {
    const { templateName, templateHtml } = req.body;
    let { context } = req.body;

    if (!templateName && !templateHtml) {
      throw Error("Missing templateName or templateHtml");
    }

    let template;

    // Name of template
    if (templateName) {
      template = templates.get(templateName);

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
    await renderHtml(req, res, html);
  });

  app
    .use(async (req, res, next) => {
      next();

      // After response created
      requestsCounter.inc({
        method: req.method,
        status: res.statusCode,
        endpoint: req.path,
      });
    })
    .use(express.static("./static"));

  return app;
}

export async function main(): Promise<void> {
  dotenv.config();
  const config = new Config();

  const app = await getApp(config);
  const server = http.createServer(app);

  createTerminus(server, {
    healthChecks: {
      "/health": async ({ state }: { state: TerminusState }) =>
        !state.isShuttingDown && app.get("browser").isConnected(),
    },
    onSignal: async () => {
      logger.info("cleaning up");
      await app.get("browser").close();
    },
    onShutdown: async () => {
      logger.info("bye!");
    },
    beforeShutdown: async () => {
      logger.info("shutting down");
    },
    signals: ["SIGINT", "SIGTERM"],
    logger: logger.error,
  });

  server.listen(config.port, config.interface, () => {
    logger.info(`Listening on: ${config.interface}:${config.port}`);
  });
}

if (require.main === module) {
  main()
    .then(() => logger.info("Done"))
    .catch((err) => logger.error(err));
}
