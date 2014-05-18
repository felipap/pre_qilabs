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
						'<div class="empty-message">Assunto não encontrado</div>'
					].join('\n'),
					suggestion: _.template('<p><%= name %></p>'),
				}
			});
			var self = this;
			$(this.getDOMNode()).on('click focusin focus', function () {
				$(self.getDOMNode()).addClass('focused');
				$('#tagInput').focus();
				$(self.getDOMNode()).find(".placeholder").hide();
			});
			$(this.refs.input.getDOMNode())
				.on('focusout', function () {
					$('#tagSelectionBox').removeClass('focused');
					_.defer(function () {
						// $(self.refs.input.getDOMNode()).val('').prop('placeholder','Tópicos relacionados');
					});
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
						<span onClick={function(){self.removeTag(tagId)}}><i className="close-btn"></i></span>
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

	var PageSelectPostType = React.createClass({
		render: function () {
			var optionEls = _.map(_(TypeData).pairs(), function (pair) {
				var self = this;
				return (
					<div className="postOption" key={pair[0]} onClick={function(){self.props.onClickOption(pair[0])}}>
						<div className="card">
							<i className={pair[1].iconClass}></i>
						</div>
						<div className="info"><label>{pair[1].label}</label></div>
					</div>
				);
			}.bind(this));
			return (
				<div className="">
					<nav className="bar">
						<div className="navcontent">
							<span className="center"><a className="brand" href="/" tabindex="-1">QI <i className="icon-bulb"></i> Labs</a></span>

							<ul className="right padding">
								<li>
									<a className="button plain-btn" href="/">Voltar</a>
								</li>
							</ul>
						</div>
					</nav>
					<div className="cContainer">
						<div id="postTypeSelection">
							<label>Que tipo de publicação você quer fazer?</label>
							<div className="optionsWrapper">{optionEls}</div>
						</div>
					</div>
				</div>
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

	var FakeCard = React.createClass({
		getInitialState: function () {
			return {title:"Título da "+TypeData[this.props.type].label};
		},
		setData: function (data) {
			this.setState(data);
		},
		render: function () {
			return (
				<div className="cardView" >
					<div className="cardHeader">
						<span className="cardType">
							{TypeData[this.props.type].label}
						</span>
						<div className="iconStats">
							<div>
								<i className="icon-heart icon-red"></i>&nbsp;0
							</div>
							{this.props.type === "Question"?
								<div><i className="icon-bulb"></i>&nbsp;0</div>
								:<div><i className="icon-comment-o"></i>&nbsp;0</div>
							}
						</div>
					</div>

					<div className="cardBody">
						{this.state.title}
					</div>

					<div className="cardFoot">
						<div className="authorship">
							<span className="username">
								{this.props.author.name}
							</span>
							<div className="avatarWrapper">
								<span>
									<div className="avatar" style={ { 'background': 'url('+this.props.author.avatarUrl+')' } }></div>
								</span>
							</div>
						</div>

						<time>agora</time>
					</div>
				</div>
			);
		}
	});

	var PagePostForm = React.createClass({
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
				<div>
					<nav className="bar">
						<div className="navcontent">
							<span className="center"><a className="brand" href="/" tabindex="-1">QI <i className="icon-bulb"></i> Labs</a></span>

							<ul className="right padding">
								<li>
									<a href="#" className="button plain-btn" data-action="discart-post">Cancelar</a>
								</li>
								<li>
									<button onClick={this.sendPost} data-action="send-post">Publicar</button>
								</li>
							</ul>
						</div>
					</nav>

					<div className="cContainer">
						<div className="formWrapper">
							<div id="formCreatePost">
								<div className="cardDemo wall grid">
									<h5>Visualização</h5>
									<FakeCard ref="cardDemo" type={this.props.type} author={window.user}/>
								</div>
								<textarea ref="postTitle" className="title" name="post_title" placeholder={"Título da "+TypeData[this.props.type].label}>
								</textarea>
								<TagSelectionBox ref="tagSelectionBox" data={_.indexBy(tagData,'id')} />
								<div className="bodyWrapper">
									<div id="postBody" ref="postBody" data-placeholder="Conte a sua experiência aqui. Mínimo de 100 palavras."></div>
								</div>
							</div>
						</div>
						<div ref="wordCount" className="wordCounter"></div>
					</div>
				</div>
			);
		},
	});

	var PostCreationView = React.createClass({
		getInitialState: function () {
			return {};
		},
		selectFormType: function (type) {
			this.setState({chosenForm:type});
		},
		render: function () {
			return this.state.chosenForm?
				<PagePostForm ref="postForm" type={this.state.chosenForm} />
				:<PageSelectPostType onClickOption={this.selectFormType} />
			;
		},
	});

	return PostCreationView;
});