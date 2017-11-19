module.exports = function (app) {

    const SpotifyWebApi = require('spotify-web-api-node');
    const nconf         = require('nconf');
    const TrackVote  = require('./../models/TrackVote');
    const VolumeVote = require('./../models/VolumeVote');

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
    const moment     = require('moment');

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


    app.get('/admin', function (req, res) {

        TrackVote.find().sort({ vote_positive : -1, vote_negative: 1 }).lean().exec().then(trackVotes => {

            VolumeVote.find().sort({ date: -1 }).limit(10).lean().exec().then(volumeVotes => {
                res.render('admin/index', { votes: trackVotes, volumeVotes: volumeVotes });
            });
        });
    });
};