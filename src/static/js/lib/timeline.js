
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
