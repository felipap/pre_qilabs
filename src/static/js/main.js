
// main.js
// for meavisa.org, by @f03lipe

var Tag = (function (window, undefined) {

	var TagItem = Backbone.Model.extend({

		idAttribute: "hashtag",

		defaults: { children: [], description: "blábláblá" },

		initialize: function () {
			this.children = new TagList;
			this.collection.on('reset', this.loadChildren, this);
		},

		// The solo interaction of the user with the tags.
		toggleChecked: function (callback) {
			callback = callback || function(){};
			var checked = this.get('checked');
			// Also check for string, just to be safe.
			if (checked && checked !== 'false')
				this.set({'checked': false});
			else
				this.set({'checked': true});
			// .save() through tagsList.save(), right?
			// this.save(['checked'], {patch:true}); // , success: callback, error: callback});
		},

		// Load the content from this.attributes['children'] into this.children
		// (a TagList). This is essential to allow the nested strategy to work.
		loadChildren: function () {
			this.children.parseAndReset(this.get('children'));
		},
	});

	var TagView = Backbone.View.extend({

		tagName: 'li',

		// template: _.template($("#template-tagview").html()),
		
		initialize: function () {
			this.hideChildren = true;
			this.childrenView = new TagListView({collection: this.model.children, className:'children'});
		},

		render: function () {
			console.log('rendering', this.model.toJSON())
			TemplateManager.get('/api/tags/template', function (err, tmpl) {
				this.$el.html(_.template(tmpl, {tag: this.model.toJSON()}));
				if (this.hideChildren) {
					this.childrenView.$el.hide();
				}
				// render childrenViews
				this.$el.append(this.childrenView.el);
				this.$("> .info").popover({
					content: this.description,
					trigger: 'hover',
					container: 'body',
					html: true
				});
			}, this);
			return this;
		},

		events: {
			'click >.tag': 'tgChecked',
			'click >.expand':  'tgShowChildren',
		},

		tgChecked: function (e) {
			console.log('ok')
			e.preventDefault();
			this.model.toggleChecked();
			this.render();
		},

		tgShowChildren: function (e) {
			e.preventDefault();
			this.hideChildren = !this.hideChildren;
			this.$('>.expand i').toggleClass("icon-angle-down");
			this.$('>.expand i').toggleClass("icon-angle-up");
			this.childrenView.$el.toggle();
		},
	});

	var TagList = Backbone.Collection.extend({
		model: TagItem,
		url: '/api/tags',
		
		initialize: function () {
			this.on({'reset': this.onReset});
		},

		parse: function (res) {
			return _.toArray(res);
		},

		parseAndReset: function (object) {
			this.reset(_.toArray(object));
		},
		
		onReset: function() {
			this.each(function(t){t.loadChildren();});
		},
		
		save: function (callback) {
			$.post(this.url, {'checked': this.getCheckedTags()}, callback);
		},

		getChecked: function () {
			var tags = this.chain()
				.map(function rec(t){return [t].concat((t.children.length)?t.children.map(rec):[]) })
				.flatten()
				.value();
			return tags.filter(function(t){return t.get('checked') === true;});
		},

		getCheckedTags: function () {
			return this.getChecked().map(function(t){return t.get('hashtag');});
		}
	});

	var TagListView = Backbone.View.extend({
		tagName: "ul",
		_views: [],

		initialize: function () {
			this.collection.on('reset', this.addAll, this);
		},

		addAll: function () {
			this._views = [];
			this.collection.each(function(tagItem) {
				this._views.push(new TagView({model:tagItem}));
			}, this);
			return this.render();
		},

		render: function () {
			var container = document.createDocumentFragment();
			// render each tagView
			_.each(this._views, function (tagView) {
				container.appendChild(tagView.render().el)
			}, this);
			this.$el.empty();
			this.$el.append(container);
			return this;
		}
	});

	return {
		item: TagItem,
		list: TagList,
		view: TagView,
		listView: TagListView,
	}
})(this);

var Post = (function (window, undefined) {
	var PostItem = Backbone.Model.extend({
	});

	var PostView = Backbone.View.extend({
		tagName: 'li',
		// template: _.template($("#template-tagview").html()),
		initialize: function () {
			this.model.collection.on('reset', this.destroy, this);
		},
		destroy: function () {
			console.log('Removing me ="(', this);
			this.remove();
		},
		render: function () {
			TemplateManager.get('/api/posts/template', function (err, tmpl) {
				this.$el.html(_.template(tmpl, {post: this.model.toJSON()}));
			}, this);
			return this;
		},
	});

	var PostList = Backbone.Collection.extend({
		model: PostItem,
		url: '/api/posts',
	});

	var PostListView = Backbone.View.extend({
		el: "#posts",
		_views: [],
		template: _.template('<% if (!length) { %>\
			<h3 style="color: #888">Ops! Você não está seguindo tag nenhuma. :/</h3>\
			<% } %>\
			<hr>'),
		
		initialize: function () {
			this.collection.on('reset', this.addAll, this);
		},

		addAll: function () {
			console.log('doing new stuff', this);
			var views = [];
			this.collection.each(function(postItem) {
				views.push(new PostView({model:postItem}));
			}, this);
			this._views = views;
			return this.render();
		},

		render: function () {
			var container = document.createDocumentFragment();
			// render each postView
			_.each(this._views, function (postView) {
				container.appendChild(postView.render().el)
			}, this);
			this.$el.empty();
			this.$el.append(container);
			return this;
		}
	});

	return {
		item: PostItem,
		list: PostList,
		view: PostView,
		listView: PostListView,
	}
})(this);

// Quick first-attempt at a TemplateManager for the views.
// Not sure if this is production-quality solution, but for now it'll save
// me the pain of having to wait for the app to reload everytime the html is
// changed.
var TemplateManager = {
	get: function (url, callback, context) {
		var template = this.templates[url];
		if (template)
			callback.call(context, null, template);
		else {
			var that = this;
			$.get(url, function (tmpl) {
				that.templates[url] = tmpl;
				callback.call(context, null, tmpl);
			})
		}
	},
	templates: {},
}

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


// Central functionality for of the app.
var app = new (Backbone.Router.extend({
	
	initialize: function () { },
	
	start: function () {
		Backbone.history.start({pushState: false});

		this.tagList = new Tag.list;
		this.tagListView = new Tag.listView({collection: this.tagList});
		$("#tags").prepend(this.tagListView.$el);
		this.tagList.parseAndReset(window._tags);

		this.postList = new Post.list;
		this.postListView = new Post.listView({collection: this.postList});
		$("#posts").prepend(this.postListView.$el);
		this.postList.reset(window._posts);
	},

	previewPosts: function () {
		this.postList.fetch({
			data: {tags: app.tagList.getCheckedTags().join(',')},
			processData: true,
			reset: true,
		})
	},

	confirmTags: function (callback) {
		this.tagList.save(callback);
	},
	
	routes: { "": "index", },
	index: function () { },
}));

$(function () {
	app.start();
});
