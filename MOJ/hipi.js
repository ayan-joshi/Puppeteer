const puppeteer = require('puppeteer');
const fs = require('fs');

class Hipi {
    static async launchBrowser() {
        const browser = await puppeteer.launch({ headless: false });
        return browser;
    }

    static async scrollPage(page) {
        await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight);
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    static async scrapeVideoData(page, songName, audioLink, label) {
        try {
            const data = [];
            const videoElements = await page.$$('a[href*="single-video"]');
            let srNo = 1; // Start from 1 for sr_no

            for (const videoElement of videoElements) {
                const url = await videoElement.evaluate(el => el.href);

                // Construct the video data object
                const videoData = {
                    sr_no: srNo++,
                    song_name: songName,
                    video_link: url,
                    audio_link: audioLink,
                    label: label,
                    date: this.getFirstDateOfMonth(),
                    analyst: 'bot',
                    app_name: 'hipi'
                };
                data.push(videoData);
            }

            return data; // Return the scraped data
        } catch (error) {
            console.error('Error during scraping:', error);
            throw error;
        }
    }

    static getFirstDateOfMonth() {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1; // Adding 1 since getMonth() returns zero-based months
        const formattedMonth = month < 10 ? `0${month}` : month; // Add leading zero if month is single digit
        const formattedDate = `${year}-${formattedMonth}-01`;
        return formattedDate;
    }

    static async run(songName, audioLink, label) {
        const browser = await Hipi.launchBrowser();
        const page = await browser.newPage();

        try {
            await page.goto(audioLink, { waitUntil: 'networkidle2' });

            let prevScrollHeight = 0;
            let scrollCount = 0;

            while (scrollCount < 1000) {
                const currentScrollHeight = await page.evaluate(() => document.body.scrollHeight);
                if (currentScrollHeight === prevScrollHeight) {
                    break; // Exit the loop if the scroll height hasn't changed
                }
                await Hipi.scrollPage(page);
                prevScrollHeight = currentScrollHeight;
                scrollCount++;
            }

            const videoData = await Hipi.scrapeVideoData(page, songName, audioLink, label);
            // console.log('Video Data:', videoData);

            return videoData; // Return the scraped data from run method
        } catch (error) {
            console.error('Error during scraping:', error);
        } finally {
            await browser.close();
        }
    }
}

module.exports = Hipi;

// Example usage:
Hipi.run(
  'Yaar Hoon Tera',
  'https://www.hipi.co.in/sound/545dad77-045f-4b60-b33e-11d89a9012e7',
  'Tseries'
);
