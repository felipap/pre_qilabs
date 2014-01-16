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
		var href = this.dataset['ajaxPostHref'];
		console.log(this.dataset, href);
		$.post(href, function () {
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

	(function showFlashMessages (msgs) {
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
		var PostItem = Backbone.Model.extend({
			urlRoot: '/api/posts'
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
				return this;
			},
		});

		var PostList = Backbone.Collection.extend({
			model: PostItem,
			url: '/api/posts',
			page: 0,
			parse: function (response, options) {
				this.page = response.page
				return Backbone.Collection.prototype.parse.call(this, response.data, options);
			},
			fetchMore: function () {
				this.fetch({data: {page:this.page+1}, remove:false});
			}
		});

		var PostListView = Backbone.View.extend({
			id: "#posts",
			_views: [],
			template: _.template(['<@ if (!length) { @>',
				'<h3 style="color: #888">Ops! Você não está seguindo tag nenhuma. :/</h3>',
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
			},

			destroy: function () {
				this.remove();
			}
		});

		var PostItemSingleView = Backbone.View.extend({
			id: "#post",
			className: 'post',
			template: _.template($("#template-postview-single").html()),

			initialize: function () {
				this.model.on('change', this.render, this);
			},
			
			destroy: function () {
				this.undelegateEvents();
				this.$el.removeData().unbind();
				this.unbind();
				this.remove();
			},

			render: function () {
				console.log('render');
				this.$el.html(this.template({post: this.model.toJSON()}));
				return this;
			},
		});

		return {
			item: PostItem,
			list: PostList,
			view: PostView,
			listView: PostListView,
			singleView: PostItemSingleView,
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
	WorkspaceRouter = Backbone.Router.extend({

		routes: {
			'posts/:post': 'singlePost',
			'*a':  'index'
		},
		
		initialize: function () {
			window.app = this;

			this.tagList = new Tag.list();
			this.tagListView = new Tag.listView({collection: this.tagList});
			$("#tags-wrapper").prepend(this.tagListView.$el);
			this.tagList.parseAndReset(window._tags);
		},

		singlePost: function (postId) {
			this.postListView && this.postListView.destroy();

			this.selPostModel = new Post.item({id:postId});
			this.postItemSingleView = new Post.singleView({model: this.selPostModel});
			this.selPostModel.fetch({reset:true});
			this.postItemSingleView.$el.appendTo('#posts-col > .placement');
		},

		index: function () {
			console.log('index)')
			this.postItemSingleView && this.postItemSingleView.destroy();

			this.postList = new Post.list();
			this.postListView = new Post.listView({collection: this.postList});
			this.postList.fetch({reset:true});
			this.postListView.$el.appendTo('#posts-col > .placement');
		},

		confirmTags: function (callback) {
			this.tagList.save(callback);
		},
		
	});

	$(function () {
		new WorkspaceRouter;
		Backbone.history.start({pushState: false});

		$("#tags-wrapper [type=submit]").click(function (event) {
			event.stopPropagation();
			event.preventDefault();
			window.app.confirmTags(function () {
				location.href = '/';
			})
		});

		$('#posts-col').scroll(function() {
			if ($('#posts-col .placement').height()-
				($(window).height()+$('#posts-col').scrollTop())< 200) {
				app.postList.fetchMore();
			}
		});
	});
});
