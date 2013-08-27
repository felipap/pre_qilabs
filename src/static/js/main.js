
// main.js
// for meavisa.org, by @f03lipe

var TagItem = Backbone.Model.extend({

	idAttribute: "hashtag",
	defaults: { children: [] },

	initialize: function () {
		this.children = new TagList;
		this.collection.on('reset', this.loadChildren, this);
	},

	toggleChecked: function () {
		if (this.get('checked') === 'true') {
			this.set({'checked': 'false'});
		} else {
			this.set({'checked': 'true'});
		}
		this.save(['checked'], {patch:true});
	},

	loadChildren: function () {
		// console.log('TagItem.loadChildren', this, this.attributes.children)
		this.children.parseAndReset(this.get('children'));
		// console.log('hi, loading children', this.children, this.get('children'));
	},
});

var TagView = Backbone.View.extend({

	tagName: 	'li',
	className: 	'tag',

	template: _.template(['<button class="btn tag-btn btn-default" data-checked= <%= checked %> >',
		'<i class="<%=checked?"icon-check-sign":"icon-check-empty"%>"></i>',
		'<%= label %>',
		'</button>'].join('')),
	
	initialize: function () {
		// this.model.on(change, this.render, this);
		this.childrenView = new TagListView({collection: this.model.children, className:'children'});
	},

	render: function () {
		this.$el.html(this.template(this.model.toJSON()));
		this.$el.append(this.childrenView.el);

		return this;
	},

	events: {
		'click >button': 	'toggleChecked',
	},

	toggleChecked: function (e) {
		e.preventDefault();
		this.model.toggleChecked();
		this.$('> button > i').toggleClass('icon-check-empty');
		this.$('> button > i').toggleClass('icon-check-sign');
	},
});

var TagList = Backbone.Collection.extend({
	model: TagItem,
	url: '/api/tags',
	
	initialize: function () {
		this.on({'reset': this.onReset});
	},

	parse: function (res) {
		console.log('res', res);
		return _.toArray(res);
	},

	parseAndReset: function (object) {
		this.reset(_.toArray(object));
	},
	
	onReset: function() {
		this.each(function(t){t.loadChildren();});
	},
});

var TagListView = Backbone.View.extend({
	tagName: "ul",
	
	initialize: function () {
		this.collection.on('reset', this.render, this);
	},

	render: function () {
		this.collection.each(function (tagItem) {
			var tagView = new TagView({model:tagItem});
			this.$el.append(tagView.render().el);
		}, this);
	}
});

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

var tagList = new TagList;
var tagListView = new TagListView({collection: tagList});

tagList.fetch({reset:true});
tagListView.render();
console.log(tagList);

// Central functionality for of the app.
var app = new (Backbone.Router.extend({
	routes: {
		"": "index",
	},
	initialize: function () {
	},
	start: function () {
		Backbone.history.start({pushState: false});
		$("#tags").prepend(tagListView.el);
	},
	index: function () {
		console.log('/: index called');
	},
}));

$(function () {
	app.start();
});
