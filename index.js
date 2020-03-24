const axios = require("axios");
const parse = require("node-html-parser").parse;
const fs = require("fs");

const AUTH_COOKIE = ""; // put your AUTH_COOKIE here
const regex = /(spur)|(knob)|(spike)|(claw)|(nail)|(protrusion)|(protuberance)/g;

(async function() {
  // search specie link and write file
  //   let species = [];
  //   try {
  //     const data = fs.readFileSync("species.csv", "utf8");
  //     species = data.split("\n");
  //   } catch (err) {
  //     console.error(err);
  //   }
  //   species.forEach(async (s, idx) => {
  //     const delay = 3000; // 3s
  //     await new Promise(r => setTimeout(r, idx * delay));
  //     await searchLink(s, link);
  //   });

  // access specie link searching for keywords
  let links = [];
  try {
    const data = fs.readFileSync("links.csv", "utf8");
    links = data
      .split("\n")
      .sort((a, b) => a.localeCompare(b))
      .map(line => line.split(","));
  } catch (err) {
    console.error(err);
  }

  links.forEach(async ([s, link], idx) => {
    const delay = 3000; // 3s
    await new Promise(r => setTimeout(r, idx * delay));
    await scanSpecie(s, link);
  });
})();

async function searchLink(s) {
  const res = await axios.default.get(
    `https://www.hbw.com/search/site/${encodeURI(s)}?f[0]=bundle%3Aspecies`,
    {
      headers: headers()
    }
  );

  const root = parse(res.data);

  const firstResult = root.querySelector(".search-result a");
  const href = firstResult ? firstResult.getAttribute("href") : "Not found";
  const txt = `${s},${href}`;

  console.log(txt);

  fs.appendFileSync("links.csv", txt + "\n", function(err) {
    if (err) return console.log(err);
    console.log(`wrote ${txt}`);
  });
}

async function scanSpecie(s, link) {
  console.log(`Acessing ${link}`);

  await axios.default
    .get(link, {
      headers: headers()
    })
    .then(res => {
      const root = parse(res.data);
      const data = root.querySelector("div.region-inner.region-content-inner");

      if (!data) {
        console.error("Cannot found html region");
      }

      const text = data.rawText;
      const result = text.match(regex);

      const txt = `${s} (${link}): ${
        result ? "Found! " + result : "no match found :("
      }`;

      console.log(`${txt}`);

      fs.appendFileSync("results.txt", txt + "\n", function(err) {
        if (err) return console.log(err);
        console.log(`wrote ${txt}`);
      });
    });
}

function headers() {
  return {
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "accept-encoding": "gzip, deflate, br",
    "accept-language": "pt-BR,pt;q=0.9,en;q=0.8",
    "cache-control": "max-age=0",
    cookie: `has_js=1; cookieconsent_dismissed=yes; ${AUTH_COOKIE}`,
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "same-origin",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "user-agent":
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36"
  };
}
