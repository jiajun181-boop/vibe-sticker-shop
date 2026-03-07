const fs = require('fs');
const path = require('path');

async function main() {
  const sitemapRes = await fetch('http://localhost:3000/sitemap.xml');
  if (!sitemapRes.ok) throw new Error('Failed to fetch sitemap: ' + sitemapRes.status);
  const xml = await sitemapRes.text();
  const urls = Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/g)).map(m => m[1].trim());

  const lighthouseMod = await import('lighthouse');
  const chromeLauncherMod = await import('chrome-launcher');
  const lighthouse = lighthouseMod.default;
  const { launch } = chromeLauncherMod;

  const chrome = await launch({ chromeFlags: ['--headless=new', '--no-sandbox'] });
  const results = [];
  let done = 0;

  try {
    for (const url of urls) {
      const u = new URL(url);
      const localUrl = `http://localhost:3000${u.pathname}${u.search}`;
      try {
        const runnerResult = await lighthouse(localUrl, {
          port: chrome.port,
          output: 'json',
          logLevel: 'error',
          onlyCategories: ['seo']
        });
        const score = Math.round((runnerResult.lhr.categories.seo.score || 0) * 100);
        results.push({ url, localUrl, score, finalUrl: runnerResult.lhr.finalUrl });
      } catch (e) {
        results.push({ url, localUrl, score: null, error: String(e && e.message ? e.message : e) });
      }
      done += 1;
      if (done % 25 === 0 || done === urls.length) {
        console.log(`PROGRESS ${done}/${urls.length}`);
      }
    }
  } finally {
    await chrome.kill();
  }

  const total = results.length;
  const withScore = results.filter(r => typeof r.score === 'number');
  const full = withScore.filter(r => r.score === 100);
  const nonFull = withScore.filter(r => r.score !== 100).sort((a,b) => a.score - b.score);
  const errors = results.filter(r => r.score === null);

  const out = {
    generatedAt: new Date().toISOString(),
    total,
    scored: withScore.length,
    fullScore: full.length,
    nonFullCount: nonFull.length,
    errorCount: errors.length,
    nonFull,
    errors,
  };

  fs.writeFileSync(path.resolve('.tmp-lighthouse-seo-all.json'), JSON.stringify(out, null, 2));

  console.log('TOTAL=' + total);
  console.log('SCORED=' + withScore.length);
  console.log('FULL_100=' + full.length);
  console.log('NON_100=' + nonFull.length);
  console.log('ERRORS=' + errors.length);
  if (nonFull.length) {
    console.log('LOWEST_10_START');
    nonFull.slice(0,10).forEach(r => console.log(`${r.score} ${r.url}`));
    console.log('LOWEST_10_END');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
