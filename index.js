const puppeteer = require('puppeteer');
const xlsx = require('xlsx');
const stringSimilarity = require('string-similarity');

// Function to read ISBN values from the Excel file
async function readBooksFromExcel(filePath) {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Assuming book titles and ISBN are in the first two columns (columns A and B)
    const data = xlsx.utils.sheet_to_json(worksheet);
    return data;
}

function findBestMatch(title, titles, prices) {
    let bestMatch = { index: -1, rating: 0, price: Infinity };
    for (let i = 0; i < titles.length; i++) {
        const rating = stringSimilarity.compareTwoStrings(title, titles[i]);
        if (rating > bestMatch.rating || (rating === bestMatch.rating && prices[i] < bestMatch.price)) {
            bestMatch = { index: i, rating: rating, price: prices[i] };
        }
    }
    return bestMatch;
}

// Function to search for a book on Snapdeal
async function searchOnSnapdeal(page, book) {
    try {
        // Navigate to the Snapdeal website
        await page.goto('https://www.snapdeal.com/');

        // Find the search input field and type the book ISBN
        await page.type('#inputValEnter', book.ISBN.toString());

        // Find and click the search button
        await page.click('.searchTextSpan');

        // Wait for the search results to load
        await page.waitForSelector('.product-tuple-listing', { timeout: 60000 });

        // Check if any search results are found
        const searchResults = await page.$$('.product-tuple-listing');
        if (searchResults.length === 0) {
            // Update the "Found" column status to "No" in Excel
            book.Found = 'No';
            return;
        }

        // Extract prices and in-stock status of search results
        const searchResultPrices = await page.$$eval('.product-tuple-listing .product-price', elements =>
            elements.map(e => parseFloat(e.textContent.replace(/[^\d.]/g, '')))
        );
      

        // Find the lowest price book index
        const lowestPriceIndex = searchResultPrices.indexOf(Math.min(...searchResultPrices));

       
        // Click on the lowest price book to open its page
        const bookLink = await searchResults[lowestPriceIndex].$eval('.product-tuple-image a', element => element.href);
        await page.goto(bookLink);

        // Extract book information
        const price = await page.$eval('.pdp-final-price', element => element.textContent.trim());
        const author = await page.$eval('.list-cicrle-cont', element => element.textContent.trim());
        const publisher = await page.$eval('.list-cicrle-cont', element => element.textContent.trim());
        const url = page.url();

        // Update the book with scraped data
        book.Found = 'Yes';
        book.Price = price;
        book.Author = author;
        book.Publisher = publisher;
        book.URL = url;
        book['In Stock'] = 'Yes';

    } catch (error) {
        console.error('Error searching on Snapdeal:', error);
    }
}




// Main function
async function main() {
    try {
        // Load book data from the Excel file
        const books = await readBooksFromExcel('input.xlsx');

        // Launch Puppeteer and create a new page
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        // Loop through each book and search on Snapdeal
        for (const book of books) {
            console.log('Searching for book:', book['Book Title']);
            await searchOnSnapdeal(page, book);
        }

        // Write the updated book data back to the Excel file
        const updatedWorkbook = xlsx.utils.book_new();
        const updatedWorksheet = xlsx.utils.json_to_sheet(books);
        xlsx.utils.book_append_sheet(updatedWorkbook, updatedWorksheet);
        xlsx.writeFile(updatedWorkbook, 'output.xlsx');

        // Close the browser after all searches are completed
        await browser.close();
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

// Call the main function
main();
