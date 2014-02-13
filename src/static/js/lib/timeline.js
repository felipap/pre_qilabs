
// for iqlabs.org, by @f03lipe

require(['jquery', 'backbone', 'underscore', 'bootstrap'], function ($, Backbone, _) {

	_.templateSettings = {
		interpolate: /\<\@\=(.+?)\@\>/gim,
		evaluate: /\<\@([\s\S]+?)\@\>/gim,
		escape: /\<\@\-(.+?)\@\>/gim
	};

	$('[data-action="send-post"]').click(function (evt) {
		var content = $("textarea").val();
		$.post('/api/me/post', {content: content}, function (data) {
			alert(JSON.stringify(data));
		});
	});

	var Post = (function () {
		'use strict';
		//
		var PostItem = Backbone.Model.extend({
			urlRoot: window.postsRoot || '/api/timeline/posts'
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
			url: window.postsRoot || '/api/timeline/posts',
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

		$('#posts-col').scroll(function() {
			if ($('#posts-col .placement').height()-
				($(window).height()+$('#posts-col').scrollTop())< 200) {
				app.postList.fetchMore();
			}
		});
	});
});
