const puppeteer = require('puppeteer');

async function scrape(url) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Navigate to the page
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Function to scroll the page
    const scrollPage = async () => {
        await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight); // Scroll down by window height
        });
    };

    // Scroll the page every 2 seconds
    const scrollInterval = setInterval(scrollPage, 2000);

    let prevHeight = 0;

    // Check for page height change and stop scrolling when it remains constant
    const checkPageHeight = setInterval(async () => {
        const currentHeight = await page.evaluate(() => document.body.scrollHeight);
        if (currentHeight === prevHeight) {
            clearInterval(scrollInterval); // Stop scrolling
            clearInterval(checkPageHeight); // Stop checking page height
            // Scrape video URLs
            const videoUrls = await page.evaluate(() => {
                const urls = [];
                const videoElements = document.querySelectorAll('a[href*="single-video"]');
                videoElements.forEach(video => {
                    urls.push(video.href);
                });
                return urls;
            });
            console.log('Video URLs:', videoUrls);
            await browser.close(); // Close the browser
        } else {
            prevHeight = currentHeight;
        }
    }, 5000); // Check every 5 seconds for page height change
}

// Call the scrape function with the URL
scrape('https://www.hipi.co.in/sound/2291adeb-61d2-4c9b-bb20-86ec0716feb7');
