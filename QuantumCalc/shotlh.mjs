import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';
const URL = pathToFileURL(process.cwd()+'/../quantum_calc.html').href;
const act = (p,a)=>p.locator(`[data-action="${a}"]`).first().click();
const b = await chromium.launch();
const pg = await b.newPage({ viewport:{width:1000,height:760} });
await pg.goto(URL);
try { await pg.waitForFunction('!!window.katex', {timeout:6000}); } catch{}
await act(pg,'key:4'); await act(pg,'key:Q'); await act(pg,'key:SET'); await act(pg,'gate:H');
for (const lh of ['1.7','1.85','2.0','2.15']){
  await pg.locator('#stateDisplay').evaluate((el,v)=>{ el.style.lineHeight=v; }, lh);
  await pg.waitForTimeout(250);
  await pg.locator('.display').screenshot({ path:`shot-v5-lh-${lh.replace('.','_')}.png` });
}
await b.close();
