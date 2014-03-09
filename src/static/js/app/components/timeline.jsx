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

define(['jquery', 'backbone', 'underscore', 'react', 'showdown'], function ($, Backbone, _, React, Showdown) {

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

	var Post = (function () {
		'use strict';

		var GenericPostItem = Backbone.Model.extend({
			url: function () {
				return this.get('apiPath');
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

		var PostList = Backbone.Collection.extend({
			model: PostItem,

			constructor: function (models, options) {
				Backbone.Collection.apply(this, arguments);
				this.url = options.url || app.postsRoot || '/api/me/timeline/posts';
			},
			comparator: function (i) {
				return -1*new Date(i.get('dateCreated'));
			},
			parse: function (response, options) {
				this.minDate = response.minDate;
				var data = Backbone.Collection.prototype.parse.call(this, response.data, options);
				// Filter for non-null results.
				return _.filter(data, function (i) { return !!i; });
			},
			tryFetchMore: function () {
				if (this.minDate <= 0)
					return;
				console.log('try fetch more')
				this.fetch({data: {maxDate:this.minDate+1}, remove:false});
			},
		});

		var CommentItem = GenericPostItem.extend({});

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
		
		/********************************************************************************/
		/********************************************************************************/
		/* React.js views */

		var CommentView = React.createClass({
			render: function () {
				var comment = this.props.model.attributes;
				var self = this;

				function onClickTrash () {
					if (confirm('Tem certeza que deseja excluir esse comentário?')) {
						self.props.model.destroy();
					}
				}

				var mediaUserAvatarStyle = {
					background: 'url('+comment.author.avatarUrl+')',
				};

				return (
					<div className="commentWrapper" id={comment.id}>
						<div className="mediaUser">
							<a href={comment.author.profileUrl}>
								<div className="mediaUserAvatar" style={mediaUserAvatarStyle} title={comment.author.username}>
								</div>
							</a>
						</div>
						<div className={(window.user && comment.author.id===window.user.id)?'msgBody editable':'msgBody'}>
							{comment.data.unescapedBody}
							{(window.user && window.user.id === comment.author.id)?
								<div className="optionBtns">
									<button data-action="remove-post" onClick={onClickTrash} data-toggle="tooltip" title="Remover Comentário" data-placement="bottom">
										<i className="icon-trash"></i>
									</button>
								</div>
							:undefined}
						</div>
						<a href={comment.path} data-time-count={1*new Date(comment.dateCreated)}>
							{window.calcTimeFrom(comment.dateCreated)}
						</a>
					</div>
				);
			},
		});

		var CommentInputView = React.createClass({

			handleSubmit: function (evt) {
				evt.preventDefault();

				var bodyEl = $(this.refs.input.getDOMNode());
				var self = this;
				$.ajax({
					type: 'post',
					dataType: 'json',
					url: this.props.model.get('apiPath')+'/comments',
					data: { content: { body: bodyEl.val() } }
				}).done(function(response) {
					bodyEl.val('');
					console.log('response', response);
					self.props.model.commentList.add(new CommentItem(response.data));
				});
			},

			render: function () {
				if (!window.user)
					return (<div></div>);

				var mediaUserAvatarStyle = {
					background: 'url('+window.user.avatarUrl+')',
				};

				return (
					<div className="commentInputSection">
						<form className="formPostComment" onSubmit={this.handleSubmit}>
							<div className="mediaUser">
								<a href={window.user.profileUrl}>
									<div className="mediaUserAvatar" style={mediaUserAvatarStyle}>
									</div>
								</a>
							</div>
							<input className="commentInput" ref="input" type="text" placeholder="Comente esse post..." />
							<button data-action="send-comment">Enviar</button>
						</form>
					</div>
				);
			},
		})

		var CommentListView = React.createClass({
			componentWillMount: function () {
				var update = function () {
					this.forceUpdate(function(){});
				}
				this.props.collection.on('add reset remove', update.bind(this));
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

		var CommentSectionView = React.createClass({

			render: function () {
				return (
					<div>
						<CommentListView collection={this.props.model.commentList} />
						{
							window.user?
							<CommentInputView model={this.props.model} />
							:null
						}
					</div>
				);
			},
		});

		/************************************************************************************/
		/************************************************************************************/

		var EditablePost = {

			onClickEdit: function () {
			},

			onClickTrash: function () {
				if (confirm('Tem certeza que deseja excluir essa postagem?')) {
					self.props.model.destroy();
				}
			},

		};

		var NotificationView = React.createClass({

			render: function () {
				var post = this.props.model.attributes;
				var mediaUserStyle = {
					background: 'url('+post.author.avatarUrl+')',
				};
				var rawMarkup = post.data.body;

				return (
					<div className="noteMessage">
						{rawMarkup}
					</div>
				);
			},

		});

		var PostView = React.createClass({
			mixins: [EditablePost],

			render: function () {
				var post = this.props.model.attributes;
				var mediaUserStyle = {
					background: 'url('+post.author.avatarUrl+')',
				};
				var rawMarkup = post.data.unescapedBody;

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

							{(window.user && post.author.id === window.user.id)?
								<div className="optionBtns">
									<button	onClick={this.onClickTrash} title="Remover Post"
										data-action="remove-post" data-toggle="tooltip" data-placement="bottom">
										<i className="icon-trash"></i>
									</button>
									<button	onClick={this.onClickEdit} title="Editar Post"
										data-action="edit-post" data-toggle="tooltip" data-placement="bottom">
										<i className="icon-edit"></i>
									</button>
								</div>
								:undefined}
						</div>
						<div className="msgBody">
							<div className="arrow"></div>
							<span dangerouslySetInnerHTML={{__html: rawMarkup}} />
						</div>
					</div>
				);
			},
		});

		var PostWrapperView = React.createClass({
			render: function () {
				var postType = this.props.model.get('type');
				return (
					<div className="postWrapper">
						{
							(postType==='Notification')?
							<NotificationView model={this.props.model} />
							:<PostView model={this.props.model} />
						}
						{
							(postType==='PlainPost'||postType==='Answer')?
							<CommentSectionView model={this.props.model} />
							:null
						}
					</div>
				);
			},
		});

		var PostForm = React.createClass({
			handleSubmit: function (evt) {
				var body = this.refs.postBody.getDOMNode().value.trim();
				if (!body) {
					return false;
				}
				$.ajax({
					type: 'post', dataType: 'json', url: this.props.postUrl,
					data: { content: { body: body }, groupId: window.groupId }
				}).done(function(response) {
					app.postList.add(new Post.item(response.data));
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

		var TimelineView = React.createClass({
			getInitialState: function () {
				return {};
			},
			componentWillMount: function () {
				function update () {
					this.forceUpdate(function(){});
				}
				this.props.collection.on('add remove reset', update.bind(this));
			},
			// changeOptions: "change:name",
			render: function () {
				var postNodes = this.props.collection.map(function (post) {
					return (
						<PostWrapperView model={post} />
					);
				});
				return (
					<div className="postListWrapper">
						<PostForm postUrl={this.props.collection.url}/>
						{postNodes}
					</div>
				);
			},
		});

		return {
			item: PostItem,
			list: PostList,
			timelineView: TimelineView,
			postView: PostWrapperView,
		};
	})();


	// Central functionality of the app.
	var WorkspaceRouter = Backbone.Router.extend({
		
		initialize: function () {
			console.log('initialized')
			window.app = this;
			$('#globalContainer').scroll(_.throttle(function() {
				if (($('#results-col').outerHeight()-$('#globalContainer').scrollTop()-256)<400)
					app.postList.tryFetchMore();
			}, 500));
		},

		routes: {
			'posts/:postId':
				 function (postId) {
				 	this.postItem = new Post.item(window.conf.postData);
				 	React.renderComponent(Post.postView({model:this.postItem}),
				 		document.getElementById('postsPlacement'));
				},
			'labs/:labId':
				function (labId) {					
					this.renderList('/api/labs/'+labId+'/posts');
				},
			'p/:profileId':
				function () {
					this.renderList(window.conf.postsRoot);
				},
			'':
				function () {
					this.renderList('/api/me/timeline/posts');
				},
		},

		renderList: function (url) {
			this.postList = new Post.list([], {url:url});
			React.renderComponent(Post.timelineView({collection:this.postList}),
				document.getElementById('postsPlacement'));
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
