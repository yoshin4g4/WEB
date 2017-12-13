from odoo import api, fields, models
    
class product_template(models.Model):
    _inherit = ["product.template"]
    
    label_ept_id=fields.Many2one("product.label","Sale Label",ondelete='cascade')
    
