/** @jsx React.DOM */

/*
** postViews.js
** Copyright QILabs.org
** BSD License
** by @f03lipe
*/

define(['jquery', 'backbone', 'underscore', 'components.postModels', 'react'], function ($, Backbone, _, postModels, React) {

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
						comment.data.escapedBody
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
				self.props.model.commentList.add(new postModels.commentItem(response.data));
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
	});

	var backboneCollection = {
		componentWillMount: function () {
			var update = function () {
				this.forceUpdate(function(){});
			}
			this.props.collection.on('add reset remove', update.bind(this));
		},

	};

	var backboneModel = {
		componentWillMount: function () {
			var update = function () {
				this.forceUpdate(function(){});
			}
			this.props.model.on('add reset remove change', update.bind(this));
		},
	};

	var CommentListView = React.createClass({displayName: 'CommentListView',
		mixins: [backboneCollection],

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
					React.DOM.div( {className:"info"}, this.props.model.commentList.models.length, " Comentários"),
					React.DOM.br(null ),
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
						model.data.escapedBody,
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
				self.props.model.answerList.add(new postModels.answerItem(response.data));
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


	var PostInfoBar = React.createClass({displayName: 'PostInfoBar',
		mixins: [backboneModel],
		render: function () {

			var post = this.props.model.attributes;

			function gotoPost () {
				window.location.href = post.path;
			}

			return (
				React.DOM.div( {className:"postInfobar"}, 
					React.DOM.ul( {className:"left"}, 
						React.DOM.li( {onClick:this.props.model.handleToggleVote.bind(this.props.model)}, 
						
							this.props.model.liked?
							React.DOM.i( {className:"icon-heart icon-red"})
							:React.DOM.i( {className:"icon-heart"}),
						
						" ",
							post.voteSum
						),
						React.DOM.li( {onClick:function(){window.location.href = post.path+'#comments';}}, 
							React.DOM.i( {className:"icon-comment-o"})," ",
							
								this.props.model.commentList.models.length===1?
								this.props.model.commentList.models.length+" comentário"
								:this.props.model.commentList.models.length+" comentários"
							
						),
						
							post.type === "QA"?
							React.DOM.li( {onClick:function(){window.location.href = post.path+'#answers';}}, 
								React.DOM.i( {className:"icon-bulb"})," ",
								
									this.props.model.answerList.models.length===1?
									this.props.model.answerList.models.length+" resposta"
									:this.props.model.answerList.models.length+" respostas"
								
							)
							:null
						
					),
					React.DOM.ul( {className:"right"}, 
						React.DOM.li( {onClick:function(){window.location.href = post.path;}}, 
							React.DOM.time( {'data-time-count':1*new Date(post.published), 'data-time-long':"true"}, 
								window.calcTimeFrom(post.published,true)
							)
						),
						React.DOM.li(null, 
							React.DOM.span( {'data-toggle':"tooltip", title:"Denunciar publicação", 'data-placement':"bottom"}, 
								React.DOM.i( {className:"icon-flag"})
							)
						)
					)
				)
			);
		}
	})

	var QAPostView = React.createClass({displayName: 'QAPostView',
		mixins: [EditablePost],

		render: function () {
			var post = this.props.model.attributes;
			var mediaUserStyle = {
				background: 'url('+post.author.avatarUrl+')',
			};
			var rawMarkup = post.data.escapedBody;

			return (
				React.DOM.div(null, 
					React.DOM.div( {className:"postHead", 'data-post-type':"QAPost"}, 
						React.DOM.div( {className:"msgHeader"}, 
							React.DOM.div( {className:"mediaUser"}, 
								React.DOM.a( {href:post.author.profileUrl}, 
									React.DOM.div( {className:"mediaUserAvatar", style:mediaUserStyle})
								)
							),
							React.DOM.div( {className:"headline"}, 
								React.DOM.a( {href:post.author.profileUrl, className:"authorUsername"}, 
									post.author.name
								), " fez uma pergunta:"
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
						),

						PostInfoBar( {model:this.props.model} )
					),
					React.DOM.div( {className:"postFoot"}, 
						
							app.postItem?
							React.DOM.div(null, 
								AnswerSectionView( {model:this.props.model} ),
								CommentSectionView( {model:this.props.model} )
							)
							:null
						
					)
				)
			);
		},
	});

	var CardView = React.createClass({displayName: 'CardView',
		mixins: [backboneModel],
		render: function () {

			function gotoPost () {
				app.navigate('#posts/'+post.id, {trigger:true});
				// app.navigate('')
			}
			var post = this.props.model.attributes;
			var mediaUserStyle = {
				background: 'url('+post.author.avatarUrl+')',
			};
			var rawMarkup = post.data.escapedBody;

			return (
				React.DOM.div( {className:"cardView", onClick:gotoPost}, 
					
					React.DOM.div( {className:"cardHeader"}, 
						React.DOM.span( {className:"cardType"}, 
						
							post.type === "QA"?
							"PERGUNTA"
							:"PUBLICAÇÃO"
						
						),
						React.DOM.div( {className:"iconStats"}, 
							React.DOM.div( {onClick:this.props.model.handleToggleVote.bind(this.props.model)}, 
								this.props.model.liked?React.DOM.i( {className:"icon-heart icon-red"}):React.DOM.i( {className:"icon-heart"}),
								" ",
								post.voteSum
							),
							React.DOM.div(null, 
								React.DOM.i( {className:"icon-comment-o"})," ",
								this.props.model.commentList.models.length
							),
							post.type === "QA"?
								React.DOM.div(null, 
									React.DOM.i( {className:"icon-bulb"})," ",
									this.props.model.answerList.models.length
								)
								:null
						)
					),

					React.DOM.div( {className:"cardBody"}, 
						React.DOM.span( {dangerouslySetInnerHTML:{__html: post.data.title || post.data.escapedBody}} )
					),

					React.DOM.div( {className:"cardFoot"}, 
						React.DOM.div( {className:"authorship"}, 
							React.DOM.div( {className:"avatarWrapper"}, 
								React.DOM.a( {href:post.author.profileUrl}, 
									React.DOM.div( {className:"avatar", style:mediaUserStyle})
								)
							),
							React.DOM.a( {href:post.author.profileUrl, className:"username"}, 
								post.author.name
							)
						),

						React.DOM.time( {'data-time-count':1*new Date(post.published), 'data-time-long':"true"}, 
							window.calcTimeFrom(post.published,true)
						)
					)
				)
			);
		}
	});

	var PlainPostView = React.createClass({displayName: 'PlainPostView',
		mixins: [EditablePost],

		render: function () {
			var post = this.props.model.attributes;
			var mediaUserStyle = {
				background: 'url('+post.author.avatarUrl+')',
			};
			var rawMarkup = post.data.escapedBody;

			return (
				React.DOM.div(null, 
					React.DOM.div( {className:"postHead", 'data-post-type':"QAPost"}, 
						React.DOM.div( {className:"msgHeader"}, 
							React.DOM.div( {className:"mediaUser"}, 
								React.DOM.a( {href:post.author.profileUrl}, 
									React.DOM.div( {className:"mediaUserAvatar", style:mediaUserStyle})
								)
							),
							React.DOM.div( {className:"headline"}, 
								React.DOM.a( {href:post.author.profileUrl, className:"authorUsername"}, 
									post.author.name
								), " disse:"
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
						),
						PostInfoBar( {model:this.props.model} )
					),
					React.DOM.div( {className:"postFoot"}, 
						
							app.postItem?
							React.DOM.div(null, 
								AnswerSectionView( {model:this.props.model} )
							)
							:null
						
					)
				)
			);
		},
	});

	return {
		'PlainPost': PlainPostView,
		'CardView': CardView,
		'QA': QAPostView,
		full: {
			'PlainPost': React.createClass({
				mixins: [EditablePost, backboneModel],

				render: function () {
					var post = this.props.model.attributes;
					var mediaUserStyle = {
						background: 'url('+post.author.avatarUrl+')',
					};
					var rawMarkup = post.data.escapedBody;

					// <div>
					// 	<div className="likeBox" onClick={this.props.model.handleToggleVote.bind(this.props.model)}>
					// 		{
					// 			this.props.model.liked?
					// 			<i className="icon-heart icon-red"></i>
					// 			:<i className="icon-heart-o"></i>
					// 		}
					// 		&nbsp;
					// 			{post.voteSum}
					// 	</div>
					// 	<div className="postContent">

					// 		<div className="postTitle">
					// 			{post.data.title}
					// 		</div>
					// 		<span className="hits">81 visualizações</span>
					// 		<time data-time-count={1*new Date(post.published)} data-time-long="true">
					// 			{window.calcTimeFrom(post.published,true)}
					// 		</time>
					// 		<div className="postStats">
					// 			<div className="tag">Application</div>
					// 			<div className="tag">Olimpíadas de Matemática</div>
					// 		</div>
					// 		<div className="postBody">
					// 			<span dangerouslySetInnerHTML={{__html: rawMarkup}} />
					// 		</div>
					// 	</div>
					// 	<div className="postInfobar">
					// 		<ul className="left">
					// 			{
					// 				post.type === "QA"?
					// 				<li>
					// 					<i className="icon-bulb"></i>&nbsp;
					// 					{
					// 						this.props.model.answerList.models.length===1?
					// 						this.props.model.answerList.models.length+" resposta"
					// 						:this.props.model.answerList.models.length+" respostas"
					// 					}
					// 				</li>
					// 				:null
					// 			}
					// 		</ul>
					// 	</div>
					// 	<div className="postFoot">
					// 		<CommentSectionView model={this.props.model} />
					// 	</div>
					// </div>
					// <div className="postBody">
					// </div>

					var postBody = (
						React.DOM.div( {className:"postBody"}, 
							React.DOM.p(null, 
								"It's been over five years since the day I first learned about the existence of MIT."
							),
							"You know MIT, right?",

							React.DOM.img( {src:"http://sloansocialimpact.mit.edu/wp-content/uploads/2014/02/MIT_Dome_night1_Edit.jpg"} ),

							React.DOM.small(null, "The pornographically-cool MIT Dome."),

							React.DOM.blockquote(null, 
								"Massachusetts Institute of Technology (MIT) is a private research university in Cambridge, Massachusetts known traditionally for research and education in the physical sciences and engineering",
								React.DOM.footer(null, React.DOM.a( {href:"http://en.wikipedia.org/wiki/Massachusetts_Institute_of_Technology"}, "Wikipedia"))
							),

							React.DOM.p(null, 
								"But MIT isn't just any \"private research university\", though: it's arguably the best technology"+' '+
								"university in the world."
							),
							React.DOM.hr(null ),
							React.DOM.p(null, 
								"Someday in 2009, while surfing around the internet, in an uncalculated move, I clicked a link on Info Magazine homepage,"+' '+
								"taking me to ", React.DOM.a( {href:"http://info.abril.com.br/noticias/internet/aulas-do-mit-e-de-harvard-gratis-no-youtube-09042009-18.shl"}, "this post"),"."+' '+
								"\"Free MIT and Harvard classes on Youtube\", it said."
							),
							React.DOM.h2(null, React.DOM.q(null, "MIT??")),
							React.DOM.p(null, "Harvard I had heard of, sure. But ", React.DOM.q(null, "what is MIT?"), " The choice to google it (rather than just leaving it be), was one that changed my life."
							),
							React.DOM.p(null, 
								"No... ", React.DOM.em(null, "seriously"),".",React.DOM.br(null ),
								"I kept reading about it for hours, days even, I presume, because next thing you know MIT was my obsession."+' '+
								"I began collecting MIT wallpapers – admittedly I still do that –,"+' '+
								"and videos related to the institution, including one of ", React.DOM.a( {href:"https://www.youtube.com/watch?v=jJ5EwCA2H4Y"}, "Burton Conner students singing Switch"),"."
							),
							React.DOM.h2(null, "MIT OpenCourseWare"),
							React.DOM.p(null, 
								"Another important MIT-related collection was one of CD-ROMs filled with OCW classes. The MIT OpenCourseWare is an MIT project lauched in 2002 that aims at providing MIT courses videolectured for free (as in beer). The first video I watched was a 2007 version of Gilbert Strang's Linear Algebra lectures. I didn't get past the 6th video. I also watched Single Variable Calculus course, and, of course, Walter Lewin's Classical Mechanics. I must have burned half a dozen CDs with these video-lectures. I don't know why."
							),
							React.DOM.iframe( {width:"720", height:"495", src:"//www.youtube.com/embed/ZK3O402wf1c", frameborder:"0", allowfullscreen:true}),
							React.DOM.small(null, "Seriously, what a sweet guy."),

							
							React.DOM.h2(null, "MIT Media Lab"),
							React.DOM.img( {src:"http://upload.wikimedia.org/wikipedia/commons/b/ba/The_MIT_Media_Lab_-_Flickr_-_Knight_Foundation.jpg"} ),
							
							React.DOM.h1(null),
							React.DOM.code(null, 
								"oi"
							),

							React.DOM.pre(null, "var postType = this.props.model.get('type')")

						)
					);
					// " ' 
					return (
						React.DOM.div(null, 
							React.DOM.div( {className:"leftOutBox"}, 
								React.DOM.div( {className:"likeBox", onClick:this.props.model.handleToggleVote.bind(this.props.model)}, 
									post.voteSum,
									" ",
									
										this.props.model.liked?
										React.DOM.i( {className:"icon-heart icon-red"})
										:React.DOM.i( {className:"icon-heart-o"})
									
								),
								React.DOM.div( {className:"eyeBox"}, 
									"81 ",
									React.DOM.i( {className:"icon-eye"})
								),
								React.DOM.div( {onClick:""}, 
									"5 ",
									React.DOM.i( {className:"icon-share"})
								)
							),
							React.DOM.div( {className:"postContent"}, 

								React.DOM.time( {'data-time-count':1*new Date(post.published), 'data-time-long':"true"}, 
									window.calcTimeFrom(post.published,true)
								),
								React.DOM.div( {className:"postTitle"}, 
									"From OCW fanatic to MIT undergrad: my 5 year journey"
								),
								postBody
							),
							React.DOM.div( {className:"postInfobar"}, 
								React.DOM.ul( {className:"left"}
								)
							),
							React.DOM.div( {className:"postFoot"}, 
								CommentSectionView( {model:this.props.model} )
							)
						)
					);
				},
			}),
			'QA': React.createClass({
				mixins: [EditablePost, backboneModel],

				render: function () {
					var post = this.props.model.attributes;
					var mediaUserStyle = {
						background: 'url('+post.author.avatarUrl+')',
					};
					var rawMarkup = post.data.escapedBody;

					return (
						React.DOM.div(null, 
							React.DOM.div( {className:"postHead", 'data-post-type':"QAPost"}, 
								React.DOM.div( {className:"msgTitle"}, 
									React.DOM.span(null, post.data.title)
								),

								React.DOM.div( {className:"msgBody"}, 
									React.DOM.span( {dangerouslySetInnerHTML:{__html: rawMarkup}} )
								),

								PostInfoBar( {model:this.props.model} )
							),
							React.DOM.div( {className:"postFoot"}, 
								
									app.postItem?
									React.DOM.div(null, 
										AnswerSectionView( {model:this.props.model} ),
										CommentSectionView( {model:this.props.model} )
									)
									:null
								
							)
						)
					);
				},
			}),
		}
	};
});

