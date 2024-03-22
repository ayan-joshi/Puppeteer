const puppeteer = require('puppeteer');

class JoshScraper {
    static async run() {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        try {
            await page.goto('https://share.myjosh.in/audio/77762d66-99e6-4c15-b676-9b74e8c31501');
            await page.waitForSelector('.imgHolder.blur');
            await page.click('.imgHolder.blur');
            await page.waitForNavigation();

            // Recursive function to scrape video URLs from multiple pages
            const videoUrls = await this.scrapeVideos(page);

            console.log('Video URLs:', videoUrls);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            await browser.close();
        }
    }

    static async scrapeVideos(page) {
        // Array to store video URLs
        let videoUrls = [];

        // Function to intercept network requests
        await page.setRequestInterception(true);
        page.on('request', interceptedRequest => {
            if (interceptedRequest.url().includes('/v1.5/api/music/video/fresh')) {
                interceptedRequest.continue();
            } else {
                interceptedRequest.abort();
            }
        });

        // Function to handle intercepted responses and scrape video URLs
        page.on('response', async response => {
            if (response.url().includes('/v1.5/api/music/video/fresh')) {
                const jsonData = await response.json();
                const videos = jsonData.videos.map(video => video.short_url);
                videoUrls.push(...videos);
            }
        });

        // Navigate to next page if pagination exists
        const nextButton = await page.$('.pagination a[aria-label="Next"]');
        if (nextButton) {
            await Promise.all([
                page.waitForNavigation(),
                page.click('.pagination a[aria-label="Next"]')
            ]);
            videoUrls.push(...await this.scrapeVideos(page));
        }

        return videoUrls;
    }
}

module.exports = JoshScraper;

// Example usage
JoshScraper.run();
