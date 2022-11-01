import path from "path";
import express from "express";
import puppeteer from "puppeteer";
import { readFileSync } from "fs";
import research from "./research";
import { spawn } from "child_process";

/* Express Server */
var torLastLog = "";
const server = express();

// get last line of the logs from tor
server.get("/tor-logs", (_, res) => res.end(torLastLog));

// start a research
server.use(express.json());
let incognitoBrowserContext: puppeteer.BrowserContext;
server.post("/startResearch", async (req, res) => {
  const { researchName, researchLimit } = req.body;
  research(
    await incognitoBrowserContext.newPage(),
    researchName,
    researchLimit
  );
  res.sendStatus(200);
});

// assets for controller
const html = readFileSync("index.html", { encoding: "utf8" });
const css = readFileSync("main.css", { encoding: "utf8" });
const js = readFileSync("main.js", { encoding: "utf8" });

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
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    ignoreHTTPSErrors: true,
    executablePath: path.resolve("chromium-1045629/chrome.exe"),
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
      if (err) console.error(err);
      console.log("The server has been closed!");
    });
    //tor.kill();
  });
})();
