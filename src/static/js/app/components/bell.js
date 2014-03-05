/** @jsx React.DOM */

define([
	'jquery',
	'underscore',
	'react',
	'bootstrap.popover',
	'bootstrap.tooltip',
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


		var Notification = React.createClass({displayName: 'Notification',
			handleClick: function () {
				var self = this;
				if (self.props.data.seen) {
					window.location.href = self.props.data.url;	
				} else {
					$.ajax({
						url: '/api/me/notifications/'+this.props.data.id,
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
					React.DOM.li( {className:"notificationItem", onClick:this.handleClick}, 
						this.props.data.thumbnailUrl?
						React.DOM.div( {className:"thumbnail", style:thumbnailStyle}):undefined,
						React.DOM.div( {class:"notificationItemBody"}, 
							React.DOM.span( {dangerouslySetInnerHTML:{__html: this.props.data.msgHtml}} ),
							React.DOM.span(null,  " ", React.DOM.em(null, date))
						)
					)
				);
			},
		});

		var NotificationList = React.createClass({displayName: 'NotificationList',
			render: function () {
				var notifications = this.props.data.map(function (i) {
					return (
						Notification( {data:i} )
					);
				});
				return (
					React.DOM.div( {className:"notificationList"}, 
						notifications
					)
				);
			}
		});

		var Bell = React.createClass({displayName: 'Bell',
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
						content: NotificationList( {data:response.data}),
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
					React.DOM.button(
						{ref:"button",
						className:"plain-btn bell-btn",
						'data-action':"show-notifications",
						onClick:this.onClickBell}, 
						React.DOM.i( {className:"icon-bell"}),
						React.DOM.sup( {id:"count", ref:"nCount", className:"badge"})
					)
				);
			},
		});

		React.renderComponent(Bell(null ),
			document.getElementById('bellPlacement'));
	}

});