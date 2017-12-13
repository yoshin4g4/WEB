
Step 1
=============================================================================
- Once you download this Theme from Odoo Store, you will get one folder - "theme_clarico". Inside that folder you will get another compressed file - clarico.tar.gz. 

Step 2 
============
- By extracting "clarico.tar.gz" file, you will get set of other modules inside it. 

Step 3
=============
- Copy those modules from folder "Clarico" and paste them along with "theme_clarico" module. Delete folder "clarico" inside module "theme_clarico". Go inside theme_clarico folder and open "__manifest__.py" file. Uncomment all the dependent modules and add comment to module "website".

Step 4
=============
- Make sure you add path of theme_clarico and other modules into your config file of Odoo. Better practice should be to add them all in one folder - For example : Clarico - and add that folder's path in your config file of Odoo.

Step 5
=============
- Go to your Odoo instance and start Odoo in Developer Mode. In order to do that, go to menu "Settings" and click on "Activate the developer mode" link.

Step 6
=============
- Under the menu "Apps" click on Submenu "Update Apps List" and than find the module "theme_clarico". Install it and you are done!
