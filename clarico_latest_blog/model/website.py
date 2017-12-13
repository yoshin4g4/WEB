from odoo import api, fields, models

class website(models.Model):
    _inherit = "website"
    
    @api.multi
    def get_latest_blogs(self, filter=[]):
        if filter:
            filter.extend([('website_published','=',True)])
        else:
            filter = [('website_published','=',True)]            
        return self.env['blog.post'].sudo().search(filter, order="id desc",limit=3)
