
require(['common', 'components.timeline'], function (common, timeline) {
	timeline.initialize();

	$('#istilldidnt').click(function (evt) {
		var id = $('#trust').val();
		if (!id) return;

		$.ajax({
			type: 'post',
			dataType: 'json',
			url: '/api/labs/'+_lab.id+'/addUser/'+id,
		}).done(function () {
			console.log(arguments);
		});
	});
});