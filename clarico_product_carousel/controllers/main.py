from odoo import http
from odoo.http import request
from odoo import SUPERUSER_ID
from odoo.tools.safe_eval import safe_eval
from odoo.addons.website_sale.controllers.main import QueryURL

class claricoCarousel(http.Controller):
     
        
    @http.route(['/ecommerce_product_carousel_snippets/render'], type='json', auth='public', website=True , csrf=False, cache=300)
    def render_product_carousel_slider(self, template, filter_id=False, objects_in_slide=4, limit=10, object_name=False):
        context = request.context
        res = request.env['ecommerce.product.carousel.data'].get_product_for_carousel_slider(filter_id=filter_id, object_name=object_name, limit=limit, context=context)
        values = {}
        values['objects'] = res['objects']
        values['title'] = res['name']
        
        Rating = request.env['rating.rating']
        rating_templates = {}
        for product_t in res['objects']:            
            product = request.env['product.template'].browse(product_t.id)      
            ratings = Rating.search([('message_id', 'in', product.website_message_ids.ids)])
            rating_message_values = dict([(record.message_id.id, record.rating) for record in ratings])
            rating_product = product.rating_get_stats([('website_published', '=', True)])
            rating_templates[product.id] = rating_product
            values['rating_product'] = rating_templates                                      
        
        
        pricelist_context = dict(request.env.context)
        if not pricelist_context.get('pricelist'):
            pricelist = request.website.get_current_pricelist()
            pricelist_context['pricelist'] = pricelist.id
        else:
            pricelist = request.env['product.pricelist'].browse(pricelist_context['pricelist'])
        from_currency = request.env.user.company_id.currency_id
        to_currency = pricelist.currency_id
        compute_currency = lambda price: from_currency.compute(price, to_currency)
        values['compute_currency'] = compute_currency
        return request.env.ref(template).render(values)
    
    @http.route(['/ecommerce_product_carousel_snippets/render/product.template'], type='json', auth='public', website=True , cache=300)
    def ecommerce_product_carousel_snippets(self, template, filter_id=16, objects_in_slide=4, limit=10, object_name="product.template"):
        cr, uid, context, pool = request.cr, request.uid, request.context, request.registry
        res = self.render_product_carousel_slider(template, filter_id=filter_id, objects_in_slide=objects_in_slide, limit=limit,
                                                                                            object_name=object_name)
        return res