
/*
** postModels.js
** Copyright QILabs.org
** BSD License
** by @f03lipe
*/

define(['jquery', 'backbone', 'underscore', 'react'], function ($, Backbone, _, React) {

	var GenericPostItem = Backbone.Model.extend({
		url: function () {
			return this.get('apiPath');
		},
	});

	var PostItem = Backbone.Model.extend({
		url: function () {
			return this.get('apiPath');
		},

		handleToggleVote: function () {
			var self = this;

			if (this.get('meta').selfVoted)
				var url = post.apiPath+'/upvote';
			else
				var url = post.apiPath+'/unupvote';

			$.ajax({
				type: 'post',
				dataType: 'json',
				url: url,
			}).done(function (response) {
				console.log('response', response);
				if (!response.error) {
					self.set(response.data);
				}
			});
		},

		initialize: function () {
			var children = this.get('children') || {};

			for (var k in children)
			if (children.hasOwnProperty(k)) {
			}
			
			this.commentList = new CommentList(children.Comment);
			this.commentList.postItem = this.postItem;
			this.answerList = new AnswerList(children.Answer);
			// if (this.get('hasComments')) {
			// 	this.commentList.fetch({reset:true});
			// }
		},
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

	var AnswerItem = GenericPostItem.extend({

		initialize: function () {
			var children = this.get('children');
			if (children) {
				this.commentList = new CommentList(children.Comment);
				this.commentList.postItem = this.postItem;
				this.answerList = new AnswerList(children.Answer);
			}
		}
	});
	
	var AnswerList = Backbone.Collection.extend({
		model: AnswerItem,	
		comparator: function (i) {
			// do votes here! :)
			return -1*new Date(i.get('published'));
		}
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

	return {
		postItem: PostItem,
		answerItem: AnswerItem,
		commentItem: CommentItem,
		postList: PostList
	}
});