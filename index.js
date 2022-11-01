"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const fs_1 = require("fs");
const research_1 = __importDefault(require("./research"));
/* Express Server */
var torLastLog = "";
const server = (0, express_1.default)();
// get last line of the logs from tor
server.get("/tor-logs", (_, res) => res.end(torLastLog));
// start a research
server.use(express_1.default.json());
let incognitoBrowserContext;
server.post("/startResearch", async (req, res) => {
    const { researchName, researchLimit } = req.body;
    (0, research_1.default)(await incognitoBrowserContext.newPage(), researchName, researchLimit);
    res.sendStatus(200);
});
// assets for controller
const html = (0, fs_1.readFileSync)("index.html", { encoding: "utf8" });
const css = (0, fs_1.readFileSync)("main.css", { encoding: "utf8" });
const js = (0, fs_1.readFileSync)("main.js", { encoding: "utf8" });
server.get("/", (_, res) => res.end(html));
server.get("/main.css", (_, res) => res.end(css));
server.get("/main.js", (_, res) => res.end(js));
const httpServer = server.listen(8342, "localhost", () => {
    console.log("server running on http://localhost:8342");
});
/* Tor */
/*const tor = spawn(path.resolve("tor/tor.exe"));

tor.stdout.on("data", (data) => {
  console.log(`stdout: ${data}`);
  torLastLog = data;
});

tor.stderr.on("data", (data) => {
  console.error(`stderr: ${data}`);
  torLastLog = data;
});

tor.on("close", (code) => {
  console.log(`tor exited with code ${code}`);
});*/
(async () => {
    const browser = await puppeteer_1.default.launch({
        headless: false,
        defaultViewport: null,
        ignoreHTTPSErrors: true,
        executablePath: path_1.default.resolve("chromium-1045629/chrome.exe"),
        args: [
            "http://localhost:8342",
            "--start-maximized",
            "--incognito",
            //"--proxy-server=socks5://localhost:9050",
            //'--host-resolver-rules="MAP * ~NOTFOUND , EXCLUDE localhost"',
        ],
    });
    incognitoBrowserContext = await browser.createIncognitoBrowserContext();
    browser.on("disconnected", () => {
        httpServer.close((err) => {
            if (err)
                console.error(err);
            console.log("The server has been closed!");
        });
        //tor.kill();
    });
})();
