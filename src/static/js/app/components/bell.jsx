/** @jsx React.DOM */

define([
	'jquery',
	'underscore',
	'react',
	'bootstrap.tooltip',
	'bootstrap.popover',
	], function ($, _, React) {

	$.extend($.fn.popover.Constructor.DEFAULTS, {react: false});
	var oldSetContent = $.fn.popover.Constructor.prototype.setContent;
	$.fn.popover.Constructor.prototype.setContent = function() {
		if (!this.options.react) {
			return oldSetContent.call(this);
		}
		var $tip = this.tip();
		var title = this.getTitle();
		var content = this.getContent();
		$tip.removeClass('fade top bottom left right in');
		if (!$tip.find('.popover-content').html()) {
			var $title = $tip.find('.popover-title');
			if (title)
				React.renderComponent(title, $title[0]);
			else
				$title.hide();
			React.renderComponent(content, $tip.find('.popover-content')[0]);
		}
	};

	if (window.user) {

		var Notification = React.createClass({
			handleClick: function () {
				var self = this;
				if (self.props.data.seen) {
					window.location.href = self.props.data.url;	
				} else {
					$.ajax({
						url: '/api/me/notifications/'+this.props.data.id+'/access',
						data: {see: true},
						type: 'get',
						datatType: 'json',
					}).done(function (data) {
						window.location.href = self.props.data.url;
					});
				}
			},
			render: function () {
				var thumbnailStyle = {
					backgroundImage: 'url('+this.props.data.thumbnailUrl+')',
				};
				var date = window.calcTimeFrom(this.props.data.dateSent);
				return (
					<li className="notificationItem" data-seen={this.props.data.seen} data-accessed={this.props.data.accessed}
					onClick={this.handleClick}>
						{this.props.data.thumbnailUrl?
						<div className="thumbnail" style={thumbnailStyle}></div>:undefined}
						<div className="notificationItemBody">
							<span dangerouslySetInnerHTML={{__html: this.props.data.msgHtml}} />
							<time>{date}</time>
						</div>
					</li>
				);
			},
		});

		var NotificationList = React.createClass({
			render: function () {
				var notifications = this.props.data.map(function (i) {
					return (
						<Notification data={i} />
					);
				});
				return (
					<div className="notificationList">
						{notifications}
					</div>
				);
			}
		});

		var Bell = React.createClass({
			componentWillMount: function () {
				this.seen = false;
				var self = this;

				// Hide popover when mouse-click happens outside it.
				$(document).mouseup(function (e) {
					var container = $(self.refs.button.getDOMNode());
					if (!container.is(e.target) && container.has(e.target).length === 0
						&& $(e.target).parents('.popover.in').length === 0) {
						$(self.refs.button.getDOMNode()).popover('hide');
					}
				});

				this.getNotifications();
			},
			getNotifications: function () {
				// Get notification data.
				var self = this;
				$.ajax({
					url: '/api/me/notifications',
					type: 'get',
					dataType: 'json',
				}).done(function (response) {
					var notSeen = _.filter(response.data, function(i){return !i.seen;});
					self.refs.nCount.getDOMNode().innerHTML = 5; // notSeen.length || '';
					if (notSeen.length) {
						this.seen = false;
					}
					$(self.refs.button.getDOMNode()).popover({
						react: true,
						content: <NotificationList data={response.data}/>,
						placement: 'bottom',
						container: 'nav.bar',
						trigger: 'manual'
					});
				}).always(function () {
					setTimeout(self.getNotifications, 5*60*1000);
				});
			},
			onClickBell: function () {
				var button = $(this.refs.button.getDOMNode());
				if (!this.seen) {
					this.seen = true;
					$.post('/api/me/notifications/seen');
					this.refs.nCount.getDOMNode().innerHTML = '';
				}

				if (button.data('bs.popover') &&
					button.data('bs.popover').tip().hasClass('in')) { // already visible
					button.popover('hide');
				} else {
					button.popover('show');
				}
			},
			render: function () {
				return (
					<button
						ref='button'
						className="icon-btn bell-btn"
						data-action="show-notifications"
						onClick={this.onClickBell}>
						<i className="icon-bell-o"></i>
						<sup ref="nCount" className="count"></sup>
					</button>
				);
			},
		});

		if (document.getElementById('bellPlacement'))
			React.renderComponent(<Bell />,
				document.getElementById('bellPlacement'));
	}

});