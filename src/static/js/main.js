
var TagItem = Backbone.Model.extend({
	urlRoot: '/api/tags',
	toggleChecked: function () {
		if (this.get('checked') === 'true') {
			this.set({'checked': 'false'});
		} else {
			this.set({'checked': 'true'});
		}
		this.save();
	}
});

var TagView = Backbone.View.extend({
	className: 'tag',
	tagname: 'li',
	id: 'todo-view',

	template: _.template('<li>Oi né<%= label %><% if (checked === "true") print("checked") %></li>'),
	
	initialize: function () {
		// this.model.on(change, this.render, this);
		this.collection.on('add', this.addOne, this);
	},

	render: function () {
		var attributes = this.model.toJSON();
		this.$el.html(this.template(attributes));
	},

	addOne: function () {
		console.log('this was called (TagView.addOne)')
		// var fV = new 
	},
	
	events: {
		"click li":		"alertClick",
		"change input":	"toggleChecked",
	},

	toggleChecked: function (e) {
		this.model.toggleChecked();
	}
});

var TagList = Backbone.Collection.extend({
	model: TagItem,
	url: '/api/tags'
});

var TagListView = Backbone.View.extend({
	render: function () {
		console.log('oi', this.collection)
		this.collection.forEach(this.addOne, this);
	},
	addOne: function (tagItem) {
		console.log('rendering one', tagItem)
		var tagView = new TagView({model:tagItem});
		this.$el.append("<a>a</a>")// tagView.render().el);
	},
});

var tagList = new TagList();
tagList.fetch();
var tagListView = new TagListView({collection: tagList});
tagListView.render();
console.log(tagListView.el);
// tagItem = new TagItem({id: 1});

// tagItem.fetch();
tagListView.render();
$("fieldset").append(tagListView.el);
console.log(tagListView.el);
