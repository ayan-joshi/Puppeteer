const puppeteer = require('puppeteer');
const fs = require('fs');
const xlsx = require('xlsx');

// Function to read ISBN values from the Excel file
async function readISBNFromExcel(filePath) {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Assuming ISBN is in the second column (column B)
    const isbnColumn = 'C';
    const isbnValues = [];

    let rowIndex = 2; // Start from row 2 (assuming row 1 is header)
    let cell = worksheet[`${isbnColumn}${rowIndex}`];
    while (cell) {
        isbnValues.push(cell.v);
        rowIndex++;
        cell = worksheet[`${isbnColumn}${rowIndex}`];
    }

    return isbnValues;
}

// Function to search for a book on Snapdeal
async function searchOnSnapdeal(page, isbn) {
    try {
        // Navigate to the Snapdeal website
        await page.goto('https://www.snapdeal.com/');

        // Find the search input field and type the ISBN
        await page.type('#inputValEnter', isbn);

        // Find and click the search button
        await page.click('.searchTextSpan');

        // Wait for the search results to load
        await page.waitForSelector('.searchResult');
    } catch (error) {
        console.error('Error searching on Snapdeal:', error);
    }
}

// Main function
async function main() {
    try {
        // Load ISBN values from the Excel file
        const isbnValues = await readISBNFromExcel('input.xlsx');

        // Launch Puppeteer and create a new page
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        // Loop through each ISBN and search on Snapdeal
        for (const isbn of isbnValues) {
            console.log('Searching for ISBN:', isbn);
            await searchOnSnapdeal(page, isbn);
            // Add your scraping logic here
            // You can extract book data from the search results page
        }

        // Close the browser
        await browser.close();
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

// Call the main function
main();
