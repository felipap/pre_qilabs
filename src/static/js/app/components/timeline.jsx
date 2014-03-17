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
			return 'agora';
			var m = Math.floor(diff/1000);
			return 'há '+m+' segundo'+(m>1?'s':'');
		} else if (diff < 1000*60*60) {
			var m = Math.floor(diff/1000/60);
			return 'há '+m+' minuto'+(m>1?'s':'');
		} else if (diff < 1000*60*60*30) { // até 30 horas
			var m = Math.floor(diff/1000/60/60);
			return 'há '+m+' hora'+(m>1?'s':'');
		} else {
			var m = Math.floor(diff/1000/60/60/24);
			return 'há '+m+' dia'+(m>1?'s':'');
		}
	} else {
		if (diff < 1000*60) {
			return 'agora'; 'há '+Math.floor(diff/1000)+'s';
		} else if (diff < 1000*60*60) {
			return 'há '+Math.floor(diff/1000/60)+'min';
		} else if (diff < 1000*60*60*30) { // até 30 horas
			return 'há '+Math.floor(diff/1000/60/60)+'h';
		} else {
			return 'há '+Math.floor(diff/1000/60/60/24)+'d';
		}
	}
};

define(['jquery', 'backbone', 'components.postForms', 'components.postViews', 'underscore', 'react', 'showdown'],
	function ($, Backbone, postForms, postViews, _, React, Showdown) {

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
							<i className="icon-cog"></i>Procurando mais atividades.
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
