/** @jsx React.DOM */

define(['common', 'react', 'medium-editor', 'medium-editor-insert', 'typeahead-bundle'], function (common, React) {
	
	var tagStates = new Bloodhound({
		datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
		queryTokenizer: Bloodhound.tokenizers.whitespace,
		local: tagData,
	});

	tagStates.initialize();

	var TagSelectionBox = React.createClass({
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
					<li className="tag" key={tagId}>
						<span>
							{this.props.data[tagId].name}
						</span>
						<span onClick={function(){self.removeTag(tagId)}}><i className="icon-times"></i></span>
					</li>
				);
			}.bind(this));
			return (
				<div className={tags.length?'':' empty '} id="tagSelectionBox">
					<i className="iconThumbnail iconThumbnailSmall icon-tags"></i>
					<ul>{
						tags.length?
							React.addons.CSSTransitionGroup({transitionName:"animateFade"},tags)
						:(
							<div className="placeholder">Tópicos relacionados</div>
						)
					}</ul>
					<input ref="input" type="text" id="tagInput" />
				</div>
			);
		},
	});

	var PostTypeSelector = React.createClass({
		render: function () {
			var options = [{
				label: 'Pergunta',
				id: 'question',
				iconClass: 'icon-question'
			}, {
				label: 'Dica',
				id: 'tip',
				iconClass: 'icon-bulb',
			}, {
				label: 'Achievement',
				id: 'Experience',
				iconClass: 'icon-trophy'
			}];
			var optionEls = _.map(options, function (option) {
				var self = this;
				return (
					<div className="postOption" onClick={function(){self.props.onClickOption(option.id)}}>
						<div className="card">
							<i className={option.iconClass}></i>
						</div>
						<div className="info"><label>{option.label}</label></div>
					</div>
				);
			}.bind(this));
			return (
				<div className="cContainer">
					<div id="postTypeSelection">
						<label>Que tipo de publicação você quer fazer?</label>
						<div className="optionsWrapper">{optionEls}</div>
					</div>
				</div>
			);
		},
	});

	var PostForm = React.createClass({
		componentDidMount: function () {
			var postBody = this.refs.postBody.getDOMNode();
			var self = this;

			this.editor = new MediumEditor(postBody);
			$(this.refs.titleInput.getDOMNode()).keypress(function (e) {
				if (e.keyCode == 13) {
					e.preventDefault();
				}
			});

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

			setTimeout(function () {
				$('.autosize').autosize({
					append: '',
				});
			}, 1000);


			$(postBody).on('input keyup', function () {
				function countWords (s){
					var ocs = s.slice(0,s.length-4)
						.replace(/(^\s*)|(\s*$)/gi,"")
						.replace(/[ ]{2,}/gi," ")
						.replace(/\n /,"\n")
						.split(' ');
					return ocs[0]===''?(ocs.length-1):ocs.length;
				}
				var count = countWords($(postBody).text());
				$(self.refs.wordCount.getDOMNode()).html(count?(count==1?count+" palavra":count+" palavras"):'');
			});

		},
		sendPost: function () {
			var postBody = this.refs.postBody.getDOMNode();

			console.log('body', this.editor.serialize().postBody)
			var data = {
				body: this.editor.serialize().postBody.value,
				title: $("[name=post_title]").val(),
				type: $("[name=post_type]").val(),
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
				<div className="cContainer">
					<div className="formWrapper">
						<div id="formCreatePost">
							<textarea ref="titleInput" className="title autosize" name="post_title" placeholder="Título da Publicação"></textarea>
							<TagSelectionBox ref="tagSelectionBox" data={_.indexBy(tagData,'id')} />
							<div className="bodyWrapper">
								<div id="postBody" ref="postBody" placeholder="Conte a sua experiência aqui. Mínimo de 100 palavras."></div>
							</div>
							<input type="hidden" name="post_type" value={this.props.type} />
							<input type="hidden" name="_csrf" value="{{ token }}" />
						</div>
					</div>
					<div ref="wordCount" className="wordCounter"></div>
				</div>
			);
		},
	});

	return React.createClass({
		getInitialState: function () {
			return {};
		},
		selectFormType: function (type) {
			this.setState({chosenForm:type});
		},
		render: function () {
			var CSSTransition = React.addons.CSSTransitionGroup;
			return (
				<CSSTransition transitionName="animateFade">
					<div>
						<nav className="bar">
						{this.state.chosenForm?(
							<div className="navcontent">
								<ul className="right padding">
									<li>
										<a href="#" className="button plain-btn" data-action="discart-post">Cancelar</a>
									</li>
									<li>
										<button onClick={this.sendPost} data-action="send-post">Publicar</button>
									</li>
								</ul>
							</div>
						):null}
						</nav>
						{
							this.state.chosenForm?
							<PostForm type={this.state.chosenForm} />
							:<PostTypeSelector onClickOption={this.selectFormType} />
						}
					</div>
				</CSSTransition>
			);
		},
	});
});