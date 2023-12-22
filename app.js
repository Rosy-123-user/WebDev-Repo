const passport = require('passport');
const session = require('express-session');
const express = require('express');
const app = express();
const path = require('path');
const LocalStrategy = require('passport-local').Strategy;
const nedb = require('nedb'); // Import NeDB
const flash = require('connect-flash'); // Import connect-flash for flash messages
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const saltRounds = 10;


const aboutController= require('./controllers/aboutController')
const aboutRoutes = require('./routes/aboutRoutes');


// Set up view engine and views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (CSS and JavaScript)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware for parsing JSON and URL-encoded data
app.use(express.json()); // Parse JSON
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data


// Generate a random string for the secret key
const generateRandomString = (length) => {
  return crypto.randomBytes(length).toString('hex');
};

// Set up a secure secret key for the session
const secretKey = generateRandomString(32);

// Use express-session middleware
app.use(
  session({
    secret: secretKey, 
    resave: true,
    saveUninitialized: true,
  })
);

app.use(flash()); // Initialize flash messages

// Initialize Passport and configure its session support
app.use(passport.initialize());
app.use(passport.session());

// Passport Configuration
function initializeUserDatabase() {
  const usersDBPath = path.join(__dirname, '..', 'data', 'userAccount.db');
  
  // Create and return the nedb instance
  const db = new nedb({ filename: usersDBPath, autoload: true });
  db.on('error', (err) => {
    console.error('Error initializing NeDB:', err);
  });
  console.log('NeDB initialized successfully');
  return db;
}

// Usage
const usersDB = initializeUserDatabase();


passport.use('local', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true,
}, async (req, username, password, done) => {
  try {
    const username = req.body.username;
    console.log('Username:', username);
  
    const user = await usersDB.findOne({ username: username });
    if (!user) {
      console.log('User not found');
      return done(null, false, req.flash('loginMessage', 'Incorrect username.'));
    }

      console.log('Retrieved user from the database:', user);

      // Ensure the user object has the correct password field
      if (!user.password) {
          console.log('Password field not found in the user object');
          return done(null, false, req.flash('loginMessage', 'Password field not found in the user object.'));
      }

      const result = await bcrypt.compare(password, user.password);
      console.log('Result of password comparison:', result);
      
      if (result) {
          console.log('Password is correct');
          return done(null, user);
      } else {
          console.log('Incorrect password');
          return done(null, false, req.flash('loginMessage', 'Incorrect password.'));
      }
  } catch (err) {
      console.error('Error in passport strategy:', err);
      return done(err);
  }
}));


passport.serializeUser((user, done) => {
  console.log('Serializing user:', user);

  done(null, user._id.toString());
});

passport.deserializeUser((id, done) => {
  console.log('Deserializing user with ID:', id);
  usersDB.findOne({ _id: id }, (err, user) => {
    done(err, user);
  });
});




// Custom middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  console.log('User is not authenticated. Redirecting to /login');
  res.redirect('/'); // Redirect to login if not authenticated
};

app.use('/', aboutRoutes); // About Us page

// General route for authenticated dashboard
app.get('/dashboard', isAuthenticated, (req, res) => {
  // Determine the user role and render the corresponding dashboard
  const role = req.user.role;
  if (role === 'alumni') {
    console.log('Rendering alumniDashboard');
    res.render('alumniDashboard', { user: req.user });
  } else if (role === 'manager') {
    console.log('Rendering managerDashboard');
    res.render('managerDashboard', { user: req.user });
  } else {
    console.error('Invalid role specified for the dashboard.');
    res.status(400).send('Invalid role specified for the dashboard.');
  }
});

app.get('/logout', (req, res) => {
  req.logout();
  console.log('User logged out. Redirecting to /about');
  res.redirect('/'); // Redirect to About Us after logout
});

// manger routes

// Import the userAccount model or any other method to fetch user data
const userAccountModel = require('./models/alumni'); // Replace with the actual path

// Define the function to fetch user account data
const fetchUserAccountData = async () => {
  try {
      return await userAccountModel.getAllUsers();
  } catch (error) {
      console.error(error);
      throw error;
  }
};

// Inside /managerDashboard route
app.get('/managerDashboard', async (req, res) => {
  try {
      const events = await new Promise((resolve, reject) => {
          aboutController.getAllEvents((err, events) => {
              if (err) {
                  reject(err);
              } else {
                  resolve(events);
              }
          });
      });

      console.log('Reached Manager Dashboard route');

      // Fetch userAccount data
      const userAccount = await fetchUserAccountData();

      // Render the managerDashboard page with events and userAccount data
      res.render('managerDashboard', { user: req.user, events, userAccount });
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});




// Route to handle event deletion
app.post('/delete-event/:eventId', aboutController.deleteEvent);

// Route to render the update event form
app.get('/update-event/:eventId', aboutController.renderUpdateForm);

// Route to handle event update
app.post('/update-event/:eventId', aboutController.updateEvent);

// Route to fetch alumni list for a specific event
app.get('/alumniList/:eventId', aboutController.getAlumniList);

// Route to handle event creation
app.post('/createEvent', async (req, res) => {
  try {
      await aboutController.createEvent(req, res);
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});



// Define a route for alumni dashboard
app.get('/alumniDashboard', async (req, res) => {
  try {
    // Fetch events from the database
    const eventsData = await aboutController.getAllEventsForAlumni();

    // Render alumniDashboard.ejs with the events data
    res.render('alumniDashboard', { events: eventsData });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Other routes and middleware should be defined after this
// Handle requests to fetch events by category
app.get('/events/category/:category', async (req, res) => {
  try {
      const category = req.params.category;
      const events = await aboutController.getEventsByCategory(category);

      res.json(events);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/register-event/:eventId', aboutController.registerEvent);

app.get('/registered-events', aboutController.getRegisteredEvents);

app.post('/unregister-event/:eventId', aboutController.unregisterEvent);


// Start the Express server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
