/** @jsx React.DOM */

/*
** wall.js
** Copyright QILabs.org
** BSD License
** by @f03lipe
*/

define([
	'jquery', 'backbone', 'components.postModels', 'components.postViews', 'underscore', 'react', 'views.createPost'],
	function ($, Backbone, postModels, postViews, _, React, PostFormView) {

	setTimeout(function updateCounters () {
		$('[data-time-count]').each(function () {
			this.innerHTML = calcTimeFrom(parseInt(this.dataset.timeCount), this.dataset.timeLong);
		});
		setTimeout(updateCounters, 1000);
	}, 1000);

	var FullPostView = React.createClass({displayName: 'FullPostView',

		componentWillMount: function () {
			var update = function () {
				this.forceUpdate(function(){});
			}
			this.props.model.on('add reset remove change', update.bind(this));
		},

		destroy: function () {
			React.unmountComponentAtNode(document.getElementById('fullPostContainer'));
			$("#fullPostContainer").removeClass('active');
			app.navigate('/', {trigger:true});
		},

		onClickTrash: function () {
			if (confirm('Tem certeza que deseja excluir essa postagem?')) {
				this.props.model.destroy();
				this.destroy();
				// Signal to the wall that the post with this ID must be removed.
				// This isn't automatic (as in deleting comments) because the models on
				// the wall aren't the same as those on post FullPostView.
				app.postList.remove({id:this.props.model.get('id')})
				$(".tooltip").remove(); // fuckin bug
			}
		},

		toggleVote: function () {
			this.props.model.handleToggleVote();
		},

		componentDidMount: function () {
			var self = this;
			$(this.getDOMNode().parentElement).on('click', function onClickOut (e) {
				if (e.target === this || e.target === self.getDOMNode()) {
					self.destroy();
					$(this).unbind('click', onClickOut);
				}
			});
		},

		render: function () {
			var post = this.props.model.attributes;
			var author = this.props.model.get('author');

			var postType = this.props.model.get('type');
			if (postType in postViews) {
				var postView = postViews[postType];
			} else {
				console.warn("Couldn't find view for post of type "+postType);
				return React.DOM.div(null);
			}

			var self = this;

			var userIsAuthor = window.user && author.id===window.user.id;

			return (
				React.DOM.div( {className:"postBox", 'data-post-type':this.props.model.get('type'), 'data-post-id':this.props.model.get('id')}, 
					React.DOM.div( {className:"postCol"}, 
						postView( {model:this.props.model} )
					),
					React.DOM.div( {className:"postSidebar", ref:"sidebar"}, 
						React.DOM.div( {className:"box authorInfo"}, 
							React.DOM.div( {className:"identification"}, 
								React.DOM.div( {className:"avatarWrapper"}, 
									React.DOM.div( {className:"avatar", style: { background: 'url('+author.avatarUrl+')' } })
								),
								React.DOM.a( {href:author.path, className:"username"}, 
									author.name
								),
								
									userIsAuthor?
									null
									:React.DOM.button( {className:"btn-follow btn-follow", 'data-action':"unfollow", 'data-user':author.id})
								
							),
							React.DOM.div( {className:"bio"}, 
								author.profile.bio
							)
						),

						React.DOM.div( {className:"flatBtnBox"}, 
							
								(window.user.id === author.id)?
								React.DOM.div( {className:"item edit", onClick:this.onClickEdit, 'data-toggle':"tooltip", title:"Editar publicação", 'data-placement':"bottom", 'data-container':"body"}, 
									React.DOM.i( {className:"icon-edit"})
								)
								:
								React.DOM.div( {className:"item like "+((window.user && post.votes.indexOf(window.user.id) != -1)?"liked":""),
									onClick:this.toggleVote}, 
									post.voteSum, " ", React.DOM.i( {className:"icon-heart-o"})
								),
							
							
								(window.user.id === author.id)?
								React.DOM.div( {className:"item remove", onClick:this.onClickTrash, 'data-toggle':"tooltip", title:"Excluir publicação", 'data-placement':"bottom", 'data-container':"body"}, 
									React.DOM.i( {className:"icon-trash"})
								)
								:null,
							

							React.DOM.div( {className:"item link", 'data-toggle':"tooltip", title:"Compartilhar", 'data-placement':"bottom", 'data-container':"body"}, 
								React.DOM.i( {className:"icon-link"})
							),
							React.DOM.div( {className:"item flag", 'data-toggle':"tooltip", title:"Sinalizar conteúdo impróprio", 'data-placement':"bottom", 'data-container':"body"}, 
								React.DOM.i( {className:"icon-flag"})
							)
						)

					)
				)
			);

			// <div className="box relatedContentBox">
			// 	<label>Perguntas relacionadas</label>
			// 	<li>
			// 		<span className="question">Lorem Ipsum Dolor Sit Amet?</span> – <span className="asker">Léo Creo</span>
			// 	</li>
			// 	<li>
			// 		<span className="question">Felipe não sabe fazer site ou eu tô enganado?</span> – <span className="asker">Recalcada Qualquer</span>
			// 	</li>
			// 	<li>
			// 		<span className="question">O Site que Nunca Saiu</span> – <span className="asker">Felipe Aragão</span>
			// 	</li>
			// </div>
			
			// <div className="box editedByBox">
			// 	<div className="avatarWrapper">
			// 		<div className="avatar" style={ { background: 'url('+'/static/images/avatar2.png'+')'} }></div>
			// 	</div>
			// 	<div className="info">
			// 		Editado por <span className="name">Felipe Aragão Pires</span> <time>há 5 horas</time> 
			// 	</div>
			// </div>
		},
	});

	var FollowList = React.createClass({displayName: 'FollowList',
		render: function () {
			// <button className="btn-follow" data-action="unfollow"></button>
			var items = _.map(this.props.list, function (person) {
				return (
					React.DOM.li(null, 
						React.DOM.a( {href:person.path}, 
							React.DOM.div( {className:"avatarWrapper"}, 
								React.DOM.div( {className:"avatar", style: {background: 'url("'+person.avatarUrl+'")'} })
							),
							React.DOM.span( {className:"name"}, person.name)
						)
					)
				);
			});
			if (this.props.isFollowin)
				var label = this.props.profile.name+" segue "+this.props.list.length+" pessoas";
			else
				var label = this.props.list.length+" pessoas seguem "+this.props.profile.name;

			return (
				React.DOM.div( {className:"listView"}, 
					React.DOM.div( {className:"userAvatar"}, 
						React.DOM.div( {className:"avatarWrapper"}, 
							React.DOM.a( {href:"#"}, 
							React.DOM.div( {className:"avatar", style: {background: 'url("'+this.props.profile.avatarUrl+'")'} }
							)
							)
						)
					),
					React.DOM.label(null, label),
					items
				)
			);
		},
	});

	var CardsPanelView = React.createClass({displayName: 'CardsPanelView',
		getInitialState: function () {
			return {selectedForm:null};
		},
		componentWillMount: function () {
			function update (evt) {
				this.forceUpdate(function(){});
			}
			this.props.collection.on('add change remove reset statusChange', update.bind(this));
		},
		render: function () {
			var self = this;
			function fetchMore () {
				self.props.collection.tryFetchMore();
			}

			var cards = this.props.collection.map(function (post) {
				if (post.get('__t') === 'Post')
					return postViews.CardView({model:post, key:post.id});
				return null;
			});
			return (
				React.DOM.div( {className:"timeline"}, 
					cards
				)
			);
		},
	});

	// Central functionality of the app.
	var WorkspaceRouter = Backbone.Router.extend({
		
		initialize: function () {
			console.log('initialized')
			window.app = this;
			this.renderWall(window.conf.postsRoot || '/api/me/timeline/posts');
		},

		routes: {
			'new':
				function () {
					var pc = $('<div class="pContainer" data-page="createPost">');
					React.renderComponent(PostFormView( {user:window.user} ), pc[0], function () {
						pc.appendTo('body');
					});
				},
			'following':
				function () {
					var self = this;
					console.log('oi')
					$.getJSON('/api/users/'+user_profile.id+'/following')
						.done(function (response) {
							if (response.error)
								alert('vish fu')
							console.log('foi!', response)
							self.renderList(response.data, {isFollowing: true});
						})
						.fail(function (response) {
							alert('vish');
						})
				},
			'followers':
				function () {
					var self = this;
					console.log('oi')
					$.getJSON('/api/users/'+user_profile.id+'/followers')
						.done(function (response) {
							if (response.error)
								alert('vish fu')
							console.log('foi!', response)
							self.renderList(response.data, {isFollowing: false});
						})
						.fail(function (response) {
							alert('vish');
						})
				},
			'posts/:postId':
				 function (postId) {
				 	var self = this;
					$.getJSON('/api/posts/'+postId)
						.done(function (response) {
							if (response.data.parentPost) {
								return app.navigate('/posts/'+response.data.parentPost, {trigger:true});
							}
							console.log('response, data', response)
							self.postItem = new postModels.postItem(response.data);
							var pc = $('<div class="pContainer" data-page="post">');
							React.renderComponent(FullPostView({model:self.postItem}),
								pc[0], function () {
									pc.appendTo('body');
								});
						})
						.fail(function (response) {
							alert("não achei");
						});
				},
			'':
				function () {
					$('body').removeClass('rightContainerOpen');
					$('.pContainer').remove();
					this.renderWall(window.conf.postsRoot || '/api/me/timeline/posts');
				},
		},

		renderList: function (list, opts) {
			React.renderComponent(
				FollowList( {list:list, isFollowing:opts.isFollowing, profile:user_profile} ),
				document.getElementById('rightContainer')
			);
			$('body').addClass('rightContainerOpen');
		},

		renderWall: function (url, opts) {
			// return;
			this.postList = new postModels.postList([], {url:url});
			if (!this.postWall) {
				this.postWall = React.renderComponent(CardsPanelView(
					_.extend(opts || {},{collection:this.postList})),
					document.getElementById('resultsContainer'));
				this.postList.fetch({reset:true});
				var fetchMore = this.postList.tryFetchMore.bind(app.postList);


				$('#globalContainer').scroll(function() {
					if ($('#content').outerHeight()-($('#globalContainer').scrollTop()+$('#globalContainer').outerHeight())<5) {
						console.log('fetching more')
						fetchMore();
					}
				});
			}
		},
	});

	$("#globalContainer").scroll(function () {
		if ($("#globalContainer").scrollTop() > 0) {
			$("body").addClass('hasScrolled');
		} else {
			$("body").removeClass('hasScrolled');
		}
	});

	if (!!$("#globalHead").length) {
		// $(document).scroll(triggerCalcNavbarFixed);
		$("#globalContainer").scroll(triggerCalcNavbarFixed);
		function triggerCalcNavbarFixed () {
			// if (($(document).scrollTop()+$('nav.bar').outerHeight()
			// 	-($("#globalHead").offset().top+$('#globalHead').outerHeight())) >= 0) {
			if ($("#globalContainer").scrollTop()-$("#globalHead").outerHeight() >= 0) {
				$("body").addClass('headerPassed');
			} else {
				$("body").removeClass('headerPassed');
			}
		}
		triggerCalcNavbarFixed();
	} else {
		$("body").addClass('noHeader');
	}

	return {
		initialize: function () {
			new WorkspaceRouter;
			Backbone.history.start({ pushState:false, hashChange:true });
		}
	};
});
