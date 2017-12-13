import odoo
from odoo import http
from odoo import fields
from odoo.http import request
from odoo.addons.clarico_shop.controllers.main import claricoShop


class claricoPriceFilter(claricoShop):
    
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
        request.cr.execute( 'select min(list_price),max(list_price) from product_template where sale_ok=True and active=True and website_published=True')
        min_max_vals = request.cr.fetchall()
        min_val = min_max_vals[0][0] or 0
        if int(min_val) == 0:
            min_val = 1
        max_val = min_max_vals[0][1] or 1
        
        custom_min_val = custom_max_val = 0
        product_price_search_vals = {}
        if request.httprequest.args.getlist('min_val') and request.httprequest.args.getlist('max_val'):
            custom_min_val = float(request.httprequest.args.getlist('min_val')[0])
            custom_max_val = float(request.httprequest.args.getlist('max_val')[0])
            if custom_min_val > custom_max_val:
                tmp = custom_max_val
                custom_max_val = custom_min_val
                custom_min_val = tmp
            product_price_search_vals.update({'min_val':custom_min_val,'max_val':custom_max_val})
            post.update({'attrib_price':'%s-%s'%(custom_min_val,custom_max_val)})
        
        else :
            post.update({'attrib_price':'%s-%s'%(min_val,max_val)})
            
            
        
        response = super(claricoPriceFilter, self).shop(page=page, category=category, search=search,ppg=ppg, **post)
        response.qcontext['custom_min_val'] = custom_min_val
        response.qcontext['custom_max_val'] = custom_max_val
        response.qcontext['min_val'] = min_val
        response.qcontext['max_val'] = max_val
        return response 
    
    
        
        
