const puppeteer = require('puppeteer');

class Josh {
  static async processRequest(page) {
    page.setRequestInterception(true);

    const dataArray = [];

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
          const jsonData = JSON.parse(responseBody); // Parse the response as JSON

          if (jsonData.data && Array.isArray(jsonData.data)) {
            for (const item of jsonData.data) {
              if (item.share_url) {
                dataArray.push({
                  song_name: item.name,
                  video_link: item.share_url,
                  label: 'label', // You can set the label value as needed
                  date: Josh.getFirstDateOfMonth(),
                  analyst: 'bot',
                  app_name: 'Josh',
                  song_id: item.song_id, // Include song_id in the array object
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
        break; // Exit the loop if scrolling doesn't load more content
      }

      previousHeight = newHeight;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second after each scroll
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


  static async run(song_id) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    try {
      await page.goto(song_id, { timeout: 60000 });

      const dataArray = await Josh.processRequest(page);

      await Josh.simulateScrolling(page);

      await browser.close();

      console.log('Processed Data Array:', dataArray);
    } catch (error) {
      console.error('Error:', error);
      await browser.close(); // Close the browser in case of an error
    }
  }
}

module.exports = Josh;

Josh.run('https://share.myjosh.in/audio/77762d66-99e6-4c15-b676-9b74e8c31501');
