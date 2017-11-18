module.exports = function (app) {

    const VolumeVote = require('./../models/VolumeVote');
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

}