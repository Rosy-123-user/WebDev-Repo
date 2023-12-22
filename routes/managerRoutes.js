// const express = require('express');
// const managerRoutes = express.Router();
// const aboutController = require('../controllers/aboutController');

// const isAuthenticated = (req, res, next) => {
//     if (req.isAuthenticated()) {
//       return next();
//     }
//     res.redirect('/'); // Redirect to about if not authenticated
//   };
  

// // // Route to display the Manager Dashboard
// managerRoutes.get('/managerDashboard', (req, res) => {
//   // try {
//   //   console.log('Reached Alumni Dashboard route');
//       res.render('managerDashboard');
//   // } catch (error) {
//   //     console.error(error);
//   //     res.status(500).send('Internal Server Error');
//   // }
// });


// // Route to handle event deletion
// managerRoutes.post('/deleteEvent/:eventId', aboutController.deleteEvent);

// // Route to handle event update
// managerRoutes.post('/updateEvent/:eventId', aboutController.updateEvent);

// // Route to fetch alumni list for a specific event
// managerRoutes.get('/alumniList/:eventId', aboutController.getAlumniList);

// // Route to handle event creation
// managerRoutes.post('/createEvent', aboutController.createEvent);

// // Other routes related to the Manager Dashboard can be added here

// module.exports = managerRoutes;
