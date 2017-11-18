module.exports = function (app) {

    const VolumeVote = require('./../models/VolumeVote');
    const TrackVote  = require('./../models/TrackVote');
    const moment     = require('moment');


    /**
     * Volume control
     * -------------------------------------------------------------------------------------------------
     **/
    app.get('/vote/volume', function (req, res) {

        VolumeVote.find().sort({ date : -1 }).lean().exec().then(votes => {

            let cutoffDate = moment().subtract(10, 'minutes');

            VolumeVote.aggregate([
                { $match: { date: { $gt: cutoffDate.toDate() } } },
                { $group: { _id : '$vote', count : { $sum : 1 }}}
            ]).exec(function (error, aggregation) {
                console.log('Aggregation', aggregation);
                res.render('votes/volume', {
                    votes:            votes,
                    cutoffDate:       cutoffDate,
                    aggregatedResult: aggregation,
                });
            });

        }, error => console.error('Cannot fetch volume votes', error));
    });

    app.get('/vote/volume-up', function (req, res) {
        vote = new VolumeVote();
        vote.vote = true;
        vote.save(() => res.redirect('/vote/volume'));
    });

    app.get('/vote/volume-down', function (req, res) {
        vote = new VolumeVote();
        vote.vote = false;
        vote.save(() => res.redirect('/vote/volume'));
    });

    /**
     * Track control
     * -------------------------------------------------------------------------------------------------
     **/
    app.get('/vote/track', function (req, res) {
        TrackVote.find().sort().lean().exec().then(votes => {
            res.render('votes/track', { votes: votes });
        });
    });

    app.post('/vote/track', function (req, res) {
        console.log('Received vote/track ', req.body);

        let track = req.body.track;
        let selectedVote  = req.body.vote;

        TrackVote.find({ track: track}).limit(1).exec().then(votes => {

            let vote = null;
            if (!votes || votes.length === 0) {
                vote = new TrackVote();
                vote.track = track;
            } else {
                vote = votes[0];
            }

            if (selectedVote === 'up') {
                vote.vote_positive++;
            } else {
                vote.vote_negative++;
            }

            vote.save(() => res.redirect('/vote/track'));
        });
    });

}