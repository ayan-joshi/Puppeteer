const puppeteer = require('puppeteer');
const Excel = require('excel4node');
const xlsx = require('xlsx');

async function scrapeSnapdeal(bookName, isbn) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Navigate to Snapdeal search results page
  await page.goto(`https://www.snapdeal.com/search?keyword=${bookName}`);
  
  // Wait for search results to load
  await page.waitForSelector('.product-tuple-description');

  // Extract available author, price, URL, publisher, and in stock information
  const data = await page.evaluate(() => {
    const product = document.querySelector('.product-tuple-description');

    const url = product.querySelector('a').href;
    const price = product.querySelector('.product-price').innerText;
    const author = product.querySelector('.product-seller-name').innerText;
    const publisher = product.querySelector('.product-publisher').innerText;
    const inStock = product.querySelector('.availability').innerText;

    return { url, price, author, publisher, inStock };
  });

  await browser.close();

  return data;
}

async function generateExcel(inputFileName, outputFileName) {
  // Read input Excel file
  const workbook = xlsx.readFile(inputFileName);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(worksheet);

  // Create a new Excel workbook for output
  const outputWorkbook = new Excel.Workbook();
  const outputWorksheet = outputWorkbook.addWorksheet('Sheet1');
  
  // Add headers
  outputWorksheet.cell(1, 1).string('Book Name');
  outputWorksheet.cell(1, 2).string('ISBN');
  outputWorksheet.cell(1, 3).string('URL');
  outputWorksheet.cell(1, 4).string('Price');
  outputWorksheet.cell(1, 5).string('Author');
  outputWorksheet.cell(1, 6).string('Publisher');
  outputWorksheet.cell(1, 7).string('In Stock');

  // Scrape Snapdeal for each book
  for (let i = 0; i < data.length; i++) {
    const { bookName, isbn } = data[i];
    const { url, price, author, publisher, inStock } = await scrapeSnapdeal(bookName, isbn);

    // Write scraped data to output Excel file
    outputWorksheet.cell(i + 2, 1).string(bookName);
    outputWorksheet.cell(i + 2, 2).string(isbn);
    outputWorksheet.cell(i + 2, 3).string(url);
    outputWorksheet.cell(i + 2, 4).string(price);
    outputWorksheet.cell(i + 2, 5).string(author);
    outputWorksheet.cell(i + 2, 6).string(publisher);
    outputWorksheet.cell(i + 2, 7).string(inStock);
  }

  // Write output Excel file
  await outputWorkbook.write(outputFileName);
}

// Usage
generateExcel('input.xlsx', 'output.xlsx');
