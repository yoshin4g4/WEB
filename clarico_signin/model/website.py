from odoo import api, fields, models
from odoo.tools import pycompat
 
class website(models.Model):
     
    _inherit = "website"
    
    def get_bgimage(self):
        IrConfigParam = self.env['ir.config_parameter']
        attachment_id = IrConfigParam.sudo().get_param('clarico_signin.signin_bg_image_id',False)
        if str(attachment_id) != "False":
            signin_bg_image = 0
            if attachment_id :
                signin_bg_image = self.env['ir.attachment'].sudo().browse(int(attachment_id)).datas or False
            if signin_bg_image :
                return signin_bg_image
        return False
      

