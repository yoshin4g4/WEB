from odoo import api, fields, models
   
class product_public_category(models.Model):
    _inherit = ["product.public.category"]
    
    attribute_select = fields.Many2one('product.attribute', 'Select Attribute')
