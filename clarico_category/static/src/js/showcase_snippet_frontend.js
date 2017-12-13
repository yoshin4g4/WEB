odoo.define('clarico_category.snippets.animation', function (require) {
'use strict';
var ajax = require('web.ajax');
var base = require('web_editor.base');
var animation = require('website.content.snippets.animation');
var no_of_product;

animation.registry.js_get_category = animation.Class.extend({
    selector : ".js_get_category",

    start: function(){
      this.redrow();
    },
    stop: function(){
      this.clean();
    },

    redrow: function(debug){
      this.clean(debug);
      this.build(debug);
    },

    clean:function(debug){
      this.$target.empty();
    },
    
    build: function(debug)
    {
      var self = this,
      limit    = self.$target.data("objects_limit"),
      template = self.$target.data("template");
      if(!template) template="category_image_showcase_snippent.clarico_category_category_showcase";
      if(!limit)limit = 10;
	  var rpc_end_point = '/showcase_data';
      ajax.jsonRpc(rpc_end_point, 'call', {
        'template': template,
        'limit': limit,
      }).then(function(data) 
    	{
    	  $(data).appendTo(self.$target);
      }).then(function()
    		  {
    	  
      }).fail(function(e) {
        return;
      });
    },	
});

});
