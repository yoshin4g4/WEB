odoo.define('clarico_product_carousel.snippets.editor', function (require) {
'use strict';
var ajax = require("web.ajax");
var core = require("web.core");
var rpc = require('web.rpc');
var Dialog = require("web.Dialog");
var editor = require("web_editor.editor");
var animation = require('website.content.snippets.animation');
var options = require('web_editor.snippets.options');
var snippet_editor = require('web_editor.snippet.editor');
var website = require('website.website');

var _t = core._t;

snippet_editor.Class.include({
    _get_snippet_url: function () {
        return '/website/snippets';
    }
});

options.registry.js_get_objects = options.Class.extend({
	drop_and_build_snippet: function(){
	      var self = this;
	      
	      if (!self.$target.data('snippet-view')) {  	  
	        this.$target.data("snippet-view", new website.snippet.animationRegistry.js_get_objects(this.$target));
	      }
	    },
	    clean_for_save:function(){
		      this.$target.empty();
	    },
	    onBuilt: function () {
			this.id = 'pcarousel' + new Date().getTime();
	    	this.$target.attr('id', this.id);
	    }
});

options.registry.js_get_selectFilter =  options.Class.extend({
	start: function() {
	      this._super();
	      var self      = this;
	      rpc.query({
	    	    model: 'website.filter.ept',
	    	    method: 'search_read',
	    	    args: [[['website_published','=',true],['filter_id.model_id','=','product.template']],['name','filter_id','id']],
	    	}).then(function(filters){
	        self.createwebsitefiltersList(filters)
	      }) 
	      .fail(function (e) {
	        var Error_heading = _t("Problem Loading Slider"),
	        Error_msg   = $("<div contenteditable='false' class='message error text-center'><h2>"+ Error_heading +"</h2><code>"+ e.data.message + "</code></div>" );
	        self.$target.append(Error_msg)
	        return;
	      });
	    },

	    createwebsitefiltersList: function(filters)
	    {
	      var self = this;
	      var ul = null;
	      setTimeout(function(){
	        ul = self.$overlay.find(".snippet-option-js_get_selectFilter > ul");
	        $(filters).each(function(){
	          var filter = $(this);

	          var li = $('<li data-filter_by_filter_id="' + filter[0].id + '"><a>' + filter[0].name+ '</a></li>');
	          ul.append(li);
	        });
	        if (self.$target.attr("data-filter_by_filter_id")) {
	          var id = self.$target.attr("data-filter_by_filter_id");
	          ul.find("li[data-filter_by_filter_id=" + id  + "]").addClass("active");
	        }
	      },100)
	    },
	    filter_by_filter_id:function(previewMode, value){
	        var self = this
	        var value = parseInt(value);
	        this.$target.attr("data-filter_by_filter_id",value)
	                    .data("filter_by_filter_id",value)
	                    .data('snippet-view').redrow(true);
	      },
	      _setActive: function () {
	          this.$el.find('li[data-filter_by_filter_id]').removeClass('active')
	              .filter('li[data-filter_by_filter_id=' + this.$target.attr('data-filter_by_filter_id') + ']').addClass('active');
	      }
	  });

options.registry.js_get_filter_products_limit =  options.Class.extend({
	start:function(){
      var self = this;
      setTimeout(function(){
        var ul = self.$overlay.find(".snippet-option-js_get_filter_products_limit > ul");
        if (self.$target.attr("data-objects_limit")) {
          var limit = self.$target.attr("data-objects_limit");
          ul.find('li[data-objects_limit="' + limit + '"]').addClass("active");
        } else {
          ul.find('li[data-objects_limit="10"]').addClass("active");
        }
      },100)
    },
    objects_limit:function(previewMode, value){
        var self = this
        var value = parseInt(value);
        this.$target.attr("data-objects_limit",value)
                    .data("objects_limit",value)
                    .data('snippet-view').redrow(true);
      },
      _setActive: function () {
          this.$el.find('li[data-objects_limit]').removeClass('active')
              .filter('li[data-objects_limit=' + this.$target.attr('data-objects_limit') + ']').addClass('active');
      },
});

options.registry.js_get_type =  options.Class.extend({
	start:function(){
      var self = this;
      setTimeout(function(){
        var ul = self.$overlay.find(".snippet-option-js_get_type > ul");
        if (self.$target.attr("data-c_type")) {
          var limit = self.$target.attr("data-c_type");
          ul.find('li[data-c_type="' + limit + '"]').addClass("active");
        } else {
          ul.find('li[data-c_type="1"]').addClass("active");
        }
      },100)
    },
    c_type:function(previewMode, value){
        var self = this
        var value = parseInt(value);
        this.$target.attr("data-c_type",value)
                    .data("c_type",value)
                    .data('snippet-view').redrow(true);
      },
      _setActive: function () {
          this.$el.find('li[data-c_type]').removeClass('active')
              .filter('li[data-c_type=' + this.$target.attr('data-c_type') + ']').addClass('active');
      }
});
options.registry.js_get_product_in_slidesToShow =  options.Class.extend({
	start:function(){
	      var self = this;
	      setTimeout(function(){
	        var ul = self.$overlay.find(".snippet-option-js_get_product_in_slidesToShow > ul");
	        if (self.$target.attr("data-objects_in_slide")) {
	          var prd_limit = self.$target.attr("data-objects_in_slide");
	          ul.find('li[data-objects_in_slide="' + prd_limit + '"]').addClass("active");
	        } else {
	          ul.find('li[data-objects_in_slide="4"]').addClass("active");
	        }
	      },100);
	    },
	    objects_in_slide:function(previewMode, value){
	        var self = this
	        var value = parseInt(value);
	        this.$target.attr("data-objects_in_slide",value)
	                    .data("objects_in_slide",value)
	                    .data('snippet-view').redrow(true);
	      },
	      _setActive: function () {
	          this.$el.find('li[data-objects_in_slide]').removeClass('active')
	              .filter('li[data-objects_in_slide=' + this.$target.attr('data-objects_in_slide') + ']').addClass('active');
	      }
});

options.registry.js_get_label =  options.Class.extend({
	start:function(){
      var self = this;
      setTimeout(function(){
        var ul = self.$overlay.find(".snippet-option-js_get_label > ul");
        if (self.$target.attr("data-sale_label")) {
          var limit = self.$target.attr("data-sale_label");
          ul.find('li[data-sale_label="' + limit + '"]').addClass("active");
        } else {
          ul.find('li[data-sale_label="0"]').addClass("active");
        }
      },100)
    },
    sale_label:function(previewMode, value){
        var self = this
        var value = parseInt(value);
        this.$target.attr("data-sale_label",value)
                    .data("sale_label",value)
                    .data('snippet-view').redrow(true);
      },
      _setActive: function () {
          this.$el.find('li[data-sale_label]').removeClass('active')
              .filter('li[data-sale_label=' + this.$target.attr('data-sale_label') + ']').addClass('active');
      }

});

options.registry.js_get_rating =  options.Class.extend({
	start:function(){
      var self = this;
      setTimeout(function(){
        var ul = self.$overlay.find(".snippet-option-js_get_rating > ul");
        if (self.$target.attr("data-get_rating")) {
          var limit = self.$target.attr("data-get_rating");
          ul.find('li[data-get_rating="' + limit + '"]').addClass("active");
        }
          else {
              ul.find('li[data-get_rating="0"]').addClass("active");
        }
        
      },100)
    },
    get_rating:function(previewMode, value){
        var self = this
        var value = parseInt(value);
        this.$target.attr("data-get_rating",value)
                    .data("get_rating",value)
                    .data('snippet-view').redrow(true);
      },
      _setActive: function () {
          this.$el.find('li[data-get_rating]').removeClass('active')
              .filter('li[data-get_rating=' + this.$target.attr('data-get_rating') + ']').addClass('active');
      }
});


});
