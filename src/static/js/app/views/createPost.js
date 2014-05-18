/** @jsx React.DOM */

define(['common', 'react', 'medium-editor', 'medium-editor-insert', 'typeahead-bundle'], function (common, React) {
	
	var tagStates = new Bloodhound({
		datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
		queryTokenizer: Bloodhound.tokenizers.whitespace,
		local: tagData,
	});

	tagStates.initialize();

	var TagSelectionBox = React.createClass({displayName: 'TagSelectionBox',
		getInitialState: function () {
			return {selectedTagsIds:[]};
		},
		addTag: function (id) {
			if (this.state.selectedTagsIds.indexOf(id) === -1)
				this.setState({ selectedTagsIds: this.state.selectedTagsIds.concat(id) });
		},
		removeTag: function (id) {
			var index = this.state.selectedTagsIds.indexOf(id);
			if (index !== -1) {
				var selected = this.state.selectedTagsIds;
				selected.splice(index, 1);
				this.setState({ selectedTagsIds: selected });
			}
		},
		getSelectedTagsIds: function () {
			return this.state.selectedTagsIds;
		},
		popTag: function (id) {
			var selected = this.state.selectedTagsIds;
			if (selected.length) {
				selected.pop();
				this.setState({ selectedTagsIds: selected });
			}
		},
		componentDidMount: function () {
			$(this.refs.input.getDOMNode()).typeahead({
				highlight: true,
				hint: true,
			}, {
				name: 'tag',
				source: tagStates.ttAdapter(),
				templates: {
					empty: [
						'<div class="empty-message">',
						'Tag não encontrada',
						'</div>'
					].join('\n'),
					suggestion: _.template('<p><%= name %></p>'),
				}
			});
			var self = this;
			$(this.getDOMNode()).on('focusin focus', function () {
				$(self.getDOMNode()).addClass('focused');
				$('#tagInput').focus();
				$(self.getDOMNode()).find(".placeholder").hide();
			});
			$(this.refs.input.getDOMNode())
				.on('focusout', function () {
					$('#tagSelectionBox').removeClass('focused');
					$(self.refs.input.getDOMNode()).val('asdf');
					console.log('oi caraio')
				})
				.on('keydown', function (e) {
					var key = e.keyCode || e.charCode;
					if (key == 8 && e.target.value.match(/^\s*$/)) { // delete on backspace
						self.popTag();
					}
				});
			var self = this;
			$(this.refs.input.getDOMNode()).on('typeahead:selected', function (evt, obj) {
				self.addTag(obj.id);
			});
		},
		render: function () {
			var self = this;
			var tags = _.map(this.state.selectedTagsIds, function (tagId) {
				return (
					React.DOM.li( {className:"tag", key:tagId}, 
						React.DOM.span(null, 
							this.props.data[tagId].name
						),
						React.DOM.span( {onClick:function(){self.removeTag(tagId)}}, React.DOM.i( {className:"icon-times"}))
					)
				);
			}.bind(this));
			return (
				React.DOM.div( {className:tags.length?'':' empty ', id:"tagSelectionBox"}, 
					React.DOM.i( {className:"iconThumbnail iconThumbnailSmall icon-tags"}),
					React.DOM.ul(null, 
						tags.length?
							React.addons.CSSTransitionGroup({transitionName:"animateFade"},tags)
						:(
							React.DOM.div( {className:"placeholder"}, "Tópicos relacionados")
						)
					),
					React.DOM.input( {ref:"input", type:"text", id:"tagInput"} )
				)
			);
		},
	});

	var PageSelectPostType = React.createClass({displayName: 'PageSelectPostType',
		render: function () {
			var optionEls = _.map(_(TypeData).pairs(), function (pair) {
				var self = this;
				return (
					React.DOM.div( {className:"postOption", key:pair[0], onClick:function(){self.props.onClickOption(pair[0])}}, 
						React.DOM.div( {className:"card"}, 
							React.DOM.i( {className:pair[1].iconClass})
						),
						React.DOM.div( {className:"info"}, React.DOM.label(null, pair[1].label))
					)
				);
			}.bind(this));
			return (
				React.DOM.div( {className:""}, 
					React.DOM.nav( {className:"bar"}, 
						React.DOM.div( {className:"navcontent"}, 
							React.DOM.ul( {className:"right padding"}, 
								React.DOM.li(null, 
									React.DOM.a( {className:"button plain-btn", href:"/"}, "Voltar")
								)
							)
						)
					),
					React.DOM.div( {className:"cContainer"}, 
						React.DOM.div( {id:"postTypeSelection"}, 
							React.DOM.label(null, "Que tipo de publicação você quer fazer?"),
							React.DOM.div( {className:"optionsWrapper"}, optionEls)
						)
					)
				)
			);
		},
	});

	var TypeData = {
		'Question': {
			label: 'Pergunta',
			iconClass: 'icon-question'
		},
		'Tip': {
			label: 'Dica',
			iconClass: 'icon-bulb',
		},
		'Experience': {
			label: 'Experiência',
			iconClass: 'icon-trophy'
		}
	};

	var FakeCard = React.createClass({displayName: 'FakeCard',
		getInitialState: function () {
			return {title:"Título da "+TypeData[this.props.type].label};
		},
		setData: function (data) {
			this.setState(data);
		},
		render: function () {
			return (
				React.DOM.div( {className:"cardView"} , 
					React.DOM.div( {className:"cardHeader"}, 
						React.DOM.span( {className:"cardType"}, 
							TypeData[this.props.type].label
						),
						React.DOM.div( {className:"iconStats"}, 
							React.DOM.div(null, 
								React.DOM.i( {className:"icon-heart icon-red"})," 0"
							),
							this.props.type === "Question"?
								React.DOM.div(null, React.DOM.i( {className:"icon-bulb"})," 0")
								:React.DOM.div(null, React.DOM.i( {className:"icon-comment-o"})," 0")
							
						)
					),

					React.DOM.div( {className:"cardBody"}, 
						this.state.title
					),

					React.DOM.div( {className:"cardFoot"}, 
						React.DOM.div( {className:"authorship"}, 
							React.DOM.span( {className:"username"}, 
								this.props.author.name
							),
							React.DOM.div( {className:"avatarWrapper"}, 
								React.DOM.span(null, 
									React.DOM.div( {className:"avatar", style: { 'background': 'url('+this.props.author.avatarUrl+')' } })
								)
							)
						),

						React.DOM.time(null, "agora")
					)
				)
			);
		}
	});

	var PagePostForm = React.createClass({displayName: 'PagePostForm',
		componentDidMount: function () {
			
			var postBody = this.refs.postBody.getDOMNode(),
				postTitle = this.refs.postTitle.getDOMNode(),
				wordCount = this.refs.wordCount.getDOMNode();

			// Medium Editor
			this.editor = new MediumEditor(postBody);
			$(postBody).mediumInsert({
				editor: this.editor,
				addons: {
					images: {
						imagesUploadScript: "http://notrelative.com",
						formatData: function (data) {
							console.log(arguments);
						}
					}
				},
			});

			$(postTitle).autosize();
			$(postTitle).on('input keyup', function (e) {
				if (e.keyCode == 13) {
					e.preventDefault();
					return;
				}
				this.refs.cardDemo.setData({
					title: this.refs.postTitle.getDOMNode().value,
				})
			}.bind(this));

			$(postBody).on('input keyup', function () {
				function countWords (s){
					var ocs = s.slice(0,s.length-4).replace(/(^\s*)|(\s*$)/gi,"")
						.replace(/[ ]{2,}/gi," ")
						.replace(/\n /,"\n")
						.split(' ');
					return ocs[0]===''?(ocs.length-1):ocs.length;
				}
				var count = countWords($(postBody).text());
				$(wordCount).html(count?(count==1?count+" palavra":count+" palavras"):'');
			}.bind(this));
		},
		sendPost: function () {
			var postBody = this.refs.postBody.getDOMNode();

			console.log('body', this.editor.serialize().postBody)
			var data = {
				body: this.editor.serialize().postBody.value,
				title: $("[name=post_title]").val(),
				type: this.props.type,
				tags: this.refs.tagSelectionBox.getSelectedTagsIds(),
			};
			console.log(data)
			$.ajax({
				dataType: 'JSON',
				data: data,
				url: "/api/me/timeline/posts",
				type: "POST",
			}).done(function (response) {
				if (response.error)
					alert(response.error)
				else {
					window.location.href = response.data.path;
				}
			});
		},
		render: function () {
			return (
				React.DOM.div(null, 
					React.DOM.nav( {className:"bar"}, 
						React.DOM.div( {className:"navcontent"}, 
							React.DOM.ul( {className:"right padding"}, 
								React.DOM.li(null, 
									React.DOM.a( {href:"#", className:"button plain-btn", 'data-action':"discart-post"}, "Cancelar")
								),
								React.DOM.li(null, 
									React.DOM.button( {onClick:this.sendPost, 'data-action':"send-post"}, "Publicar")
								)
							)
						)
					),

					React.DOM.div( {className:"cContainer"}, 
						React.DOM.div( {className:"formWrapper"}, 
							React.DOM.div( {id:"formCreatePost"}, 
								React.DOM.div( {className:"cardDemo wall grid"}, 
									React.DOM.h5(null, "Visualização"),
									FakeCard( {ref:"cardDemo", type:this.props.type, author:window.user})
								),
								React.DOM.textarea( {ref:"postTitle", className:"title", name:"post_title", placeholder:"Título da "+TypeData[this.props.type].label}
								),
								TagSelectionBox( {ref:"tagSelectionBox", data:_.indexBy(tagData,'id')} ),
								React.DOM.div( {className:"bodyWrapper"}, 
									React.DOM.div( {id:"postBody", ref:"postBody", 'data-placeholder':"Conte a sua experiência aqui. Mínimo de 100 palavras."})
								)
							)
						),
						React.DOM.div( {ref:"wordCount", className:"wordCounter"})
					)
				)
			);
		},
	});

	var PostCreationView = React.createClass({displayName: 'PostCreationView',
		getInitialState: function () {
			return {};
		},
		selectFormType: function (type) {
			this.setState({chosenForm:type});
		},
		render: function () {
			return this.state.chosenForm?
				PagePostForm( {ref:"postForm", type:this.state.chosenForm} )
				:PageSelectPostType( {onClickOption:this.selectFormType} )
			;
		},
	});

	return PostCreationView;
});