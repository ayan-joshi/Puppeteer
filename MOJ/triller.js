const https = require('follow-redirects').https;

class Triller {

    static async run(songName, audioLink, label) {
        let songId = await this.getSongId(audioLink);
        let pageNo = 1;
        let flag = true;
        let videoUrls = [];
        let srNoCounter = 1;

        while (flag) {
            let resResultJson = await this.apiCall(pageNo, songId);
            if (resResultJson.length === 0) {
                flag = false;
            } else {
                const videos = resResultJson.map(async video => {
                    return {
                        sr_no: srNoCounter++,
                        song_name: songName,
                        video_link: video.short_url,
                        audio_link: audioLink,
                        label: label,
                        date: this.getFirstDateOfMonth(),
                        analyst: 'bot',
                        app_name: 'triller'
                    };
                });
                videoUrls.push(...await Promise.all(videos));
                pageNo++;
            }
        }
        console.log('Video URLs:', videoUrls);
        return videoUrls;
    }

    static async getSongId(audioLink) {
        const regex = /tracks\/([^\/]+)/;
        const match = audioLink.match(regex);
        if (match) {
            return match[1];
        } else {
            throw new Error('Invalid audio link format');
        }
    }

    static async apiCall(pageNo, songId) {
        let body = await new Promise((resolve, reject) => {
            let options = {
                'method': 'GET',
                'hostname': 'social.triller.co',
                'path': `/v1.5/api/music/video/fresh?page=${pageNo}&song_id=${songId}&limit=50`,
                'headers': {},
                'maxRedirects': 20
            };

            let req = https.request(options, function (res) {
                let chunks = [];

                res.on("data", function (chunk) {
                    chunks.push(chunk);
                });

                res.on("end", function () {
                    const body = Buffer.concat(chunks).toString();
                    const jsonData = JSON.parse(body);
                    resolve(jsonData.videos);
                });

                res.on("error", function (error) {
                    reject(error);
                });
            });

            req.end();
        });

        return body;
    }

    static getFirstDateOfMonth() {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1; // Adding 1 since getMonth() returns zero-based months
        const formattedMonth = month < 10 ? `0${month}` : month; // Add leading zero if month is single digit
        const formattedDate = `${year}-${formattedMonth}-01`;
        return formattedDate;
    }
    
}

module.exports = Triller;

// Example usage
// Triller.run('Blessed',  'https://triller.co/tracks/6ac26199-cd40-4f7d-b504-3fff7df4cafe', 'Sony Music');
