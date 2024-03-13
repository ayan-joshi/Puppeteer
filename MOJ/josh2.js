const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Enable request interception
  await page.setRequestInterception(true);

  // Navigate to the page
  await page.goto('https://share.myjosh.in/audio/8899ab03-fd5a-41b7-b5e2-7c64b02955f1');

  // Define a handler for intercepted requests
  page.on('request', (request) => {
    // Check if the request is the POST request we want to intercept
    if (request.method() === 'POST' && request.url() === 'https://feed.myjosh.in/v1/feed/audio?id=8899ab03-fd5a-41b7-b5e2-7c64b02955f1&page=1&rows=10') {
      // Continue the request
      request.continue();

      // Wait for the response
      request.responded.then(async (response) => {
        // Access the response data
        const responseData = await response.json();

        // Extract the share_url from the response
        const shareUrls = responseData.data.map(item => item.share_url);
        console.log(shareUrls);
      });
    } else {
      // Continue other requests
      request.continue();
    }
  });

  // Wait for a specific amount of time to ensure the POST request is made
  await new Promise(resolve => setTimeout(resolve, 5000));

  await browser.close();
})();