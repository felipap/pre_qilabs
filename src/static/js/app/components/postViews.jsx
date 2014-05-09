/** @jsx React.DOM */

/*
** postViews.js
** Copyright QILabs.org
** BSD License
** by @f03lipe
*/

define(['jquery', 'backbone', 'underscore', 'components.postModels', 'react', 'medium-editor',], function ($, Backbone, _, postModels, React) {

	var mediumEditorAnswerOpts = {
		firstHeader: 'h1',
		secondHeader: 'h2',
		buttons: ['bold', 'italic', 'quote', 'anchor', 'underline', 'orderedlist'],
		buttonLabels: {
			quote: '<i class="icon-quote"></i>',
			orderedlist: '<i class="icon-list"></i>'
		}
	};

	/* React.js views */

	var EditablePost = {
		onClickTrash: function () {
			if (confirm('Tem certeza que deseja excluir essa postagem?')) {
				this.props.model.destroy();
			}
		},
	};

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

	//

	var Comment = {
		View: React.createClass({
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
							<a className="userLink author" href={comment.author.profileUrl}>
								<div className="avatarWrapper">
									<div className="avatar" style={mediaUserAvatarStyle} title={comment.author.username}>
									</div>
								</div>
								<span className="name">
									{comment.author.name}
								</span>
							</a>&nbsp;·&nbsp;

							<time data-time-count={1*new Date(comment.published)} data-time-long="true">
								{window.calcTimeFrom(comment.published)}
							</time>

							{(window.user && window.user.id === comment.author.id)?
								<div className="optionBtns">
									<button data-action="remove-post" onClick={this.onClickTrash}>
										<i className="icon-trash"></i>
									</button>
								</div>
							:undefined}
						</div>
					</div>
				);
			},
		}),
		InputForm: React.createClass({

			getInitialState: function () {
				return {showInput:false};
			},

			componentDidUpdate: function () {
				if (this.refs && this.refs.input) {
					$(this.refs.input.getDOMNode()).autosize();
					if (this.props.small) {
						$(this.refs.input.getDOMNode()).keypress(function (e) {
							if (e.keyCode == 13) {
								e.preventDefault();
							}
						});
					}
				}
			},

			showInput: function () {
				this.setState({showInput:true});
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
					self.setState({showInput:false});
					bodyEl.val('');
					self.props.model.children.Comment.add(new postModels.commentItem(response.data));
				});

			},

			render: function () {
				if (!window.user)
					return (<div></div>);
				var mediaUserAvatarStyle = {
					background: 'url('+window.user.avatarUrl+')',
				};

				return (
					<div>
						{
							this.state.showInput?(
								<div className={"commentInputSection "+(this.props.small?"small":'')}>
									<form className="formPostComment" onSubmit={this.handleSubmit}>
										{
											this.props.small?
											null
											:<h4>Comente essa publicação</h4>
										}
										<textarea required="required" ref="input" type="text" placeholder="Seu comentário aqui..."></textarea>
										<button data-action="send-comment" onClick={this.handleSubmit}>Enviar</button>
									</form>
								</div>
							):(
								<div className="showInput" onClick={this.showInput}>{
									this.props.model.get('type') === "Answer"?
									"Adicionar comentário."
									:"Fazer comentário sobre essa pergunta."
								}</div>
							)
						}
					</div>
				);
			},
		}),
		ListView: React.createClass({
			mixins: [backboneCollection],

			render: function () {
				var commentNodes = this.props.collection.map(function (comment) {
					return (
						<CommentView model={comment} key={comment.id} />
					);
				});

				return (
					<div className="commentList">
						{
							this.props.small?
							null
							:<label>{this.props.collection.models.length} Comentário{this.props.collection.models.length>1?"s":""}</label>
						}

						{commentNodes}
					</div>
				);
			},
		}),
		SectionView: React.createClass({
			mixins: [backboneCollection],

			render: function () {
				if (!this.props.collection)
					return <div></div>;
				return (
					<div className={"commentSection "+(this.props.small?' small ':'')}>
						<CommentListView  small={this.props.small} placeholder={this.props.placeholder} collection={this.props.collection} />
						<CommentInputForm small={this.props.small} model={this.props.postModel} />
					</div>
				);
			},
		}),
	};

	//

	var Answer = {
		View: React.createClass({
			mixins: [EditablePost],

			getInitialState: function () {
				return {isEditing:false};
			},

			onClickEdit: function () {
				if (!this.editor) return;

				this.setState({isEditing:true});
				this.editor.activate();
			},

			componentDidMount: function () {
				if (window.user && this.props.model.get('author').id === window.user.id) {
					this.editor = new MediumEditor(this.refs.answerBody.getDOMNode(), mediumEditorAnswerOpts); 
					this.editor.deactivate();
				} else {
					this.editor = null;
				}
			},
			
			onClickSave: function () {
				if (!this.editor) return;

				var self = this;

				this.props.model.save({
					data: {
						body: this.editor.serialize()['element-0'].value,
					},
				}, {
					success: function () {
						console.log(self.props.model.attributes)
						self.setState({isEditing:false});
						self.forceUpdate();
					}
				});
			},

			componentDidUpdate: function () {
				if (!this.editor) return;
				if (!this.state.isEditing) {
					console.log('hear hear')
					this.editor.deactivate(); // just to make sure
					$(this.refs.answerBody.getDOMNode()).html($(this.props.model.get('data').body));
				} else {
					this.editor.activate();
				}
			},

			onCancelEdit: function () {
				if (!this.editor) return;

				console.log('come on', this.props.model.attributes.data.escapedBody)
				this.setState({isEditing:false});
				e = this.editor;
			},
			
			render: function () {
				var answer = this.props.model.attributes;
				var self = this;

				return (
					<div className="answerViewWrapper">
						<div className={" answerView "+(this.state.isEditing?" editing ":"")} ref="answerView">
							<table>
							<tr>
								<td className="left">
									<div className="voteControl">
										<button className="control"><i className="icon-caret-up"></i></button>
										<div className="voteResult">5</div>
										<button className="control"><i className="icon-caret-down"></i></button>
									</div>
								</td>
								<td className="right">
									<div className="answerBodyWrapper" ref="answerBodyWrapper">
										<div className='answerBody' ref="answerBody" dangerouslySetInnerHTML={{__html: answer.data.body }}>
										</div>
										<div className="arrow"></div>
										<button data-action="save">
											Salvar
										</button>
									</div>
									<div className="infobar">
										<div className="toolbar">
											{(window.user && answer.author.id===window.user.id)?
											(
												<div className="item save" data-action="save-post" onClick={this.onClickSave} data-toggle="tooltip" data-placement="bottom" title="Salvar">
													<i className="icon-save"></i>
												</div>
											):null}
											{(window.user && answer.author.id===window.user.id)?
											(
												<div className="item cancel" onClick={this.onCancelEdit} data-toggle="tooltip" data-placement="bottom" title="Cancelar">
													<i className="icon-times"></i>
												</div>
											):null}
											{(window.user && answer.author.id===window.user.id)?
											(
												<div className="item edit" onClick={this.onClickEdit} data-toggle="tooltip" data-placement="bottom" title="Editar">
													<i className="icon-pencil"></i>
												</div>
											):null}
											{(window.user && answer.author.id===window.user.id)?
											(
												<div className="item remove" data-action="remove-post" onClick={this.onClickTrash}  data-toggle="tooltip" data-placement="bottom" title="Remover">
													<i className="icon-trash"></i>
												</div>
											):null}
											<div className="item link" data-toggle="tooltip" data-placement="bottom" title="Link">
												<i className="icon-link"></i>
											</div>
											<div className="item flag"  data-toggle="tooltip" data-placement="bottom" title="Sinalizar conteúdo">
												<i className="icon-flag"></i>
											</div>
										</div>
										<div className="answerAuthor">
											<div className="avatarWrapper">
												<a href={answer.author.profileUrl}>
													<div className="avatar" style={ { background: 'url('+answer.author.avatarUrl+')' } } title={answer.author.username}>
													</div>
												</a>
											</div>
											<div className="info">
												<a href={answer.author.profileUrl} className="username">
													{answer.author.name}
												</a> <time data-time-count={1*new Date(answer.published)}>
													{window.calcTimeFrom(answer.published)}
												</time>
											</div>
											<div className="answerSidebar" ref="sidebar">
												<div className="box authorInfo">
													<div className="identification">
														<div className="avatarWrapper">
															<div className="avatar" style={ { background: 'url('+answer.author.avatarUrl+')' } }></div>
														</div>
														<a href={answer.profileUrl} className="username">
															{answer.author.name}
														</a>
														<button className="btn-follow btn-follow" data-action="unfollow" data-user="{{ profile.id }}"></button>
													</div>
													<div className="bio">
														{
															(answer.author.profile.bio.split(" ").length>20)?
															answer.author.profile.bio.split(" ").slice(0,20).join(" ")+"..."
															:answer.author.profile.bio
														}
													</div>
												</div>
											</div>
										</div>
									</div>
								</td>
							</tr>
							</table>
							<CommentSectionView small={true} collection={this.props.model.children.Comment} postModel={this.props.model} />
						</div>
					</div>
				);
				// console.log('me', me.props.children.props.children[0].props.children.props.children[1].props.children[0].props.children[0].props.children.props.dangerouslySetInnerHTML);
				// return me
			},
		}),
		ListView: React.createClass({
			componentWillMount: function () {
				var update = function () {
					this.forceUpdate(function(){});
				}
				this.props.collection.on('add reset remove', update.bind(this));
			},

			render: function () {
				var answerNodes = this.props.collection.map(function (answer) {
					return (
						<AnswerView model={answer} key={answer.id}/>
					);
				});

				return (
					
					<div className="answerList">
						{answerNodes}
					</div>
				);
			},
		}),
		SectionView: React.createClass({
			render: function () {
				return (
					<div className="answerSection">
						<div className="sectionHeader">
							<label>{ this.props.collection.length } Respostas</label>
							<div className="sortingMenu">
								<label>ordenar por</label>
								<div className="menu">
									<span className="selected">Votos <i className="icon-adown"></i></span>
									<div className="dropdown">
										<li>+ Antigo</li>
										<li>Atividade</li>
									</div>
								</div>
							</div>
						</div>
						<AnswerListView collection={this.props.collection} />
						<AnswerInputForm model={this.props.postModel} placeholder="Adicionar comentário."/>
					</div>
				);
			},
		}),
		InputForm: React.createClass({

			componentDidUpdate: function () {
				if (this.refs.input) {
					this.editor = new MediumEditor(this.refs.input.getDOMNode(), mediumEditorAnswerOpts);
					e = this.editor;
				}
			},

			getInitialState: function () {
				return {showInput:false};
			},

			handleSubmit: function (evt) {
				evt.preventDefault();

				if (!this.editor) return alert("WTF"); // WTF

				var body = this.editor.serialize()['element-0'].value;
				var self = this;
				$.ajax({
					type: 'post',
					dataType: 'json',
					url: this.props.model.get('apiPath')+'/answers',
					data: { body: body }
				}).done(function(response) {
					self.editor.innerHTML = "";
					self.setState({showInput:false});
					console.log('response', response);
					self.props.model.children.Answer.add(new postModels.answerItem(response.data));
				});
			},

			showInput: function () {
				this.setState({showInput:true});
			},

			render: function () {
				if (!window.user)
					return (<div></div>);

				var mediaUserAvatarStyle = {
					background: 'url('+window.user.avatarUrl+')',
				};

				return (
					<div>
					{
						this.state.showInput?(
							<div className={"answerInputSection "+(this.props.small?"small":'')}>
								<form className="formPostAnswer" onSubmit={this.handleSubmit}>
								{
									this.props.small?
									null
									:<label>Responda à pergunta "{this.props.model.get('data').title}"</label>
								}
									<div className="editorWrapper">
										<div className="editor answerBody" ref="input" name="teste" data-placeholder="Resposta da pergunta aqui..."></div>
									</div>
									<button data-action="send-answer" onClick={this.handleSubmit}>Enviar</button>
								</form>
							</div>
						):(
							<div className="showInput" onClick={this.showInput}>
								Responder pergunta.
							</div>
						)
					}
					</div>
				);
			},
		}),
	};

	//

	var CommentSectionView = Comment.SectionView;
	var CommentListView = Comment.ListView;
	var CommentInputForm = Comment.InputForm;
	var CommentView = Comment.View;
	var AnswerSectionView = Answer.SectionView;
	var AnswerListView = Answer.ListView;
	var AnswerInputForm = Answer.InputForm;
	var AnswerView = Answer.View;

	//

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
							{post.translatedType}
						</span>
						<div className="iconStats">
							<div onClick={this.props.model.handleToggleVote.bind(this.props.model)}>
								{this.props.model.liked?<i className="icon-heart icon-red"></i>:<i className="icon-heart"></i>}
								&nbsp;
								{post.voteSum}
							</div>
							<div>
								<i className="icon-comment-o"></i>&nbsp;
								{this.props.model.get('childrenCount').Comment}
							</div>
							{post.type === "QA"?
								<div>
									<i className="icon-bulb"></i>&nbsp;
									{this.props.model.get('childrenCount').Answer}
								</div>
								:null}
						</div>
					</div>

					<div className="cardBody">
						<span dangerouslySetInnerHTML={{__html: post.data.title }} />
					</div>

					<div className="cardFoot">
						<div className="authorship">
							<a href={post.author.profileUrl} className="username">
								{post.author.name}
							</a>
							<div className="avatarWrapper">
								<a href={post.author.profileUrl}>
									<div className="avatar" style={mediaUserStyle}></div>
								</a>
							</div>
						</div>

						<time data-time-count={1*new Date(post.published)} data-time-long="true">
							{window.calcTimeFrom(post.published,true)}
						</time>
					</div>
				</div>
			);
		}
	});

	return {
		'CardView': CardView,
		'PlainPost': React.createClass({
			mixins: [EditablePost, backboneModel],

			render: function () {
				var post = this.props.model.attributes;
				var rawMarkup = post.data.escapedBody;

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

				return (
					<div>
						<div className="postHeader">
							<time data-time-count={1*new Date(post.published)} data-time-long="true">
								{window.calcTimeFrom(post.published,true)}
							</time>
							<div className="type">
								{post.translatedType}
							</div>
							<div className="postTitle">
								From OCW fanatic to MIT undergrad: my 5 year journey
							</div>
							<div className="tags">
								<div className="tag">Application</div>
								<div className="tag">Vestibular</div>
								<div className="tag">Universidades</div>
							</div>
						</div>

						<div className="postBody">
							<span dangerouslySetInnerHTML={{__html: rawMarkup}} />
						</div>

						<div className="postInfobar">
							<ul className="left">
							</ul>
						</div>
						<div className="postFooter">
							<CommentSectionView collection={this.props.model.children.Comment} postModel={this.props.model} />
						</div>
					</div>
				);
			},
		}),
		'Question': React.createClass({
			mixins: [EditablePost, backboneModel],

			render: function () {
				var post = this.props.model.attributes;
				var rawMarkup = post.data.escapedBody;

				return (
					<div>
						<div className="postHeader">
							<time data-time-count={1*new Date(post.published)} data-time-long="true">
								{window.calcTimeFrom(post.published,true)}
							</time>
							<div className="type">
								{post.translatedType}
							</div>
							<div className="postTitle">
								{post.data.title}
							</div>
							<div className="tags">
								<div className="tag">Application</div>
								<div className="tag">Olimpíada de Matemática</div>
							</div>
						</div>
						<div className="postBody">
							<span dangerouslySetInnerHTML={{__html: rawMarkup}} />
						</div>
						<div className="postInfobar">
							<ul className="left">
							</ul>
						</div>
						<div className="postFooter">
							<CommentSectionView collection={this.props.model.children.Comment} postModel={this.props.model} small={true} />
							<AnswerSectionView collection={this.props.model.children.Answer} postModel={this.props.model} />
						</div>
					</div>
				);
			},
		}),
	};
});

