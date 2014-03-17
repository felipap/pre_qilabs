/** @jsx React.DOM */

/*
** timeline.js
** Copyright QILabs.org
** BSD License
** by @f03lipe
*/

window.calcTimeFrom = function (arg, long) {
	var now = new Date(),
		then = new Date(arg),
		diff = now-then;

	if (long) {
		if (diff < 1000*60) {
			return 'agora'; 'há '+Math.floor(diff/1000)+' segundos';
		} else if (diff < 1000*60*60) {
			return 'há '+Math.floor(diff/1000/60)+' minutos';
		} else if (diff < 1000*60*60*30) { // até 30 horas
			return 'há '+Math.floor(diff/1000/60/60)+' horas';
		} else {
			return 'há '+Math.floor(diff/1000/60/60/24)+' dias';
		}
	} else {
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
};

define(['jquery', 'backbone', 'underscore', 'react', 'showdown'], function ($, Backbone, _, React, Showdown) {

	setTimeout(function updateCounters () {
		$('[data-time-count]').each(function () {
			this.innerHTML = calcTimeFrom(parseInt(this.dataset.timeCount), this.dataset.timeLong);
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
				this.answerList = new AnswerList(this.get('answers'));
				// if (this.get('hasComments')) {
				// 	this.commentList.fetch({reset:true});
				// }
			},
		});

		var AnswerItem = GenericPostItem.extend({
			initialize: function () {
			}
		});
		
		var AnswerList = Backbone.Collection.extend({
			model: AnswerItem,	
			comparator: function (i) {
				// do votes here! :)
				return -1*new Date(i.get('published'));
			}
		});

		var PostList = Backbone.Collection.extend({
			model: PostItem,

			constructor: function (models, options) {
				Backbone.Collection.apply(this, arguments);
				this.url = options.url || app.postsRoot || '/api/me/timeline/posts';
				this.EOF = false;
			},
			comparator: function (i) {
				return -1*new Date(i.get('published'));
			},
			parse: function (response, options) {
				if (response.minDate < 1) {
					this.EOF = true;
					this.trigger('statusChange');
				}
				this.minDate = 1*new Date(response.minDate);
				var data = Backbone.Collection.prototype.parse.call(this, response.data, options);
				// Filter for non-null results.
				return _.filter(data, function (i) { return !!i; });
			},
			tryFetchMore: function () {
				if (this.minDate < 1) {
					return;
				}
				this.fetch({data: {maxDate:this.minDate-1}, remove:false});
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
			}
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
					React.DOM.div( {className:"commentWrapper"}, 
						React.DOM.div( {className:"msgBody"}, 
							React.DOM.div( {className:"arrow"}),
							comment.data.unescapedBody
						),
						React.DOM.div( {className:"infoBar"}, 
							(window.user && window.user.id === comment.author.id)?
								React.DOM.div( {className:"optionBtns"}, 
									React.DOM.button( {'data-action':"remove-post", onClick:this.onClickTrash}, 
										React.DOM.i( {className:"icon-trash"})
									)
								)
							:undefined,
							React.DOM.a( {className:"userLink author", href:comment.author.profileUrl}, 
								React.DOM.div( {className:"mediaUser"}, 
									React.DOM.div( {className:"mediaUserAvatar", style:mediaUserAvatarStyle, title:comment.author.username}
									)
								),
								React.DOM.span( {className:"name"}, 
									comment.author.name
								)
							),", ",

							React.DOM.time( {'data-time-count':1*new Date(comment.published), 'data-time-long':"true"}, 
								window.calcTimeFrom(comment.published)
							)
						
						)
					)
				);
			},
		});

		var CommentInputForm = React.createClass({displayName: 'CommentInputForm',

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
									React.DOM.tr(null, React.DOM.td( {className:"commentInputTd"}, 
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
					React.DOM.div( {className:"commentList"}, 
						commentNodes
					)
				);
			},
		});

		var CommentSectionView = React.createClass({displayName: 'CommentSectionView',

			render: function () {
				return (
					React.DOM.div( {className:"commentSection"}, 
						CommentListView( {collection:this.props.model.commentList} ),
						window.user?
						CommentInputForm( {model:this.props.model} )
						:null
					)
				);
			},
		});

		var AnswerView = React.createClass({displayName: 'AnswerView',
			mixins: [EditablePost],
			render: function () {
				var model = this.props.model.attributes;
				var self = this;

				var mediaUserAvatarStyle = {
					background: 'url('+model.author.avatarUrl+')',
				};

				return (
					React.DOM.div( {className:"answerView"}, 
						React.DOM.div( {className:"leftCol"}, 
							React.DOM.div( {className:"mediaUser"}, 
								React.DOM.a( {href:model.author.profileUrl}, 
									React.DOM.div( {className:"mediaUserAvatar", style:mediaUserAvatarStyle, title:model.author.username}
									)
								)
							),
							React.DOM.div( {className:"optionBtns"}, 
								React.DOM.button( {'data-action':"remove-post", onClick:this.onClickTrash}, 
									React.DOM.i( {className:"icon-trash"})
								)
							)
						),
						React.DOM.div( {className:(window.user && model.author.id===window.user.id)?'msgBody editable':'msgBody'}, 
							model.data.unescapedBody,
							(window.user && window.user.id === model.author.id)?
								React.DOM.div( {className:"arrow"})
							:undefined
						),
						React.DOM.a( {href:model.path, 'data-time-count':1*new Date(model.published)}, 
							window.calcTimeFrom(model.published)
						),
						React.DOM.hr(null ),
						CommentSectionView( {model:this.props.model} )
					)
				);
			},
		});

		var AnswerListView = React.createClass({displayName: 'AnswerListView',
			componentWillMount: function () {
				var update = function () {
					this.forceUpdate(function(){});
				}
				this.props.collection.on('add reset remove', update.bind(this));
			},

			render: function () {
				var answerNodes = this.props.collection.map(function (answer) {
					return (
						AnswerView( {model:answer} )
					);
				});

				return (
					React.DOM.div( {className:"answerList"}, 
						answerNodes
					)
				);
			},
		});

		var AnswerSectionView = React.createClass({displayName: 'AnswerSectionView',

			render: function () {
				return (
					React.DOM.div( {className:"answerSection"}, 
						AnswerListView( {collection:this.props.model.answerList} ),
						window.user?
						AnswerInputForm( {model:this.props.model} )
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
					React.DOM.div( {className:"activityView"}, 
						React.DOM.span( {dangerouslySetInnerHTML:{__html: this.props.model.get('content')}} ),
						React.DOM.time( {'data-time-count':1*new Date(post.published)}, 
							window.calcTimeFrom(post.published)
						)
					)
				);
			},

		});

		var AnswerInputForm = React.createClass({displayName: 'AnswerInputForm',

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
					url: this.props.model.get('apiPath')+'/answers',
					data: { content: { body: bodyEl.val() } }
				}).done(function(response) {
					bodyEl.val('');
					console.log('response', response);
					self.props.model.answerList.add(new AnswerItem(response.data));
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
										React.DOM.textarea( {required:"required", className:"commentInput", ref:"input", type:"text", placeholder:"Responda essa publicação."}
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

		var QAPostView = React.createClass({displayName: 'QAPostView',
			mixins: [EditablePost],

			render: function () {
				var post = this.props.model.attributes;
				var mediaUserStyle = {
					background: 'url('+post.author.avatarUrl+')',
				};
				var rawMarkup = post.data.unescapedBody;

				return (
					React.DOM.div( {className:"postPart", 'data-post-type':"QAPost"}, 
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
									"fez uma pergunta:"
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
							React.DOM.div( {className:"msgTitle"}, 
								React.DOM.div( {className:"arrow"}),
								React.DOM.span(null, post.data.title)
							),
							React.DOM.div( {className:"msgBody"}, 
								React.DOM.span( {dangerouslySetInnerHTML:{__html: rawMarkup}} )
							)
						),
						app.postItem?
						React.DOM.div(null, 
							CommentSectionView( {model:this.props.model} ),
							AnswerSectionView( {model:this.props.model} )
						)
						:React.DOM.div( {className:"showMorePrompt"}, 
							"Visualizar ", this.props.model.answerList.models.length, " respostas"
						)
					)
				);
			},
		});


		var PostView = React.createClass({displayName: 'PostView',
			mixins: [EditablePost],

			render: function () {
				var postType = this.props.model.get('type');
				// test for type, QA for example
				return (
					React.DOM.div( {className:"postView"}, 
						QAPostView( {model:this.props.model} )
					)
				);
			},
		});

		var StreamItemView = React.createClass({displayName: 'StreamItemView',
			render: function () {
				var itemType = this.props.model.get('__t');
				return (
					React.DOM.div( {className:"streamItem"}, 
						(itemType==='Post')?
						PostView( {model:this.props.model} )
						:ActivityView( {model:this.props.model} )
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
				function update (evt) {
					// console.log('updatefired')
					this.forceUpdate(function(){});
				}
				this.props.collection.on('add remove reset statusChange', update.bind(this));
			},
			// changeOptions: "change:name",
			render: function () {
				var postNodes = this.props.collection.map(function (post) {
					return (
						StreamItemView( {model:post} )
					);
				});
				return (
					React.DOM.div( {className:"postListWrapper"}, 
						this.props.canPostForm?
						PostForm( {postUrl:this.props.collection.url})
						:null,
						postNodes,
						this.props.collection.EOF?
						React.DOM.div( {className:"streamSign"}, 
							React.DOM.i( {className:"icon-exclamation"}), " Nenhuma outra atividade encontrada."
						)
						:React.DOM.a( {className:"streamSign", href:"#", onClick:this.props.collection.tryFetchMore}, 
							React.DOM.i( {className:"icon-spin icon-cog"}),"Procurando mais atividades."
						)
					)
				);
			},
		});

		return {
			item: PostItem,
			list: PostList,
			timelineView: TimelineView,
			postView: StreamItemView,
		};
	})();


	// Central functionality of the app.
	var WorkspaceRouter = Backbone.Router.extend({
		
		initialize: function () {
			console.log('initialized')
			window.app = this;
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
					this.renderList('/api/labs/'+labId+'/posts',{canPostForm:true});
				},
			'p/:profileId':
				function () {
					this.renderList(window.conf.postsRoot,{canPostForm:false});
				},
			'':
				function () {
					this.renderList('/api/me/timeline/posts',{canPostForm:true});
				},
		},

		renderList: function (url, opts) {
			this.postList = new Post.list([], {url:url});
			React.renderComponent(Post.timelineView(
				_.extend(opts,{collection:this.postList})),
				document.getElementById('postsPlacement'));

			this.postList.fetch({reset:true});

			var fetchMore = _.throttle(this.postList.tryFetchMore.bind(app.postList),1000);
			var fetchMore = this.postList.tryFetchMore.bind(app.postList);

			$('#globalContainer').scroll(function() {
				if ($('#content').outerHeight()-($('#globalContainer').scrollTop()+$('#globalContainer').outerHeight())<5) {
					fetchMore();
				}
			});
		},

	});

	return {
		initialize: function () {
			new WorkspaceRouter;
			Backbone.history.start({ pushState:false, hashChange:false });
		}
	};
});
