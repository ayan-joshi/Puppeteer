var https = require('follow-redirects').https;
var fs = require('fs');

// Function to fetch data for a given page
function fetchDataForPage(page) {
    var options = {
        'method': 'GET',
        'hostname': 'social.triller.co',
        'path': `/v1.5/api/music/video/fresh?page=${page}&song_id=6ac26199-cd40-4f7d-b504-3fff7df4cafe&limit=50`,
        'headers': {},
        'maxRedirects': 20
    };

    var req = https.request(options, function (res) {
        console.log('Response status code:', res.statusCode);

        var chunks = [];

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function (chunk) {
            var body = Buffer.concat(chunks);
            try {
                var jsonData = JSON.parse(body.toString());
                processData(jsonData, page);
            } catch (error) {
                console.error('Error parsing JSON:', error);
                console.log('Response body:', body.toString());
            }
        });

        res.on("error", function (error) {
            console.error('Error:', error);
        });
    });

    req.end();
}

// Function to process fetched data
function processData(data, page) {
    const users = data.users;
    const videos = data.videos;
    const outputData = {};

    // Fetch video_uuid for each user
    Object.keys(users).forEach(userId => {
        const user = users[userId];
        const username = user.username;

        const userVideos = videos.filter(video => video.user_id === parseInt(userId));
        const userVideoUuids = userVideos.map(video => video.video_uuid);

        outputData[username] = userVideoUuids;
    });

    // Create video URLs and update outputData
    Object.keys(outputData).forEach(username => {
        outputData[username] = outputData[username].map(videoUuid => {
            return `https://triller.co/@${username}/video/${videoUuid}`;
        });
    });

    // Stringify the outputData
    const outputJson = JSON.stringify(outputData, null, 2);

    // Write to output.json
    fs.appendFileSync('output.json', `Page ${page}:\n${outputJson}\n\n`);

    console.log(`Data for page ${page} stored in output.json`);
}

// Fetch data for pages 1 to 5
for (let page = 1; page <= 5; page++) {
    fetchDataForPage(page);
}
