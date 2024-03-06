const axios = require('axios');

async function fetchData(page) {
    try {
        const url = `https://social.triller.co/v1.5/api/music/video/fresh?page=${page}&song_id=6ac26199-cd40-4f7d-b504-3fff7df4cafe&limit=6`;
        const response = await axios.get(url);
        
        if (response.status === 200) {
            const jsonData = response.data;
            const usersData = jsonData.users || [];
            
            // Extract usernames and their video_uuids
            const userVideos = usersData.map(user => ({
                username: user.username,
                video_uuid: user.video_uuid
            }));
            
            return userVideos;
        } else {
            console.log("Failed to fetch data from page", page);
            return [];
        }
    } catch (error) {
        console.error("Error fetching data:", error.message);
        return [];
    }
}

async function fetchAllData() {
    try {
        const allUserVideos = [];
        
        // Fetch data from pages 1, 2, and 3
        for (let page = 1; page <= 3; page++) {
            const userVideos = await fetchData(page);
            allUserVideos.push(...userVideos);
        }
        
        console.log("All user videos:", allUserVideos);
    } catch (error) {
        console.error("Error fetching all data:", error.message);
    }
}

fetchAllData();
