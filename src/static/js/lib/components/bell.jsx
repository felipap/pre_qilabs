/** @jsx React.DOM */

define([
	'jquery',
	'underscore',
	'react',
	'vendor/bootstrap/tooltip',
	'vendor/bootstrap/popover',
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
			React.renderComponent(content,  $tip.find('.popover-content')[0]);
		}
	};

	if (window.user) {


		var Notification = React.createClass({
			handleClick: function () {
				var self = this;
				// setTimeout(function () {
				// 	window.location.href = self.props.data.url;	
				// }, 1500)
				$.ajax({
					url: '/api/me/notifications/'+this.props.data.id,
					data: {see: true},
					type: 'get',
					datatType: 'json',
				}).done(function (data) {
					window.location.href = self.props.data.url;
				});
			},
			render: function () {
				
				var html = '<% for (var i=0; i<notifications.length; i++) { var note = notifications[i]; %><li>'+
				'<a onClick="readNotification(\'<%= note.id %>\', \'<%= note.url %>\')" href="<%= note.url %>"> <%= note.msg %> </li> <%}%>';

				var thumbnailStyle = {
					backgroundImage: 'url('+this.props.data.thumbnailUrl+')',
				};
				
				return (
					<li className="notificationItem" onClick={this.handleClick}>
						{this.props.data.thumbnailUrl?
						<div className="thumbnail" style={thumbnailStyle}></div>:undefined}
						<div class="notificationItemBody">
							<span dangerouslySetInnerHTML={{__html: this.props.data.msgHtml}} />
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
				var self = this;

				$(document).mouseup(function (e) {
					var container = $(self.refs.button.getDOMNode());
					if (!container.is(e.target) && container.has(e.target).length === 0
						&& $(e.target).parents('.popover.in').length === 0) {
						$(self.refs.button.getDOMNode()).popover('hide');
					}
				});

				$.ajax({
					url: '/api/me/notifications',
					type: 'get',
					dataType: 'json',
				}).done(function (response) {
					
					var notSeen = _.filter(response.data, function(i){return !i.seen;});
					self.refs.nCount.getDOMNode().innerHTML = notSeen.length || '';
					$(self.refs.button.getDOMNode()).popover({
						react: true,
						content: <NotificationList data={response.data}/>,
						placement: 'bottom',
						container: 'body',
						trigger: 'manual'
					});
				});
			},
			onClickBell: function () {
				$(this.refs.button.getDOMNode()).popover('toggle');
			},
			render: function () {
				return (
					<button
						ref='button'
						className="plain-btn bell-btn"
						data-action="show-notifications"
						onClick={this.onClickBell}>
						<i className="icon-bell"></i>
						<sup id="count" ref="nCount" className="badge"></sup>
					</button>
				);
			},
		});

		React.renderComponent(<Bell />,
			document.getElementById('bellPlacement'));
	}

});