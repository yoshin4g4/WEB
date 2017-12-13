import odoo
from odoo import http
from odoo import fields
from odoo.http import request
from odoo.addons.website_sale.controllers.main import WebsiteSale
from odoo.addons.website_sale_wishlist.controllers.main import WebsiteSaleWishlist

class claricoRecentlyViewed(WebsiteSale):
    
    @http.route(['/shop/product/<model("product.template"):product>'], type='http', auth="public", website=True)
    def product(self, product, category='', search='', **post):
        response = super(claricoRecentlyViewed, self).product(product=product, category=category, search=search, **post)
        recently_viewed_product_ids = self.update_recently_viewed_items(product.id)
        response.qcontext.update(active_id=product.id)
        if request.session['recently_viewed_product_ids'] :
            product = request.env['product.template'].search([('id','in',request.session['recently_viewed_product_ids'])])
            response.qcontext['recently_viewed_product'] = product
        return response
    
    @http.route(['/shop/cart'], type='http', auth="public", website=True)
    def cart(self, **post):
        response = super(claricoRecentlyViewed, self).cart(**post)
        recently_viewed_product_ids = request.session.get( 'recently_viewed_product_ids', False)
        if recently_viewed_product_ids :
            product = request.env['product.template'].search([('id','in',request.session['recently_viewed_product_ids'])])
            response.qcontext['recently_viewed_product'] = product
        return response
    

    def update_recently_viewed_items(self,product_id):
        recently_viewed_product_ids = request.session.get( 'recently_viewed_product_ids', False)
        if recently_viewed_product_ids :
            if product_id not in request.session['recently_viewed_product_ids'] :
                tmp = recently_viewed_product_ids
                tmp.append(product_id)    
                request.session['recently_viewed_product_ids'] = tmp
        else :
            request.session['recently_viewed_product_ids'] = [product_id]
        return request.session['recently_viewed_product_ids']
    


class claricoWishlist_RecentlyViewed(WebsiteSaleWishlist):
    def _get_compute_currency_and_context(self):
        pricelist_context = dict(request.env.context)
        pricelist = False
        if not pricelist_context.get('pricelist'):
            pricelist = request.website.get_current_pricelist()
            pricelist_context['pricelist'] = pricelist.id
        else:
            pricelist = request.env['product.pricelist'].browse(pricelist_context['pricelist'])

        from_currency = request.env.user.company_id.currency_id
        to_currency = pricelist.currency_id
        compute_currency = lambda price: from_currency.compute(price, to_currency)

        return compute_currency, pricelist_context, pricelist
    
    @http.route(['/shop/wishlist'], type='http', auth="public", website=True)
    def get_wishlist(self, count=False, **kw):
        response = super(claricoWishlist_RecentlyViewed, self).get_wishlist(count=count,**kw)
        recently_viewed_product_ids = request.session.get('recently_viewed_product_ids', False)
        compute_currency, pricelist_context, pricelist = self._get_compute_currency_and_context()
        if recently_viewed_product_ids :
            product = request.env['product.template'].search([('id','in',request.session['recently_viewed_product_ids'])])
            response.qcontext['recently_viewed_product'] = product
            response.qcontext['compute_currency'] =  compute_currency
            response.qcontext['pricelist'] =  pricelist
        return response
        


   
