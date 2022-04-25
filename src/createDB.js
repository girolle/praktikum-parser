import { mkdir, writeFile } from "./fsFuncs.js";

async function parseTest(path, page) {
  await page
    .$x('//div[text()="Тест"]')
    .then(async (testItems) => await testItems[0].click())
    .then(async () => await page.waitForSelector(".CodeMirror-line"))
    .then(
      async () => await page.$$eval(".CodeMirror-line", (lines) => lines.reduce((summury, line) => summury + line.innerText + "\n", ""))
    )
    .then(async (text) => writeFile(`${path}/test.js`, text));
}

async function parseTask(path, page, task) {
  await task
    .click()
    .then(() => page.waitForSelector(".CodeMirror"))
    .then(() => page.$$(".CodeMirror"))
    .then(
      async (tasks) =>
        await Promise.all(tasks.map((el) => el.getProperty("innerText")))
    )
    .then(
      async (textsJSON) =>
        await Promise.all(textsJSON.map((el) => el.jsonValue()))
    )
    .then((texts) => {
      writeFile(`${path}/1. task.md`, texts[0]);
      writeFile(`${path}/2. hint.md`, texts[1]);
      writeFile(`${path}/3. success.md`, texts[2]);
      writeFile(`${path}/url.md`, page.url());
    })
    .then(() => parseTest(path, page));
}

async function parseItems(path, page, row) {
  await row.click().then(async () => {
    await row
      .$(".expandable-item__content > .menu-item")
      .then(async (menuItem) => await menuItem.click())
      .then(async () => await page.waitForSelector(".theory-editor__block"))
      .then(async () => {
        const content = await page.$$eval(
          ".sortable__content .Markdown",
          (els) => {
            return els.reduce((summury, el) => summury + el.innerHTML, "");
          }
        );
        writeFile(`${path}/theory.md`, content);
        writeFile(`${path}/url.md`, page.url());
        const tasks = await page.$$(".lessons__task");
        if (tasks.length > 0) {
          for (let i = 0; i < tasks.length; i++) {
            const nextPath = `${path}/Задание ${i + 1}`;
            mkdir(nextPath);
            await parseTask(nextPath, page, tasks[i]);
          }
        }
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
          as.reduce((fullName, a) => fullName + " " + a.innerText, "")
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
        const name = await rows[i].$eval("a", (a) => a.innerText);
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
