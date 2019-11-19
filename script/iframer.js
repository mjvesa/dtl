let fs = require("fs");
const iframeTemplate = fs.readFileSync("./src/iframe_template.html", "utf8");
const uiTemplate = fs.readFileSync("./src/ui_template.html", "utf8");
const bundle = fs.readFileSync("./build/bundle.js", "utf8");
const jsZip = fs.readFileSync("./node_modules/jszip/dist/jszip.min.js", "utf8");

const iframe = iframeTemplate
  .split('"jszip-placeholder"')
  .join(jsZip)
  .split('"bundle-placeholder"')
  .join(bundle);
const iframeBase64 = Buffer.from(iframe).toString("base64");
const ui = uiTemplate.replace("base64-iframe-placeholder", iframeBase64);

fs.writeFileSync("./plugin/ui.html", ui, "utf8");
fs.copyFileSync("./src/code.js", "./plugin/code.js");
