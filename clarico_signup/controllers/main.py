import logging
import werkzeug
from odoo import http
from odoo.addons.auth_signup.controllers.main import AuthSignupHome
from odoo.http import request

_logger = logging.getLogger(__name__)

class claricoSignUp(AuthSignupHome):

    def get_auth_signup_config(self):
        res = super(claricoSignUp,self).get_auth_signup_config()
        IrConfigParam = request.env['ir.config_parameter']
        attachment_id = IrConfigParam.sudo().get_param('clarico_signup.signup_bg_image_id',False)
        if str(attachment_id) != "False":
            signup_bg_image = False
            if attachment_id :
                signup_bg_image = request.env['ir.attachment'].sudo().browse(int(attachment_id)).datas or False
                if signup_bg_image :
                    res.update({'signup_bg_image':signup_bg_image  })
        return res



    
