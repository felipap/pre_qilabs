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

	$.fn.share = function (options) {

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
		var options = _.extend(_.extend(defOptions, this.data()), options);

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
	}
});

/*! perfect-scrollbar - v0.4.6
* http://noraesae.github.com/perfect-scrollbar/
* Copyright (c) 2013 HyeonJe Jun; Licensed MIT */
// "use strict";(function(e){"function"==typeof define&&define.amd?define(["jquery"],e):e(jQuery)})(function(e){var r={wheelSpeed:10,wheelPropagation:!1,minScrollbarLength:null,useBothWheelAxes:!1,useKeyboard:!0,suppressScrollX:!1,suppressScrollY:!1,scrollXMarginOffset:0,scrollYMarginOffset:0};e.fn.perfectScrollbar=function(o,l){return this.each(function(){var t=e.extend(!0,{},r),s=e(this);if("object"==typeof o?e.extend(!0,t,o):l=o,"update"===l)return s.data("perfect-scrollbar-update")&&s.data("perfect-scrollbar-update")(),s;if("destroy"===l)return s.data("perfect-scrollbar-destroy")&&s.data("perfect-scrollbar-destroy")(),s;if(s.data("perfect-scrollbar"))return s.data("perfect-scrollbar");s.addClass("ps-container");var n,c,a,i,p,f,u,d,b,h,v=e("<div class='ps-scrollbar-x-rail'></div>").appendTo(s),g=e("<div class='ps-scrollbar-y-rail'></div>").appendTo(s),m=e("<div class='ps-scrollbar-x'></div>").appendTo(v),w=e("<div class='ps-scrollbar-y'></div>").appendTo(g),T=parseInt(v.css("bottom"),10),L=parseInt(g.css("right"),10),y=function(){var e=parseInt(h*(f-i)/(i-b),10);s.scrollTop(e),v.css({bottom:T-e})},S=function(){var e=parseInt(d*(p-a)/(a-u),10);s.scrollLeft(e),g.css({right:L-e})},I=function(e){return t.minScrollbarLength&&(e=Math.max(e,t.minScrollbarLength)),e},C=function(){v.css({left:s.scrollLeft(),bottom:T-s.scrollTop(),width:a,display:t.suppressScrollX?"none":"inherit"}),g.css({top:s.scrollTop(),right:L-s.scrollLeft(),height:i,display:t.suppressScrollY?"none":"inherit"}),m.css({left:d,width:u}),w.css({top:h,height:b})},X=function(){a=s.width(),i=s.height(),p=s.prop("scrollWidth"),f=s.prop("scrollHeight"),!t.suppressScrollX&&p>a+t.scrollXMarginOffset?(n=!0,u=I(parseInt(a*a/p,10)),d=parseInt(s.scrollLeft()*(a-u)/(p-a),10)):(n=!1,u=0,d=0,s.scrollLeft(0)),!t.suppressScrollY&&f>i+t.scrollYMarginOffset?(c=!0,b=I(parseInt(i*i/f,10)),h=parseInt(s.scrollTop()*(i-b)/(f-i),10)):(c=!1,b=0,h=0,s.scrollTop(0)),h>=i-b&&(h=i-b),d>=a-u&&(d=a-u),C()},Y=function(e,r){var o=e+r,l=a-u;d=0>o?0:o>l?l:o,v.css({left:s.scrollLeft()}),m.css({left:d})},x=function(e,r){var o=e+r,l=i-b;h=0>o?0:o>l?l:o,g.css({top:s.scrollTop()}),w.css({top:h})},D=function(){var r,o;m.bind("mousedown.perfect-scrollbar",function(e){o=e.pageX,r=m.position().left,v.addClass("in-scrolling"),e.stopPropagation(),e.preventDefault()}),e(document).bind("mousemove.perfect-scrollbar",function(e){v.hasClass("in-scrolling")&&(S(),Y(r,e.pageX-o),e.stopPropagation(),e.preventDefault())}),e(document).bind("mouseup.perfect-scrollbar",function(){v.hasClass("in-scrolling")&&v.removeClass("in-scrolling")}),r=o=null},P=function(){var r,o;w.bind("mousedown.perfect-scrollbar",function(e){o=e.pageY,r=w.position().top,g.addClass("in-scrolling"),e.stopPropagation(),e.preventDefault()}),e(document).bind("mousemove.perfect-scrollbar",function(e){g.hasClass("in-scrolling")&&(y(),x(r,e.pageY-o),e.stopPropagation(),e.preventDefault())}),e(document).bind("mouseup.perfect-scrollbar",function(){g.hasClass("in-scrolling")&&g.removeClass("in-scrolling")}),r=o=null},k=function(){var e=function(e,r){var o=s.scrollTop();if(0===o&&r>0&&0===e)return!t.wheelPropagation;if(o>=f-i&&0>r&&0===e)return!t.wheelPropagation;var l=s.scrollLeft();return 0===l&&0>e&&0===r?!t.wheelPropagation:l>=p-a&&e>0&&0===r?!t.wheelPropagation:!0},r=!1;s.bind("mousewheel.perfect-scrollbar",function(o,l,a,i){t.useBothWheelAxes?c&&!n?i?s.scrollTop(s.scrollTop()-i*t.wheelSpeed):s.scrollTop(s.scrollTop()+a*t.wheelSpeed):n&&!c&&(a?s.scrollLeft(s.scrollLeft()+a*t.wheelSpeed):s.scrollLeft(s.scrollLeft()-i*t.wheelSpeed)):(s.scrollTop(s.scrollTop()-i*t.wheelSpeed),s.scrollLeft(s.scrollLeft()+a*t.wheelSpeed)),X(),r=e(a,i),r&&o.preventDefault()}),s.bind("MozMousePixelScroll.perfect-scrollbar",function(e){r&&e.preventDefault()})},M=function(){var r=function(e,r){var o=s.scrollTop();if(0===o&&r>0&&0===e)return!1;if(o>=f-i&&0>r&&0===e)return!1;var l=s.scrollLeft();return 0===l&&0>e&&0===r?!1:l>=p-a&&e>0&&0===r?!1:!0},o=!1;s.bind("mouseenter.perfect-scrollbar",function(){o=!0}),s.bind("mouseleave.perfect-scrollbar",function(){o=!1});var l=!1;e(document).bind("keydown.perfect-scrollbar",function(e){if(o){var n=0,c=0;switch(e.which){case 37:n=-3;break;case 38:c=3;break;case 39:n=3;break;case 40:c=-3;break;default:return}s.scrollTop(s.scrollTop()-c*t.wheelSpeed),s.scrollLeft(s.scrollLeft()+n*t.wheelSpeed),X(),l=r(n,c),l&&e.preventDefault()}})},O=function(){var e=function(e){e.stopPropagation()};w.bind("click.perfect-scrollbar",e),g.bind("click.perfect-scrollbar",function(e){var r=parseInt(b/2,10),o=e.pageY-g.offset().top-r,l=i-b,t=o/l;0>t?t=0:t>1&&(t=1),s.scrollTop((f-i)*t),X()}),m.bind("click.perfect-scrollbar",e),v.bind("click.perfect-scrollbar",function(e){var r=parseInt(u/2,10),o=e.pageX-v.offset().left-r,l=a-u,t=o/l;0>t?t=0:t>1&&(t=1),s.scrollLeft((p-a)*t),X()})},j=function(){var r=function(e,r){s.scrollTop(s.scrollTop()-r),s.scrollLeft(s.scrollLeft()-e),X()},o={},l=0,t={},n=null,c=!1;e(window).bind("touchstart.perfect-scrollbar",function(){c=!0}),e(window).bind("touchend.perfect-scrollbar",function(){c=!1}),s.bind("touchstart.perfect-scrollbar",function(e){var r=e.originalEvent.targetTouches[0];o.pageX=r.pageX,o.pageY=r.pageY,l=(new Date).getTime(),null!==n&&clearInterval(n),e.stopPropagation()}),s.bind("touchmove.perfect-scrollbar",function(e){if(!c&&1===e.originalEvent.targetTouches.length){var s=e.originalEvent.targetTouches[0],n={};n.pageX=s.pageX,n.pageY=s.pageY;var a=n.pageX-o.pageX,i=n.pageY-o.pageY;r(a,i),o=n;var p=(new Date).getTime();t.x=a/(p-l),t.y=i/(p-l),l=p,e.preventDefault()}}),s.bind("touchend.perfect-scrollbar",function(){clearInterval(n),n=setInterval(function(){return.01>Math.abs(t.x)&&.01>Math.abs(t.y)?(clearInterval(n),void 0):(r(30*t.x,30*t.y),t.x*=.8,t.y*=.8,void 0)},10)})},A=function(){s.unbind(".perfect-scrollbar"),e(window).unbind(".perfect-scrollbar"),e(document).unbind(".perfect-scrollbar"),s.data("perfect-scrollbar",null),s.data("perfect-scrollbar-update",null),s.data("perfect-scrollbar-destroy",null),m.remove(),w.remove(),v.remove(),g.remove(),m=w=a=i=p=f=u=d=T=b=h=L=null},E=function(r){s.addClass("ie").addClass("ie"+r);var o=function(){var r=function(){e(this).addClass("hover")},o=function(){e(this).removeClass("hover")};s.bind("mouseenter.perfect-scrollbar",r).bind("mouseleave.perfect-scrollbar",o),v.bind("mouseenter.perfect-scrollbar",r).bind("mouseleave.perfect-scrollbar",o),g.bind("mouseenter.perfect-scrollbar",r).bind("mouseleave.perfect-scrollbar",o),m.bind("mouseenter.perfect-scrollbar",r).bind("mouseleave.perfect-scrollbar",o),w.bind("mouseenter.perfect-scrollbar",r).bind("mouseleave.perfect-scrollbar",o)},l=function(){C=function(){m.css({left:d+s.scrollLeft(),bottom:T,width:u}),w.css({top:h+s.scrollTop(),right:L,height:b}),m.hide().show(),w.hide().show()},y=function(){var e=parseInt(h*f/i,10);s.scrollTop(e),m.css({bottom:T}),m.hide().show()},S=function(){var e=parseInt(d*p/a,10);s.scrollLeft(e),w.hide().show()}};6===r&&(o(),l())},W="ontouchstart"in window||window.DocumentTouch&&document instanceof window.DocumentTouch,B=function(){var e=navigator.userAgent.toLowerCase().match(/(msie) ([\w.]+)/);e&&"msie"===e[1]&&E(parseInt(e[2],10)),X(),D(),P(),O(),W&&j(),s.mousewheel&&k(),t.useKeyboard&&M(),s.data("perfect-scrollbar",s),s.data("perfect-scrollbar-update",X),s.data("perfect-scrollbar-destroy",A)};return B(),s})}});

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

			// Returns true if this element has a checked child
			// TODO: improve this, for it only performs searches 1-level deep AND
			// this way of doing this through a method is not right. It shoudl be 
			// triggered by the children or smthing.
			hasCheckedChild: function (callback) {
				if (_.isEmpty(this.get('children'))) { // optimize?
					return false;
				}
				return !_.all(_.map(this.get('children'), function(t){return !t.checked;}));
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
				// console.log('\n\nchildrenChanged', this);
				// console.log('calling render from tgChecked');
				this.render();
			},

			destroy: function () {
				console.log('Removing me view ="(', this);
				this.remove();
			},

			// ?
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
				this.$('>.expand i').toggleClass("icon-angle-down");
				this.$('>.expand i').toggleClass("icon-angle-up");
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

	// Quick first-attempt at a TemplateManager for the views.
	// Not sure if this is production-quality solution, but for now it'll save
	// me the pain of having to wait for the app to reload everytime the html is
	// changed.
	var TemplateManager = {
		get: function (url, callback, context) {
			var template = this.templates[url];
			if (template)
				callback.call(context, null, template);
			else {
				var that = this;
				$.get(url, function (tmpl) {
					that.templates[url] = tmpl;
					callback.call(context, null, tmpl);
				})
			}
		},
		templates: {},
	}

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
