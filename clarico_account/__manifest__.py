{
    # Theme information
    'name' : 'Clarico Account',
    'category' : 'Website',
    'version' : '1.0',
    'summary': 'View Orders, Invoices, Account Details at Frontend',
    'description': """""",

    # Dependencies
    'depends': [
        'clarico_layout','website_quote','sale','portal'
    ],

    # Views
    'data': [
        'templates/template.xml',
        'templates/assets.xml'
    ],

    # Author
    'author': 'Emipro Technologies Pvt. Ltd.',
    'website': 'http://www.emiprotechnologies.com',

    # Technical
    'installable': True,
}
