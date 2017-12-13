from openerp import models, fields, api

class product_label(models.Model):
    _name="product.label"
    _rec_name="lname"    
    
    lname=fields.Char("Name")
    
