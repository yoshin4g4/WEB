odoo.define('clarico_category.snippets.editor', function (require) {
'use strict';

var animation = require('website.content.snippets.animation');
var options = require('web_editor.snippets.options');
var snippet_editor = require('web_editor.snippet.editor');
var website = require('website.website');

snippet_editor.Class.include({
    _get_snippet_url: function () {
        return '/website/snippets';
    }
});

 options.registry.js_get_category = options.Class.extend({
	drop_and_build_snippet: function(){
	      var self = this;
	      if (!self.$target.data('snippet-view')) {  	  
	        this.$target.data("snippet-view", new website.snippet.animationRegistry.js_get_category(this.$target));
	      }
	    },
	    clean_for_save:function(){
		      this.$target.empty();
	    }	
});
});
