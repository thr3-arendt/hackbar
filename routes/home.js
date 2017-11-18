module.exports = function (app) {

    const SpotifyWebApi = require('spotify-web-api-node');
    const nconf         = require('nconf');
    const TrackVote  = require('./../models/TrackVote');

    const WebApiRequest = require('./../node_modules/spotify-web-api-node/src/webapi-request');
    const HttpManager  = require('./../node_modules/spotify-web-api-node/src/http-manager');

    const SpotifyAuth = require('./../models/SpotifyAuth');

    let scopes = ['user-read-private', 'user-read-email', 'streaming', 'user-read-playback-state',
        'user-modify-playback-state', 'user-read-currently-playing',
        'playlist-modify-public'];

    let redirectUri  = 'http://localhost:3000/spotify/callback';
    let clientId     = nconf.get('spotify:clientId');
    let clientSecret = nconf.get('spotify:clientSecret');
    let state        = 'some-state-of-my-choice';

    const spotifyApi = new SpotifyWebApi({
        redirectUri : redirectUri,
        clientId:     clientId,
        clientSecret: clientSecret,
    });

    /**
    * Hardcoded oauth tokens
    * -------------------------------------------------------------------------------------------------
    **/
    const spotifyUserId = 'nohr12';
    const playlistId    = '6H8QlMzlm6jG1vfBFDy7s0';


    // home page
    app.get('/', function (req, res) {

        SpotifyAuth.find({ username: 'nohr12'}).limit(1).lean().exec().then(auth => {
            spotifyApi.setAccessToken(auth[0].accessToken);
            spotifyApi.setRefreshToken(auth[0].refreshToken);

            spotifyApi.getMyCurrentPlaybackState().then(data => {
                res.render('index', { title:'', currentSong: data.body.item, progress_ms: data.body.progress_ms });
            }, error => console.log('Cannot get current playback state ', error));
        });
    });

    app.get('/upvote', function (req, res) {
        SpotifyAuth.find({ username: 'nohr12'}).limit(1).lean().exec().then(auth => {
            spotifyApi.setAccessToken(auth[0].accessToken);
            spotifyApi.setRefreshToken(auth[0].refreshToken);

            spotifyApi.getMyCurrentPlaybackState().then(data => {

                let currentSong = data.body.item;
                let track = currentSong.uri;
                console.log('URI for upvote', track);

                TrackVote.find({ track: track }).limit(1).exec().then(votes => {

                    let vote = null;
                    if (!votes || votes.length === 0) {
                        vote = new TrackVote();
                        vote.track = track;
                    } else {
                        vote = votes[0];
                    }

                    vote.vote_positive++;

                    vote.save(() => res.redirect('/'));
                });

            }, error => console.log('Cannot get current playback state ', error));
        });
    });

    app.get('/downvote', function (req, res) {
        SpotifyAuth.find({ username: 'nohr12'}).limit(1).lean().exec().then(auth => {
            spotifyApi.setAccessToken(auth[0].accessToken);
            spotifyApi.setRefreshToken(auth[0].refreshToken);

            spotifyApi.getMyCurrentPlaybackState().then(data => {

                let currentSong = data.body.item;
                let track = currentSong.uri;
                console.log('URI for upvote', track);

                TrackVote.find({ track: track }).limit(1).exec().then(votes => {

                    let vote = null;
                    if (!votes || votes.length === 0) {
                        vote = new TrackVote();
                        vote.track = track;
                    } else {
                        vote = votes[0];
                    }

                    vote.vote_negative++;

                    vote.save(() => res.redirect('/'));
                });

            }, error => console.log('Cannot get current playback state ', error));
        });
    });

    app.get('/skip', function (req, res) {
        SpotifyAuth.find({ username: 'nohr12'}).limit(1).lean().exec().then(auth => {
            spotifyApi.setAccessToken(auth[0].accessToken);
            spotifyApi.setRefreshToken(auth[0].refreshToken);
            spotifyApi.skipToNext();
            res.redirect('/');
        });
    });

    // chat area
    app.get('/chat', function (req, res) {
        res.render('chat', { title: 'Chat with Me!  ' })
    });

    // about page
    app.get('/about', function (req, res) {
        res.render('about', { title: 'About Me.  ' })
    });

    // queue
    app.get('/queue', function (req, res) {
        SpotifyAuth.find({ username: 'nohr12'}).limit(1).lean().exec().then(auth => {
            spotifyApi.setAccessToken(auth[0].accessToken);
            spotifyApi.setRefreshToken(auth[0].refreshToken);

            spotifyApi.getMyCurrentPlaybackState().then(currentData => {
                spotifyApi.getPlaylistTracks(spotifyUserId, playlistId).then(data => {
                    res.render('player/queue', { playlist: data.body, currentSong: currentData.body.item })
                }, error => console.error('Cannot fetch playlist tracks ', error));
            });
        });
    });
}
