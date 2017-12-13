from odoo import http, _
from odoo.http import request
from odoo.addons.clarico_shop.controllers.main import claricoShop
from odoo.addons.website_sale.controllers.main import WebsiteSale
from odoo.addons.clarico_compare.controllers.main import Claricoproductcomparison
        
class claricoRating(claricoShop):
    
    @http.route([
        '/shop',
        '/shop/page/<int:page>',
        '/shop/category/<model("product.public.category"):category>',
        '/shop/category/<model("product.public.category"):category>/page/<int:page>'
    ], type='http', auth="public", website=True)
    def shop(self, page=0, category=None, search='', ppg=False, **post):
        response = super(claricoRating, self).shop(page=page, category=category, search=search, **post)
        Rating = request.env['rating.rating']
        products = response.qcontext['products']
        rating_templates = {}
        for product in products :
            ratings = Rating.search([('message_id', 'in', product.website_message_ids.ids)])#             rating_message_values = dict([(record.message_id.id, record.rating) for record in ratings])
            rating_product = product.rating_get_stats([('website_published', '=', True)])
            rating_templates[product.id] = rating_product
            response.qcontext['rating_product'] = rating_templates
        return response 
    
class claricoProductRating(WebsiteSale):
    
    @http.route(['/shop/product/<model("product.template"):product>'], type='http', auth="public", website=True)
    def product(self, product, category='', search='', **kwargs): 
        response = super(claricoProductRating, self).product(product=product, category=category, search=search, **kwargs)
        Rating = request.env['rating.rating']
        rating_templates = {}
        ratings = Rating.search([('message_id', 'in', product.website_message_ids.ids)])#             rating_message_values = dict([(record.message_id.id, record.rating) for record in ratings])
        rating_product = product.rating_get_stats([('website_published', '=', True)])
        rating_templates[product.id] = rating_product
        response.qcontext['rating_product'] = rating_templates
        return response
    
class claricoCompareRating(Claricoproductcomparison):
    
    @http.route('/shop/compare/', type='http', auth="public", website=True)
    def product_compare(self, **post): 
        response = super(claricoCompareRating, self).product_compare(**post)
        Rating = request.env['rating.rating']
        rating_templates = {}
        products = response.qcontext.get('products') or None
        if products:
            for product in products :
                ratings = Rating.search([('message_id', 'in', product.product_tmpl_id.website_message_ids.ids)])#             rating_message_values = dict([(record.message_id.id, record.rating) for record in ratings])
                rating_product = product.product_tmpl_id.rating_get_stats([('website_published', '=', True)])
                rating_templates[product.id] = rating_product
        response.qcontext['rating_product'] = rating_templates
        return response

