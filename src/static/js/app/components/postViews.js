/** @jsx React.DOM */

/*
** timeline.js
** Copyright QILabs.org
** BSD License
** by @f03lipe
*/

define(['jquery', 'underscore', 'react'], function ($, _, React) {

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
	});

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

	var PlainPostView = React.createClass({displayName: 'PlainPostView',
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
						React.DOM.div( {className:"msgBody"}, 
							React.DOM.div( {className:"arrow"}),
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

	return {
		'PlainPost': PlainPostView,
		'QA': QAPostView,
	};
});
