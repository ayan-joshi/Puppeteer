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
    // Keep track of the number of images scraped
    let scrapedImageCount = 0;
    // Maximum number of consecutive scrolls with no additional images loaded before stopping
    const maxConsecutiveEmptyScrolls = 5;
    // Number of consecutive empty scrolls
    let consecutiveEmptyScrolls = 0;

    try {
        while (true) {
            // Scroll the page
            await scrollPage();
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds
            // Get the current scroll height
            const currentScrollHeight = await page.evaluate(() => document.body.scrollHeight);
            // Check if we've reached the bottom of the page
            if (currentScrollHeight === prevScrollHeight) {
                consecutiveEmptyScrolls++;
                if (consecutiveEmptyScrolls >= maxConsecutiveEmptyScrolls) {
                    break; // Stop scrolling if no additional content is loaded after several scrolls
                }
            } else {
                consecutiveEmptyScrolls = 0;
            }
            // Update the previous scroll height
            prevScrollHeight = currentScrollHeight;

            // Scrape image URLs
            const newImageUrls = await page.evaluate(() => {
                const urls = [];
                const imageElements = document.querySelectorAll('img[src*="stream"]');
                imageElements.forEach(image => {
                    urls.push(image.src);
                });
                return urls;
            });
            // Update the total number of scraped images
            scrapedImageCount += newImageUrls.length;
            console.log('Scraped', scrapedImageCount, 'images');
        }

        // Generate content page URLs
        const contentPageUrls = newImageUrls.map(imageUrl => {
            const uniqueId = imageUrl.match(/([^\/]+)\.jpg$/)[1]; // Extract the unique ID from the image URL
            return `https://share.myjosh.in/content/${uniqueId}?ref_action=click&flow_id=8899ab03-fd5a-41b7-b5e2-7c64b02955f1`;
        });
        console.log('Content page URLs:', contentPageUrls);

        // Write content page URLs to a JSON file
        fs.writeFileSync('output2.json', JSON.stringify(contentPageUrls, null, 2));
        console.log('Content page URLs saved to output2.json');
    } catch (error) {
        console.error('Error during scraping:', error);
    } finally {
        await browser.close(); // Close the browser
    }
}

// Call the scrape function with the URL
scrape('https://share.myjosh.in/audio/8899ab03-fd5a-41b7-b5e2-7c64b02955f1?u=0x04f4fc2b1709606d');
