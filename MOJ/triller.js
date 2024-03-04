const puppeteer = require('puppeteer');

async function scrape(url) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    // Navigate to the page
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Function to scroll the page to the bottom
    const scrollPageToBottom = async () => {
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });
    };

    // Scroll the page to the bottom
    let previousHeight = 0;
    while (true) {
        await scrollPageToBottom();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds for content to load
        const newHeight = await page.evaluate(() => document.body.scrollHeight);
        if (newHeight === previousHeight) {
            break; // Exit the loop if no more content is loaded
        }
        previousHeight = newHeight;
    }

    // Scrape video URLs with the common part "/video"
    const videoUrls = await page.evaluate(() => {
        const urls = [];
        const videoElements = document.querySelectorAll('a[href*="/video"]');
        videoElements.forEach(video => {
            urls.push(video.href);
        });
        return urls;
    });

    console.log('Video URLs:', videoUrls);
    
    await browser.close(); // Close the browser
}

// Call the scrape function with the URL
scrape('https://triller.co/tracks/6ac26199-cd40-4f7d-b504-3fff7df4cafe');
