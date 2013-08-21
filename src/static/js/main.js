
var TagItem = Backbone.Model.extend({urlRoot: '/api/tags'});

var TagView = Backbone.View.extend({
	tagname: 'li',
	id: 'todo-view',
	className: 'tag',
	template: _.template('<li><%= label %></li>'),
	render: function () {
		var attributes = this.model.toJSON();
		this.$el.html(this.template(attributes));
	},
	events: {
		"click li":		"alertClick"
	},
	alertClick: function (e) {

	}
});

tagItem = new TagItem({id: 1});
tagView = new TagView({model:tagItem});

// tagItem.fetch();
todoView.render();

console.log(todoView.el);