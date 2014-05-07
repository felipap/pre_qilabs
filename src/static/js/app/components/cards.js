/** @jsx React.DOM */

/*
** cards.js
** Copyright QILabs.org
** BSD License
** by @f03lipe
*/

define([
	'jquery', 'backbone', 'components.postForms', 'components.postModels', 'components.postViews', 'underscore', 'react', 'showdown'],
	function ($, Backbone, postForms, postModels, postViews, _, React, Showdown) {

	$(window).resize(function resizeCardsPanel() {
		document.getElementById("globalContainer").style.height = (document.body.offsetHeight - document.getElementById("globalContainer").getBoundingClientRect().top + 10)+"px";
	});

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

	var FullPostView = React.createClass({displayName: 'FullPostView',

		getInitialState: function () {
			return {full:false};
		},

		destroy: function () {
			React.unmountComponentAtNode(document.getElementById('fullPageContainer'));
			$("#fullPageContainer").removeClass('active');
			app.navigate('/', {trigger:true});
		},

		render: function () {
			var post = this.props.model.attributes;

			// test for type, QA for example
			var postType = this.props.model.get('type');
			if (postType in postViews) {
				var postView = postViews[postType];
			} else {
				console.warn("Couldn't find view for post of type "+postType);
				return React.DOM.div(null );
			}

			var self = this;

			function toggleSidebar () {
				self.setState({full:!self.state.full});
			}

			var mediaUserStyle = {
				background: 'url('+post.author.avatarUrl+')',
			};
			// console.log(this.props.model.get('type'))
			return (
				React.DOM.div( {className:"postBox "+(this.state.full?'full':''), 'data-post':this.props.model.get('type')}, 
					React.DOM.div( {className:"postCol"}, 
						postView( {model:this.props.model} )
					),
					React.DOM.div( {className:"postSidebar", ref:"sidebar"}, 
						React.DOM.div( {className:"sidebarToggle", onClick:toggleSidebar}, 
							React.DOM.i( {className:"icon-plus"})
						),
						React.DOM.div( {className:"box authorInfo"}, 
							/* <div className="cardType"><strong>DICA</strong> por</div> */
							React.DOM.div( {className:"identification"}, 
								React.DOM.div( {className:"avatarWrapper"}, 
									React.DOM.a( {href:post.profileUrl}, 
										React.DOM.div( {className:"avatar", style:mediaUserStyle})
									)
								),
								React.DOM.a( {href:post.profileUrl, className:"username"}, 
									post.author.name
								),
								React.DOM.button( {className:"btn-follow btn-follow", 'data-action':"unfollow", 'data-user':"{{ profile.id }}"}),

								React.DOM.div( {className:"bio"}, 
									React.DOM.div( {className:"specialized"}, "MIT Freshman"),
									"QI Labs Founder & CEO. Open source enthusiast. I believe I can program my way into changing the world."
								)
							)
						),
						
						React.DOM.div( {className:"box tags"}, 
							React.DOM.div( {className:"postStats"}, 
								React.DOM.i( {className:"icon-tags"}), "  ",
								React.DOM.div( {className:"tag"}, "Application"),
								React.DOM.div( {className:"tag"}, "MIT")
							)
						),
						
						React.DOM.div( {className:"box editedByBox"}, 
							React.DOM.div( {className:"avatarWrapper"}, 
								React.DOM.div( {className:"avatar", style: { background: 'url('+'/static/images/avatar2.png'+')'} })
							),
							React.DOM.div( {className:"info"}, 
								"Editado por ", React.DOM.span( {className:"name"}, "Felipe Aragão Pires"), " ", React.DOM.time(null, "há 5 horas") 
							)
						),
						

						React.DOM.div( {className:"likeBox"}, 
							React.DOM.div( {className:"up"}, 
								React.DOM.i( {className:"icon-tup"})
							),
							React.DOM.div( {className:"down"}, 
								React.DOM.i( {className:"icon-tdown"})
							)
						),
						React.DOM.div( {className:"flatBtnBox"}, 
							React.DOM.div( {className:"item edit", 'data-toggle':"tooltip", title:"Editar publicação", 'data-placement':"bottom", 'data-container':"body"}, 
								React.DOM.i( {className:"icon-edit"})
							),
							React.DOM.div( {className:"item link", 'data-toggle':"tooltip", title:"Compartilhar", 'data-placement':"bottom", 'data-container':"body"}, 
								React.DOM.i( {className:"icon-link"})
							),
							React.DOM.div( {className:"item flag", 'data-toggle':"tooltip", title:"Sinalizar conteúdo impróprio", 'data-placement':"bottom", 'data-container':"body"}, 
								React.DOM.i( {className:"icon-flag"})
							)
						)
					),
					React.DOM.div( {onClick:this.destroy, className:"blackout"})
				)
			);
							// <div className="item fb">
							// 	<i className="icon-facebook"></i>
							// </div>
							// <div className="item tweet">
							// 	<i className="icon-twitter"></i>
							// </div>
			// <div className="box flagOption">
			// 	<span data-toggle="tooltip" title="Denunciar publicação" data-placement="bottom">
			// 		<i className="icon-flag"></i>
			// 	</span>
			// 	Sinalizar publicação imprópria.
			// </div>
		},
	});

	var CardsPanelView = React.createClass({displayName: 'CardsPanelView',
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
		render: function () {
			var self = this;
			var postForm = postForms.Plain;
			function fetchMore () {
				self.props.collection.tryFetchMore();
			}

			var cards = this.props.collection.map(function (post) {
				if (post.get('__t') === 'Post')
					return postViews.CardView( {model:post} );
				return null;
			});
			return (
				React.DOM.div( {className:"timeline"}, 
					cards,
					this.props.collection.EOF?
					React.DOM.div( {className:"streamSign"}, 
						React.DOM.i( {className:"icon-exclamation"}), " Nenhuma outra atividade encontrada."
					)
					:React.DOM.a( {className:"streamSign", href:"#", onClick:fetchMore}, 
						"Procurando mais atividades."
					)
				)
			);
		},
	});

	// Central functionality of the app.
	var WorkspaceRouter = Backbone.Router.extend({
		
		initialize: function () {
			console.log('initialized')
			window.app = this;
			this.renderList('/api/me/timeline/posts',{canPostForm:true});
		},

		routes: {
			'u/:profileId':
				function () {
					this.renderList(window.conf.postsRoot,{canPostForm:false});
				},
			'posts/:postId':
				 function (postId) {
				 	$.getJSON('/api/posts/'+postId, function (response) {
				 		console.log('response, data', response)
					 	this.postItem = new postModels.postItem(response.data);
					 	React.renderComponent(FullPostView({model:this.postItem}),
					 		document.getElementById('fullPageContainer'));
					 	$("#fullPageContainer").addClass('active');
				 	});
				},
		},

		renderList: function (url, opts) {
			// return;
			this.postList = new postModels.postList([], {url:url});
			React.renderComponent(CardsPanelView(
				_.extend(opts,{collection:this.postList})),
				document.getElementById('resultsContainer'));

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
