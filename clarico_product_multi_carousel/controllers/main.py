from odoo import http
from odoo.http import request
from odoo import SUPERUSER_ID
from odoo.tools.safe_eval import safe_eval

class ClaricoStaticCarousel(http.Controller):
    @http.route(['/ecommerce_static_product_carousel_snippets/render'], type='json', auth='public', website=True , cache=300)
    def ecommerce_product_static_carousel_snippets(self, template,filter_id=False):
        values = {}
        if filter_id :
            res = request.env['website.multi.filter.ept'].sudo().search([('id', '=',filter_id)])
            if res:
                values['title'] = res
        else :
            res = request.env['website.multi.filter.ept'].sudo().search([])
            if res:
                values['title'] = res[0]
        
        return request.env.ref(template).render(values)
    
    
    @http.route(['/static_product_data'], type='json', auth='public', website=True , cache=300)
    def ecommerce_product_data(self, template,temp_filter_id=False):
        values = {}
        if temp_filter_id:
            cr, uid, context = request.cr, request.uid, request.context
            Rating = request.env['rating.rating']
            filter_data=request.env['website.filter.ept'].search([('id', '=',temp_filter_id)])
            data={}
            localdict = {'uid':uid}
            data['domain'] = safe_eval(filter_data.filter_id.domain,localdict)
            data_pro = request.env['product.template'].search(data['domain'],limit=4)  
            values = {}
            
            
            rating_templates = {}
            for product_t in data_pro:            
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
            values['objects'] = data_pro
        return request.env.ref("clarico_product_multi_carousel.clarico_product_multi_carousel_static_carousel_snippet_content").render(values)
    

    
     
    
    
    
    
    
    
    
    
    
    
