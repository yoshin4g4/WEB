import odoo
from odoo import http
from odoo.http import request
from odoo.addons.http_routing.models.ir_http import slug


class claricoQuickView(http.Controller):
    
    @http.route(['/productdata'], type='json', auth="public", website=True)    
    def fetchProduct(self,product_id=None, **kwargs):
        if product_id :
            product_record = request.env['product.template'].search([['id','=',product_id]])
            Rating = request.env['rating.rating']
            
            pricelist = request.website.get_current_pricelist()
            
            from_currency = request.env.user.company_id.currency_id
            to_currency = pricelist.currency_id
            compute_currency = lambda price: from_currency.compute(price, to_currency)
            
            values={
                'product':product_record,
                'get_attribute_value_ids': self.get_attribute_value_ids,
                'compute_currency': compute_currency,
            }
            
            rating_templates = {}
            product = request.env['product.template'].search([['id','=',product_id]])
            ratings = Rating.search([('message_id', 'in', product.website_message_ids.ids)])#             rating_message_values = dict([(record.message_id.id, record.rating) for record in ratings])
            rating_product = product.rating_get_stats([('website_published', '=', True)])
            rating_templates[product.id] = rating_product

            values['rating_product'] = rating_templates
            response = http.Response(template="clarico_quick_view.clarico_quick_view_fetch-record",qcontext=values)            
        return response.render()
        
    
    def get_attribute_value_ids(self, product):
        product = product.with_context(quantity=1)

        visible_attrs_ids = product.attribute_line_ids.filtered(lambda l: len(l.value_ids) > 1).mapped('attribute_id').ids
        to_currency = request.website.get_current_pricelist().currency_id
        attribute_value_ids = []
        for variant in product.product_variant_ids:
            if to_currency != product.currency_id:
                price = variant.currency_id.compute(variant.website_public_price, to_currency)
            else:
                price = variant.website_public_price
            visible_attribute_ids = [v.id for v in variant.attribute_value_ids if v.attribute_id.id in visible_attrs_ids]
            attribute_value_ids.append([variant.id, visible_attribute_ids, variant.website_price, price])
        return attribute_value_ids
    
    
    
    
    
    
    
