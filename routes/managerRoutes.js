const express = require('express');
const router = express.Router();
const managerController = require('../controllers/aboutController');

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/'); // Redirect to login if not authenticated
  };
  

// Route to display the Manager Dashboard
router.get('/manager-dashboard', isAuthenticated, managerController.getAllEvents);

// Route to handle event deletion
router.post('/delete-event/:eventId', isAuthenticated, managerController.deleteEvent);

// Route to handle event update
router.post('/update-event/:eventId', isAuthenticated, managerController.updateEvent);

// Route to fetch alumni list for a specific event
router.get('/alumni-list/:eventId', isAuthenticated, managerController.getAlumniList);

// Route to handle event creation
router.post('/create-event', isAuthenticated, managerController.createEvent);

// Other routes related to the Manager Dashboard can be added here

module.exports = router;
