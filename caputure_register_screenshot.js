const puppeteer = require('C:/Users/hermo/AppData/Local/Temp/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  await page.goto('http://localhost:3000/register', {
    waitUntil: 'networkidle0',
    timeout: 30000
  });

  await page.screenshot({
    path: 'E:/realestate_booking/thesis_screenshots/02-register.png',
    fullPage: true
  });

  console.log('Screenshot saved: thesis_screenshots/02-register.png');
  await browser.close();
})();
