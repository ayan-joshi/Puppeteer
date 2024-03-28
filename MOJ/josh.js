const puppeteer = require('puppeteer');

class Josh {
  static async processRequest(page, songId, songName) {
    page.setRequestInterception(true);

    const dataArray = [];
    let srNoCounter = 1;

    page.on('request', async (request) => {
      const requestedUrl = request.url();

      // Continue with the request
      request.continue();
    });

    page.on('response', async (response) => {
      const requestedUrl = await response.request().url();
      if (response.status() === 200 && requestedUrl.endsWith('apiwbody')) {
        const responseBody = await response.text();
        try {
          const jsonData = JSON.parse(responseBody);
          

          if (jsonData.data && Array.isArray(jsonData.data)) {
            for (const item of jsonData.data) {
              if (item.share_url) {
                dataArray.push({
                  sr_no: srNoCounter++,
                  song_name: songName,
                  video_link: item.share_url,
                  song_url: songId,
                  label: 'Hungama',
                  date: Josh.getFirstDateOfMonth(),
                  analyst: 'bot',
                  app_name: 'Josh',
                });
              }
            }
          }
        } catch (error) {
          console.error('Error parsing JSON response:', error);
        }
      }
    });

    return dataArray;
  }

  static async simulateScrolling(page) {
    let previousHeight;
    while (true) {
      const newHeight = await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
        return document.body.scrollHeight;
      });

      if (newHeight === previousHeight) {
        break; 
      }

      previousHeight = newHeight;
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 1 second after each scroll
    }
  }

  static getFirstDateOfMonth() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; 
    const formattedMonth = month < 10 ? `0${month}` : month; 
    const formattedDate = `${year}-${formattedMonth}-01`;
    return formattedDate;
  }

  static async run(songId, songName) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    try {
      await page.goto(songId, { timeout: 600000 });

      const dataArray = await Josh.processRequest(page, songId, songName); // Pass songName to processRequest

      await Josh.simulateScrolling(page);

      await browser.close();

      // return dataArray;
      console.log('Processed Data Array:', dataArray);
    } catch (error) {
      console.error('Error:', error);
      await browser.close(); // Close the browser in case of an error
    }
  }
}

module.exports = Josh;

Josh.run('https://share.myjosh.in/audio/cce708df-6f47-456a-b1af-a80c80554363', 'Phsychic');
