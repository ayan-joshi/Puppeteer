const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setRequestInterception(true);

  const jsonResponseData = [];
  const videoUrls = new Set(); // Using a Set to store unique video URLs

  page.on('request', async (request) => {
    const requestedUrl = request.url();

    // Continue with the request
    request.continue();
  });

  page.on('response', async (response) => {
    const requestedUrl = await response.request().url();
    if (response.status() === 200 && requestedUrl.endsWith('apiwbody')) {
      const responseBody = await response.text();
      try {
        const jsonData = JSON.parse(responseBody); // Parse the response as JSON

        if (jsonData.data && Array.isArray(jsonData.data)) {
          for (const item of jsonData.data) {
            if (item.share_url) {
              videoUrls.add(item.share_url); // Add unique video URLs to the Set
            }
          }
        }
        
        jsonResponseData.push({ url: requestedUrl, body: responseBody });
      } catch (error) {
        console.error('Error parsing JSON response:', error);
      }
    }
  });

  await page.goto('https://share.myjosh.in/audio/77762d66-99e6-4c15-b676-9b74e8c31501', { timeout: 60000 });

  // Simulate scrolling to load more content
  let previousHeight;
  while (true) {
    const newHeight = await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
      return document.body.scrollHeight;
    });

    if (newHeight === previousHeight) {
      break; // Exit the loop if scrolling doesn't load more content
    }

    previousHeight = newHeight;
    await new Promise(resolve => setTimeout(resolve, 1000));// Wait for 1 second after each scroll
  }

  await browser.close();

  console.log('Video URLs:', Array.from(videoUrls)); // Log all unique video URLs
})();
