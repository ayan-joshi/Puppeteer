const fs = require('fs');

// Read the JSON file synchronously
const rawData = fs.readFileSync('input.json');

// Parse JSON data
const jsonData = JSON.parse(rawData);

// Extracting user_ids from the users object
const userIds = Object.keys(jsonData.users);

// Create an object to store user_ids with corresponding video URLs
const outputData = {};

userIds.forEach(userId => {
    const user = jsonData.users[userId];
    const videos = jsonData.videos.filter(video => video.user_id === parseInt(userId)); // Filter videos by user_id

    // Extracting the username
    const username = user.username;

    // Check if user data is fetched
    if (!user || !username) {
        outputData[username] = ['User data not fetched'];
        return; // Skip to the next user
    }

    // Extracting the video URLs
    const videoUrls = videos.map(video => {
        // Check if video data is fetched
        if (!video || !video.video_uuid) {
            return 'Video data not fetched';
        }
        return `https://triller.co/@${username}/video/${video.video_uuid}`;
    });

    // Store the username and video URLs in the outputData
    outputData[username] = videoUrls;
});

// Stringify the outputData
const outputJson = JSON.stringify(outputData, null, 2);

// Write to output.json
fs.writeFileSync('output.json', outputJson);

console.log('Data stored in output.json');
