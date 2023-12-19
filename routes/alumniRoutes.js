const express = require('express');
const router = express.Router();
const alumniController = require('../controllers/aboutController');



// Define a route for alumni dashboard
router.get('/alumniDashboard', (req, res) => {
    res.render('alumniDashboard'); 
});

router.post('/registerEvent/:eventId', alumniController.registerEvent);

router.get('/registeredEvents', alumniController.getRegisteredEvents);

router.post('/unregisterEvent/:eventId', alumniController.unregisterEvent);


module.exports = router;
