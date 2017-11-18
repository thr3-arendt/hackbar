const cron       = require('node-cron');
const moment     = require('moment');
const VolumeVote = require('./../models/VolumeVote');
const SpotifyWebApi = require('spotify-web-api-node');
const nconf = require('nconf');
const WebApiRequest = require('./../node_modules/spotify-web-api-node/src/webapi-request');
const HttpManager  = require('./../node_modules/spotify-web-api-node/src/http-manager');

const spotifyApi = new SpotifyWebApi({
    redirectUri : 'http://localhost:3000/spotify/callback',
    clientId:     nconf.get('spotify:clientId'),
    clientSecret: nconf.get('spotify:clientSecret'),
});

const accessToken = nconf.get('spotify:accessToken');
spotifyApi.setAccessToken(accessToken);



let volumeUpdateTask = cron.schedule('*/10 * * * *', function() {
    console.log('[VolumeUpdateTask] Running volume update task');

    let cutoffDate = moment().subtract(10, 'minutes');

    VolumeVote.aggregate([
        { $match: { date: { $gt: cutoffDate.toDate() } } },
        { $group: { _id : '$vote', count : { $sum : 1 }}}
    ]).exec(function (error, aggregation) {
        console.log('[VolumeUpdateTask] Aggregation', aggregation);

        let countLouder  = 0;
        let countQuieter = 0;

        aggregation.forEach(entry => {
            if (entry['_id'] === true) {
                countLouder = entry.count;
            } else {
                countQuieter = entry.count;
            }
        });

        if (countQuieter == countLouder) {
            return;
        }

        let delta = countQuieter < countLouder ? 25 : -25;

        // get current volume level
        spotifyApi.getMyCurrentPlaybackState().then(data => {

            let volume = data.body.device.volume_percent || 50;
            console.log('[VolumeUpdateTask] Current volume is ', data.body.device.volume_percent);

            volume += delta;

            volume = Math.max(volume, 10);
            volume = Math.min(volume, 100);


            let request = WebApiRequest.builder()
                .withPath('/v1/me/player/volume')
                .withQueryParameters({
                    volume_percent: volume
                })
                .build();

            request.addHeaders({
                'Authorization' : 'Bearer ' + accessToken
            });

            HttpManager.put(request, (error, result) => {
                console.log('[VolumeUpdateTask] Set volume to ' + volume);
            });


        });

    });
});

volumeUpdateTask.start();