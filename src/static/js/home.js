requirejs.config({
	appDir: ".",
	baseUrl: "static/js",
	paths: { 
		'jquery':['//ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min','vendor/jquery-2.0.3.min'],
		'bootstrap':['//cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.0.0/js/bootstrap.min','vendor/bootstrap-3.0.0.min'],
		'underscore':['//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.5.1/underscore-min','vendor/underscore-1.5.1.min'],
		'backbone':['//cdnjs.cloudflare.com/ajax/libs/backbone.js/1.0.0/backbone-min','vendor/backbone-1.0.0.min'],
	},
	shim: {
		'underscore': { exports: '_' },
		'bootstrap' : { deps: ['jquery'] },
		'backbone'	: { exports: 'Backbone', deps: ['underscore', 'jquery']},
	}
});

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
			$("<div class='warn'><button type=button class=close data-dismiss=alert aria-hidden=true>&times;</button>"+msgs.warn[i]+"</div>")
				.hide().appendTo($(".flash-msgs")).slideDown();
		for (var i=0; msgs.info && i<msgs.info.length; i++)
			$("<div class='info'><button type=button class=close data-dismiss=alert aria-hidden=true>&times;</button>"+msgs.info[i]+"</div>")
				.hide().appendTo($(".flash-msgs")).slideDown();
	})(window._flash_msgs);
});

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

// Place any jQuery/helper plugins in here.
require(['jquery'], function ($) {

	$.fn.sshare = function (options) {

		// Prevent binding multiple times.
		if (this.find('.sn-share-btns').length)
			return;

		var defOptions = {
			trigger: 'hover',
			duration: 'fast',
			text: undefined,
			url: 'http://vempraruavem.org',
		};
		// Get options from default < element datset < arguments.
		var options = $.extend($.extend(defOptions, this.data()), options);

		var funcs = {
			twitter: function (e) {
				if (options.text || options.url)
					var url = 'http://twitter.com/share?'+(options.text && '&text='+encodeURIComponent(options.text))||('url='+encodeURIComponent(options.url));
				else throw "No url or text specified";
				window.open(url,'','width=500,height=350,toolbar=0,menubar=0,location=0','modal=yes');
			},
			facebook: function (e) {
				if (options.url)
					var url = 'http://www.facebook.com/sharer.php?u='+encodeURIComponent(options.url);
				else throw "No url or text specified";
				window.open(url,'','width=500,height=350,toolbar=0,menubar=0,location=0','modal=yes');
			},
			gplus: function (e) {
				if (options.url)
					var url = 'https://plusone.google.com/_/+1/confirm?hl=pt&url='+encodeURIComponent(options.url);
				else throw "No url or text specified";
				window.open(url,'','width=500,height=350,toolbar=0,menubar=0,location=0','modal=yes');
			},
		};

		this.addClass('sn-share');
		var html = $('<div class="sn-share-btns"><div class="btn-group"><button class="btn btn-xs btn-info btn-twitter"><i class="fa fa-twitter"></i></button><button class="btn btn-xs btn-info btn-facebook">&nbsp;<i class="fa fa-facebook"></i>&nbsp;</button><button class="btn btn-xs btn-info btn-gplus"><i class="fa fa-google-plus"></i></button></div><div class="arrow"></div></div>');

		html.find('.btn-twitter').click(funcs.twitter);
		html.find('.btn-facebook').click(funcs.facebook);
		html.find('.btn-gplus').click(funcs.gplus);
		html.appendTo(this);

		this.click(function(evt){
			evt.stopPropagation();
			evt.preventDefault();
			return false;
		})

		if (options.now === true) {
			html.fadeIn();
			this.on('click '+(options.trigger === 'hover'?'mouseenter':''), function (e) {
				html.fadeIn(options.duration);
			});
		} else {
			this.on('click '+(options.trigger === 'hover'?'mouseenter':''), function (e) {
				html.fadeIn(options.duration);
			});
		}
		this.on('mouseleave', function (e) {
			html.fadeOut(options.duration);
		});
	};

	/*! perfect-scrollbar - v0.4.6
	* http://noraesae.github.com/perfect-scrollbar/
	* Copyright (c) 2013 HyeonJe Jun; Licensed MIT */
	// (function(e){"function"==typeof require&&require.amd?require(["jquery"],e):e(jQuery)})
	(function(e){e(jQuery)})
	(function(e){
		var r={wheelSpeed:10,wheelPropagation:!1,minScrollbarLength:null,useBothWheelAxes:!1,useKeyboard:!0,suppressScrollX:!1,suppressScrollY:!1,scrollXMarginOffset:0,scrollYMarginOffset:0};
		e.fn.perfectScrollbar=function(o,t){return this.each(function(){var l=e.extend(!0,{},r),n=e(this);if("object"==typeof o?e.extend(!0,l,o):t=o,"update"===t)return n.data("perfect-scrollbar-update")&&n.data("perfect-scrollbar-update")(),n;if("destroy"===t)return n.data("perfect-scrollbar-destroy")&&n.data("perfect-scrollbar-destroy")(),n;if(n.data("perfect-scrollbar"))return n.data("perfect-scrollbar");n.addClass("ps-container");var s,c,a,i,p,f,u,d,b,h,v=e("<div class='ps-scrollbar-x-rail'></div>").appendTo(n),g=e("<div class='ps-scrollbar-y-rail'></div>").appendTo(n),m=e("<div class='ps-scrollbar-x'></div>").appendTo(v),w=e("<div class='ps-scrollbar-y'></div>").appendTo(g),T=parseInt(v.css("bottom"),10),L=parseInt(g.css("right"),10),y=function(){var e=parseInt(h*(f-i)/(i-b),10);n.scrollTop(e),v.css({bottom:T-e})},S=function(){var e=parseInt(d*(p-a)/(a-u),10);n.scrollLeft(e),g.css({right:L-e})},I=function(e){return l.minScrollbarLength&&(e=Math.max(e,l.minScrollbarLength)),e},X=function(){v.css({left:n.scrollLeft(),bottom:T-n.scrollTop(),width:a,display:l.suppressScrollX?"none":"inherit"}),g.css({top:n.scrollTop(),right:L-n.scrollLeft(),height:i,display:l.suppressScrollY?"none":"inherit"}),m.css({left:d,width:u}),w.css({top:h,height:b})},D=function(){a=n.width(),i=n.height(),p=n.prop("scrollWidth"),f=n.prop("scrollHeight"),!l.suppressScrollX&&p>a+l.scrollXMarginOffset?(s=!0,u=I(parseInt(a*a/p,10)),d=parseInt(n.scrollLeft()*(a-u)/(p-a),10)):(s=!1,u=0,d=0,n.scrollLeft(0)),!l.suppressScrollY&&f>i+l.scrollYMarginOffset?(c=!0,b=I(parseInt(i*i/f,10)),h=parseInt(n.scrollTop()*(i-b)/(f-i),10)):(c=!1,b=0,h=0,n.scrollTop(0)),h>=i-b&&(h=i-b),d>=a-u&&(d=a-u),X()},Y=function(e,r){var o=e+r,t=a-u;d=0>o?0:o>t?t:o,v.css({left:n.scrollLeft()}),m.css({left:d})},x=function(e,r){var o=e+r,t=i-b;h=0>o?0:o>t?t:o,g.css({top:n.scrollTop()}),w.css({top:h})},C=function(){var r,o;m.bind("mousedown.perfect-scrollbar",function(e){o=e.pageX,r=m.position().left,v.addClass("in-scrolling"),e.stopPropagation(),e.preventDefault()}),e(document).bind("mousemove.perfect-scrollbar",function(e){v.hasClass("in-scrolling")&&(S(),Y(r,e.pageX-o),e.stopPropagation(),e.preventDefault())}),e(document).bind("mouseup.perfect-scrollbar",function(){v.hasClass("in-scrolling")&&v.removeClass("in-scrolling")}),r=o=null},P=function(){var r,o;w.bind("mousedown.perfect-scrollbar",function(e){o=e.pageY,r=w.position().top,g.addClass("in-scrolling"),e.stopPropagation(),e.preventDefault()}),e(document).bind("mousemove.perfect-scrollbar",function(e){g.hasClass("in-scrolling")&&(y(),x(r,e.pageY-o),e.stopPropagation(),e.preventDefault())}),e(document).bind("mouseup.perfect-scrollbar",function(){g.hasClass("in-scrolling")&&g.removeClass("in-scrolling")}),r=o=null},k=function(){var e=function(e,r){var o=n.scrollTop();if(0===o&&r>0&&0===e)return!l.wheelPropagation;if(o>=f-i&&0>r&&0===e)return!l.wheelPropagation;var t=n.scrollLeft();return 0===t&&0>e&&0===r?!l.wheelPropagation:t>=p-a&&e>0&&0===r?!l.wheelPropagation:!0},r=!1;n.bind("mousewheel.perfect-scrollbar",function(o,t,a,i){l.useBothWheelAxes?c&&!s?i?n.scrollTop(n.scrollTop()-i*l.wheelSpeed):n.scrollTop(n.scrollTop()+a*l.wheelSpeed):s&&!c&&(a?n.scrollLeft(n.scrollLeft()+a*l.wheelSpeed):n.scrollLeft(n.scrollLeft()-i*l.wheelSpeed)):(n.scrollTop(n.scrollTop()-i*l.wheelSpeed),n.scrollLeft(n.scrollLeft()+a*l.wheelSpeed)),D(),r=e(a,i),r&&o.preventDefault()}),n.bind("MozMousePixelScroll.perfect-scrollbar",function(e){r&&e.preventDefault()})},M=function(){var r=function(e,r){var o=n.scrollTop();if(0===o&&r>0&&0===e)return!1;if(o>=f-i&&0>r&&0===e)return!1;var t=n.scrollLeft();return 0===t&&0>e&&0===r?!1:t>=p-a&&e>0&&0===r?!1:!0},o=!1;n.bind("mouseenter.perfect-scrollbar",function(){o=!0}),n.bind("mouseleave.perfect-scrollbar",function(){o=!1});var t=!1;e(document).bind("keydown.perfect-scrollbar",function(e){if(o){var s=0,c=0;switch(e.which){case 37:s=-3;break;case 38:c=3;break;case 39:s=3;break;case 40:c=-3;break;default:return}n.scrollTop(n.scrollTop()-c*l.wheelSpeed),n.scrollLeft(n.scrollLeft()+s*l.wheelSpeed),D(),t=r(s,c),t&&e.preventDefault()}})},O=function(){var e=function(e){e.stopPropagation()};w.bind("click.perfect-scrollbar",e),g.bind("click.perfect-scrollbar",function(e){var r=parseInt(b/2,10),o=e.pageY-g.offset().top-r,t=i-b,l=o/t;0>l?l=0:l>1&&(l=1),n.scrollTop((f-i)*l),D()}),m.bind("click.perfect-scrollbar",e),v.bind("click.perfect-scrollbar",function(e){var r=parseInt(u/2,10),o=e.pageX-v.offset().left-r,t=a-u,l=o/t;0>l?l=0:l>1&&(l=1),n.scrollLeft((p-a)*l),D()})},E=function(){var r=function(e,r){n.scrollTop(n.scrollTop()-r),n.scrollLeft(n.scrollLeft()-e),D()},o={},t=0,l={},s=null,c=!1;e(window).bind("touchstart.perfect-scrollbar",function(){c=!0}),e(window).bind("touchend.perfect-scrollbar",function(){c=!1}),n.bind("touchstart.perfect-scrollbar",function(e){var r=e.originalEvent.targetTouches[0];o.pageX=r.pageX,o.pageY=r.pageY,t=(new Date).getTime(),null!==s&&clearInterval(s),e.stopPropagation()}),n.bind("touchmove.perfect-scrollbar",function(e){if(!c&&1===e.originalEvent.targetTouches.length){var n=e.originalEvent.targetTouches[0],s={};s.pageX=n.pageX,s.pageY=n.pageY;var a=s.pageX-o.pageX,i=s.pageY-o.pageY;r(a,i),o=s;var p=(new Date).getTime();l.x=a/(p-t),l.y=i/(p-t),t=p,e.preventDefault()}}),n.bind("touchend.perfect-scrollbar",function(){clearInterval(s),s=setInterval(function(){return.01>Math.abs(l.x)&&.01>Math.abs(l.y)?(clearInterval(s),void 0):(r(30*l.x,30*l.y),l.x*=.8,l.y*=.8,void 0)},10)})},A=function(){n.unbind(".perfect-scrollbar"),e(window).unbind(".perfect-scrollbar"),e(document).unbind(".perfect-scrollbar"),n.data("perfect-scrollbar",null),n.data("perfect-scrollbar-update",null),n.data("perfect-scrollbar-destroy",null),m.remove(),w.remove(),v.remove(),g.remove(),m=w=a=i=p=f=u=d=T=b=h=L=null},j=function(r){n.addClass("ie").addClass("ie"+r);var o=function(){var r=function(){e(this).addClass("hover")},o=function(){e(this).removeClass("hover")};n.bind("mouseenter.perfect-scrollbar",r).bind("mouseleave.perfect-scrollbar",o),v.bind("mouseenter.perfect-scrollbar",r).bind("mouseleave.perfect-scrollbar",o),g.bind("mouseenter.perfect-scrollbar",r).bind("mouseleave.perfect-scrollbar",o),m.bind("mouseenter.perfect-scrollbar",r).bind("mouseleave.perfect-scrollbar",o),w.bind("mouseenter.perfect-scrollbar",r).bind("mouseleave.perfect-scrollbar",o)},t=function(){X=function(){m.css({left:d+n.scrollLeft(),bottom:T,width:u}),w.css({top:h+n.scrollTop(),right:L,height:b}),m.hide().show(),w.hide().show()},y=function(){var e=parseInt(h*f/i,10);n.scrollTop(e),m.css({bottom:T}),m.hide().show()},S=function(){var e=parseInt(d*p/a,10);n.scrollLeft(e),w.hide().show()}};6===r&&(o(),t())},W="ontouchstart"in window||window.DocumentTouch&&document instanceof window.DocumentTouch,H=function(){var e=navigator.userAgent.toLowerCase().match(/(msie) ([\w.]+)/);e&&"msie"===e[1]&&j(parseInt(e[2],10)),D(),C(),P(),O(),W&&E(),n.mousewheel&&k(),l.useKeyboard&&M(),n.data("perfect-scrollbar",n),n.data("perfect-scrollbar-update",D),n.data("perfect-scrollbar-destroy",A)};return H(),n})
		}
	}),(function(e){function r(r){var o=r||window.event,t=[].slice.call(arguments,1),l=0,n=0,s=0;return r=e.event.fix(o),r.type="mousewheel",o.wheelDelta&&(l=o.wheelDelta/120),o.detail&&(l=-o.detail/3),s=l,void 0!==o.axis&&o.axis===o.HORIZONTAL_AXIS&&(s=0,n=-1*l),void 0!==o.wheelDeltaY&&(s=o.wheelDeltaY/120),void 0!==o.wheelDeltaX&&(n=-1*o.wheelDeltaX/120),t.unshift(r,l,n,s),(e.event.dispatch||e.event.handle).apply(this,t)}var o=["DOMMouseScroll","mousewheel"];if(e.event.fixHooks)for(var t=o.length;t;)e.event.fixHooks[o[--t]]=e.event.mouseHooks;e.event.special.mousewheel={setup:function(){if(this.addEventListener)for(var e=o.length;e;)this.addEventListener(o[--e],r,!1);else this.onmousewheel=r},teardown:function(){if(this.removeEventListener)for(var e=o.length;e;)this.removeEventListener(o[--e],r,!1);else this.onmousewheel=null}},e.fn.extend({mousewheel:function(e){return e?this.bind("mousewheel",e):this.trigger("mousewheel")},unmousewheel:function(e){return this.unbind("mousewheel",e)}})})
	(jQuery);
});


// home.js
// for meavisa.org, by @f03lipe

require(['jquery', 'backbone', 'underscore', 'bootstrap'], function ($, Backbone, _) {

	_.templateSettings = {
		interpolate: /\<\@\=(.+?)\@\>/gim,
		evaluate: /\<\@([\s\S]+?)\@\>/gim,
		escape: /\<\@\-(.+?)\@\>/gim
	};

	var Tag = (function () {
		'use strict';
		// Model for each tag
		var TagItem = Backbone.Model.extend({

			idAttribute: "hashtag",		// how it's identified in the tags
			saveOnChange: false,		// save everytime tag is toggled, disable

			// Prevent errors if server doesn't send any children or description
			// attributes.
			defaults: { children: [], description: null },

			initialize: function () {
				// this.children are lists of tags from this.attributes.children
				this.children = new TagList();
				// Each time our collection is reseted, load children as views.
				this.collection.on('reset', this.loadChildren, this);
				// For when collection children are hidden and must be (un)checked.
				this.collection.on('checkAll', this.check, this);
				this.collection.on('uncheckAll', this.uncheck, this);
			},

			// The solo interaction of the user with the tags.
			// By default saves to the server at the end if this.saveOnChange is set
			// to true. Otherwise, the user may pass options.save === true and set
			// the callback in options.callback.
			toggleChecked: function (options) {
				var checked = this.get('checked');
				// Also check for string, just to be safe.
				if (checked && checked !== 'false')
					this.set({'checked': false});
				else
					this.set({'checked': true});

				if ((options && options.save !== undefined)?
					(options.save===true):this.saveOnChange) {
					var callback = (options && options.callback) || function(){};
					this.save(['checked'], {
						patch:true, success:callback, error:callback
					});
				}
			},

			// To be triggered by events from the parent tag when the children are
			// hidden (therefore and all must be effected).
			check: function (options) {
				this.set({'checked': true});
				if ((options && options.save !== undefined)?
					(options.save===true):this.saveOnChange) {
					var callback = (options && options.callback) || function(){};
					this.save(['checked'], {
						patch:true, success:callback, error:callback
					});
				}
			},

			// To be triggered by events from the parent tag when the children are
			// hidden (therefore and all must be effected).
			uncheck: function (options) {
				this.set({'checked': false});
				if ((options && options.save !== undefined)?
					(options.save===true):this.saveOnChange) {
					var callback = (options && options.callback) || function(){};
					this.save(['checked'], {
						patch:true, success:callback, error:callback
					});
				}
			},

			// Return true if this element has a checked child
			// TODO: improve this, for it only performs searches 1-level deep AND
			// this way of doing this through a method is not right. It shoudl be 
			// triggered by the children or smthing.
			hasCheckedChild: function (callback) {
				return _.any(this.children.map(function (t) {
					return t.get('checked');
				}));
			},

			// Load the content from this.attributes.children into this.children
			// (a TagList). This is essential to allow the nested strategy to work.
			loadChildren: function () {
				this.children.parseAndReset(this.get('children'));
			},
		});

		var TagView = Backbone.View.extend({

			tagName: 'li',

			template: _.template($("#template-tagview").html()),
			
			initialize: function () {
				this.model.collection.on('reset', this.destroy, this);
				// If children elements will be hidden in the html.
				this.hideChildren = true;
				// View for this.model.children.
				this.childrenView = new TagListView({collection: this.model.children, className:'children'});
				// Listen to change on children, so we can update the check icon 
				// accordingly. (empty, checked or dash)
				// if(this.)
				this.model.children.on('change', this.childrenChanged, this);
			},

			// Called everytime a children tag is checked, to update our icon.
			childrenChanged: function () {
				// For now, ignore if the event is triggered in the outtermost
				// tagList, for changing in the outtermost elements should not
				// interfer with the app.tagList. No difference.
				if (this.collection === app.tagList) {
					return;
				}
				// this.set('children', );
				console.log('\n\nchildrenChanged', this);
				// console.log('calling render from tgChecked');
				this.render();
			},

			destroy: function () {
				console.log('Removing me view ="(', this);
				this.remove();
			},

			render: function () {
				// console.log('rendering tagView', this.model.toJSON());
				// http://tbranyen.com/post/missing-jquery-events-while-rendering
				this.childrenView.$el.detach();
				// Render our html.
				this.$el.html(this.template({
					tag: _.extend(this.model.toJSON(), {hasCheckedChild: this.model.hasCheckedChild()})
				}));
				// Hide children if necessary.
				if (this.hideChildren) {
					this.childrenView.$el.hide();
				}
				// Render our childrenViews.
				this.$el.append(this.childrenView.el);

				// Code our info popover. Do it here (not in the html) in order
				// to diminish change of XSS attacks.
				this.$("> .tag .info").popover({
					content: this.model.get("description"),
					placement: 'bottom',
					trigger: 'hover',
					container: 'body',
					delay: { show: 100, hide: 300 },
					title: "<i class='icon-tag'></i> "+this.model.get("hashtag"),
					html: true,
				});
				// Prevent popover from persisting on click. (better solution?)
				this.$("> .tag .info").click(function(e){e.stopPropagation();});
				return this;
			},

			events: {
				'click >.tag': 'tgChecked',
				'click >.expand': 'tgShowChildren',
			},

			// toggleChecked
			tgChecked: function (e) {
				// console.log('\n\ntgChecked called', e.target);;
				e.preventDefault();
				if (this.model.get('checked'))
					this.model.children.trigger('uncheckAll');
				else
					this.model.children.trigger('checkAll');
				this.model.children.trigger('render');

				this.model.toggleChecked();
				// Reset this
				this.render();
				// and reset children
				// this.model.children.trigger('reset')
			},

			// toggleShowChildren
			// pretty straight-forward
			tgShowChildren: function (e) {
				e.preventDefault();
				this.hideChildren = !this.hideChildren;
				this.$('>.expand i').toggleClass("fa-angle-down");
				this.$('>.expand i').toggleClass("fa-angle-up");
				this.childrenView.$el.toggle();
				// Render children or nobody will. :(
				this.childrenView.render();
			},
		});

		var TagList = Backbone.Collection.extend({
			model: TagItem,
			url: '/api/tags',
			
			// Parse everytime something is fetched.
			parse: function (res) {
				return _.toArray(res);
			},

			// Parse and then reset.
			// Because this.parse isn't called when .reset() is used to input data.
			parseAndReset: function (object) {
				this.reset(_.toArray(object));
			},
			
			// Only send information about the checked tags when saving the TagList.
			save: function (callback) {
				$.post(this.url, {'checked': this.getCheckedTags()}, callback);
			},

			// Select those tagItem's which have t.attributes.checked === true
			getChecked: function () {
				var tags = this.chain()
					.map(function rec(t){return [t].concat((t.children.length)?t.children.map(rec):[]);})
					.flatten()
					.value();
				return tags.filter(function(t){return t.get('checked') === true;});
			},

			// Returns the hashtags of the tags from getChecked()
			// Equivocal name?
			getCheckedTags: function () {
				return this.getChecked().map(function(t){return t.get('hashtag');});
			}
		});

		var TagListView = Backbone.View.extend({
			tagName: "ul",
			_views: [], // a list of children views

			initialize: function () {
				this.collection.on('render', this.render, this);
				this.collection.on('reset', this.addAll, this);
			},

			addAll: function () {
				// There's no need to remove tagView's inside this._views one-by-one
				// because they listen to the reset event on the collection and call
				// themselves destroy. (suicide!)
				this._views = [];
				this.collection.each(function(tagItem) {
					this._views.push(new TagView({model:tagItem}));
				}, this);
				return this.render();
			},

			render: function () {
				// Hack to prevent bumpiness in redering...
				var container = document.createDocumentFragment();
				// render each tagView
				_.each(this._views, function (tagView) {
					container.appendChild(tagView.render().el);
				}, this);
				this.$el.empty();
				this.$el.append(container);
				return this;
			}
		});

		return {
			item: TagItem,
			list: TagList,
			view: TagView,
			listView: TagListView,
		};
	})();

	var Post = (function () {
		'use strict';
		//
		var PostItem = Backbone.Model.extend({});

		var PostView = Backbone.View.extend({
			tagName: 'li',
			template: _.template($("#template-postview").html()),
			initialize: function () {
				this.model.collection.on('reset', this.destroy, this);
			},
			destroy: function () {
				this.remove();
			},
			render: function () {
				this.$el.html(this.template({post: this.model.toJSON()}));
				return this;
			},
		});

		var PostList = Backbone.Collection.extend({
			model: PostItem,
			url: '/api/posts',
		});

		var PostListView = Backbone.View.extend({
			el: "#posts",
			_views: [],
			template: _.template(['<@ if (!length) { @>',
				'<h3 style="color: #888">Ops! Você não está seguindo tag nenhuma. :/</h3>',
				'<@ } @>',
				'<hr>'].join('\n')),
			
			initialize: function () {
				this.collection.on('reset', this.addAll, this);
			},

			addAll: function () {
				var views = [];
				this.collection.each(function(postItem) {
					views.push(new PostView({model:postItem}));
				}, this);
				this._views = views;
				return this.render();
			},

			render: function () {
				var container = document.createDocumentFragment();
				// render each postView
				_.each(this._views, function (postView) {
					container.appendChild(postView.render().el);
				}, this);
				this.$el.empty();
				this.$el.append(container);
				if (this._views.length)
					$("#no-posts-msg").hide();
				else
					$("#no-posts-msg").show();
				return this;
			}
		});

		return {
			item: PostItem,
			list: PostList,
			view: PostView,
			listView: PostListView,
		};
	})();

	// Extend PATCH:true option of Backbone.
	// When model.save([attrs], {patch:true}) is called:
	// - the method is changed to PUT;
	// - the data sent is a hash with the passed attributes and their values;
	var originalSync = Backbone.sync;
	Backbone.sync = function(method, model, options) {
		if (method === 'patch' && options.attrs instanceof Array) {
			// pop attributes and add their values
			while (e = options.attrs.pop())
				options.attrs[e] = model.get(e);
			options.type = 'PUT';
			// turn options.attrs into an Object
			options.attrs = _.extend({}, options.attrs);
		}
		return originalSync(method, model, options);
	};

	// Central functionality for of the app.
	app = new (Backbone.Router.extend({
		
		initialize: function () { },
		
		initPreview: function () { 
			// Disable preview button.
			$("#btn-preview").prop('disabled', true);
			// Listen to clicks on tags to enable the disable button. #wtf
			$(document).on("click", ".tag", function (e) {
				// console.log('hey, I was called');
				$("#btn-preview").prop('disabled', false);
			})
		},

		start: function () {
			Backbone.history.start({pushState: false});

			this.tagList = new Tag.list();
			this.tagListView = new Tag.listView({collection: this.tagList});
			$("#tags-wrapper").prepend(this.tagListView.$el);
			this.tagList.parseAndReset(window._tags);

			// initiate the "change => preview" mechanism.
			this.initPreview();

			this.postList = new Post.list();
			this.postListView = new Post.listView({collection: this.postList});
			this.postList.fetch({reset:true}); // (window._posts);
		},

		previewPosts: function () {
			// restart the preview button.
			this.initPreview();

			// Push posts from server.
			var tags = app.tagList.getCheckedTags().join(',') || ','; 
			this.postList.fetch({
				data: {tags: tags},
				processData: true,
				reset: true,
			});
			// Update message.
			$("#posts-desc").html("Esses são os assuntos que vão aparecer para você:");
		},

		confirmTags: function (callback) {
			this.tagList.save(callback);
		},
		
		routes: { "": "index", },
		index: function () { },
	}));


	$(function () {
		_.delay(function() {
			$("#sidebar #tags-wrapper > ul").perfectScrollbar({suppressScrollX:true});
		}, 400);

		$("#tags-wrapper [type=submit]").click(function (event) {
			event.stopPropagation();
			event.preventDefault();
			window.app.confirmTags(function () {
				location.href = '/';
			})
		});
		$("#btn-preview").click(function (event) {
			event.stopPropagation();
			event.preventDefault();
			window.app.previewPosts();
		});

		app.start();
	});
});
