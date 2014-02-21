/*! meavisa - v0.0.2
* http://meavisa.org
* Copyright (c) 2014 ; Licensed BSD */

requirejs.config({
	appDir: ".",
	baseUrl: "static/js",
	paths: {
		'app.index': 	'app.index',
		'jquery': 		['//ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min','vendor/jquery-2.0.3.min'],
		'bootstrap': 	['//cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.0.0/js/bootstrap.min','vendor/bootstrap-3.0.0.min'],
		'underscore': 	['//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.5.1/underscore-min','vendor/underscore-1.5.1.min'],
		'backbone': 	['//cdnjs.cloudflare.com/ajax/libs/backbone.js/1.0.0/backbone-min','vendor/backbone-1.0.0.min'],
	},
	shim: {
		'underscore': { exports: '_' },
		'bootstrap' : { deps: ['jquery'] },
		'backbone'	: { exports: 'Backbone', deps: ['underscore', 'jquery']},
	}
});

// Present in all built javascript.

define(['jquery','bootstrap'], function ($) {

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


/*
** timeline.js
** Copyright QILabs.org
** by @f03lipe
*/

window.calcTimeFrom = function (arg) {
	var now = new Date(),
		then = new Date(arg),
		diff = now-then;
	if (diff < 1000*60) {
		return 'agora'; 'há '+Math.floor(diff/1000)+'s';
	} else if (diff < 1000*60*60) {
		return 'há '+Math.floor(diff/1000/60)+'min';
	} else if (diff < 1000*60*60*30) { // até 30 horas
		return 'há '+Math.floor(diff/1000/60/60)+'h';
	} else {
		return 'há '+Math.floor(diff/1000/60/60/24)+' dias';
	}
}

require(['jquery', 'backbone', 'underscore', 'bootstrap'], function ($, Backbone, _) {

	_.templateSettings = {
		interpolate: /\<\@\=(.+?)\@\>/gim,
		evaluate: /\<\@([\s\S]+?)\@\>/gim,
		escape: /\<\@\-(.+?)\@\>/gim
	};

	setTimeout(function updateCounters () {

		$('[data-time-count]').each(function () {
			this.innerHTML = calcTimeFrom(parseInt(this.dataset.timeCount));
		});

		setTimeout(updateCounters, 1000);
	}, 1000);

	$('[data-action="send-post"]').click(function (evt) {
		var body = document.querySelector("#inputPostContent").value;
		$.ajax({
			type: 'post',
			dataType: 'json',
			url: '/api/posts',
			data: { content: { body: body }, groupId: window.groupId }
		}).done(function(response) {
			document.querySelector("#inputPostContent").value = '';
			app.postList.add(new Post.item(response.data));
			console.log('data', response.data);
		});
	});

	var Post = (function () {
		'use strict';

		var GenericPostItemView = Backbone.View.extend({
			construction: function (opts) {
				this.collection = opts.collection;
				Backbone.View.apply(this, arguments);
			},
			destroy: function () {
				var self = this;
				this.model.destroy({
					success: function () {
						console.log('succes');
						self.$el.removeData().unbind();
						self.remove();
					}
				});
			},
		});

		var GenericPostItem = Backbone.Model.extend({
			url: function () {
				return this.get('apiPath');
			},
		})

		var CommentItem = GenericPostItem.extend({
		});

		var CommentView = GenericPostItemView.extend({
			tagName: 'li',
			className: 'commentWrapper',
			template: _.template($("#template-commentview").html()),
			initialize: function () {
				this.bindRemoveBtn();
			},
			bindRemoveBtn: function () {
				this.$el.on('click', '[data-action=remove-post]', this.askForRemoval.bind(this));
			},
			askForRemoval: function () {
				if (confirm('Tem certeza que deseja excluir esse comentário?')) {
					this.destroy();
				}
			},
			render: function () {
				this.$el.html(this.template({comment: this.model.toJSON()}));
				return this;
			},
		});

		var CommentList = Backbone.Collection.extend({
			model: CommentItem,
			page: 0,
			comparator: function (i) {
				return 1*new Date(i.get('dateCreated'));
			},
			url: function () {
				return this.postItem.get('apiPath') + '/comments'; 
			},
			parse: function (response, options) {
				this.page = response.page;
				return Backbone.Collection.prototype.parse.call(this, response.data, options);
			},
			tryFetchMore: function () {
				console.log('tryFetchMore')
				if (this.page === -1)
					return;
				this.fetch({data: {page:this.page+1}, remove:false});
			},
		});

		var CommentListView = Backbone.View.extend({
			tagName: 'ul',
			className: "commentListWrapper",
			_commentViews: [],
			
			initialize: function () {
				this.collection.on('reset', this.addAll, this);
				this.collection.on('add', this.addAll, this);
				this.addAll();
			},

			addAll: function () {
				var views = [];
				this.collection.each(function(item) {
					views.push(new CommentView({model:item,collection:this.collection}));
				}, this);
				this._commentViews = views;
				return this.render();
			},

			render: function () {
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

		var PostItem = GenericPostItem.extend({
			initialize: function () {
				this.commentList = new CommentList(this.get('comments'));
				this.commentList.postItem = this.postItem;
				// if (this.get('hasComments')) {
				// 	this.commentList.fetch({reset:true});
				// }
			},
		});

		var PostView = GenericPostItemView.extend({
			tagName: 'li',
			className: 'postWrapper',
			template: _.template($("#template-postview").html()),
			bindRemoveBtn: function () {
				this.$el.on('click', '.opMessage [data-action=remove-post]', this.askForRemoval.bind(this));
			},
			askForRemoval: function () {
				if (confirm('Tem certeza que deseja excluir essa postagem?')) {
					this.destroy();
				}
			},
			initialize: function () {
				this.model.collection.on('reset', this.destroy, this);
				this.bindRemoveBtn();
				this.commentListView = new CommentListView({ collection: this.model.commentList });
			},
			events: {
				'submit .formPostComment':
					function (evt) {
						console.log('this is', this, this.collection)
						var bodyEl = $(evt.target).find(".commentInput");
						var self = this;
						$.ajax({
							type: 'post',
							dataType: 'json',
							url: this.model.get('apiPath')+'/comments',
							data: { content: { body: bodyEl.val() } }
						}).done(function(response) {
							bodyEl.val('');
							// console.log('response', response);
							self.model.commentList.add(new CommentItem(response.data));
						});
					},
			},
			render: function () {
				this.$el.html(this.template({post: this.model.toJSON()}));
				this.$el.find('.postCommentsSection').append(this.commentListView.$el);
				return this;
			},
		});

		var PostList = Backbone.Collection.extend({
			model: PostItem,
			url: function () {
				return app.postsRoot;
			},
			page: 0,
			comparator: function (i) {
				return -1*new Date(i.get('dateCreated'));
			},
			parse: function (response, options) {
				this.page = response.page;
				var data = Backbone.Collection.prototype.parse.call(this, response.data, options);
				// Filter for non-null results.
				return _.filter(data, function (i) { return !!i; });
			},
			tryFetchMore: function () {
				if (this.page === -1)
					return;
				this.fetch({data: {page:this.page+1}, remove:false});
			},
		});

		var PostListView = Backbone.View.extend({
			className: "postListWrapper",
			_postViews: [],
			
			initialize: function () {
				this.collection.on('reset', this.addAll, this);
				this.collection.on('add', this.addAll, this);
			},

			addAll: function () {
				var views = [];
				this.collection.each(function(postItem) {
					views.push(new PostView({model:postItem,collection:this.collection}));
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
			console.log('index', this);
			if (!window.postsRoot) {
				return;
			}
			this.config = _.extend({},window.loadConfig);
			if (this.config.postData) {
			}
			this.postList = new Post.list();
			console.log('ppo', this.postList);
			this.postListView = new Post.listView({collection: this.postList});
			if (false && window.post) {	
				this.postList.reset([window.post]);
			} else {
				this.postList.fetch({reset:true});
			}
			this.postListView.$el.appendTo('#postsPlacement');
		},

		renderPosts: function (opts) {
			this.postsRoot = opts;
			this.postList = new Post.list();
			this.postListView = new Post.listView({collection: this.postList});
			this.postList.fetch({reset:true});
			this.postListView.$el.appendTo('#postsPlacement');			
		}
	});

	$(function () {
		new WorkspaceRouter;
		// Backbone.history.start({pushState: false});
		$('#globalContainer').scroll(_.throttle(function() {
			if ($('#postsPlacement').height()-
				($(window).height()+$('#posts-col').scrollTop())< 200)
				app.postList.tryFetchMore();
		}, 500));
	});
});
