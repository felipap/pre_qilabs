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
				return -1*new Date(i.get('published'));
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
				return 1*new Date(i.get('published'));
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

		var EditablePost = {

			onClickEdit: function () {
			},

			onClickTrash: function () {
				if (confirm('Tem certeza que deseja excluir essa postagem?')) {
					this.props.model.destroy();
				}
			},

		};

		var CommentView = React.createClass({displayName: 'CommentView',
			mixins: [EditablePost],
			render: function () {
				var comment = this.props.model.attributes;
				var self = this;

				var mediaUserAvatarStyle = {
					background: 'url('+comment.author.avatarUrl+')',
				};

				return (
					React.DOM.div( {className:"commentWrapper", id:comment.id}, 
						React.DOM.div( {className:"mediaUser"}, 
							React.DOM.a( {href:comment.author.profileUrl}, 
								React.DOM.div( {className:"mediaUserAvatar", style:mediaUserAvatarStyle, title:comment.author.username}
								)
							)
						),
						React.DOM.div( {className:(window.user && comment.author.id===window.user.id)?'msgBody editable':'msgBody'}, 
							comment.data.unescapedBody,
							(window.user && window.user.id === comment.author.id)?
								React.DOM.div( {className:"optionBtns"}, 
									React.DOM.button( {'data-action':"remove-post", onClick:this.onClickTrash, 'data-toggle':"tooltip", title:"Remover Comentário", 'data-placement':"bottom"}, 
										React.DOM.i( {className:"icon-trash"})
									)
								)
							:undefined
						),
						React.DOM.a( {href:comment.path, 'data-time-count':1*new Date(comment.published)}, 
							window.calcTimeFrom(comment.published)
						)
					)
				);
			},
		});

		var CommentInputView = React.createClass({displayName: 'CommentInputView',

			componentDidMount: function () {
				$(this.refs.input.getDOMNode()).autosize();
			},

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
					return (React.DOM.div(null));
				var mediaUserAvatarStyle = {
					background: 'url('+window.user.avatarUrl+')',
				};

				return (
					React.DOM.div( {className:"commentInputSection"}, 
						React.DOM.form( {className:"formPostComment", onSubmit:this.handleSubmit}, 
							React.DOM.table(null, 
								React.DOM.tbody(null, 
									React.DOM.tr(null, React.DOM.td(null, 
										React.DOM.div( {className:"mediaUser"}, 
											React.DOM.a( {href:window.user.profileUrl}, 
												React.DOM.div( {className:"mediaUserAvatar", style:mediaUserAvatarStyle}
												)
											)
										)
									),React.DOM.td( {className:"commentInputTd"}, 
										React.DOM.textarea( {required:"required", className:"commentInput", ref:"input", type:"text", placeholder:"Faça um comentário sobre essa publicação."}
										)
									),React.DOM.td(null, 
										React.DOM.button( {'data-action':"send-comment", onClick:this.handleSubmit}, "Enviar")
									))
								)
							)
						)
					)
				);
			},
		})

		var CommentListView = React.createClass({displayName: 'CommentListView',
			componentWillMount: function () {
				var update = function () {
					this.forceUpdate(function(){});
				}
				this.props.collection.on('add reset remove', update.bind(this));
			},

			render: function () {
				var commentNodes = this.props.collection.map(function (comment) {
					return (
						CommentView( {model:comment} ) 
					);
				});

				return (
					React.DOM.div( {className:"commentListWrapper"}, 
						commentNodes
					)
				);
			},
		});

		var CommentSectionView = React.createClass({displayName: 'CommentSectionView',

			render: function () {
				return (
					React.DOM.div(null, 
						CommentListView( {collection:this.props.model.commentList} ),
						
							window.user?
							CommentInputView( {model:this.props.model} )
							:null
						
					)
				);
			},
		});

		/************************************************************************************/
		/************************************************************************************/

		var ActivityView = React.createClass({displayName: 'ActivityView',

			render: function () {
				var post = this.props.model.attributes;
				var mediaUserStyle = {
					background: 'url('+post.actor.avatarUrl+')',
				};
				return (
					React.DOM.div( {className:"noteMessage"}, 
						React.DOM.span( {dangerouslySetInnerHTML:{__html: this.props.model.get('content')}} ),
						React.DOM.time( {'data-time-count':1*new Date(post.published)}, 
							window.calcTimeFrom(post.published)
						)
					)
				);
			},

		});

		var PostView = React.createClass({displayName: 'PostView',
			mixins: [EditablePost],

			render: function () {
				var post = this.props.model.attributes;
				var mediaUserStyle = {
					background: 'url('+post.author.avatarUrl+')',
				};
				var rawMarkup = post.data.unescapedBody;

				return (
					React.DOM.div( {className:"opMessage"}, 
						React.DOM.div( {className:"msgHeader"}, 
							React.DOM.div( {className:"mediaUser"}, 
								React.DOM.a( {href:post.author.profileUrl}, 
									React.DOM.div( {className:"mediaUserAvatar", style:mediaUserStyle})
								)
							),
							React.DOM.div( {className:"headline"}, 
								React.DOM.a( {href:post.author.profileUrl, className:"authorUsername"}, 
									post.author.name
								), 
								"disse:"
							),
							
							React.DOM.a( {href:post.path}, 
								React.DOM.time( {'data-time-count':1*new Date(post.published)}, 
									window.calcTimeFrom(post.published)
								)
							),

							(window.user && post.author.id === window.user.id)?
								React.DOM.div( {className:"optionBtns"}, 
									React.DOM.button(	{onClick:this.onClickTrash, title:"Remover Post",
										'data-action':"remove-post", 'data-toggle':"tooltip", 'data-placement':"bottom"}, 
										React.DOM.i( {className:"icon-trash"})
									),
									React.DOM.button(	{onClick:this.onClickEdit, title:"Editar Post",
										'data-action':"edit-post", 'data-toggle':"tooltip", 'data-placement':"bottom"}, 
										React.DOM.i( {className:"icon-edit"})
									)
								)
								:undefined
						),
						React.DOM.div( {className:"msgBody"}, 
							React.DOM.div( {className:"arrow"}),
							React.DOM.span( {dangerouslySetInnerHTML:{__html: rawMarkup}} )
						)
					)
				);
			},
		});

		var PostWrapperView = React.createClass({displayName: 'PostWrapperView',
			render: function () {
				var postType = this.props.model.get('__t');
				// console.log('type', postType, this.props.model.attributes)
				return (
					React.DOM.div( {className:"postWrapper"}, 
						
							(postType==='Post')?
							PostView( {model:this.props.model} )
							:ActivityView( {model:this.props.model} ),
						
						
							(this.props.model.get('type')==='PlainPost'||this.props.model.get('type')==='Answer')?
							CommentSectionView( {model:this.props.model} )
							:null
						
					)
				);
			},
		});

		var PostForm = React.createClass({displayName: 'PostForm',
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
					React.DOM.form( {className:"postInputForm", onSubmit:this.handleSubmit}, 
						React.DOM.h2(null, "Enviar uma msg para o seus seguidores"),
						React.DOM.textarea( {placeholder:"Escreva uma mensagem aqui", ref:"postBody"}),
						React.DOM.button( {'data-action':"send-post", type:"submit"}, "Enviar Post")
					)
				);
			}
		});

		var TimelineView = React.createClass({displayName: 'TimelineView',
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
						PostWrapperView( {model:post} )
					);
				});
				return (
					React.DOM.div( {className:"postListWrapper"}, 
						PostForm( {postUrl:this.props.collection.url}),
						postNodes
					)
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
