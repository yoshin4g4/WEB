from odoo import api, fields, models
 
class website(models.Model):
     
    _inherit = "website"
    
    clarico_header_style_one = fields.Char('CLarico Heading')
    clarico_header_style_two = fields.Char("Clarico header style2")
    clarico_header_style_three = fields.Char("Clarico header style3")
     
    def category_check(self,filter=[]):
         
        if filter:
            filter.extend([('website_published','=',True)])
        else:
            filter=([('website_published','=',True)])
         
        return self.env['product.public.category'].sudo().search(filter)
       
