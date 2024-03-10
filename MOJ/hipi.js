const https = require('follow-redirects').https;
const fs = require('fs');

const options = {
    method: 'GET',
    hostname: 'www.hipi.co.in',
    path: '/_next/data/221b61f2bb25f7a54d514a26772f12a795492f5a/en-in/sound/abf409cf-2e90-4a2d-ab1d-b4a483c2327f.json?item=abf409cf-2e90-4a2d-ab1d-b4a483c2327f',
    headers: {},
    maxRedirects: 20
};

const req = https.request(options, function (res) {
    let chunks = '';

    res.on('data', function (chunk) {
        chunks += chunk;
    });

    res.on('end', function () {
        try {
            const jsonData = JSON.parse(chunks);
            processData(jsonData);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            console.log('Response body:', chunks);
        }
    });

    res.on('error', function (error) {
        console.error('Error:', error);
    });
});

req.end();

function processData(data) {
    const { videoArray } = data?.pageProps || {};

    if (!videoArray || !Array.isArray(videoArray) || videoArray.length === 0) {
        console.error('No video data found in the response.');
        return;
    }

    const outputData = [];

    videoArray.forEach((video, index) => {
        const { content_id, soundId, userName } = video || {};
        if (!content_id || !soundId || !userName) {
            console.error(`Missing data for video at index ${index}. Skipping.`);
            return;
        }

        const newUrl = `https://www.hipi.co.in/single-video/${content_id}?feed=sound&keyword=${soundId}&index=${index}`;
        outputData.push({ username: userName, url: newUrl });
    });

    // Write to output1.json
    fs.writeFileSync('output1.json', JSON.stringify(outputData, null, 2));

    console.log('Data stored in output1.json');
}
