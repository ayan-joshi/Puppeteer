const fs = require('fs');


fs.readFile('input.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading input file:', err);
        return;
    }

    try {
       
        const jsonData = JSON.parse(data);

      
        if (!jsonData || !jsonData.data || !Array.isArray(jsonData.data)) {
            console.error('Invalid JSON data format.');
            return;
        }

     
        const shareUrls = jsonData.data.map(item => item.share_url);

       
        fs.writeFile('output2.json', JSON.stringify(shareUrls, null, 2), err => {
            if (err) {
                console.error('Error writing output file:', err);
                return;
            }
            console.log('Share URLs saved to output.json');
        });
    } catch (error) {
        console.error('Error parsing JSON data:', error);
    }
});
