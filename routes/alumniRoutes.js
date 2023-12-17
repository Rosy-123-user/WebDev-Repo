const express = require('express');
const router = express.Router();
const alumniController = require('../controllers/aboutController');


router.post('/register-event/:eventId', alumniController.registerEvent);

router.get('/registered-events', alumniController.getRegisteredEvents);

router.post('/unregister-event/:eventId', alumniController.unregisterEvent);

// Define a route for alumni dashboard
router.get('/alumniDashboard', (req, res) => {
    res.render('alumniDashboard'); // Adjust the view name based on your setup
});

module.exports = router;
