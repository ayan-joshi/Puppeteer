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

    static async extractVideoUrlFromThumbnail(page, thumbnailUrl) {
        await page.setRequestInterception(true);
        let videoUrl = null;

        const requestHandler = async (request) => {
            const requestUrl = request.url();
            if (requestUrl.includes('/content/')) {
                try {
                    const response = await request.continue();
                    const redirectUrl = response.headers().location;
                    if (redirectUrl) {
                        videoUrl = redirectUrl;
                    }
                } catch (error) {
                    console.error('Error handling request:', error);
                }
            } else {
                request.continue();
            }
        };

        page.on('request', requestHandler);

        try {
            await page.goto(thumbnailUrl, { waitUntil: 'networkidle2' });
        } catch (error) {
            console.error('Error navigating to thumbnail:', error);
        }

        page.off('request', requestHandler);
        await page.setRequestInterception(false);

        return videoUrl;
    }

    static async run(url) {
        const browser = await Josh.launchBrowser();
        const page = await browser.newPage();

        try {
            await page.goto(url, { waitUntil: 'networkidle2' });

            let prevScrollHeight = 0;
            let newThumbnailsFound = true;
            let scrollCount = 0;
            const videoLinks = [];

            while (newThumbnailsFound && scrollCount < 2) {
                const currentScrollHeight = await page.evaluate(() => document.body.scrollHeight);
                if (currentScrollHeight === prevScrollHeight) {
                    newThumbnailsFound = false;
                    continue;
                }
                await Josh.scrollPage(page);
                prevScrollHeight = currentScrollHeight;
                scrollCount++;
            }

            const thumbnailUrls = await page.$$eval('img[src*="stream.myjosh.in"]', imgs => imgs.map(img => img.src));

            for (const thumbnailUrl of thumbnailUrls) {
                const videoUrl = await Josh.extractVideoUrlFromThumbnail(page, thumbnailUrl);
                if (videoUrl) {
                    videoLinks.push(videoUrl);
                }
            }

            console.log('Video Links:', videoLinks);
            return videoLinks;
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