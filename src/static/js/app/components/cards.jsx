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

	var FullPostView = React.createClass({

		getInitialState: function () {
			return {full:false};
		},

		destroy: function () {
			React.unmountComponentAtNode(document.getElementById('fullPageContainer'));
			app.navigate('/', {trigger:true});
		},

		render: function () {
			var post = this.props.model.attributes;

			// test for type, QA for example
			var postType = this.props.model.get('type');
			if (postType in postViews) {
				var postView = postViews.full[postType];
			} else {
				console.warn("Couldn't find view for post of type "+postType);
				return <div />;
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
				<div className={"fullPostView "+(this.state.full?'full':'')}>
					<div className="sidebarToggle" onClick={toggleSidebar}>
						<i className="icon-plus"></i>
					</div>
					<div className="postView">
						<postView model={this.props.model} />
					</div>

					<div className="postSidebar" ref="sidebar">
						<div className="box authorInfo">
							{/* <div className="cardType"><strong>DICA</strong> por</div> */}
							<div className="identification">
								<div className="avatarWrapper">
									<a href={post.profileUrl}>
										<div className="avatar" style={mediaUserStyle}></div>
									</a>
								</div>
								<a href={post.profileUrl} className="username">
									{post.author.name}
								</a>
								<button className="btn-follow btn-follow" data-action="unfollow" data-user="{{ profile.id }}"></button>

								<div className="bio">
									QI Labs Founder &amp; CEO. <br />MIT freshman. Open source enthusiast. I believe I can program my way into changing the world.
								</div>
							</div>
						
						</div>
						
						<div className="box tags">
							<div className="postStats">
								<i className="icon-tags"></i> &nbsp;
								<div className="tag">Application</div>
								<div className="tag">MIT</div>
							</div>
						</div>
						<div className="box flagOption">
							<span data-toggle="tooltip" title="Denunciar publicação" data-placement="bottom">
								<i className="icon-flag"></i>
							</span>
							Sinalizar publicação imprópria.
						</div>
					</div>
					<div onClick={this.destroy} className="blackout"></div>
				</div>
			);
		},
	});

	var CardsPanelView = React.createClass({
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
				<div className="timeline">
					{cards}
					{this.props.collection.EOF?
					<div className="streamSign">
						<i className="icon-exclamation"></i> Nenhuma outra atividade encontrada.
					</div>
					:<a className="streamSign" href="#" onClick={fetchMore}>
						Procurando mais atividades.
					</a>}
				</div>
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
				 	});
				},
		},

		renderList: function (url, opts) {
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

	var originalOffset = $(".cardsNav").offset().top;

	$('#globalContainer').scroll(function() {
		console.log($('#globalContainer').scrollTop() - originalOffset+60+1)
		if ($('#globalContainer').scrollTop() > originalOffset-60) {
			$(".cardsNav").addClass('fixed');
		} else {
			$(".cardsNav").removeClass('fixed');
		}
	});


	function onResize () {
		$("#globalContainer").height($('body').height() - $("#globalContainer").offset().top)
	}
	$(window).resize(onResize);
	onResize();

	return {
		initialize: function () {
			new WorkspaceRouter;
			Backbone.history.start({ pushState:false, hashChange:true });
		}
	};
});
