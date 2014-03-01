/** @jsx React.DOM */

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
};

define(['jquery', 'backbone', 'underscore', 'react', 'react.backbone'], function ($, Backbone, _, React) {

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

	/************************************************************************************/
	/************************************************************************************/
	/************************************************************************************/
	/************************************************************************************/

	// var Comment = React.createClass({
	// 	render: function () {
	// 		var raw = this.props.children.toString(); // add markup converter
	// 		return (
	// 			<div className="comment">
	// 				<h2 className="commentAuthor">{this.props.author}</h2>
	// 				<span>{raw}</span>
	// 			</div>
	// 		);
	// 	}
	// });
		
	// var CommentList = React.createClass({
	// 	render: function() {
	// 		// console.log('oi?', this.props.data)
	// 		var commentNodes = this.props.data.map(function (comment, index) {
	// 			return <Comment key={index} author={comment.author.name}>{comment.data.body}</Comment>;
	// 		});
	// 		return <div className="commentList">{commentNodes}</div>;
	// 	}
	// });

	// var CommentForm = React.createClass({
	// 	handleSubmit: function() {
	// 		var author = this.refs.author.getDOMNode().value.trim();
	// 		var text = this.refs.text.getDOMNode().value.trim();
	// 		this.props.onCommentSubmit({author: author, text: text});
	// 		this.refs.author.getDOMNode().value = '';
	// 		this.refs.text.getDOMNode().value = '';
	// 		return false;
	// 	},
	// 	render: function() {
	// 		return (
	// 			<form className="commentForm" onSubmit={this.handleSubmit}>
	// 				<input type="text" placeholder="Your name" ref="author" />
	// 				<input type="text" placeholder="Say something..." ref="text" />
	// 				<input type="submit" value="Post" />
	// 			</form>
	// 		);
	// 	}
	// });

	// var CommentBox = React.createClass({
	// 	loadCommentsFromServer: function () {
	// 		$.ajax({
	// 			url: this.props.url,
	// 			dataType: 'json',
	// 			success: function (data) {
	// 				this.setState({data: data.data});
	// 			}.bind(this)
	// 		});
	// 	},
	// 	handleCommentSubmit: function (comment) {
	// 		var comments = this.state.data;
	// 		comments.push(comment);
	// 		this.setState({data: comments});
	// 		$.ajax({
	// 			url: this.props.url,
	// 			type: 'POST',
	// 			data: comment,
	// 			success: function (data) {
	// 				this.setState({data: data.data});
	// 			}.bind(this)
	// 		});
	// 	},
	// 	getInitialState: function () {
	// 		return {data:[]};
	// 	},
	// 	componentWillMount: function () {
	// 		this.loadCommentsFromServer();
	// 		setInterval(this.loadCommentsFromServer, this.props.pollInterval);
	// 	},
	// 	render: function () {
	// 		return (
	// 			<div className="commentBox">
	// 				<h1>Comments</h1>
	// 				<CommentList data={this.state.data} />
	// 				<CommentForm onCommentSubmit={this.handleCommentSubmit} />
	// 			</div>
	// 		);
	// 	}
	// })


	// var PostBox = React.createClass({
	// 	getInitialState: function () {
	// 		return {data:[]};
	// 	},
	// 	componentWillMount: function () {

	// 	},
	// 	render: function () {
	// 		return (
	// 			<div className="postWrapper">
	// 				<PostForm onPostSubmit={this.handlePostSubmit} />
	// 				<h1>Posts</h1>
	// 				<PostList model={this.state.data} />
	// 			</div>
	// 		);
	// 	},
	// });

	// React.renderComponent(<PostBox />, document.getElementById('postInput'));

	/************************************************************************************/
	/************************************************************************************/
	/************************************************************************************/
	/************************************************************************************/


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

		// var CommentView = GenericPostItemView.extend({
		// 	tagName: 'li',
		// 	className: 'commentWrapper',
		// 	template: _.template($("#template-commentview").html()),
		// 	initialize: function () {
		// 		this.bindRemoveBtn();
		// 	},
		// 	bindRemoveBtn: function () {
		// 		this.$el.on('click', '[data-action=remove-post]', this.askForRemoval.bind(this));
		// 	},
		// 	askForRemoval: function () {
		// 		if (confirm('Tem certeza que deseja excluir esse comentário?')) {
		// 			this.destroy();
		// 		}
		// 	},
		// 	render: function () {
		// 		this.$el.html(this.template({comment: this.model.toJSON()}));
		// 		return this;
		// 	},
		// });

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

		// var CommentListView = Backbone.View.extend({
		// 	tagName: 'ul',
		// 	className: "commentListWrapper",
		// 	_commentViews: [],
			
		// 	initialize: function () {
		// 		this.collection.on('reset', this.addAll, this);
		// 		this.collection.on('add', this.addAll, this);
		// 		this.addAll();
		// 	},

		// 	addAll: function () {
		// 		var views = [];
		// 		this.collection.each(function(item) {
		// 			views.push(new CommentView({model:item,collection:this.collection}));
		// 		}, this);
		// 		this._commentViews = views;
		// 		return this.render();
		// 	},

		// 	render: function () {
		// 		var container = document.createDocumentFragment();
		// 		_.each(this._commentViews, function (item) {
		// 			container.appendChild(item.render().el);
		// 		}, this);
		// 		this.$el.empty();
		// 		this.$el.append(container);
		// 		return this;
		// 	},

		// 	destroy: function () {
		// 		this.remove();
		// 	}
		// });

		var CommentView = React.createClass({
			render: function () {
				var comment = this.props.model.attributes;
				console.log('comment:', comment)

				var mediaUserAvatarStyle = {
					background: 'url('+comment.author.avatarUrl+')',
				};

				return (
					<div className="commentWrapper">
						<div className="mediaUser">
							<a href={comment.author.profileUrl}>
								<div className="mediaUserAvatar" style={mediaUserAvatarStyle} title={comment.author.username}>
								</div>
							</a>
						</div>
						<div className={(comment.author.id==='{{ user.id }}')?'msgBody editable':'msgBody'}>
							{comment.data.unescapedBody}
							{function(){
								if (window.user && window.user.id === comment.author.id)
									return (
										<div className="optionBtns">
											<button data-action="remove-post" data-toggle="tooltip" title="Remover Comentário" data-placement="bottom">
												<i className="icon-trash"></i>
											</button>
										</div>
									);
							}()}
						</div>
						<a href={comment.path} data-time-count={1*new Date(comment.dateCreated)}>
							{window.calcTimeFrom(comment.dateCreated)}
						</a>
					</div>
				);
			},
		});


		var CommentListView = React.createClass({			
			componentWillMount: function () {
				var update = function () {
					this.forceUpdate(function(){});
				}
				this.props.collection.on('reset', update.bind(this));
				this.props.collection.on('add', update.bind(this));
			},

			render: function () {
				var commentNodes = this.props.collection.map(function (comment) {
					return (
						<CommentView model={comment} /> 
					);
				});

				return (
					<div className="commentListWrapper">
						{commentNodes}
					</div>
				);
			},
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

		// var PostView = GenericPostItemView.extend({
		// 	tagName: 'li',
		// 	className: 'postWrapper',
		// 	template: _.template($("#template-postview").html()),
		// 	bindRemoveBtn: function () {
		// 		this.$el.on('click', '.opMessage [data-action=remove-post]', this.askForRemoval.bind(this));
		// 	},
		// 	askForRemoval: function () {
		// 		if (confirm('Tem certeza que deseja excluir essa postagem?')) {
		// 			this.destroy();
		// 		}
		// 	},
		// 	initialize: function () {
		// 		this.model.collection.on('reset', this.destroy, this);
		// 		this.bindRemoveBtn();
		// 		this.commentListView = new CommentListView({ collection: this.model.commentList });
		// 	},
		// 	events: {
		// 		// 'submit .formPostComment':
		// 		// 	function (evt) {
		// 		// 		console.log('this is', this, this.collection)
		// 		// 		var bodyEl = $(evt.target).find(".commentInput");
		// 		// 		var self = this;
		// 		// 		$.ajax({
		// 		// 			type: 'post',
		// 		// 			dataType: 'json',
		// 		// 			url: this.model.get('apiPath')+'/comments',
		// 		// 			data: { content: { body: bodyEl.val() } }
		// 		// 		}).done(function(response) {
		// 		// 			bodyEl.val('');
		// 		// 			// console.log('response', response);
		// 		// 			self.model.commentList.add(new CommentItem(response.data));
		// 		// 		});
		// 		// 	},
		// 	},
		// 	render: function () {
		// 		this.$el.html(this.template({post: this.model.toJSON()}));
		// 		React.renderComponent(
		// 			<CommentBox url="/api/posts/530b7b66bd95abc20500000a/comments" pollInterval={2000} />,
		// 			document.getElementById('container')
		// 		);

		// 		this.$el.find('.postCommentsSection').append(this.commentListView.$el);
		// 		return this;
		// 	},
		// });

		var PlainPostView = React.createClass({

			render: function () {
				var post = this.props.model.attributes;

				var mediaUserStyle = {
					background: 'url('+post.author.avatarUrl+')',
				};

				return (
					<div className="opMessage">
						<div className="msgHeader">
							<div className="mediaUser">
								<a href={post.author.profileUrl}>
									<div className="mediaUserAvatar" style={mediaUserStyle}></div>
								</a>
							</div>
							<div className="headline">
								<a href={post.author.profileUrl} className="authorUsername">
									{post.author.name}
								</a>
								disse:
							</div>
							
							<a href={post.path}>
								<time data-time-count={1*new Date(post.dateCreated)}>
									{window.calcTimeFrom(post.dateCreated)}
								</time>
							</a>

							{function () {
								if (window.user && post.author.id === window.user.id)
									return (
										<div className="optionBtns">
											<button data-action="remove-post" data-toggle="tooltip" data-placement="bottom" title="Remover Post">
												<i className="icon-trash"></i>
											</button>
											<button data-action="edit-post" data-toggle="tooltip" data-placement="bottom" title="Editar Post">
												<i className="icon-edit"></i>
											</button>
										</div>
									);
								return;
							}()}
						</div>
						<div className="msgBody">
							<div className="arrow"></div>
							{post.data.unescapedBody}
						</div>
					</div>
				);
			}
		});

		var PostWrapperView = React.createClass({

			render: function () {
				console.log('list', this.props.model.commentList)
				return (
					<div className="postWrapper">
						<PlainPostView model={this.props.model}/>
						<CommentListView collection={this.props.model.commentList}/>
					</div>
				);
			}
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

		var PostForm = React.createClass({
			handleSubmit: function (evt) {
				var body = this.refs.postBody.getDOMNode().value.trim();
				if (!body) {
					return false;
				}
				$.ajax({
					type: 'post', dataType: 'json', url: '/api/posts',
					data: { content: { body: body }, groupId: window.groupId }
				}).done(function(response) {
					app.postList.add(new Post.item(response.data));
					console.log('data', response.data);
				});
				this.refs.postBody.getDOMNode().value = '';

				return false;
			},
			render: function () {
				return (
					<form className="postInputForm" onSubmit={this.handleSubmit}>
						<h2>Enviar uma msg para o seus seguidores</h2>
						<textarea placeholder="Escreva uma mensagem aqui" ref="postBody"></textarea>
						<button data-action="send-post" type="submit">Enviar Post</button>
					</form>
				);
			}
		});

		// var PostListView = Backbone.View.extend({
		// 	className: "postListWrapper",
		// 	_postViews: [],
			
		// 	initialize: function () {
		// 		this.collection.on('reset', this.addAll, this);
		// 		this.collection.on('add', this.addAll, this);
		// 	},

		// 	addAll: function () {
		// 		var views = [];
		// 		this.collection.each(function(postItem) {
		// 			views.push(new PostView({model:postItem,collection:this.collection}));
		// 		}, this);
		// 		this._postViews = views;
		// 		return this.render();
		// 	},

		// 	render: function () {
		// 		var container = document.createDocumentFragment();
		// 		// render each postView
		// 		_.each(this._postViews, function (postView) {
		// 			container.appendChild(postView.render().el);
		// 		}, this);
		// 		this.$el.empty();
		// 		this.$el.append(container);
		// 		return this;
		// 	},

		// 	destroy: function () {
		// 		this.remove();
		// 	}
		// });

		var PostListView = React.createClass({
			getInitialState: function () {
				return {};
			},
			componentWillMount: function () {
				var self = this;
				function updateMe (evt) {
					console.log('oi', arguments)
					self.forceUpdate(function(){});
				}
				this.props.collection.on('add', updateMe);
				this.props.collection.on('reset', updateMe);
			},
			// changeOptions: "change:name",
			render: function () {
				var postNodes = this.props.collection.map(function (post) {
					return (
						<PostWrapperView model={post}/>
					);
				});
				return (
					<div className="postListWrapper">
						<PostForm />
						{postNodes}
					</div>
				);
			},
		});

		return {
			item: PostItem,
			list: PostList,
			// view: PostView,
			listView: PostListView,
		};
	})();


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

			var ListView = Post.listView;
			var postList = this.postList;

			React.renderComponent(<ListView collection={postList} />, document.getElementById('postsPlacement'));

			// this.postListView = new Post.listView({collection: this.postList});
			this.postList.fetch({reset:true});
		},
	});

	return {
		initialize: function () {
			new WorkspaceRouter;
			Backbone.history.start({ pushState:false, hashChange:false });
		}
	};
});
