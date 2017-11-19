module.exports = function (app) {

    const SpotifyWebApi = require('spotify-web-api-node');
    const nconf         = require('nconf');

    const WebApiRequest = require('./../node_modules/spotify-web-api-node/src/webapi-request');
    const HttpManager  = require('./../node_modules/spotify-web-api-node/src/http-manager');

    const SpotifyAuth = require('./../models/SpotifyAuth');

    let scopes = ['user-read-private', 'user-read-email', 'streaming', 'user-read-playback-state',
        'user-modify-playback-state', 'user-read-currently-playing',
        'playlist-modify-public'];

    let redirectUri  = 'https://hackbar.azurewebsites.net/spotify/callback';
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


    app.get('/spotify', function (req, res) {
        res.render('spotify/index');
    });


    /**
    * AUTHENTICATION
    * -------------------------------------------------------------------------------------------------
    **/
    app.get('/spotify/auth', function (req, res) {

        let authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);

        console.log('Authoriziation URL: ' + authorizeURL);

        res.redirect(authorizeURL);
    });

    // chat area
    app.get('/spotify/callback', function (req, res) {

        let code = req.query.code;

        console.log('Received code ', code);

        spotifyApi.authorizationCodeGrant(code).then(data => {
            console.log('The token expires in ' + data.body['expires_in']);
            console.log('Access token: ' + data.body['access_token']);
            console.log('Refresh token: ' + data.body['refresh_token']);

            // Set the access token on the API object to use it in later calls
            spotifyApi.setAccessToken(data.body['access_token']);
            spotifyApi.setRefreshToken(data.body['refresh_token']);

            req.session.accessToken  = data.body['access_token'];
            req.session.refreshToken = data.body['refresh_token'];

            let spotifyAuth = new SpotifyAuth();
            spotifyAuth.accessToken  = data.body['access_token'];
            spotifyAuth.refreshToken = data.body['refresh_token'];

            // delete old one first
            SpotifyAuth.find({ username: 'nohr12'}).remove(() => {
                spotifyAuth.save((error, auth) => {
                    if (error) {
                        console.log('Could not save spotify auth', error);
                    }
                    req.flash('info', 'Reauthenticated Spotify account');
                    console.log('Saved auths');
                    res.redirect('/');
                });
            });

        }, error => { console.error('Cant authorize code grant', error) });

        // res.render('spotify/callback', { title: 'Callback' })
    });



    /**
    * Control spotify
    * -------------------------------------------------------------------------------------------------
    **/

    app.get('/spotify/currentlyplaying', function (req, res) {

        SpotifyAuth.find({ username: 'nohr12'}).limit(1).lean().exec().then(auth => {
            spotifyApi.setAccessToken(auth[0].accessToken);
            spotifyApi.setRefreshToken(auth[0].refreshToken);

            spotifyApi.getMyCurrentPlaybackState().then(data => {
                res.render('spotify/current', { output: data.body });
            }, error => console.log('Cannot get current playback state ', error));
        });
    });

    app.get('/spotify/devices', function (req, res) {

        SpotifyAuth.find({ username: 'nohr12'}).limit(1).lean().exec().then(auth => {
            spotifyApi.setAccessToken(auth[0].accessToken);
            spotifyApi.setRefreshToken(auth[0].refreshToken);

            spotifyApi.getMyDevices().then(data => {
                    console.log('My devices', data.body);
                }, error => console.log('Could not fetch devices ', error));

            res.render('index');
        });
    });

    app.get('/spotify/play', function (req, res) {
        SpotifyAuth.find({ username: 'nohr12'}).limit(1).lean().exec().then(auth => {
            spotifyApi.setAccessToken(auth[0].accessToken);
            spotifyApi.setRefreshToken(auth[0].refreshToken);

            spotifyApi.play();
            res.redirect('/spotify');
        });
    });

    app.get('/spotify/pause', function (req, res) {
        SpotifyAuth.find({ username: 'nohr12'}).limit(1).lean().exec().then(auth => {
            spotifyApi.setAccessToken(auth[0].accessToken);
            spotifyApi.setRefreshToken(auth[0].refreshToken);
            spotifyApi.pause();
            res.redirect('/spotify');
        });
    });

    app.get('/spotify/skipToNext', function (req, res) {
        SpotifyAuth.find({ username: 'nohr12'}).limit(1).lean().exec().then(auth => {
            spotifyApi.setAccessToken(auth[0].accessToken);
            spotifyApi.setRefreshToken(auth[0].refreshToken);
            spotifyApi.skipToNext();
            res.redirect('/spotify');
        });
    });

    app.get('/spotify/volume', function (req, res) {

        SpotifyAuth.find({ username: 'nohr12'}).limit(1).lean().exec().then(auth => {
            spotifyApi.setAccessToken(auth[0].accessToken);
            spotifyApi.setRefreshToken(auth[0].refreshToken);

            let volume = req.query.volume || 75;

            // does not exist in the library
            // own implementation ftw

            let request = WebApiRequest.builder()
                .withPath('/v1/me/player/volume')
                .withQueryParameters({
                    volume_percent: volume
                })
                .build();

            request.addHeaders({
                'Authorization' : 'Bearer ' + auth[0].accessToken
            });

            HttpManager.put(request, (error, result) => {
                res.redirect('/spotify');
            });
        });
    });

    app.get('/spotify/playlist/tracks', function(req, res) {
        SpotifyAuth.find({ username: 'nohr12'}).limit(1).lean().exec().then(auth => {
            spotifyApi.setAccessToken(auth[0].accessToken);
            spotifyApi.setRefreshToken(auth[0].refreshToken);

            spotifyApi.getPlaylistTracks(spotifyUserId, playlistId).then(data => {
                res.render('spotify/playlist-tracks', { output: data.body });
            }, error => console.error('Cannot fetch playlist tracks ', error));
        });
    });

    app.get('/spotify/search', function (req, res) {
        SpotifyAuth.find({ username: 'nohr12'}).limit(1).lean().exec().then(auth => {
            spotifyApi.setAccessToken(auth[0].accessToken);
            spotifyApi.setRefreshToken(auth[0].refreshToken);

            let options = {
                limit:  req.query.limit || 10,
                offset: req.query.offset || 0,
                market: req.query.market || 'DE',
            };

            spotifyApi.search('in the end', ['track'], options).then(data => {
                res.render('spotify/search', { output: data.body });
            }, error => console.error('Cannot search for tracks ', error));
        });
    });

    app.get('/spotify/addtoplaylist', function (req, res) {
        SpotifyAuth.find({ username: 'nohr12'}).limit(1).lean().exec().then(auth => {
            spotifyApi.setAccessToken(auth[0].accessToken);
            spotifyApi.setRefreshToken(auth[0].refreshToken);

            tracks = [
                'spotify:track:60a0Rd6pjrkxjPbaKzXjfq',
            ];

            spotifyApi.addTracksToPlaylist(spotifyUserId, playlistId, tracks).then(data => {
                res.redirect('/spotify');
            }, error => console.error('Cannot add trackto playlist ', error));
        });
    });

    app.get('/spotify/removefromplaylist', function (req, res) {
        SpotifyAuth.find({ username: 'nohr12'}).limit(1).lean().exec().then(auth => {
            spotifyApi.setAccessToken(auth[0].accessToken);
            spotifyApi.setRefreshToken(auth[0].refreshToken);

            tracks = [{
                "positions": [1],
                "uri": 'spotify:track:60a0Rd6pjrkxjPbaKzXjfq',
            }];

            spotifyApi.removeTracksFromPlaylist(spotifyUserId, playlistId, tracks).then(data => {
                res.redirect('/spotify');
            }, error => console.error('Cannot remove track from playlist ', error));
        });
    });
}
