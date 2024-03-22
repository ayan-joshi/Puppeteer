const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Enable request interception
  await page.setRequestInterception(true);

  // Event listener for intercepted requests
  page.on('request', interceptedRequest => {
    console.log('Intercepted URL:', interceptedRequest.url());

    // Check if the request resolution is handled
    if (interceptedRequest.isInterceptResolutionHandled()) {
      console.log('Request resolution is handled');
      return;
    }

    // Abort image requests (PNG and JPG)
    if (interceptedRequest.url().endsWith('.png') || interceptedRequest.url().endsWith('.jpg')) {
      console.log('Aborting image request:', interceptedRequest.url());
      interceptedRequest.abort();
    } else {
      console.log('Continuing request:', interceptedRequest.url());
      interceptedRequest.continue();
    }
  });

  // Navigate to the target URL
  await page.goto('https://share.myjosh.in/audio/77762d66-99e6-4c15-b676-9b74e8c31501');

  // Close the browser
  await browser.close();
})();
