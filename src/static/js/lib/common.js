
// Present in all built javascript.

// Avoid `console` errors in browsers that lack a console.
(function() {
	var method;
	var noop = function () {};
	var methods = [
		'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
		'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
		'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
		'timeStamp', 'trace', 'warn'
	];
	var length = methods.length;
	var console = (window.console = window.console || {});
	while (length--) {
		method = methods[length];
		// Only stub undefined methods.
		if (!console[method]) {
			console[method] = noop;
		}
	}
}());

define(['jquery','underscore','bootstrap','plugins'], function ($, _) {

	if (window.loggedUser) {
		$.ajax({
			url: '/api/me/notifications',
			type: 'get',
			dataType: 'json',
		}).done(function (data) {
			var $bell = $("[data-action=show-notifications]");
			var notes = data.data;
			console.log(data)
			var notSeen = _.filter(notes, function(i){return !i.seen;});
			$bell.find('#count').html(notSeen.length || '');
			var html = '<@ for (var i=0; i<notifications.length; i++) { var note = notifications[i]; @><li>'+
			'<a onClick="readNotification(\'<@= note.id @>\', \'<@= note.url @>\')" href="<@= note.url @>"> <@= note.msg @> </li> <@}@>';
			$bell.popover({
				title: 'Suas Notificações',
				placement: 'bottom',
				container: 'body',
				content: _.template(html, {notifications:notes}),
				html: true,
				// trigger: 'click'
			});
		});

		window.readNotification = function (id, url) {
			$.ajax({
				url: '/api/me/notifications/'+id,
				data: {see: true},
				type: 'get',
				datatType: 'json',
			}).done(function (data) {
				window.location.href = url;
			});
			return false;
		}
	}

	$("a[data-ajax-post-href],button[data-ajax-post-href]").click(function () {
		var href = this.dataset['ajaxPostHref'],
			redirect = this.dataset['redirectHref'];
		console.log(this.dataset, href);
		$.post(href, function () {
			if (redirect)
				window.location.href = redirect;
			else
				window.location.reload();
		});
	});

	$("form[data-ajax-post-href]").on('submit', function (evt) {
		evt.preventDefault();
		var href = this.dataset['ajaxPostHref']+'?'+$(this).serialize();
		console.log(this.dataset, href);
		$.post(href, function () {
			window.location.reload();
		});
	});

	$(".btn-follow").click(function (evt) {
		var self = this;
		switch (this.dataset.action) {
			case 'unfollow':
				$.post('/api/users/'+this.dataset.user+'/unfollow',
					function (data) {
						if (data.error) {
							alert(data.error);
						} else {
							self.dataset.action = 'follow';
						}
				});
				break;
			case 'follow':
				$.post('/api/users/'+this.dataset.user+'/follow',
					function (data) {
						if (data.error) {
							alert(data.error);
						} else {
							self.dataset.action = 'unfollow';
						}
				});
		}
	});

	$(function () {
		$("[data-toggle=popover]").popover();
		$("body").tooltip({selector:'[data-toggle=tooltip]'});
		$("[data-toggle=dialog]").xdialog();

		if (document.body.dataset.page === 'front') {
			var navbar = $("nav.bar");
			var jumboHeight = $('#jumbo').height();
			var navbarHeight = navbar.outerHeight();
			$(window).on('scroll ready', function () {
				// if ($(window).scrollTop()+navbarHeight > jumboHeight) {
				if ($(window).scrollTop() > navbarHeight) {
					navbar.addClass('opaque');
				} else {
					navbar.removeClass('opaque');
				}
			});
		}
	});

	(function setCSRFToken () {
		$.ajaxPrefilter(function(options, _, xhr) {
			if (!options.crossDomain) {
				xhr.setRequestHeader('X-CSRF-Token',
					$("meta[name='csrf-token']").attr('content'));
			}
		});
	})();

	(function showFlashPosts (msgs) {
		if (!$(".flash-msgs")[0])
			$("<div class='flash-msgs'>").prependTo($('body > section')[0]);
		for (var i=0; msgs.warn && i<msgs.warn.length; i++)
			$("<div class='warn'><button type=button class=close data-dismiss=alert aria-hidden=true>&times;</button>"+msgs.warn[i]+"</div>")
				.hide().appendTo($(".flash-msgs")).slideDown();
		for (var i=0; msgs.info && i<msgs.info.length; i++)
			$("<div class='info'><button type=button class=close data-dismiss=alert aria-hidden=true>&times;</button>"+msgs.info[i]+"</div>")
				.hide().appendTo($(".flash-msgs")).slideDown();
	})(window._flash_msgs);
});