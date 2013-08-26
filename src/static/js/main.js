

var TagItem = Backbone.Model.extend({
	urlRoot: '/api/tags',
	defaults: {
		children: []
	},

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
		this.save();
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
		'<%= label %>',
		'</button>'].join('')),
	
	initialize: function () {
		// this.model.on(change, this.render, this);
		// this.collection.on('add', this.addOne, this);
		this.childrenView = new TagListView({collection: this.model.children, className:'children'});
		// console.log('childrenView', this.childrenView)
		// this.$el.append($("<ul class='children'/>").append(this.childrenView));
	},

	render: function () {
		var attributes = this.model.toJSON();
		console.log("TagView().render called", this)

		this.$el.html(this.template(attributes));
		this.$el.append(this.childrenView.el);

//		this.childrenView.render();
		return this;
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
		this.collection.on('reset', this.addAll, this);
	},
	
	render: function () {
		this.addAll();
	},

	addAll: function () {
		this.collection.each(function (tagItem) {
			var tagView = new TagView({model:tagItem});
			this.$el.append(tagView.render().el);
		}, this);
	}
});

var tagList = new TagList;
var tagListView = new TagListView({collection: tagList});

tagList.fetch({reset:true});
tagListView.render();
console.log(tagList);

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
