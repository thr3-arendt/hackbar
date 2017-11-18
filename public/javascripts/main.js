/*$(function() {
	$('.item-swipe').swipeTo({
		minSwipe: 100,
		angle: 10,
		wrapScroll: 'body',
		binder: true,
		swipeStart: function() {
			//console.log('start');
		},
		swipeMove: function() {
			//console.log('move');
		},
		swipeEnd: function() {
			//console.log('end');
		},
	});
	deleteItem();
	getIe();
})*/

var deleteItem = function() {
	var deleteItemFnc = $('body').on('click tap', '.btn-delete', function(e) {
		e.preventDefault();
		var that = $(this);
		that.parent().parent().fadeOut('500');
	})
}

var progressbar = $('.track .progress-bar');

if (progressbar) {
    var start = $('.begin').data('start');
    var end = $('.end').data('end');

    console.log('Going from ' + start + ' to ' + end);

    setInterval(function () {
        start += 1000; // plus a second

        if (start > end) {
            location.reload();
        }

        var minutes = Math.floor(start / (1000 * 60));
        var seconds = Math.floor((start - minutes * 60 * 1000) / (1000));

        $('.begin').text(minutes + ':' + (seconds < 10 ? '0'+seconds : seconds));
        $('.progress-bar').css('width', Math.round(start / end * 100) + '%')

    }, 1000);
}