
/*
** timeline.js
** Copyright QILabs.org
** BSD License
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

define(['jquery', 'backbone', 'underscore', 'bootstrap'], function ($, Backbone, _) {

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
			endDate: new Date(),
			comparator: function (i) {
				return 1*new Date(i.get('dateCreated'));
			},
			url: function () {
				return this.postItem.get('apiPath') + '/comments'; 
			},
			parse: function (response, options) {
				this.endDate = new Date(response.endDate);
				return Backbone.Collection.prototype.parse.call(this, response.data, options);
			},
			tryFetchMore: function () {
				console.log('tryFetchMore')
				if (this.endDate === new Date(0))
					return;
				this.fetch({data: {endDate:this.endDate}, remove:false});
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
	var WorkspaceRouter = Backbone.Router.extend({

		routes: {
			'posts/:postId':
				 function (postId) {
					console.log('post');
					this.postList = new Post.list();
					this.postListView = new Post.listView({collection: this.postList});
					this.postList.add(conf.postData)
					this.postListView.$el.appendTo($('#postsPlacement'));
				},
			'labs/:labId':
				function (labId) {
					console.log('lab');
					if (!window.conf.postsRoot) {
						return;
					}
					this.postsRoot = window.conf.postsRoot;
					this.labId = window.conf.labId;
					this.postList = new Post.list();
					this.postListView = new Post.listView({collection: this.postList});
					this.postList.fetch({reset:true});
					this.postListView.$el.appendTo($('#postsPlacement'));
				},
			'p/:profileId':	'main',
			'':  'main'
		},
		
		initialize: function () {
			console.log('initialized')
			window.app = this;
			$('#globalContainer').scroll(_.throttle(function() {
				if ($('#postsPlacement').height()-
					($(window).height()+$('#posts-col').scrollTop())< 200)
					app.postList.tryFetchMore();
			}, 500));
		},

		main: function () {
			console.log('main', this);
			if (!window.conf.postsRoot) {
				return;
			}
			this.postsRoot = window.conf.postsRoot;
			this.postList = new Post.list();
			this.postListView = new Post.listView({collection: this.postList});
			this.postList.fetch({reset:true});
			this.postListView.$el.appendTo($('#postsPlacement'));
		},
	});

	return {
		initialize: function () {
			new WorkspaceRouter;
			Backbone.history.start({ pushState:false, hashChange:false });
		}
	};
});