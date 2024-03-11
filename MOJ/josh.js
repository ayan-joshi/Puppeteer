const puppeteer = require('puppeteer');

async function scrape(url) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    // Navigate to the page
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Wait for the thumbnail element to be present
    await page.waitForSelector('.thumbnail-selector img');

    // Get the URL of the thumbnail
    const thumbnailUrl = await page.evaluate(() => {
        const thumbnailElement = document.querySelector('.thumbnail-selector img');
        return thumbnailElement.src;
    });

    // Click on the thumbnail to navigate to the associated URL
    await page.click('.');

    // Wait for navigation to complete
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Get the URL of the page after clicking the thumbnail
    const clickedUrl = page.url();

    console.log('Thumbnail URL:', thumbnailUrl);
    console.log('Clicked URL:', clickedUrl);

    await browser.close(); // Close the browser after scraping
}

// Call the scrape function with the URL
scrape('https://share.myjosh.in/audio/8899ab03-fd5a-41b7-b5e2-7c64b02955f1?u=0x04f4fc2b1709606d');
