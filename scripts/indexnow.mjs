// Ping IndexNow (Bing, Yandex, etc.) with every URL in the built sitemap. Run after deploy: npm run indexnow
import { readFileSync } from 'node:fs';
const site = JSON.parse(readFileSync(new URL('../src/_data/site.json', import.meta.url)));
const urls = [...readFileSync(new URL('../_site/sitemap.xml', import.meta.url), 'utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
const host = new URL(site.url).host;
const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key: site.indexNowKey, keyLocation: `${site.url}/${site.indexNowKey}.txt`, urlList: urls }) });
console.log('IndexNow', r.status, urls.length, 'urls');
