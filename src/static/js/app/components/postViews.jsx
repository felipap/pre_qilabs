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
						{comment.data.escapedBody}
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
				self.props.model.commentList.add(new postModels.commentItem(response.data));
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

	var CommentListView = React.createClass({
		mixins: [backboneCollection],

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
					<div className="info">{this.props.model.commentList.models.length} Comentários</div>
					<br />
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
						{model.data.escapedBody}
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
				self.props.model.answerList.add(new postModels.answerItem(response.data));
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
		mixins: [backboneModel],
		render: function () {

			var post = this.props.model.attributes;

			function gotoPost () {
				window.location.href = post.path;
			}

			return (
				<div className="postInfobar">
					<ul className="left">
						<li onClick={this.props.model.handleToggleVote.bind(this.props.model)}>
						{
							this.props.model.liked?
							<i className="icon-heart icon-red"></i>
							:<i className="icon-heart"></i>
						}
						&nbsp;
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
			var rawMarkup = post.data.escapedBody;

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

	var CardView = React.createClass({
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
				<div className="cardView" onClick={gotoPost}>
					
					<div className="cardHeader">
						<span className="cardType">
						{
							post.type === "QA"?
							"PERGUNTA"
							:"PUBLICAÇÃO"
						}
						</span>
						<div className="iconStats">
							<div onClick={this.props.model.handleToggleVote.bind(this.props.model)}>
								{this.props.model.liked?<i className="icon-heart icon-red"></i>:<i className="icon-heart"></i>}
								&nbsp;
								{post.voteSum}
							</div>
							<div>
								<i className="icon-comment-o"></i>&nbsp;
								{this.props.model.commentList.models.length}
							</div>
							{post.type === "QA"?
								<div>
									<i className="icon-bulb"></i>&nbsp;
									{this.props.model.answerList.models.length}
								</div>
								:null}
						</div>
					</div>

					<div className="cardBody">
						<span dangerouslySetInnerHTML={{__html: post.data.title || post.data.escapedBody}} />
					</div>

					<div className="cardFoot">
						<div className="authorship">
							<div className="avatarWrapper">
								<a href={post.author.profileUrl}>
									<div className="avatar" style={mediaUserStyle}></div>
								</a>
							</div>
							<a href={post.author.profileUrl} className="username">
								{post.author.name}
							</a>
						</div>

						<time data-time-count={1*new Date(post.published)} data-time-long="true">
							{window.calcTimeFrom(post.published,true)}
						</time>
					</div>
				</div>
			);
		}
	});

	var PlainPostView = React.createClass({
		mixins: [EditablePost],

		render: function () {
			var post = this.props.model.attributes;
			var mediaUserStyle = {
				background: 'url('+post.author.avatarUrl+')',
			};
			var rawMarkup = post.data.escapedBody;

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
						<div className="postBody">
							<p>
								It&apos;s been over five years since the day I first learned about the existence of MIT.
							</p>
							You know MIT, right?

							<img src="http://sloansocialimpact.mit.edu/wp-content/uploads/2014/02/MIT_Dome_night1_Edit.jpg" />

							<small>The pornographically-cool MIT Dome.</small>

							<blockquote>
								Massachusetts Institute of Technology (MIT) is a private research university in Cambridge, Massachusetts known traditionally for research and education in the physical sciences and engineering
								<footer><a href="http://en.wikipedia.org/wiki/Massachusetts_Institute_of_Technology">Wikipedia</a></footer>
							</blockquote>

							<p>
								But MIT isn't just any "private research university", though: it's arguably the best technology
								university in the world.
							</p>
							<hr />
							<p>
								Someday in 2009, while surfing around the internet, in an uncalculated move, I clicked a link on Info Magazine homepage,
								taking me to <a href="http://info.abril.com.br/noticias/internet/aulas-do-mit-e-de-harvard-gratis-no-youtube-09042009-18.shl">this post</a>.
								"Free MIT and Harvard classes on Youtube", it said.
							</p>
							<h2><q>MIT??</q></h2>
							<p>Harvard I had heard of, sure. But <q>what is MIT?</q> The choice to google it (rather than just leaving it be), was one that changed my life.
							</p>
							<p>
								No... <em>seriously</em>.<br />
								I kept reading about it for hours, days even, I presume, because next thing you know MIT was my obsession.
								I began collecting MIT wallpapers – admittedly I still do that –,
								and videos related to the institution, including one of <a href="https://www.youtube.com/watch?v=jJ5EwCA2H4Y">Burton Conner students singing Switch</a>.
							</p>
							<h2>MIT OpenCourseWare</h2>
							<p>
								Another important MIT-related collection was one of CD-ROMs filled with OCW classes. The MIT OpenCourseWare is an MIT project lauched in 2002 that aims at providing MIT courses videolectured for free (as in beer). The first video I watched was a 2007 version of Gilbert Strang's Linear Algebra lectures. I didn't get past the 6th video. I also watched Single Variable Calculus course, and, of course, Walter Lewin's Classical Mechanics. I must have burned half a dozen CDs with these video-lectures. I don't know why.
							</p>
							<iframe width="720" height="495" src="//www.youtube.com/embed/ZK3O402wf1c" frameborder="0" allowfullscreen></iframe>
							<small>Seriously, what a sweet guy.</small>

							
							<h2>MIT Media Lab</h2>
							<img src="http://upload.wikimedia.org/wikipedia/commons/b/ba/The_MIT_Media_Lab_-_Flickr_-_Knight_Foundation.jpg" />
							
							<h1></h1>
							<code>
								oi
							</code>

							<pre>var postType = this.props.model.get('type')</pre>

						</div>
					);
					// " ' 
					return (
						<div>
							<div className="leftOutBox">
								<div className="likeBox" onClick={this.props.model.handleToggleVote.bind(this.props.model)}>
									{post.voteSum}
									&nbsp;
									{
										this.props.model.liked?
										<i className="icon-heart icon-red"></i>
										:<i className="icon-heart-o"></i>
									}
								</div>
								<div className="eyeBox">
									81&nbsp;
									<i className="icon-eye"></i>
								</div>
								<div onClick="">
									5&nbsp;
									<i className="icon-share"></i>
								</div>
							</div>
							<div className="postContent">

								<time data-time-count={1*new Date(post.published)} data-time-long="true">
									{window.calcTimeFrom(post.published,true)}
								</time>
								<div className="postTitle">
									{post.data.title}
								</div>
								{postBody}
							</div>
							<div className="postInfobar">
								<ul className="left">
								</ul>
							</div>
							<div className="postFoot">
								<CommentSectionView model={this.props.model} />
							</div>
						</div>
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
						<div>
							<div className="postHead" data-post-type="QAPost">
								<div className="msgTitle">
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
			}),
		}
	};
});

