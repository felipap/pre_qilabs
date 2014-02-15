
// Present in all built javascript.

require(['jquery','bootstrap'], function ($) {

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
