/** @jsx React.DOM */

/*
** postViews.js
** Copyright QILabs.org
** BSD License
** by @f03lipe
*/

define(['jquery', 'backbone', 'underscore', 'components.postModels', 'react', 'medium-editor',],
	function ($, Backbone, _, postModels, React) {

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
			this.props.collection.on('add reset change remove', update.bind(this));
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
							<span dangerouslySetInnerHTML={{__html: comment.data.escapedBody }}></span>
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

							<time data-time-count={1*new Date(comment.published)}>
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
				var self = this;
				// This only works because showInput starts out as false.
				if (this.refs && this.refs.input) {
					$(this.refs.input.getDOMNode()).autosize();
					if (this.props.small) {
						$(this.refs.input.getDOMNode()).keyup(function (e) {
							// Prevent newlines in comments.
							if (e.keyCode == 13) { // enter
								e.preventDefault();
							} else if (e.keyCode == 27) { // esc
								// Hide box if the content is "empty".
								if (self.refs.input.getDOMNode().value.match(/^\s*$/))
									self.setState({showInput:false});
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
			mixins: [backboneModel, EditablePost],

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
					$(this.refs.answerBody.getDOMNode()).mediumInsert({
						editor: this.editor,
					});

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
				if (this.editor) {
					if (!this.state.isEditing) {
						this.editor.deactivate(); // just to make sure
						$(this.refs.answerBody.getDOMNode()).html($(this.props.model.get('data').body));
					} else {
						this.editor.activate();
					}
				}
			},

			toggleVote: function () {
				this.props.model.handleToggleVote();
			},

			onCancelEdit: function () {
				if (!this.editor) return;
				this.setState({isEditing:false});
			},
			
			render: function () {
				var answer = this.props.model.attributes;
				var self = this;

				// <button className="control"><i className="icon-caret-up"></i></button>
				// <div className="voteResult">5</div>
				// <button className="control"><i className="icon-caret-down"></i></button>
				var userHasVoted = window.user && answer.votes.indexOf(window.user.id) != -1;
				var userIsAuthor = window.user && answer.author.id===window.user.id;

				var voteControl = (
					<div className={" voteControl "+(userHasVoted?"voted":"")}>
						<button className="thumbs" onClick={this.toggleVote} disabled={userIsAuthor?"disabled":""}
						title={userIsAuthor?"Você não pode votar na sua própria resposta.":""}>
							<i className="icon-tup"></i>
						</button>
						<div className="count">
							{answer.voteSum}
						</div>
					</div>
				);

				return (
					<div className="answerViewWrapper">
						<div className={" answerView "+(this.state.isEditing?" editing ":"")} ref="answerView">
							<div className="left">
								{voteControl}
							</div>
							<div className="right">
								<div className="answerBodyWrapper" ref="answerBodyWrapper">
									<div className='answerBody' ref="answerBody" dangerouslySetInnerHTML={{__html: answer.data.body }}>
									</div>
								</div>
								<div className="infobar">
									<div className="toolbar">
										{userIsAuthor?
										(
											<div className="item save" data-action="save-post" onClick={this.onClickSave} data-toggle="tooltip" data-placement="bottom" title="Salvar">
												<i className="icon-save"></i>
											</div>
										):null}
										{userIsAuthor?
										(
											<div className="item cancel" onClick={this.onCancelEdit} data-toggle="tooltip" data-placement="bottom" title="Cancelar">
												<i className="icon-times"></i>
											</div>
										):null}
										{userIsAuthor?
										(
											<div className="item edit" onClick={this.onClickEdit} data-toggle="tooltip" data-placement="bottom" title="Editar">
												<i className="icon-pencil"></i>
											</div>
										):null}
										{userIsAuthor?
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
													{
													userIsAuthor?null:<button className="btn-follow btn-follow" data-action="unfollow" data-user="{{ profile.id }}"></button>
													}
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
							</div>
							<CommentSectionView small={true} collection={this.props.model.children.Comment} postModel={this.props.model} />
						</div>
					</div>
				);
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
			getInitialState: function () {
				return {sortingType:'votes'};
			},
			onSortSelected: function (e) {
				var type = e.target.dataset.sort;
				console.log(e, type)

				var comp = this.props.collection.comparators[type];
				this.props.collection.comparator = comp;
				this.props.collection.sort();
				this.setState({sortingType: type});
			},
			render: function () {
				var self = this;

				var sortTypes = {
					'votes': 'Votos',
					'older': '+ Antigo',
					'younger': '+ Novo',
					'updated': 'Atividade',
				};

				var otherOpts = _.map(_.filter(_.keys(sortTypes), function (i) {
					return i != self.state.sortingType;
				}), function (type) {
					return (
						<li data-sort={type} onClick={self.onSortSelected}>{sortTypes[type]}</li>
					);
				});

				var menu = (
					<div className="menu">
						<span className="selected" data-sort={this.state.sortingType}>
							{sortTypes[this.state.sortingType]}
							<i className="icon-adown"></i>
						</span>
						<div className="dropdown">
							{otherOpts}
						</div>
					</div>
				);

				return (
					<div className="answerSection">
						<div className="sectionHeader">
							<label>{ this.props.collection.length } Respostas</label>
							<div className="sortingMenu">
								<label>ordenar por</label>
								{menu}
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
				if (this.refs && this.refs.input) {
					this.editor = new MediumEditor(this.refs.input.getDOMNode(), mediumEditorAnswerOpts);
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

	var TagList = React.createClass({
		render: function () {
			var tags = _.map(this.props.tags, function (label) {
				return (
					<div className="tag">
						{label}
					</div>
				);
			});
			return (
				<div className="tags">
					{tags}
				</div>
			);
		}
	})

	return {
		'CardView': React.createClass({
			mixins: [backboneModel],
			componentDidMount: function () {
				// var cardBodySpan = this.refs.cardBodySpan.getDOMNode();
				// if ($(cardBodySpan).height() < 70) {
				// 	$(cardBodySpan).css('font-size', '21px');
				// }
			},
			render: function () {

				function gotoPost () {
					app.navigate('/posts/'+post.id, {trigger:true});
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
								{post.type === "Question"?
									<div>
										<i className="icon-bulb"></i>&nbsp;
										{this.props.model.get('childrenCount').Answer}
									</div>
									:<div>
										<i className="icon-comment-o"></i>&nbsp;
										{this.props.model.get('childrenCount').Comment}
									</div>
								}
							</div>
						</div>

						<div className="cardBody">
							<span ref="cardBodySpan">{post.data.title}</span>
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

							<time data-time-count={1*new Date(post.published)}>
								{window.calcTimeFrom(post.published,true)}
							</time>
						</div>
					</div>
				);
			}
		}),
		'Question': React.createClass({
			mixins: [EditablePost, backboneModel],

			render: function () {
				var post = this.props.model.attributes;
				var rawMarkup = post.data.escapedBody;

				return (
					<div>
						<div className="postHeader">
							<time data-time-count={1*new Date(post.published)}>
								{window.calcTimeFrom(post.published,true)}
							</time>
							<div className="type">
								{post.translatedType}
							</div>
							<div className="postTitle">
								{post.data.title}
							</div>
							<div className="tags">
								<TagList tags={post.tags} />
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
		'Experience': React.createClass({
			mixins: [EditablePost, backboneModel],

			render: function () {
				var post = this.props.model.attributes;
				return (
					<div>
						<div className="postHeader">
							<time data-time-count={1*new Date(post.published)}>
								{window.calcTimeFrom(post.published,true)}
							</time>
							<div className="type">
								{post.translatedType}
							</div>
							<div className="postTitle">
								{this.props.model.get('data').title}
							</div>
							<div className="tags">
								<TagList tags={post.tags} />
							</div>
						</div>

						<div className="postBody">
							<span dangerouslySetInnerHTML={{__html: this.props.model.get('data').body}} />
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
		'Tip': React.createClass({
			mixins: [EditablePost, backboneModel],

			render: function () {
				var post = this.props.model.attributes;
				return (
					<div>
						<div className="postHeader">
							<time data-time-count={1*new Date(post.published)}>
								{window.calcTimeFrom(post.published,true)}
							</time>
							<div className="type">
								{post.translatedType}
							</div>
							<div className="postTitle">
								{this.props.model.get('data').title}
							</div>
							<div className="tags">
								<TagList tags={post.tags} />
							</div>
						</div>

						<div className="postBody">
							<span dangerouslySetInnerHTML={{__html: this.props.model.get('data').body}} />
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

	};
});

