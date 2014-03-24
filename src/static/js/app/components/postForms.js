/** @jsx React.DOM */

/*
** timeline.js
** Copyright QILabs.org
** BSD License
** by @f03lipe
*/

define(['jquery', 'underscore', 'react', 'components.postModels'], function ($, _, React, postModels) {

	var PlainTextForm = React.createClass({displayName: 'PlainTextForm',
		handleSubmit: function (evt) {
			var body = this.refs.postBody.getDOMNode().value.trim();
			if (!body) {
				return false;
			}
			$.ajax({
				type: 'post', dataType: 'json', url: this.props.postUrl,
				data: { content: { body: body }, groupId: window.groupId, type: 'PlainPost' }
			}).done(function(response) {
				app.postList.add(new postModels.postItem(response.data));
			});
			this.refs.postBody.getDOMNode().value = '';

			return false;
		},
		render: function () {
			return (
				React.DOM.form( {className:"postInputForm", onSubmit:this.handleSubmit}, 
					React.DOM.h2(null, "Enviar uma msg para o seus seguidores"),
					React.DOM.textarea( {placeholder:"Escreva uma mensagem aqui", ref:"postBody"}),
					React.DOM.button( {'data-action':"send-post", type:"submit"}, "Enviar Post")
				)
			);
		}
	});

	var QAForm = React.createClass({displayName: 'QAForm',
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
					type: 'QA'
				},
			}).done(function(response) {
				app.postList.add(new postModels.postItem(response.data));
			});
			this.refs.postBody.getDOMNode().value = '';

			return false;
		},
		render: function () {
			return (
				React.DOM.form( {className:"postInputForm", onSubmit:this.handleSubmit}, 
					React.DOM.h2(null, "Faça uma pergunta aos seus seguidores"),
					React.DOM.input( {type:"text", placeholder:"Escreva um título aqui", ref:"postTitle"} ),
					React.DOM.textarea( {placeholder:"Escreva uma mensagem aqui", ref:"postBody"}),
					React.DOM.button( {'data-action':"send-post", type:"submit"}, "Enviar Post")
				)
			);
		}
	});

	return {
		'Plain': PlainTextForm,
		'QA': QAForm,
	};
});
