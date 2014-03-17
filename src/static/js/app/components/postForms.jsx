/** @jsx React.DOM */

/*
** timeline.js
** Copyright QILabs.org
** BSD License
** by @f03lipe
*/

define(['jquery', 'underscore', 'react'], function ($, _, React) {

	var PlainTextForm = React.createClass({
		handleSubmit: function (evt) {
			var body = this.refs.postBody.getDOMNode().value.trim();
			if (!body) {
				return false;
			}
			$.ajax({
				type: 'post', dataType: 'json', url: this.props.postUrl,
				data: { content: { body: body }, groupId: window.groupId, type: 'PlainPost' }
			}).done(function(response) {
				app.postList.add(new Post.item(response.data));
			});
			this.refs.postBody.getDOMNode().value = '';

			return false;
		},
		render: function () {
			return (
				<form className="postInputForm" onSubmit={this.handleSubmit}>
					<h2>Enviar uma msg para o seus seguidores</h2>
					<textarea placeholder="Escreva uma mensagem aqui" ref="postBody"></textarea>
					<button data-action="send-post" type="submit">Enviar Post</button>
				</form>
			);
		}
	});

	var QAForm = React.createClass({
		handleSubmit: function (evt) {
			var body = this.refs.postBody.getDOMNode().value.trim();
			if (!body) {
				return false;
			}
			var title = this.refs.postTitle.getDOMNode().value.trim();
			if (!title) {
				return false;
			}
			$.ajax({
				type: 'post', dataType: 'json', url: this.props.postUrl,
				data: {
					content: {
						title: title,
						body: body,
					},
					groupId: window.groupId,
					type: 'PlainText'
				},
			}).done(function(response) {
				app.postList.add(new Post.item(response.data));
			});
			this.refs.postBody.getDOMNode().value = '';

			return false;
		},
		render: function () {
			return (
				<form className="postInputForm" onSubmit={this.handleSubmit}>
					<h2>Faça uma pergunta aos seus seguidores</h2>
					<input type="text" placeholder="Escreva um título aqui" ref="postTitle" />
					<textarea placeholder="Escreva uma mensagem aqui" ref="postBody"></textarea>
					<button data-action="send-post" type="submit">Enviar Post</button>
				</form>
			);
		}
	});

	return {
		'Plain': PlainTextForm,
		'QA': QAForm,
	};
});
