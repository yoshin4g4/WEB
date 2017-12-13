from odoo import api, fields, models
    
class product_template(models.Model):
    _inherit = ["product.template"]
    
    brand_ept_id=fields.Many2one("brand","Sale Brand",ondelete='cascade')
