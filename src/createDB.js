import { mkdir, writeFile } from "./fsFuncs.js";

async function parseItems(path, page, row) {
  await row.click().then(async () => {
    await row
      .$(".expandable-item__content > .menu-item")
      .then(async (menuItem) => await menuItem.click())
      .then(async () => {
        await page.waitForSelector(".theory-editor__block").then(async () => {
          const content = await page.$$eval(".Markdown", (els) => {
            return els.reduce((summury, el) => summury + el.innerHTML, "");
          });
          writeFile(`${path}/theory.md`, content);
        });
      });
  });
}

async function parseLessons(path, url, page) {
  await page.goto(url);
  await page.$$(".lessons__item").then(async (rows) => {
    for (let i = 0; i < rows.length; i++) {
      const name = await rows[i].getProperty("textContent");
      const nextPath = `${path}/${name._remoteObject.value}`;
      mkdir(nextPath);
      await parseItems(nextPath, page, rows[i]);
    }
  });
}

async function parseTopics(path, url, page) {
  await page.goto(url);
  await page.$$(".table-list__row").then(async (rows) => {
    if (rows.length > 0) {
      const pathToUrl = {};
      for (let i = 0; i < rows.length; i++) {
        const url = await rows[i].$eval("a", (a) => a.href);
        const name = await rows[i].$$eval("a", (as) =>
          as.reduce((fullName, a) => fullName + " " + a.textContent, "")
        );
        const nextPath = `${path}/${name}`;
        mkdir(nextPath);
        writeFile(`${nextPath}/url.md`, url);
        pathToUrl[nextPath] = url;
      }
      for (let key in pathToUrl) {
        console.log(`| |-${key.substring(0, 80)}`);
        await parseLessons(key, pathToUrl[key], page);
      }
    }
  });
}

export async function parseCourses(path, page) {
  await page.$$(".table-list__row").then(async (rows) => {
    if (rows.length > 0) {
      const pathToUrl = {};
      for (let i = 0; i < rows.length; i++) {
        const url = await rows[i].$eval("a", (a) => a.href);
        const name = await rows[i].$eval("a", (a) => a.textContent);
        const nextPath = `${path}/${name}`;
        mkdir(nextPath);
        writeFile(`${nextPath}/url.md`, url);
        pathToUrl[nextPath] = url;
      }
      for (let key in pathToUrl) {
        console.log(`|-${key.substring(0, 82)}`);
        await parseTopics(key, pathToUrl[key], page);
      }
    }
  });
}
