import path from "path";
import XLSX from "xlsx";
import { type ElementHandle, type Page } from "puppeteer";

const wait = (ms: number): Promise<void> =>
  new Promise((r, _) => setTimeout(r, ms));

function saveResearch(researchName: string, researchList: any[]) {
  const book = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(researchList);
  XLSX.utils.book_append_sheet(book, sheet);
  XLSX.writeFileXLSX(book, path.resolve(researchName + ".xlsx"));
}

export default async (page: Page, researchName: string, researchLimit = 30) => {
  if (!researchName) researchName = "nearby restaurants";
  if (!researchLimit) researchLimit = 30;

  await page.setBypassCSP(true);

  await page.goto("https://www.google.com/?hl=en-US", {
    waitUntil: "domcontentloaded",
    timeout: 0,
  });

  // wait for cookie consent
  /*console.log("waiting for cookie consent...");
  await page.waitForFunction(
    () =>
      (document.querySelector("div[role=dialog]") as HTMLElement).style
        .display === "none",
    { polling: "mutation", timeout: 0 }
  );
  console.log("cookie consent done.");*/

  // wait for search form
  await page.waitForSelector("form[role=search]", {
    visible: true,
    timeout: 0,
  });

  await wait(Math.random() * 1000 + 500);
  await page.type("input[type=text]", researchName, { delay: 100 });
  await page.keyboard.press("Enter");
  await page.waitForNavigation({ timeout: 0, waitUntil: "domcontentloaded" });

  //document.querySelectorAll("#search [jsaction*=mouseover]");

  console.log("waiting for more places...");
  await page.waitForSelector("#rcnt g-more-link a", {
    visible: true,
    timeout: 0,
  });
  console.log("more places found.");

  console.log("waiting for resutlts page...");

  await wait(2000 + Math.random() * 3000);
  await page.click("#rcnt g-more-link a");
  await page.waitForNavigation({ timeout: 0, waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => location.href.startsWith("https://www.google.com/search"),
    { polling: "mutation", timeout: 0 }
  );
  await page.waitForSelector("#search [jsaction*=mouseover]", {
    visible: true,
    timeout: 0,
  });

  console.log("resutlts page found...");

  await wait(3000);
  let researchCount = 0;
  let researchDone = false;
  let researchList: any[] = [];
  do {
    const places = await page.$$("#search [jsaction*=mouseover]");
    for (const e of places) {
      researchCount++;
      let placeName: string;
      let popup: ElementHandle;
      try {
        placeName = await e.$eval("span", (e) => e.innerText || "");
        await e.$eval("[class*=rllt]", (e) => {
          e.scrollIntoView();
          (e as HTMLElement).click();
        });

        await page.waitForFunction(
          `() =>
          document.querySelector(".xpdopen")?.querySelector("span")
          ?.innerText === "${placeName.replace(/"/g, '\\"')}"`,
          { timeout: 0, polling: "mutation" }
        );

        await wait(1000 + Math.random() * 3000);
        popup = (await page.$(".xpdopen"))!;

        const dataObj = {
          Name: placeName,
          Rating: (await e.$("span[aria-hidden]"))
            ? await e.$eval("span[aria-hidden]", (e) => e?.innerText || "")
            : "",
          "Rating Count": (await e.$("span[aria-hidden]"))
            ? await (
                (await e.evaluateHandle(
                  (e) => e.querySelector("span[aria-hidden]")?.parentElement
                )) as ElementHandle
              ).$$eval("span", (e) => e.at(-1)?.innerText?.slice(1, -1) || "")
            : "",
          "Possible Website": await page.evaluate(() =>
            Promise.resolve(
              document
                .querySelector(".xpdopen a[ping][href]")
                ?.getAttribute("href") || ""
            )
          ),
          Address: await popup.$$eval(
            "[data-local-attribute=d3adr] span",
            (e) => e?.at(-1)?.innerText || ""
          ),
          "Map Link": "",
          Phone: await page.evaluate(() =>
            Promise.resolve(
              document
                .querySelector(".xpdopen [data-phone-number]")
                ?.getAttribute("data-phone-number") || ""
            )
          ),
        };

        dataObj[
          "Map Link"
        ] = `https://www.google.com/maps/search${encodeURIComponent(
          placeName + dataObj.Address
        )}`;

        researchList.push(dataObj);
      } catch (e) {
        console.error(e);
        continue;
      }

      if (researchCount >= researchLimit) {
        researchDone = true;
        break;
      }
    }

    saveResearch(researchName, researchList);
    if (researchDone || !(await page.$("#pnnext"))) break;

    await page.click("#pnnext");
    await page.waitForNavigation({ timeout: 0, waitUntil: "domcontentloaded" });
    await page.waitForSelector("#search [jsaction*=mouseover]", {
      visible: true,
      timeout: 0,
    });
    await wait(3000);
  } while (true);

  saveResearch(researchName, researchList);

  await wait(3000);
  await page.close();
};
