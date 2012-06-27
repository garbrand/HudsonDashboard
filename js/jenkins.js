var Jenkins = function( project, selector ) {
	
	if ( typeof project == 'undefined' ) return 'Please provide a project name';
	selector = selector || 'body';
	
	// Main model
	var status = {};
	// strip 'sipes.' from the project name
	status.project = project.replace("sipes.","");;

	// URLs of services
	var url = {};
	url.base = 'https://hudson.informaat.nl/job/';
	url.build = project + '/lastBuild/api/json';
	
	switch(project) {
	case 'sipes.api':
		url.coverage = 'sipes/Coverage_Reports/api-coverage.html';
		break;
	case 'sipes.client':
		url.coverage = 'sipes/Coverage_Reports/client-coverage.html';
		break;
	};
	
	var $placeholder = $({});
	
	var timer; // timer interval id

	
	// sipes.api:
	// lastBuild: https://hudson.informaat.nl/job/sipes.api/lastBuild/api/json
	// coverage: https://hudson.informaat.nl/job/sipes/Coverage_Reports/api-coverage.html
	
	// sipes.client:
	// lastBuild: https://hudson.informaat.nl/job/sipes.api/lastBuild/api/json
	// coverage: https://hudson.informaat.nl/job/sipes/Coverage_Reports/client-coverage.html
	
	var model = {
		getLastBuild: function() {
			return jQuery.getJSON( url.base + url.build +'?jquery&jsonp=?' );
		}
		
		, getCoverage: function() {
			return $.ajax(url.base + url.coverage);
			// return $.ajax('tests/stubs/coverage.html');
		}
		
		, scrapeCoveragePercentage: function(report) {
			var $report = $(report);
			var percentage = $report.find('#stats:first .percentage').text();
			return percentage;
		}
		
		, createCoverageIframe: function( callback ) {
			// Implemented as a `$.Deferred`
			var def = $.Deferred();
			var $iframe = $('<iframe id="coverage-' + status.project + '" src="' + url.base + url.coverage + '" style="display: none;"></iframe>');
			$iframe.appendTo('body');
			// $iframe.load( callback( $iframe.contents() ));
			$iframe.load( function() {
				def.resolve($(this));
			} );
			return def.promise();
		}
		
		, parseBuild: function(build) {
			var stat = {};
			stat.person = build.culprits[0].fullName.split(' ')[0];
			stat.status = build.result;
			
			return stat;
		}
		
		
		, fetch: function( callback ) {
			// Execute the 2 loads in parrallel as deferreds:
			jQuery
			.when( model.getLastBuild(), model.getCoverage() )
			// .when( model.getLastBuild(), model.createCoverageIframe() )
			.done(function(build, coverage) {
				// TODO: check for errors, handle them
				var tmp = model.parseBuild(build[0]);
 				status.person = tmp.person;
				status.status = tmp.status;
				
				status.coverage = model.scrapeCoveragePercentage(coverage[0]);
				// status.coverage = model.scrapeCoveragePercentage(coverage.contents());
				
				callback( status );
			});
		}
	};
	
	var view = {
		template: function(data) {
			return '<article id="' + data.project + '" class="' + data.status + '">'
			+ '<h2>' + data.project + '</h2>'
			+ '<dl>'
			+ '<dt>Coverage</dt>'
			+ '<dd>' + data.coverage + '</dd>'
			+ '<dt>Push</dt>'
			+ '<dd>' + data.person + '</dd>'
			+ '</dl>'
			+ '</article>';
		}
		
		, render: function(data) {
			var item = view.template( data );
			var $view = $('#' + data.project);
			
			// TODO: does this return either $view or $(body)?
			return ($view.length) ? $view.replaceWith( item ) : $(selector).append( item );
		}
		
		, pulse: function($element) {
			$element.animate({opacity: 0.2}, 500).animate({opacity: 1}, 500, function() { view.pulse($element); });
		}
	};
	
	var controller = {
		poll: function( interval ) {
			interval = interval || 10 * 1000;
			
			// If a timer was previously set, clear it:
			if(timer) controller.stop( timer );
			
			// TODO: the timer will just increment infinitely. At some the int will be to large; reload the page when the timer > 8640 (this is once every 24h)
			
			// Set a new timer:
			timer = setTimeout( controller.init, interval );
			return timer;
		}
		
		, stop: function( timer ) {
			clearTimeout( timer );
			return 'stopped polling';
		}
		
		, init: function() {
			model.fetch(view.render);
			controller.poll();
			
			// TODO: add a check for failure, call view.pulse() on it
		}
		
		, getCoverage: function() {
			model.createCoverageIframe(model.scrapeCoveragePercentage);
		}
	};

	var api = {
		  init: controller.init
		, poll: controller.poll
		, stop: controller.stop
		, frame: controller.getCoverage
	};
	
	return api;
};