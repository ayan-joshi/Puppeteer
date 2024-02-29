const puppeteer = require('puppeteer');
const fs = require('fs');
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

// Function to search for a book on Snapdeal
async function searchOnSnapdeal(page, book) {
    try {
        // Navigate to the Snapdeal website
        await page.goto('https://www.snapdeal.com/');

        // Find the search input field and type the book title or ISBN
        await page.type('#inputValEnter', book.ISBN.toString());

        // Find and click the search button
        await page.click('.searchTextSpan');

        // Wait for the search results to load
        await page.waitForSelector('.searchResult');

        // Check if any search results are found
        const searchResults = await page.$$('.searchResult .product-desc-rating');
        if (searchResults.length === 0) {
            // Update the "Found" column status to "No" in Excel
            book.Found = 'No';
            return;
        }

        // Extract titles of search results
        const searchResultTitles = await page.$$eval('.searchResult .product-desc-rating', (elements) =>
            elements.map(e => e.textContent.trim())
        );

        // Find the best match for the book title
        const bestMatch = stringSimilarity.findBestMatch(book['Book Title'], searchResultTitles);
        const matchIndex = bestMatch.bestMatchIndex;
        const matchScore = bestMatch.bestMatch.rating;

        // Check if the best match score is at least 90%
        if (matchScore >= 0.9) {
            // Update the book with search result details
            const searchResult = searchResults[matchIndex];
            const price = await searchResult.$eval('.product-price', element => element.textContent.trim());
            const author = await searchResult.$eval('.product-seller-name', element => element.textContent.trim());
            const publisher = await searchResult.$eval('.product-publisher', element => element.textContent.trim());
            const inStock = await searchResult.$eval('.availability', element => element.textContent.trim());

            book.Found = 'Yes';
            book.Price = price;
            book.Author = author;
            book.Publisher = publisher;
            book['In Stock'] = inStock;
        } else {
            // Update the "Found" column status to "No" in Excel
            book.Found = 'No';
        }
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
