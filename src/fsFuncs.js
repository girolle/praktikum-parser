import fs from "fs";

export function rmRf(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file, index) => {
      const curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        rmRf(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}

export function mkdir(path) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
}

export function writeFile(path, content) {
  fs.writeFileSync(path, content);
}
