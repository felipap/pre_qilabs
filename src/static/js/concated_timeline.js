/*! meavisa - v0.0.2
* http://meavisa.org
* Copyright (c) 2014 ; Licensed  */
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
		$("[data-toggle=tooltip]").tooltip();
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
}()) ;

// Place any jQuery/helper plugins in here.
require(['jquery'], function ($) {

	'strict use';

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

	$.fn.xdialog = function (options) {

		if (!this[0]) return;

		var anchor = this[0].hash || '#'+this[0].dataset.hash,
			dialogEl = $(anchor),
			hideUrl = !!this.data('hide-url');

		this.click(function (evt) {
			evt.preventDefault();
			dialogEl.addClass('active');
			if (!hideUrl)
				history.pushState({}, '', anchor)
		});

		dialogEl.find('[data-action=close-dialog]').click(function (evt) {
			evt.preventDefault();
			dialogEl.removeClass('active');
			if (!hideUrl)
				location.hash = '';
		});
	};
});


// for iqlabs.org, by @f03lipe

require(['jquery', 'backbone', 'underscore', 'bootstrap'], function ($, Backbone, _) {

	_.templateSettings = {
		interpolate: /\<\@\=(.+?)\@\>/gim,
		evaluate: /\<\@([\s\S]+?)\@\>/gim,
		escape: /\<\@\-(.+?)\@\>/gim
	};

	$('[data-action="send-post"]').click(function (evt) {
		var body = $("textarea").val();
		$.ajax({
			type:'post',
			url: '/api/posts',
			data: { content: { body: body } }
		}).done(function(data) {
			alert('data', data)
		});
	});

	var Post = (function () {
		'use strict';

		var CommentItem = Backbone.Model.extend({
		});

		var CommentView = Backbone.View.extend({
			tagName: 'li',
			className: 'post',
			template: _.template($("#template-commentview").html()),
			initialize: function () {
			},
			destroy: function () {
				this.undelegateEvents();
				this.$el.removeData().unbind();
				this.unbind();
				this.remove();
			},
			render: function () {
				this.$el.html(this.template({comment: this.model.toJSON()}));
				return this;
			},
		});

		var CommentList = Backbone.Collection.extend({
			model: CommentItem,
			page: 0,
			constructor: function (opts) {
				this.postItem = opts.postItem;
				console.log('this.postItem', this.postItem);
				Backbone.Collection.apply(this, arguments);
			},
			url: function () {
				return this.postItem.get('apiPath') + '/comments'; 
			},
			parse: function (response, options) {
				this.page = response.page;
				console.log('this.page', response)
				return Backbone.Collection.prototype.parse.call(this, response.data, options);
			},
			fetchMore: function () {
				this.fetch({data: {page:this.page+1}, remove:false});
			},
		});

		var CommentListView = Backbone.View.extend({
			tagName: 'ul',
			className: "commentList",
			_commentViews: [],
			initialize: function () {
				this.collection.on('reset', this.addAll, this);
				this.collection.on('add', this.addAll, this);
			},

			addAll: function () {
				var views = [];
				this.collection.each(function(item) {
					views.push(new CommentView({model:item}));
				}, this);
				this._commentViews = views;
				return this.render();
			},

			render: function () {
				console.log('rending commentListView', this.collection);
				var container = document.createDocumentFragment();
				_.each(this._commentViews, function (item) {
					container.appendChild(item.render().el);
				}, this);
				this.$el.empty();
				this.$el.append(container);
				return this;
			},

			destroy: function () {
				this.remove();
			}
		});

		var PostItem = Backbone.Model.extend({
			url: function () {
				this.get('apiPath');
			},
			initialize: function () {
				this.commentsList = new CommentList({ postItem: this });
				this.commentsList.fetch({reset:true});
			},
		});

		var PostView = Backbone.View.extend({
			tagName: 'li',
			className: 'post',
			template: _.template($("#template-postview").html()),
			initialize: function () {
				this.model.collection.on('reset', this.destroy, this);
			},
			destroy: function () {
				this.undelegateEvents();
				this.$el.removeData().unbind();
				this.unbind();
				this.remove();
			},
			render: function () {
				this.$el.html(this.template({post: this.model.toJSON()}));
				this.commentListView = new CommentListView({ collection: this.model.commentsList });
				this.$el.append(this.commentListView.$el);
				return this;
			},
		});

		var PostList = Backbone.Collection.extend({
			model: PostItem,
			url: window.postsRoot || '/api/timeline/posts',
			page: 0,
			parse: function (response, options) {
				this.page = response.page;
				var data = Backbone.Collection.prototype.parse.call(this, response.data, options);
				// Filter for non-null results.
				return _.filter(data, function (i) { return !!i; });
			},
			fetchMore: function () {
				this.fetch({data: {page:this.page+1}, remove:false});
			},
		});

		var PostListView = Backbone.View.extend({
			id: "#posts",
			_postViews: [],
			template: _.template(['<@ if (!length) { @>',
				'<h3 style="color: #888">Nenhum post visível. :/</h3>',
				'<@ } @>',
				'<h3 id="posts-desc">Últimas atualizações dos assuntos que você segue...</h3>',
				'<hr>'].join('\n')),
			
			initialize: function () {
				this.collection.on('reset', this.addAll, this);
				this.collection.on('add', this.addAll, this);
			},

			addAll: function () {
				var views = [];
				this.collection.each(function(postItem) {
					views.push(new PostView({model:postItem}));
				}, this);
				this._postViews = views;
				return this.render();
			},

			render: function () {
				var container = document.createDocumentFragment();
				// render each postView
				_.each(this._postViews, function (postView) {
					container.appendChild(postView.render().el);
				}, this);
				this.$el.empty();
				this.$el.append(container);
				if (this._postViews.length)
					$("#no-posts-msg").hide();
				else
					$("#no-posts-msg").show();
				return this;
			},

			destroy: function () {
				this.remove();
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

	// Central functionality of the app.
	WorkspaceRouter = Backbone.Router.extend({

		routes: {
			'*a':  'index'
		},
		
		initialize: function () {
			window.app = this;
		},

		index: function () {
			console.log('index')
			this.postList = new Post.list();
			this.postListView = new Post.listView({collection: this.postList});
			this.postList.fetch({reset:true});
			this.postListView.$el.appendTo('#posts-col > .placement');
		},	
	});

	$(function () {
		new WorkspaceRouter;
		Backbone.history.start({pushState: false});
		$('#globalContainer').scroll(_.throttle(function() {
			if ($('#posts-col .placement').height()-
				($(window).height()+$('#posts-col').scrollTop())< 200) {
				app.postList.fetchMore();
			}
		}, 500));
	});
});
