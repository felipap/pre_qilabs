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

define(['jquery', 'backbone', 'components.postForms', 'underscore', 'react', 'showdown'],
	function ($, Backbone, postForms, _, React, Showdown) {

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

		/************************************************************************************/
		/************************************************************************************/

		var ActivityView = React.createClass({

			render: function () {
				var post = this.props.model.attributes;
				var mediaUserStyle = {
					background: 'url('+post.actor.avatarUrl+')',
				};
				return (
					<div className="activityView">
						<span dangerouslySetInnerHTML={{__html: this.props.model.get('content')}} />
						<time data-time-count={1*new Date(post.published)}>
							{window.calcTimeFrom(post.published)}
						</time>
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
					<div className="postPart" data-post-type="QAPost">
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
									fez uma pergunta:
								</div>
								
								<a href={post.path}>
									<time data-time-count={1*new Date(post.published)}>
										{window.calcTimeFrom(post.published)}
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
							<div className="msgTitle">
								<div className="arrow"></div>
								<span>{post.data.title}</span>
							</div>
							<div className="msgBody">
								<span dangerouslySetInnerHTML={{__html: rawMarkup}} />
							</div>
						</div>
						{app.postItem?
						<div>
							<CommentSectionView model={this.props.model} />
							<AnswerSectionView model={this.props.model} />
						</div>
						:<div className="showMorePrompt">
							Visualizar {this.props.model.answerList.models.length} respostas
						</div>}
					</div>
				);
			},
		});


		var PostView = React.createClass({
			mixins: [EditablePost],

			render: function () {
				var postType = this.props.model.get('type');
				// test for type, QA for example
				return (
					<div className="postView">
						<QAPostView model={this.props.model} />
					</div>
				);
			},
		});

		var StreamItemView = React.createClass({
			render: function () {
				var itemType = this.props.model.get('__t');
				return (
					<div className="streamItem">
						{(itemType==='Post')?
						<PostView model={this.props.model} />
						:<ActivityView model={this.props.model} />}
					</div>
				);
			},
		});

		var TimelineView = React.createClass({
			getInitialState: function () {
				return {selectedForm:null};
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
						<StreamItemView model={post} />
					);
				});

				var self = this;

				function dismissForm () {
					self.setState({selectedForm:'QA'}, function(){});
				}

				function selectForm (evt) {
					var btn = evt.target;
					self.setState({selectedForm:btn.dataset.form}, function(){
						console.log('state set:', self.state)
					});
				}

				switch (this.state.selectedForm) {
					case 'QA':
						var postForm = postForms.QA;
						break;
					case 'PlainText':
						var postForm = postForms.PlainText;
						break;
					default:
						var postForm = null;
				}

				return (
					<div className="postListWrapper">
						{this.props.canPostForm?
							(
								postForm?
								<postForm postUrl={this.props.collection.url}/>
								:<div className="">
									<button onClick={selectForm} data-form='QA'>
										Fazer uma pergunta
									</button>
									<button onClick={selectForm} data-form='PlainText'>
										Escreva um texto
									</button>
								</div>
							)
							:null
						}
						{postNodes}
						{this.props.collection.EOF?
						<div className="streamSign">
							<i className="icon-exclamation"></i> Nenhuma outra atividade encontrada.
						</div>
						:<a className="streamSign" href="#" onClick={this.props.collection.tryFetchMore}>
							<i className="icon-spin icon-cog"></i>Procurando mais atividades.
						</a>}
					</div>
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
