const cron          = require('node-cron');
const SpotifyAuth   = require('./../models/SpotifyAuth');
const nconf         = require('nconf');
const WebApiRequest = require('./../node_modules/spotify-web-api-node/src/webapi-request');
const HttpManager   = require('./../node_modules/spotify-web-api-node/src/http-manager');


let tokenRefreshTask = cron.schedule('*/30 * * * *', function() {
    console.log('Refreshing token');

    SpotifyAuth.find({ username: 'nohr12'}).limit(1).exec().then(auth => {

        // BASE 64
        let encodedHash = Buffer.from(nconf.get('spotify:clientId')+':'+nconf.get('spotify:clientSecret'))
                                .toString('base64');

        let request = WebApiRequest.builder()
            .withHost('accounts.spotify.com')
            .withPath('/api/token')
            .withBodyParameters({
                grant_type:    'refresh_token',
                refresh_token: auth[0].refreshToken,
            })
            .build();

        request.addHeaders({
            'Authorization' : 'Basic ' + encodedHash
        });

        HttpManager.post(request, (error, result) => {
            if (error) {
                console.error('Could not refresh access token. God help us');
                return;
            }

            console.log('Refreshed token');

            let myAuth = auth[0];
            myAuth.accessToken = result.body.access_token;
            // resets TLL hopefully
            myAuth.createdAt   = new Date();

            myAuth.save((err) => {
                if (err) {
                    console.error('Could not save new spotify auth', err, myAuth.accessToken, myAuth.createdAt);
                } else {
                    console.log('New spotify credentials saved', myAuth.accessToken, myAuth.createdAt);
                }
            });

        });

    });
});

tokenRefreshTask.start();