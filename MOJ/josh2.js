const puppeteer = require('puppeteer');

class Josh {
    static async launchBrowser() {
        const browser = await puppeteer.launch({ headless: false });
        return browser;
    }

    static async scrollPage(page) {
        await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight);
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    static async extractVideoUrl(page, mainUrl) {
        const currentUrl = page.url();
        if (currentUrl.includes('/content/')) {
            return currentUrl;
        }

        await page.waitForSelector('.imgHolder.blur');
        await page.click('.imgHolder.blur');
        await page.waitForNavigation();

        const newUrl = page.url();
        if (newUrl.includes('/content/')) {
            await page.goto(mainUrl, { waitUntil: 'networkidle2' }); // Navigate back to the main page
            return newUrl;
        }

        return null;
    }

    static async run(url) {
        const browser = await Josh.launchBrowser();
        const page = await browser.newPage();

        try {
            await page.goto(url, { waitUntil: 'networkidle2' });

            let prevScrollHeight = 0;
            let newThumbnailsFound = true;
            let scrollCount = 0;
            const videoLinks = new Set(); // Using a Set to automatically handle duplicates

            while (newThumbnailsFound && scrollCount < 1) {
                const currentScrollHeight = await page.evaluate(() => document.body.scrollHeight);
                if (currentScrollHeight === prevScrollHeight) {
                    newThumbnailsFound = false;
                    continue;
                }
                await Josh.scrollPage(page);
                prevScrollHeight = currentScrollHeight;
                scrollCount++;

                const thumbnailElements = await page.$$('.imgHolder.blur');
                for (const thumbnailElement of thumbnailElements) {
                    const videoUrl = await Josh.extractVideoUrl(page, url); // Pass the main URL to the extractVideoUrl function
                    if (videoUrl && !videoLinks.has(videoUrl)) {
                        videoLinks.add(videoUrl);
                    }
                }
            }

            console.log('Video Links:', Array.from(videoLinks)); // Convert Set to Array for logging and return
            return Array.from(videoLinks);
        } catch (error) {
            console.error('Error during scraping:', error);
        } finally {
            await browser.close();
        }
    }
}

module.exports = Josh;

// Example usage:
Josh.run('https://share.myjosh.in/audio/77762d66-99e6-4c15-b676-9b74e8c31501');
