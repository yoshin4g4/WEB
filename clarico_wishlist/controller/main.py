import odoo
from odoo import http
from odoo import fields
from odoo.http import request
from odoo.addons.website_sale_wishlist.controllers.main import WebsiteSaleWishlist
from itertools import product

class claricoWishlist(WebsiteSaleWishlist):
    
    @http.route(['/shop/wishlist'], type='http', auth="public", website=True)
    def get_wishlist(self, count=False, **kw):
        response = super(claricoWishlist, self).get_wishlist(count=count,**kw)
        Rating = request.env['rating.rating']
        products = request.env['product.wishlist'].with_context(display_default_code=False).current()
        rating_templates = {}
        if products:
            for product in products :
                ratings = Rating.search([('message_id', 'in', product.product_id.product_tmpl_id.website_message_ids.ids)])
                rating_product = product.product_id.product_tmpl_id.rating_get_stats([('website_published', '=', True)])
                rating_templates[product.id] = rating_product
                response.qcontext['rating_product'] = rating_templates
        return response

    
    @http.route(['/wishlist_products_popout'], type='json', auth="public", website=True)
    def wishpopout(self, **kwargs):
            product = request.env['product.wishlist'].sudo().with_context(display_default_code=False).search([("partner_id", "=", request.env.user.partner_id.id)])
            
            pricelist = request.website.get_current_pricelist()
                
            from_currency = request.env.user.company_id.currency_id
            to_currency = pricelist.currency_id
            compute_currency = lambda price: from_currency.compute(price, to_currency)
            products={
                 'object': product,
                 'compute_currency': compute_currency,
                }
            response = http.Response(template="clarico_wishlist.clarico_wishlist_popover_data",qcontext=products)            
            return response.render()
    
    @http.route(['/clear_wishlist'], type='json', auth="public", website=True)
    def clear_wishlist(self, wish=False,**kwargs):
        wishlist = request.env['product.wishlist'].sudo()        
        if wish:
            wishlist_ids =wishlist.search([('id', '=', wish)])
            wishlist_ids.write({'active': False})
            return True
        return False
