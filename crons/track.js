const cron       = require('node-cron');
const TrackVote = require('./../models/TrackVote');
const SpotifyAuth = require('./../models/SpotifyAuth');
const SpotifyWebApi = require('spotify-web-api-node');
const nconf = require('nconf');


const spotifyApi = new SpotifyWebApi({
    redirectUri : 'http://localhost:3000/spotify/callback',
    clientId:     nconf.get('spotify:clientId'),
    clientSecret: nconf.get('spotify:clientSecret'),
});



let trackUpdateTask = cron.schedule('*/2 * * * *', function () {
    console.log('[TrackUpdateTask] Running track update task');

    TrackVote.find({ deleted: { $ne: true } }).exec().then(votes => {

        if (!votes || votes.length === 0) {
            console.log('No votes found');
            return;
        }

        const spotifyUserId = 'nohr12';
        const playlistId    = '6H8QlMzlm6jG1vfBFDy7s0';

        SpotifyAuth.find({ username: 'nohr12'}).limit(1).lean().exec().then(auth => {
            spotifyApi.setAccessToken(auth[0].accessToken);
            spotifyApi.setRefreshToken(auth[0].refreshToken);

            spotifyApi.getPlaylistTracks(spotifyUserId, playlistId).then(playlist => {

                console.log('fetched playlist');

                let tracks = [];
                // go through each vote and check if it needs to be removed
                votes.forEach(vote => {
                    console.log(`Track ${vote.track} with ${vote.vote_positive} and ${vote.vote_negative}`);

                    if (vote.vote_positive + vote.vote_negative >= 5) {
                         // more than 75% negative votes
                        if (vote.vote_negative / (vote.vote_positive + vote.vote_negative) >= 0.60) {
                            console.log('Should remove this track');

                            // find position in playlist
                            for (let i = 0; i < playlist.body.items.length; i ++) {
                                if (playlist.body.items[i].track.uri == vote.track) {
                                    console.log(`Found ${vote.track} at index ${i}`);

                                    tracks.push({
                                        'positions': [i],
                                        'uri':       vote.track
                                    });

                                    vote.deleted = true;
                                    vote.save(/* yolo */);
                                }
                            }
                        }
                    }
                });

                if (tracks.length > 0) {
                    console.log('Going to remove tracks', tracks);
                    spotifyApi.removeTracksFromPlaylist(spotifyUserId, playlistId, tracks).then(data => {
                        console.log('Removed all tracks');

                        // set info in database

                    }, error => console.error('Cannot remove track from playlist ', error));
                }

            }, error => console.log('Cannot fetch playlist', error));
        }, error => console.log('Cannot fetch access token', error));
    }, error => console.log('Cannot find trackvotes', error));
});



trackUpdateTask.start();