
// Present in all built javascript.

require(['jquery','bootstrap'], function ($) {
	$("[data-role='logout']").click(function () {
		$.post('/logout', function () {
			window.location.href = "/";
		});
	});

	$(function () {
		$("[data-toggle=popover]").popover();
		$("[data-toggle=tooltip]").tooltip();
	});
	(function setCSRFToken () {
		$.ajaxPrefilter(function(options, _, xhr) {
			if (!options.crossDomain) {
				xhr.setRequestHeader('X-CSRF-Token',
					$("meta[name='csrf-token']").attr('content'));
			}
		});
	})();

	(function showFlashMessages (msgs) {
		if (document.body.dataset.page === 'front')
			return;
		if (!$(".flash-msgs")[0])
			$("<div class='flash-msgs'>").prependTo($('body > section')[0]);
		for (var i=0; msgs.warn && i<msgs.warn.length; i++)
			$(".flash-msgs").append("<div class='warn'><button type=button class=close data-dismiss=alert aria-hidden=true>&times;</button>"+msgs.warn[i]+"</div>");
		for (var i=0; msgs.info && i<msgs.info.length; i++)
			$(".flash-msgs").append("<div class='info'><button type=button class=close data-dismiss=alert aria-hidden=true>&times;</button>"+msgs.info[i]+"</div>");
	})(window._flash_msgs);
});
