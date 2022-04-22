import env from "../env.js";

export default function signin(page) {
  return new Promise(async (resolve, reject) => {
    if (page.url().includes("passport")) {
      const login = await page.$("input[name=login]");
      await login.type(env.LOGIN);

      const password = await page.$("input[name=passwd]");
      await password.type(env.PASSWORD);

      const submit = await page.$("button[type=submit]");
      await submit.click();

      await page.waitForNavigation();
      resolve("Signin success");
    } else {
      reject("Signin went wrong");
    }
  });
}
