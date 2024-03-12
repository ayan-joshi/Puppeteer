const puppeteer = require('puppeteer');
const fs = require('fs');

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

    // Keep track of previous scroll height to detect when we've reached the bottom
    let prevScrollHeight = 0;

    try {
        while (true) {
            // Scroll the page
            await scrollPage();
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
            // Get the current scroll height
            const currentScrollHeight = await page.evaluate(() => document.body.scrollHeight);
            // Check if we've reached the bottom of the page
            if (currentScrollHeight === prevScrollHeight) {
                break; // Stop scrolling if no additional content is loaded
            }
            // Update the previous scroll height
            prevScrollHeight = currentScrollHeight;
        }

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

        // Write video URLs to a JSON file
        fs.writeFileSync('output1.json', JSON.stringify(videoUrls, null, 2));
        console.log('Video URLs saved to output1.json');
    } catch (error) {
        console.error('Error during scraping:', error);
    } finally {
        await browser.close(); // Close the browser
    }
}

// Call the scrape function with the URL
scrape('https://www.hipi.co.in/sound/27d62c5f-609d-4b85-b8f7-8593da3ca112');
