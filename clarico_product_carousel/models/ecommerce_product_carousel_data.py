from odoo import SUPERUSER_ID
from odoo.osv import osv
from odoo.http import request
from odoo.tools.safe_eval import safe_eval
from odoo import api, fields, models, _,tools

class ecommerce_product_carousel_data(osv.osv):
    _name = 'ecommerce.product.carousel.data'
    _carousel_data = True

    
    def get_product_carousel_slider_filter_data(self,filter_id,object_name,context=None):
        res={}
        if context is None:
            context={}
            res={}
        
        if filter_id:
            res = {'domain':[],'model':self._name,'order':False}
            filter_data = request.env['website.filter.ept'].browse(filter_id)
            localdict = {'uid':request.uid}
            res['domain'] = safe_eval(filter_data.filter_id.domain,localdict)
            res['model'] = filter_data.filter_id.model_id
            res['name']=filter_data.name
        else:
            res = {'domain':[],'model':'product.template','order':False}
        return res
    
    def get_product_for_carousel_slider(self,filter_id,object_name,limit,context=None):
        filter_data = self.get_product_carousel_slider_filter_data(filter_id,object_name, context)
        if filter_data:
            object_ids = request.env[filter_data['model']].search(filter_data['domain'],limit=limit, order=filter_data['order'])              
            return {'objects':object_ids,'name':'name' in filter_data and filter_data['name'] or _("All")}

