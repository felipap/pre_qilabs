/** @jsx React.DOM */

/*
** timeline.js
** Copyright QILabs.org
** BSD License
** by @f03lipe
*/

define(['jquery', 'backbone', 'components.postForms', 'components.postModels', 'components.postViews', 'underscore', 'react', 'showdown'],
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

	var ActivityView = React.createClass({

		render: function () {
			var post = this.props.model.attributes;
			var mediaUserStyle = {
				background: 'url('+post.actor.avatarUrl+')',
			};
			return (
				<div className="activityView">
					<span dangerouslySetInnerHTML={{__html: this.props.model.get('content')}} />
					<time data-time-count={1*new Date(post.published)} data-time-long="true">
						{window.calcTimeFrom(post.published, true)}
					</time>
				</div>
			);
		},
	});

	var PostView = React.createClass({

		render: function () {
			// test for type, QA for example
			var postType = this.props.model.get('type');
			if (postType in postViews) {
				var postView = postViews[postType];
			} else {
				console.warn("Couldn't find view for post of type "+postType);
				return <div />;
			}
			// console.log(this.props.model.get('type'))
			return (
				<div className="postView">
					<postView model={this.props.model} />
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

			// switch (this.state.selectedForm) {
			// 	case 'QA':
			// 		var postForm = postForms.QA;
			// 		break;
			// 	case 'PlainText':
			// 		var postForm = postForms.Plain;
			// 		break;
			// 	default:
			// 		var postForm = null;
			// }
			// {this.props.canPostForm?
			// 	(
			// 		postForm?
			// 		<postForm postUrl={this.props.collection.url}/>
			// 		:<div className="">
			// 			<button onClick={selectForm} data-form='QA'>
			// 				Fazer uma pergunta
			// 			</button>
			// 			<button onClick={selectForm} data-form='PlainText'>
			// 				Escreva um texto
			// 			</button>
			// 		</div>
			// 	)
			// 	:null
			// }

			var postForm = postForms.Plain;

			return (
				<div className="timeline">
					{this.props.canPostForm?
						<div className="header">
							<postForm postUrl={this.props.collection.url}/>
							<hr />
						</div>
						:null
					}
					{postNodes}
					{this.props.collection.EOF?
					<div className="streamSign">
						<i className="icon-exclamation"></i> Nenhuma outra atividade encontrada.
					</div>
					:<a className="streamSign" href="#" onClick={this.props.collection.tryFetchMore}>
						<i className="icon-cog"></i>Procurando mais atividades.
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
		},

		routes: {
			'posts/:postId':
				 function (postId) {
				 	this.postItem = new postModels.postItem(window.conf.postData);
				 	React.renderComponent(PostView({model:this.postItem}),
				 		document.getElementById('resultsContainer'));
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
			this.postList = new postModels.postList([], {url:url});
			React.renderComponent(TimelineView(
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

	return {
		initialize: function () {
			new WorkspaceRouter;
			Backbone.history.start({ pushState:false, hashChange:false });
		}
	};
});
