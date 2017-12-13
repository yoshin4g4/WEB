import odoo
from odoo import http
from odoo import fields
from odoo.http import request
from odoo.addons.clarico_shop.controllers.main import claricoShop

class claricoBrand(claricoShop):
    
    def _get_search_domain(self, search, category, attrib_values, price_vals = {}):        
        domain = request.website.sale_product_domain()
        if search:
            for srch in search.split(" "):
                domain += [
                    '|', '|', '|','|', ('name', 'ilike', srch), ('description', 'ilike', srch),
                    ('description_sale', 'ilike', srch), ('product_variant_ids.default_code', 'ilike', srch),
                    ('brand_ept_id.name','ilike', srch)]
 
        if category:
            domain += [('public_categ_ids', 'child_of', int(category))]
 
        if price_vals :
        #if price_vals & (int(price_vals.get('min_val',0)) != 0 & int(price_vals.get('max_val',0)) !=0) :
            domain += [('list_price','>=',price_vals.get('min_val')),('list_price','<=',price_vals.get('max_val'))]
        
        if attrib_values:
            attrib = None
            ids = []
            for value in attrib_values:
                if value[0] == 0 :
                    ids.append(value[1])
                    domain += [('brand_ept_id.id', 'in', ids)]
                elif not attrib:
                    attrib = value[0]
                    ids.append(value[1])
                elif value[0] == attrib:
                    ids.append(value[1])
                else:
                    domain += [('attribute_line_ids.value_ids', 'in', ids)]
                    attrib = value[0]
                    ids = [value[1]]
            if attrib:
                domain += [('attribute_line_ids.value_ids', 'in', ids)]     
        return domain
    
    @http.route([
        '/shop',
        '/shop/page/<int:page>',
        '/shop/category/<model("product.public.category"):category>',
        '/shop/category/<model("product.public.category"):category>/page/<int:page>'
    ], type='http', auth="public", website=True)
    def shop(self, page=0, category=None, search='', ppg=False, **post):
        response = super(claricoBrand, self).shop(page=page, category=category, search=search,ppg=ppg, **post)
        brand_object = request.env['brand']
        brand_rec=brand_object.sudo().search([('is_website_publish','=',True)])
        response.qcontext['brand_list'] = brand_rec
        return response 
