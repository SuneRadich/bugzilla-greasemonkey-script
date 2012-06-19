// ==UserScript==
// @name        Bugzilla Attachment Preview and other Mods
// @namespace   http://userscripts.org/scripts/show/107207
// @include     https://bugzilla.*.dk/*
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.7/jquery.min.js
// @description Shows attached images. Modifications of Orphu of Io (Bugzilla - Simple Modification) and Nikita Vasilyev (Bugzilla attachments preview 1.0) and custom highlight of specific bug titles
// @copyright   2011+, Mark Young, 2012 Sune Radich Christensen
// @version     1.3.1
// @licence     MIT
// ==/UserScript==

(function(){

	var page = window.location.href, // get the location href to find out what page is loaded
		page_uri = window.location.pathname.substr(10) + window.location.search, //grab the page URI
		$comments = $('#comments'),
		$bz_comment = $('.bz_comment'),
		$bz_comment_table = $('.bz_comment > table'),
		$bz_comment_div_pre = $("#comments > div pre"),
		$bugzilla_body = $('#bugzilla-body'),
		$bz_head = $('head'),
		$bz_head_style = $bz_head.find('style'),
		$ul_links_li = $('#header ul.links li'),
		$saved_links = $('#links-saved ul.links li'),
		usefulLinks = $('#useful-links li');

	$ul_links_li.find('span.separator').remove();//remove delimiters from top menu
	$saved_links.find('span.separator').remove();//remove delimiters from saved links
	usefulLinks.find('span.separator').remove();//remove delimiters from saved links

	$('body').css('background', 'lightgrey');//change document background color to grey

	$('form[action="process_bug.cgi"] td:first, form[action="post_bug.cgi"] td:first').css({'width': '100%'});//make form wider

	//make comments block wider
	//$('#comment').css({'width': '900px'});

	//make summary input wider
	$('#short_desc').css({'width': '810px'});

	//avoid duplicate style insertion
	if ($bz_head_style.length < 1) {
		$bz_head.append('<style/>');
		$bz_head_style = $bz_head.find('style');
	}

	// START: MENU processing
	$bz_head_style.append('' +
		'#header ul.links li a, #links-saved ul.links li a, #useful-links li a { ' +
		'-moz-background-clip: border;' +
		'-moz-background-inline-policy: continuous;' +
		'-moz-background-origin: padding;' +
		'border-radius: 5px;' +
		'padding: 2px 8px;' +
		'text-decoration: none;' +
		'position: relative;' +
		'}' +
		'#header #lang_links_container ul.links li {display: inline-block;}' +
		'#header ul.links li a:hover, #links-saved ul.links li a:hover, #useful-links li a:hover {' +
		'background-color: #f90;' +
		'color: #192228;' +
		'}' +
		'.nactiveM{' +
		'color: #fff; ' +
		'background-color: #777 ' +
		'}' +
		'.activeM {' +
		'color: #fff; ' +
		'background-color: #f90 ' +
		'}' +
		'.nactiveM[href="#"] { display: none !important; }' +
		'.lang_current { display: none; }' +
		'');

	//set the default style to all the items
	$ul_links_li.each(function(i){
		$(this).find('a').addClass('nactiveM');
	});


	$ul_links_li.each(function(){
		var $curr_a = $(this).find('a'),
			$curr_link = $(this).find('a').attr('href');

		if ($curr_link == page_uri) {
			// highlight the ative item in the top menu
			$curr_a.removeClass('nactiveM').addClass('activeM');
		} else {
			$curr_a.removeClass('activeM').addClass('nactiveM');
		}
	});

	usefulLinks.each(function(){
			var $curr_a = $(this).find('a'),
				$curr_link = $(this).find('a').attr('href');

			if ($curr_link == page_uri) {
				// highlight the ative item in the top menu
				$curr_a.removeClass('nactiveM').addClass('activeM');
			} else {
				$curr_a.removeClass('activeM').addClass('nactiveM');
			}
		});

	//the same as above but for saved_links
	$saved_links.each(function(){
		var $curr_a = $(this).find('a'),
			$curr_link = $(this).find('a').attr('href');

		if ($curr_link == page_uri) {
			$curr_a.removeClass('nactiveM').addClass('activeM');// highlight the ative item in the saved_links menu
		} else {
			$curr_a.removeClass('activeM').addClass('nactiveM');
		}
	});
	// END: MENU processing

	$bugzilla_body.find('div.tabbed').show();// show the tabs on the top
	$('#knob').show();// show comments block
	$('#page-index').show();// show the info block on home page

	//  START: Comments processing
	if (page.match(/show_bug.cgi/)) {//load only on show_bug page

		$('#comments > div:odd').css("background-color", "#F0EFC9");//alternate colors for odd comments
		$('#comments > div:even').css("background-color", "#E5F3F9");//alternate colors for even comments

		$bz_comment.append('<span style="font-size: 90%"><a href="#comments">Top</a></span>'); //add a link to top on the bottom of every comment

	}
	//  END: Comments processing
	// START: Show/Hide bugs depending on status
	if (page.match(/buglist.cgi?/))//load only on buglist page
	{
		//function to create the bugs combo box for show/hide
		function bugsCombo(divClassName, selectClassName, name, defaultValName){
			htmlBugsCombo = '<div class="' + divClassName + '_combo">' + name + ': ' +
				'<select class="' + selectClassName + '" size="1" name="' + selectClassName + '">' +
				'<option value="NONE">' + defaultValName + '</option>' +
				'<option value="UNCONFIRMED">UNCONFIRMED </option>' +
				'<option value="NEW">NEW </option>' +
				'<option value="ASSIGNED">ASSIGNED </option>' +
				'<option value="REOPENED">REOPENED </option>' +
				'<option value="RESOLVED">RESOLVED </option>' +
				'<option value="VERIFIED">VERIFIED </option>' +
				'<option value="CLOSED">CLOSED </option>' +
				'</select></div>';
			return htmlBugsCombo;
		}

		var $bz_buglist_tr = $(".bz_buglist tbody tr.bz_bugitem"),
			hideBugsCombo = bugsCombo('hide_by_status', 'hide_bug_status', 'Hide', 'NONE'),
			showBugsCombo = bugsCombo('show_by_status', 'show_bug_status', 'Show', 'ALL'),
			$bz_buglist = $(".bz_buglist"),
			$tr_bz_bugitem = $("tr.bz_bugitem");

		if ($('.hide_by_status_combo').length <= 1) {
			$bugzilla_body.prepend(hideBugsCombo + showBugsCombo);//add Show/Hide bugs combo to top
			$bugzilla_body.append(hideBugsCombo + showBugsCombo);//add Show/Hide bugs combo to top
			$(".hide_by_status_combo, .show_by_status_combo").css({'display': 'inline', 'padding': '0px 5px 0px 0px'});
		}
		//hide bugs depending on status
		$(".hide_bug_status").change(function(){
			var selVal = $(this).val();
			if (selVal === 'NONE') {
				$bz_buglist_tr.show();
			} else {
				$bz_buglist_tr.show().filter("tr.bz_" + selVal + "").hide();
			}
			return false;
		});
		//show bugs depending on status
		$(".show_bug_status").change(function(){
			var selVal = $(this).val();
			if (selVal === 'ALL') {
				$bz_buglist_tr.show();
			} else {
				$bz_buglist_tr.hide().filter("tr.bz_" + selVal + "").show();
			}
			return false;
		});

		$($bz_buglist).next().next().find('form').css({
			'display': 'inline'
		});

		//change buglist table header background color
		$bz_buglist.find('tr:first').css({
			"background-color": "#404D6C",
			"color": "#fff"
		});

		//change buglist table header links color
		$bz_buglist.find('tr:first a').css({
			"color": "#fff"
		});
	}
	// END: Show/Hide bugs depending on status

	// START: Style the New bug page
	if (page.match(/enter_bug.cgi\?/) === null)//load only on enter_bug page, but not on new bug form page
	{
		if (page.match(/enter_bug.cgi/))//load only on enter_bug page
		{
			$bz_head_style.append('' +
				'.highlight{ background-color: #F7F7F7 }' +
				'');
			var win = {
				'w': $(window).width(),
				'h': $(window).height()
			},
				topmenu_h = $('#gap').height() + 50,
				header_h = $('#header').height(),
				footer_h = $('#footer').height()
				;
			$bugzilla_body.css({
				'height': ((win.h - header_h - footer_h - topmenu_h) + 'px'),
				'overflow': 'auto',
				'border': '1px solid #404D6C'
			});
			$bugzilla_body.find('tr:odd').addClass('highlight');
		}
	}
	// END: Style the New bug page

	/**
	 * Remove XML button
	 * @author Sune Radich Christensen
	 */
	$('#xml').remove();

	/**
	 * Add preview of attached images
	 */
	[].forEach.call(document.querySelectorAll("#attachment_table .bz_attach_extra_info"), function(a){
		if (a.textContent.indexOf("image/") > -1) {
			var img = new Image();
			img.style.display = "block";
			img.style.maxWidth = "900px";
			img.src = a.previousElementSibling.href;
			img.className = "resizable-image";
			a.parentNode.insertBefore(img, a.parentNode.firstChild);
		}

	});


	var regexp = /\[(\D+)\]/;   //at least one char, of any non didget type

	//Get all columns that contain the title of the bug
	$('.bz_short_desc_column', '.bz_buglist').each(function(index, item){

		var content = $(item),
			matched = content.html().match(regexp), //test if the title contains the string of the format [SOMETEXT]
			color = '#555';	//default color

		if (matched !== null) {

			switch (matched[1]) {
				case 'BugToSelf':
					color = '#f80';
					break;
				case 'Element konfiguration':
					//Fallthough to default
				default:
				//do nothing
			}
			content.html(content.html().replace(matched[0], '<span style="font-weight:bold; color:' + color + '">' + matched[0] + '</span>'));
		}

	});


}());
