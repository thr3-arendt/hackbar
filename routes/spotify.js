module.exports = function (app) {

    var SpotifyWebApi = require('spotify-web-api-node');

    // home page
    app.get('/spotify/auth', function (req, res) {

        var scopes = ['user-read-private', 'user-read-email'],
            redirectUri = 'https://hackbar.azurewebsites.net/spotify/callback',
            clientId = 'fcecfc72172e4cd267473117a17cbd4d',
            state = 'some-state-of-my-choice';

        // credentials are optional
        // var spotifyApi = new SpotifyWebApi({
        //   clientId : 'fcecfc72172e4cd267473117a17cbd4d',
        //   clientSecret : 'a6338157c9bb5ac9c71924cb2940e1a7',
        //   redirectUri : 'http://hackbar.azurewebsites.net/spotify/callback'
        // });
        // res.render('spotify/auth', { title: 'Authenticate' })
        var spotifyApi = new SpotifyWebApi({
          redirectUri : redirectUri,
          clientId : clientId
        });

        var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);

        console.log(authorizeURL);

        });

    // chat area
    app.get('/spotify/callback', function (req, res) {
        res.render('spotify/callback', { title: 'Callback' })
    });
}
