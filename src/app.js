import puppeteer from "puppeteer";
import signin from "./signin.js";
import env from "../env.js";
import { parseCourses } from "./createDB.js";
import { rmRf, mkdir } from "./fsFuncs.js";

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(env.URL);

  await signin(page)
    .then(async (result) => {
      console.log("\x1b[32m%s\x1b[0m", result);
    })
    .catch(async (error) => {
      console.log(error);
      await browser.close();
      return 1;
    });

  const path = env.PATH;

  rmRf(path);
  mkdir(path);
  try {
    await parseCourses(path, page);
  } catch (error) {
    await page.screenshot({ path: "./example.png" });
    console.log(error);
  }
  await browser.close();
})();
