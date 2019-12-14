const BookInstance = require('../models/bookinstance');
const { body, validationResult} = require('express-validator/check');
const { sanitizeBody} = require('express-validator/filter');
const Book = require('../models/book')
const async = require('async')

// ************can this be written in a module patern/factory function/class instead?*******************

// Diplay a list of all BookInstances
exports.bookinstance_list = (req, res, next) => {
    BookInstance.find()
        .populate('book')
        .exec((err, list_bookinstances) => {
            if(err) {return next(err)}
            res.render('bookinstance_list', {title: 'Book Instance List', bookinstance_list: list_bookinstances});
        });
};

// Display detail page for a specific BookInstance
exports.bookinstance_detail = (req, res, next) => {
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
        if(err) {return next(err)}
        if(bookinstance==null) {
            const err = new Error('Book copy not found');
            err.status = 404;
            return next(err);
        }
        // successful, render bookinstance detail
        res.render('bookinstance_detail', {title: 'Copy: ' + bookinstance.book.title, bookinstance: bookinstance});
    });
};

// Display BookInstance create form on GET
exports.bookinstance_create_get = (req, res, next) => {
    Book.find({}, 'title')
    .exec((err, books) => {
        if(err) {return next(err)}
        // Successful, render Bookinstance form
        res.render('bookinstance_form', {title: 'Create Book Instance', book_list: books})
    });
};

// Handle BookInstance create on POST 
exports.bookinstance_create_post = [
    // Validate fields
    body('book', 'Book must be specified').isLength({min: 1}).trim(),
    body('imprint', 'Imprint must be specified').isLength({min: 1}).trim(),
    body('due_back', 'Invalid Date').optional({checkFalsy: true}).isISO8601(),

    // Sanitize fields
    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),

    // Process request after validation and sanitization
    (req, res, next) => {
        const errors = validationResult(req);

        const bookinstance = new BookInstance(
            {
                book: req.body.book,
                imprint: req.body.imprint,
                status: req.body.status,
                due_back: req.body.due_back,
            }
        );

        if(!errors.isEmpty()) {
            Book.find({}, 'title')
                .exec((err, books) => {
                    if(err) {return next(err)}
                    res.redirect(bookinstance.url);

                    res.render('bookinstance_form', { title: 'Create Book Instance', book_list: books, selected_book: bookinstance.book._id, errors: errors, bookinstance: bookinstance})
                });
                return;
        } else {
            // Data from form is valid
            bookinstance.save((err) => {
                if(err) { return next(err) }
                // Successful, redirect to new record
                res.redirect(bookinstance.url)
            });
        }
    }
];   

// Display BookInstance delete form on GET
exports.bookinstance_delete_get = (req, res, next) => {
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec((err, bookinstance) => {
        if(err) { return next(err)}
        res.render('bookinstance_delete', { title: 'Delete Book Instance: ' + bookinstance.book.title, bookinstance: bookinstance })
    });
};

// Handle BookInstance delete form on POST
exports.bookinstance_delete_post = (req, res, next) => {
    BookInstance.findByIdAndRemove(req.body.bookinstanceid, deleteBookInstance = (err) => {
        if(err) { return next(err)}
        res.redirect('/catalog');
    });
};

// Display BookInstance update form on GET
exports.bookinstance_update_get = (req, res, next) => {
    async.parallel({
        book_instance: (callback) => {
            BookInstance.findById(req.params.id).exec(callback)
        },
        book: (callback) => {
            Book.find(callback)
        },
    }, (err, results) => {
        if(err) { return next(err) }
        
        res.render('bookinstance_form', { title: 'Update book instance', bookinstance: results.book_instance, book_list: results.book, selected_book: results.book_instance.book._id })
    });
};

// Handle BookInstance update form on POST
exports.bookinstance_update_post = [
    // validate fields
    body('book', 'Book must be specified').isLength({min: 1}).trim(),
    body('imprint', 'Imprint must be specified').isLength({min: 1}).trim(),
    body('due_back', 'Invalid Date').optional({checkFalsy: true}).isISO8601(),

    // Sanitize fields
    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),

    // Process request after validation and sanitization
    (req, res, next) => {
        const errors = validationResult(req);

    // create a new bookinstance object with data and old id
        const book_instance = new BookInstance(
            {
                book: req.body.book,
                imprint: req.body.imprint,
                status: req.body.status,
                due_back: req.body.due_back,
                _id: req.params.id,
            }
        );
        if(!errors.isEmpty()) {
            async.parallel({
                book: (callback) => {
                    Book.find(callback)
                },
            }, (err, results) => {
                if(err) { return next(err) }
                
                res.render('bookinstance_form', { title: 'Update book instance', bookinstance: results.book_instance, book_list: results.book, selected_book: results.book_instance.book._id })
            });
            return;
        } else {
            // Data from form is valid. Update record
            BookInstance.findByIdAndUpdate(req.params.id, book_instance, {}, (err, theisntace) => {
                if(err) { return next(err) }
                // Successfully updates - redirect to bookinstance detail page
                res.redirect(theisntace.url)
            });
        }
    }
];
