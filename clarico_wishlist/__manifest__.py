{
    # Theme information
    'name' : 'Clarico Wishlist',
    'category' : 'Website',
    'version' : '1.0',
    'summary': 'View List of Products added to Wishlist',
    'description': """""",

    # Dependencies
    'depends': [
       'website_sale_wishlist','clarico_shop', 'clarico_product','clarico_account',
    ],

    # Views
    'data': [
        'template/theme_template.xml',
        'template/assets.xml',
	'template/wishlist_list_popout.xml',
    ],

    # Author
    'author': 'Emipro Technologies Pvt. Ltd.',
    'website': 'http://www.emiprotechnologies.com',

    # Technical
    'installable': True,
}
