from odoo import fields, models
    
class Brand(models.Model):
    _name="brand"
    
    name=fields.Char("Brand Name",required=True)
    brand_image=fields.Binary("brand_image", attachment=True)
    is_website_publish=fields.Boolean("is_website_publish")