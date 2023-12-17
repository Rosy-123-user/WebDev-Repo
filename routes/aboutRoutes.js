// routes/aboutRoutes.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const aboutController = require('../controllers/aboutController');


// Import the Event model with a different name
const EventModel = require('../models/events.js');

router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        // ...
    })(req, res, next);
});

// Route to display the About Us page
router.get('/', aboutController.displayAboutPage);


// Routes for user authentication
// router.get('/signup', aboutController.signupForm);
router.post('/signup', aboutController.signup);
// router.get('/login', aboutController.loginForm);
router.post('/login', aboutController.loginMiddleware, (req, res, next) => {
    passport.authenticate('local', {
        failureRedirect: '/',
        failureFlash: true,
        successRedirect: '/dashboard', // Replace with your desired success redirect
    })(req, res, next);
});

// Route to handle the contact form submission
router.post('/contact', aboutController.sendContactEmail);

// Other routes related to the About Us page can be added here

module.exports = router;
