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

    // Wait for some time for the page to load and scrape video URLs
    setTimeout(async () => {
        const videoUrls = await page.evaluate(() => {
            const urls = [];
            const videoElements = document.querySelectorAll('a[href*="single-video"]');
            videoElements.forEach(video => {
                urls.push(video.href);
            });
            return urls;
        });
        console.log('Video URLs:', videoUrls);
        clearInterval(scrollInterval); // Stop scrolling
        await browser.close(); // Close the browser
    }, 10000); // Adjust the time according to your page load time
}

// Call the scrape function with the URL
scrape('https://www.hipi.co.in/sound/be9600b1-2d7c-48df-9484-8b07e505c1de');

