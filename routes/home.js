module.exports = function (app) {

    const SpotifyWebApi = require('spotify-web-api-node');
    const nconf         = require('nconf');
    const TrackVote  = require('./../models/TrackVote');
    const VolumeVote = require('./../models/VolumeVote');
    const ActionLog  = require('./../models/ActionLog');

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


    // home page
    app.get('/', function (req, res) {

        if (!req.session.voteTrack) {
            req.session.voteTrack = {};
        }

        SpotifyAuth.find({ username: 'nohr12'}).limit(1).lean().exec().then(auth => {

            if (!auth || auth.length === 0) {
                // the token expired
                console.log('Lost auth token along the way. redirecting to spotify auth');
                return res.redirect('/spotify/auth');
            }

            spotifyApi.setAccessToken(auth[0].accessToken);
            spotifyApi.setRefreshToken(auth[0].refreshToken);

            spotifyApi.getMyCurrentPlaybackState().then(data => {
                res.render('index', {
                    title:'',
                    currentSong: data.body.item,
                    progress_ms: data.body.progress_ms,
                    voted:       req.session.voteTrack[data.body.item.uri],
                    hasSkipped:  req.session.hasSkipped == true, // type casting hell
                });
            }, error => console.log('Cannot get current playback state ', error));
        });
    });

    app.get('/upvote/:track', function (req, res) {

        if (!req.session.voteTrack) {
            req.session.voteTrack = {};
        }

        SpotifyAuth.find({ username: 'nohr12'}).limit(1).lean().exec().then(auth => {

            if (!auth || auth.length === 0) {
                // the token expired
                console.log('Lost auth token along the way. redirecting to spotify auth');
                return res.redirect('/spotify/auth');
            }

            spotifyApi.setAccessToken(auth[0].accessToken);
            spotifyApi.setRefreshToken(auth[0].refreshToken);

            let track = req.params.track;

            if (req.session.voteTrack[track]) {
                console.log('You are not allowed to do that anymore');
                req.flash('info', 'You\'ve already voted for this song');
                return res.redirect('/');
            }

            TrackVote.find({ track: track, deleted: { $ne: true } }).limit(1).exec().then(votes => {

                let vote = null;
                if (!votes || votes.length === 0) {
                    vote = new TrackVote();
                    vote.track = track;
                } else {
                    vote = votes[0];
                }

                log = new ActionLog();
                log.message = `Received upvote for track ${track}`;
                log.save();

                vote.vote_positive++;

                let backURL = req.header('Referer') || '/';
                vote.save(() => res.redirect(backURL));

                req.flash('info', 'Upvoted song');

                console.log('Voting up for track ' + track);
                req.session.voteTrack[track] = 'up';
            });
        });
    });

    app.get('/downvote/:track', function (req, res) {

        if (!req.session.voteTrack) {
            req.session.voteTrack = {};
        }

        SpotifyAuth.find({ username: 'nohr12'}).limit(1).lean().exec().then(auth => {

            if (!auth || auth.length === 0) {
                // the token expired
                console.log('Lost auth token along the way. redirecting to spotify auth');
                return res.redirect('/spotify/auth');
            }

            spotifyApi.setAccessToken(auth[0].accessToken);
            spotifyApi.setRefreshToken(auth[0].refreshToken);

            let track = req.params.track;

            if (req.session.voteTrack[track]) {
                console.log('You are not allowed to do that anymore');
                req.flash('info', 'You\'ve already voted for this song');
                return res.redirect('/');
            }

            TrackVote.find({ track: track, deleted: { $ne: true } }).limit(1).exec().then(votes => {

                let vote = null;
                if (!votes || votes.length === 0) {
                    vote = new TrackVote();
                    vote.track = track;
                } else {
                    vote = votes[0];
                }

                log = new ActionLog();
                log.message = `Received downvote for track ${track}`;
                log.save();

                vote.vote_negative++;

                let backURL = req.header('Referer') || '/';
                vote.save(() => {

                    req.flash('info', 'Downvoted song');

                    console.log('Voting down for track ' + track);
                    req.session.voteTrack[track] = 'down';


                    if (vote.vote_positive + vote.vote_negative >= 5) {
                        if (vote.vote_negative / (vote.vote_positive + vote.vote_negative) >= 0.60) {
                            // the track should be removed
                            // check if its the current song and then skip it
                            let current = req.query.current || 0;

                            if (current) {

                                log = new ActionLog();
                                log.message = `Skipping track ${track} (${vote.vote_negative} out of ${vote.vote_positive + vote.vote_negative} voted to skip)`;
                                log.save();

                                console.log('Skipping songs due to popular demand');
                                // skip the track
                                spotifyApi.skipToNext().then(() => res.redirect(backURL));
                                return;
                            } else {
                                log = new ActionLog();
                                log.message = `Marking track ${track} as to be deleted (${vote.vote_negative} out of ${vote.vote_positive + vote.vote_negative} voted against)`;
                                log.save();
                            }
                        }
                    }

                    res.redirect(backURL);
                });
            });
        });
    });

    app.get('/skip', function (req, res) {

        if (req.session.hasSkipped) {
            console.log('You are not allowed to skip more than once');
            req.flash('info', 'You only get one skip a day');
            return res.redirect('/');
        }

        SpotifyAuth.find({ username: 'nohr12'}).limit(1).lean().exec().then(auth => {

            if (!auth || auth.length === 0) {
                // the token expired
                console.log('Lost auth token along the way. redirecting to spotify auth');
                return res.redirect('/spotify/auth');
            }

            spotifyApi.setAccessToken(auth[0].accessToken);
            spotifyApi.setRefreshToken(auth[0].refreshToken);
            spotifyApi.skipToNext();

            console.log('Skipping current song');
            req.session.hasSkipped = true;

            setTimeout(() => res.redirect('/'), 1500);
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

            if (!auth || auth.length === 0) {
                // the token expired
                console.log('Lost auth token along the way. redirecting to spotify auth');
                return res.redirect('/spotify/auth');
            }

            spotifyApi.setAccessToken(auth[0].accessToken);
            spotifyApi.setRefreshToken(auth[0].refreshToken);

            spotifyApi.getMyCurrentPlaybackState().then(currentData => {
                spotifyApi.getPlaylistTracks(spotifyUserId, playlistId).then(data => {
                    res.render('player/queue', {
                        playlist: data.body,
                        currentSong: currentData.body.item,
                        voted: req.session.voteTrack,
                    })
                }, error => console.error('Cannot fetch playlist tracks ', error));
            });
        });
    });

    app.get('/search', function (req, res) {
        res.render('player/search', { tracks: [] });
    });

    app.post('/search', function (req, res) {
        let search = req.body.search;

        let options = {
            limit:  req.query.limit || 30,
            offset: req.query.offset || 0,
            market: req.query.market || 'DE',
        };

        SpotifyAuth.find({ username: 'nohr12'}).limit(1).lean().exec().then(auth => {

            if (!auth || auth.length === 0) {
                // the token expired
                console.log('Lost auth token along the way. redirecting to spotify auth');
                return res.redirect('/spotify/auth');
            }

            spotifyApi.setAccessToken(auth[0].accessToken);
            spotifyApi.setRefreshToken(auth[0].refreshToken);

            spotifyApi.search(search, ['track'], options).then(data => {
                res.render('player/search', { tracks: data.body.tracks.items });
            }, error => console.error('Cannot search for tracks ', error));
        });
    });

    app.get('/addtrack/:track', function (req, res) {
        let track = req.params.track;

        SpotifyAuth.find({ username: 'nohr12'}).limit(1).lean().exec().then(auth => {

            if (!auth || auth.length === 0) {
                // the token expired
                console.log('Lost auth token along the way. redirecting to spotify auth');
                return res.redirect('/spotify/auth');
            }

            spotifyApi.setAccessToken(auth[0].accessToken);
            spotifyApi.setRefreshToken(auth[0].refreshToken);

            tracks = [track];

            spotifyApi.addTracksToPlaylist(spotifyUserId, playlistId, tracks).then(data => {
                req.flash('info', 'Your track has been added');
                res.redirect('/queue');
            }, error => console.error('Cannot add trackto playlist ', error));
        });
    });

    app.get('/volume/up', function (req, res) {

        if (req.session.changeVolumeDate && moment().diff(req.session.changeVolumeDate, 'seconds') < 30) {
            console.log('You are not allowed to do that yet');
            req.flash('info', 'Pace yourself young padawan');
            return res.redirect('/');
        }

        vote = new VolumeVote();
        vote.vote = true;
        vote.save(() => res.redirect('/'));

        req.session.changeVolumeDate = moment();

        req.flash('info', 'Voted to increase the volume');

        log = new ActionLog();
        log.message = `Received vote to crank up the volume`;
        log.save();

        console.log('Voting for volume up');

    });

    app.get('/volume/down', function (req, res) {

        if (req.session.changeVolumeDate && moment().diff(req.session.changeVolumeDate, 'seconds') < 30) {
            console.log('You are not allowed to do that yet');
            req.flash('info', 'Pace yourself young padawan');
            return res.redirect('/');
        }

        vote = new VolumeVote();
        vote.vote = false;
        vote.save(() => res.redirect('/'));

        req.session.changeVolumeDate = moment();

        req.flash('info', 'Voted to decrease the volume');

        log = new ActionLog();
        log.message = `Received vote to lower the volume`;
        log.save();

        console.log('Voting for volume down');
    });
}
