from odoo import http
from odoo.http import request

class claricoCategory(http.Controller):
     
    @http.route(['/showcase_data'],type='json', auth='public', website=True , csrf=False, cache=30)
    def category_data(self,template,limit=10):
        data=request.env['product.public.category'].search([['parent_id','=',False]],limit=limit)
        values = {'object':data}
        return request.env.ref(template).render(values)

    
    
    
       

    
     
    
    
    
    
    
    
    
    
    
    
