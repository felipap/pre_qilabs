/** @jsx React.DOM */

/*
** postViews.js
** Copyright QILabs.org
** BSD License
** by @f03lipe
*/

define(['jquery', 'backbone', 'underscore', 'react'], function ($, Backbone, _, React) {

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

	var CommentView = React.createClass({
		mixins: [EditablePost],
		render: function () {
			var comment = this.props.model.attributes;
			var self = this;

			var mediaUserAvatarStyle = {
				background: 'url('+comment.author.avatarUrl+')',
			};

			return (
				<div className="commentWrapper">
					<div className='msgBody'>
						<div className="arrow"></div>
						{comment.data.unescapedBody}
					</div>
					<div className="infoBar">
						{(window.user && window.user.id === comment.author.id)?
							<div className="optionBtns">
								<button data-action="remove-post" onClick={this.onClickTrash}>
									<i className="icon-trash"></i>
								</button>
							</div>
						:undefined}
						<a className="userLink author" href={comment.author.profileUrl}>
							<div className="mediaUser">
								<div className="mediaUserAvatar" style={mediaUserAvatarStyle} title={comment.author.username}>
								</div>
							</div>
							<span className="name">
								{comment.author.name}
							</span>
						</a>,&nbsp;

						<time data-time-count={1*new Date(comment.published)} data-time-long="true">
							{window.calcTimeFrom(comment.published)}
						</time>
					
					</div>
				</div>
			);
		},
	});

	var CommentInputForm = React.createClass({

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
				return (<div></div>);
			var mediaUserAvatarStyle = {
				background: 'url('+window.user.avatarUrl+')',
			};

			return (
				<div className="commentInputSection">
					<form className="formPostComment" onSubmit={this.handleSubmit}>
						<table>
							<tbody>
								<tr><td className="commentInputTd">
									<textarea required="required" className="commentInput" ref="input" type="text" placeholder="Faça um comentário sobre essa publicação.">
									</textarea>
								</td><td>
									<button data-action="send-comment" onClick={this.handleSubmit}>Enviar</button>
								</td></tr>
							</tbody>
						</table>
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
				<div className="commentList">
					{commentNodes}
				</div>
			);
		},
	});

	var CommentSectionView = React.createClass({

		render: function () {
			return (
				<div className="commentSection">
					<CommentListView collection={this.props.model.commentList} />
					{window.user?
					<CommentInputForm model={this.props.model} />
					:null}
				</div>
			);
		},
	});

	var AnswerView = React.createClass({
		mixins: [EditablePost],
		render: function () {
			var model = this.props.model.attributes;
			var self = this;

			var mediaUserAvatarStyle = {
				background: 'url('+model.author.avatarUrl+')',
			};

			return (
				<div className="answerView">
					<div className="leftCol">
						<div className="mediaUser">
							<a href={model.author.profileUrl}>
								<div className="mediaUserAvatar" style={mediaUserAvatarStyle} title={model.author.username}>
								</div>
							</a>
						</div>
						<div className="optionBtns">
							<button data-action="remove-post" onClick={this.onClickTrash}>
								<i className="icon-trash"></i>
							</button>
						</div>
					</div>
					<div className={(window.user && model.author.id===window.user.id)?'msgBody editable':'msgBody'}>
						{model.data.unescapedBody}
						{(window.user && window.user.id === model.author.id)?
							<div className="arrow"></div>
						:undefined}
					</div>
					<a href={model.path} data-time-count={1*new Date(model.published)}>
						{window.calcTimeFrom(model.published)}
					</a>
					<hr />
					<CommentSectionView model={this.props.model} />
				</div>
			);
		},
	});

	var AnswerListView = React.createClass({
		componentWillMount: function () {
			var update = function () {
				this.forceUpdate(function(){});
			}
			this.props.collection.on('add reset remove', update.bind(this));
		},

		render: function () {
			var answerNodes = this.props.collection.map(function (answer) {
				return (
					<AnswerView model={answer} />
				);
			});

			return (
				<div className="answerList">
					{answerNodes}
				</div>
			);
		},
	});

	var AnswerSectionView = React.createClass({

		render: function () {
			return (
				<div className="answerSection">
					<AnswerListView collection={this.props.model.answerList} />
					{window.user?
					<AnswerInputForm model={this.props.model} />
					:null}
				</div>
			);
		},
	});

	var AnswerInputForm = React.createClass({

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
				return (<div></div>);
			var mediaUserAvatarStyle = {
				background: 'url('+window.user.avatarUrl+')',
			};

			return (
				<div className="commentInputSection">
					<form className="formPostComment" onSubmit={this.handleSubmit}>
						<table>
							<tbody>
								<tr><td>
									<div className="mediaUser">
										<a href={window.user.profileUrl}>
											<div className="mediaUserAvatar" style={mediaUserAvatarStyle}>
											</div>
										</a>
									</div>
								</td><td className="commentInputTd">
									<textarea required="required" className="commentInput" ref="input" type="text" placeholder="Responda essa publicação.">
									</textarea>
								</td><td>
									<button data-action="send-comment" onClick={this.handleSubmit}>Enviar</button>
								</td></tr>
							</tbody>
						</table>
					</form>
				</div>
			);
		},
	});

	var PostInfoBar = React.createClass({
		render: function () {

			var post = this.props.model.attributes;

			function gotoPost () {
				window.location.href = post.path;
			}

			function upvote () {
				$.ajax({
					type: 'post',
					dataType: 'json',
					url: post.apiPath+'/upvote',
				}).done(function (response) {
					console.log('response', response);
				});
			}

			return (
				<div className="postInfobar">
					<ul className="left">
						<li onClick={upvote}>
							<i className="icon-heart"></i>&nbsp;
							{post.voteSum}
						</li>
						<li onClick={function(){window.location.href = post.path+'#comments';}}>
							<i className="icon-comment-o"></i>&nbsp;
							{
								this.props.model.commentList.models.length===1?
								this.props.model.commentList.models.length+" comentário"
								:this.props.model.commentList.models.length+" comentários"
							}
						</li>
						{
							post.type === "QA"?
							<li onClick={function(){window.location.href = post.path+'#answers';}}>
								<i className="icon-bulb"></i>&nbsp;
								{
									this.props.model.answerList.models.length===1?
									this.props.model.answerList.models.length+" resposta"
									:this.props.model.answerList.models.length+" respostas"
								}
							</li>
							:null
						}
					</ul>
					<ul className="right">
						<li onClick={function(){window.location.href = post.path;}}>
							<time data-time-count={1*new Date(post.published)} data-time-long="true">
								{window.calcTimeFrom(post.published,true)}
							</time>
						</li>
						<li>
							<span data-toggle="tooltip" title="Denunciar publicação" data-placement="bottom">
								<i className="icon-flag"></i>
							</span>
						</li>
					</ul>
				</div>
			);
		}
	})

	var QAPostView = React.createClass({
		mixins: [EditablePost],

		render: function () {
			var post = this.props.model.attributes;
			var mediaUserStyle = {
				background: 'url('+post.author.avatarUrl+')',
			};
			var rawMarkup = post.data.unescapedBody;

			return (
				<div>
					<div className="postHead" data-post-type="QAPost">
						<div className="msgHeader">
							<div className="mediaUser">
								<a href={post.author.profileUrl}>
									<div className="mediaUserAvatar" style={mediaUserStyle}></div>
								</a>
							</div>
							<div className="headline">
								<a href={post.author.profileUrl} className="authorUsername">
									{post.author.name}
								</a> fez uma pergunta:
							</div>

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

						<div className="msgTitle">
							<div className="arrow"></div>
							<span>{post.data.title}</span>
						</div>

						<div className="msgBody">
							<span dangerouslySetInnerHTML={{__html: rawMarkup}} />
						</div>

						<PostInfoBar model={this.props.model} />
					</div>
					<div className="postFoot">
						{
							app.postItem?
							<div>
								<AnswerSectionView model={this.props.model} />
								<CommentSectionView model={this.props.model} />
							</div>
							:null
						}
					</div>
				</div>
			);
		},
	});

	var PlainPostView = React.createClass({
		mixins: [EditablePost],

		render: function () {
			var post = this.props.model.attributes;
			var mediaUserStyle = {
				background: 'url('+post.author.avatarUrl+')',
			};
			var rawMarkup = post.data.unescapedBody;

			return (
				<div>
					<div className="postHead" data-post-type="QAPost">
						<div className="msgHeader">
							<div className="mediaUser">
								<a href={post.author.profileUrl}>
									<div className="mediaUserAvatar" style={mediaUserStyle}></div>
								</a>
							</div>
							<div className="headline">
								<a href={post.author.profileUrl} className="authorUsername">
									{post.author.name}
								</a> disse:
							</div>
							
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
						<PostInfoBar model={this.props.model} />
					</div>
					<div className="postFoot">
						{
							app.postItem?
							<div>
								<AnswerSectionView model={this.props.model} />
							</div>
							:null
						}
					</div>
				</div>
			);
		},
	});

	return {
		'PlainPost': PlainPostView,
		'QA': QAPostView,
	};
});
