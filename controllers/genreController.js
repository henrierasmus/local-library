const Genre = require('../models/genre');
const validator = require('express-validator');
const Book = require('../models/book');
const async = require('async');

// ************can this be written in a module patern/factory function/class instead?*******************

// Display list of all Genres
exports.genre_list = (req, res, next) => {
    Genre.find()
        .exec(function (err, list_genre) {
            if(err) {return next(err)}
            // successfull
            res.render('genre_list', {title: 'Genre List', genre_list: list_genre})
        });
};

// Display detail page for a specific Genre
exports.genre_detail = (req, res, next) => {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
                .exec(callback)

        },
        genre_books: function(callback) {
            Book.find({ 'genre': req.params.id})
                .exec(callback)
        },

    }, function(err, result) {
        if(err) {return next(err)}
        if (result.genre==null) {
            const err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
    
        // successfull, render page
        res.render('genre_detail', { title: 'Genre Details', genre: result.genre, genre_books: result.genre_books })
    })
};

// Display Genre create form on GET
exports.genre_create_get = (req, res, next) => {
    res.render('genre_form', { title: 'Create Genre'});
};


// Handle Genre create form on POST
exports.genre_create_post = [
    // Validate that the name field is not empty
    validator.body('name', 'Genre name required').isLength({ min: 1}).trim(),

    // Sanitize (escape) the name field
    validator.sanitizeBody('name').escape(),

    // Process request after validation and sanitization
    (req, res, next) => {
        // Extract the Validation errors from a request
        const errors = validator.validationResult(req)

        // Create a genre object with escaped and trimmed data
        const genre = new Genre(
            {name: req.body.name}
        );

        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages.
            res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array()});
            return;
        } else {
            // Data from form is valid.
            // Check if Genre woth same name already exists.
            Genre.findOne({ 'name': req.body.name })
                .exec((err, found_genre) => {
                    if(err) {return next(err)}
                    if (found_genre){
                        // genre exists, redirect to its detail page
                        res.redirect(found_genre.url)
                    } else {
                        genre.save((err) => {
                            if(err) {return next(err)}
                            // Genre Saved. Redirect to genre detail page
                            res.redirect(genre.url)
                        });
                    }
                });
        }
    }

]

// Display Genre delete form on GET
exports.genre_delete_get = (req, res, next) => {
    async.parallel({
        genre: (callback) => {
            Genre.findById(req.params.id).exec(callback)
        },
        genre_books: (callback) => {
            Book.find({ 'genre': req.params.id}).exec(callback)
        },
    }, (err, results) => {
        if(err) {return next(err)}
        if(results == null) {
            res.redirect('/catalog/genres');
        }
        // Sucessful render genre delete page
        res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books })
    });
};

// Handle Genre delete on POST
exports.genre_delete_post =(req, res) => {
    async.parallel({
        genre: (callback) => {
            Genre.findById(req.body.genreid).exec(callback)
        },
        genre_books: (callback) => {
            Book.find({ 'genre': req.body.genreid}).exec(callback)
        },
    }, (err, results) => {
        if(err) {return next(err)}
        // Genre has books associated with it\
        if(results.genre_books.length > 0) {
            res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books })
            return;
        } else {
            Genre.findByIdAndRemove(req.body.genreid, deleteGenre = (err) => {
                if(err) { return next(err)}
                res.redirect('/catalog/genres')
            });
        }
    });
};

// Display Genre update form on GET
exports.genre_update_get = (req, res, next) => {
    Genre.findById(req.params.id)
    .exec((err, results_genre) => {
        if(err) { return next(err)}
        res.render('genre_form', { title: 'Update Genre', genre: results_genre, })
    });
};

// Handle Genre update on POST
exports.genre_update_post = [
    // Validate that the name field is not empty
    validator.body('name', 'Genre name required').isLength({ min: 1}).trim(),

   // Sanitize (escape) the name field
    validator.sanitizeBody('name').escape(),

   // Process request after validation and sanitization
    (req, res, next) => {
       // Extract the Validation errors from a request
        const errors = validator.validationResult(req)

       // Create a genre object with escaped and trimmed data
        const genre = new Genre(
            { 
                name: req.body.name, 
                _id: req.params.id,
            }
        );

        if(!errors.isEmpty()) {
            Genre.findById(req.params.id)
            .exec((err, results_genre) => {
                if(err) { return next(err)}
                res.render('genre_form', { title: 'Update Genre', genre: results_genre, })
            });
            return;
        } else {
            // data from form is valid
            Genre.findByIdAndUpdate(req.params.id, genre, {}, (err, thegenre) => {
                if(err) { return next(err) }

                res.redirect(thegenre.url);
            });
        }
    }
];
   