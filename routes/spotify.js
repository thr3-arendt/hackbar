module.exports = function (app) {

    const SpotifyWebApi = require('spotify-web-api-node');
    const nconf         = require('nconf');

    const WebApiRequest = require('./../node_modules/spotify-web-api-node/src/webapi-request');
    const HttpManager  = require('./../node_modules/spotify-web-api-node/src/http-manager');

    let scopes = ['user-read-private', 'user-read-email', 'streaming', 'user-read-playback-state',
        'user-modify-playback-state', 'user-read-currently-playing'];

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
    let accessToken = nconf.get('spotify:accessToken');
    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(nconf.get('spotify:refreshToken'));




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

            console.log('Set session: ', req.session.accessToken);

            res.redirect('/spotify');

        }, error => { console.error('Cant authorize code grant', error) });

        res.render('spotify/callback', { title: 'Callback' })
    });



    /**
    * Control spotify
    * -------------------------------------------------------------------------------------------------
    **/

    app.get('/spotify/currentlyplaying', function (req, res) {
        spotifyApi.getMyCurrentPlaybackState().then(data => {
            res.render('spotify/current', { output: data.body });
        }, error => console.log('Cannot get current playback state ', error));
    });

    app.get('/spotify/devices', function (req, res) {

        console.log(req.session.accessToken);

        spotifyApi.getMyDevices().then(data => {
                console.log('My devices', data.body);
            }, error => console.log('Could not fetch devices ', error));

        res.render('index');
    });

    app.get('/spotify/play', function (req, res) {
        spotifyApi.play();
        res.redirect('/spotify');
    });

    app.get('/spotify/pause', function (req, res) {
        spotifyApi.pause();
        res.redirect('/spotify');
    });

    app.get('/spotify/skipToNext', function (req, res) {
        spotifyApi.skipToNext();
        res.redirect('/spotify');
    });

    app.get('/spotify/volume', function (req, res) {

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
            'Authorization' : 'Bearer ' + accessToken
        });

        HttpManager.put(request, (error, result) => {
            res.redirect('/spotify');
        });
    });
}
