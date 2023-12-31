const express = require('express');
const passport = require('passport');
const datastore = require('nedb');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const saltRounds = 10;

const userDatabaseFile = path.join(__dirname, '..', 'data', 'userAccount.db');
const eventDatabaseFile = path.join(__dirname, '..', 'data', 'events.db');

let userDb;
let eventsDb;

// Function to create and load the database
function createAndLoadDatabase(databaseFile) {
    // Check if the database file exists
    if (fs.existsSync(databaseFile)) {
        // Database file exists; use it
        return new datastore({
            filename: databaseFile,
            autoload: true
        });
    } else {
        // Database file doesn't exist; handle this case as needed
        console.error(`Database file ${databaseFile} does not exist.`);
        return null;
    }
}

// Create and load events database
eventsDb = createAndLoadDatabase(eventDatabaseFile);

// Create and load userAccount database
userDb = createAndLoadDatabase(userDatabaseFile);

// Check if the databases were successfully created and loaded
if (!eventsDb || !userDb) {
    console.error('Error creating or loading databases.');
    // Handle the error appropriately, e.g., by exiting the application
    process.exit(1);
}


const nodemailer = require('nodemailer'); // Import nodemailer for sending emails

// Initialize NeDB and create a collection
const EventModel = eventsDb;


// In your route or controller, you can now use EventModel
const displayAboutPage = async (req, res) => {
    try {
        // Fetch events from the NeDB collection
        EventModel.find({}, (err, events) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Internal Server Error');
            }

            console.log('Fetched events:', events); // Log events to console for debugging

            // Render the About Us page with events data
            res.render('about', { events, message: req.flash('error') });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const signup = async (req, res) => {
    try {
        const { username, password, email, phone, category, name, role } = req.body;

        // Check if the username is already taken
        const existingUser = await userDb.findOne({ username });

        console.log('Existing user:', existingUser);

        if (existingUser && existingUser.password) {
            return res.status(400).send('Username already taken. Please choose another username.');
        }

        // Hash the password before storing it
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Save user data to the NeDB database
        const newUser = {
            username,
            password: hashedPassword,
            email,
            phone,
            category,
            name,
            role,
        };
        await userDb.insert(newUser);

        // Redirect to alumni or manager dashboard based on user role
        if (newUser.role === 'alumni') {
            res.redirect('/alumniDashboard');
        } else if (newUser.role === 'manager') {
            res.redirect('/managerDashboard');
        } else {
            res.status(400).send('Invalid role specified during signup.');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


const signupForm = (req, res) => {
    res.render('signup'); 
};


// Other controller functions related to the About Us page can be added here

const login = (req, res, next) => {
passport.authenticate('local', {
    failureRedirect: '/',
    failureFlash: true,
    successRedirect: (req) => {
        // Dynamically set the success redirect based on the user's role
        if (req.user.role === 'alumni') {
            return '/alumniDashboard';
        } else if (req.user.role === 'manager') {
            return '/managerDashboard';
        } else {
            console.log('failure loging in');
            return '/';
        }
    },
    })(req, res, next);
};


// Modify the successRedirect dynamically based on the user's role
const loginMiddleware = (req, res, next) => {

    passport.authenticate('local', (err, user, info) => {
    console.log('Passport authentication callback:', err, user, info);       
        if (err) {
            console.error(err);
            return next(err);
        }
        if (!user) {
            console.log('Authentication failed');
            // Redirect to the About Us page on login failure
            return res.redirect('/');
        }

        console.log('Authentication succeeded');
        // Redirect to the appropriate dashboard based on the user's role
        if (user.role === 'alumni') {
            console.log('Login successful. Redirecting to /alumniDashboard');
            return res.redirect('/alumniDashboard');
        } else if (user.role === 'manager') {
            console.log('Login successful. Redirecting to /managerDashboard');
            return res.redirect('/managerDashboard');
        } else {
            // Handle other roles or redirect to a default dashboard
            console.log('Login successful but user role is unknown. Redirecting to /dashboard');
            return res.redirect('/');
        }
    })(req, res, next);
};




const loginForm = (req, res) => {
    res.render('login'); // Update with your login form template
};

const sendContactEmail = async (req, res) => {
    try {
        const { name, email, message } = req.body;

        // Use nodemailer to send an email with the contact form details
        // Set up a nodemailer transporter with your email provider's settings
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: 'your-email@gmail.com',//not yet implemented
            to: 'r.niyigaba@alustudent.com',
            subject: 'Contact Form Submission',
            text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
        };

        await transporter.sendMail(mailOptions);

        res.redirect('/'); // Redirect back to the About Us page after sending email
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

// alumniDashboard controller

const getAllEventsForAlumni = async (alumniId) => {
    return new Promise((resolve, reject) => {
        EventModel.find({ attendees: alumniId }, (err, events) => {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                console.log('Fetched alumni events:', events);
                resolve(events);
            }
        });
    });
};

// Fetch events by category
const getEventsByCategory = async (category) => {
    return new Promise((resolve, reject) => {
        EventModel.find({ category }, (err, events) => {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                console.log(`Fetched events for category "${category}":`, events);
                resolve(events);
            }
        });
    });
};

const registerEvent = async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const alumniId = req.user._id; // Assuming you have alumni ID in the user object

        // Add alumni to the list of attendees for the event
        await EventModel.update({ _id: eventId }, { $push: { attendees: alumniId } });

        res.redirect('/alumniDashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const getRegisteredEvents = async (req, res) => {
    try {
        const alumniId = req.user._id; // Assuming you have alumni ID in the user object

        // Fetch events where the alumni is registered
        const registeredEvents = await EventModel.find({ attendees: alumniId });

        res.render('registeredEvents', { registeredEvents });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const unregisterEvent = async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const alumniId = req.user._id; // Assuming you have alumni ID in the user object

        // Remove alumni from the list of attendees for the event
        await EventModel.update({ _id: eventId }, { $pull: { attendees: alumniId } });

        res.redirect('/alumniDashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

// managerDashboard

// Fetch all events
const getAllEvents = async (callback) => {
    EventModel.find({}, (err, events) => {
        if (err) {
            console.error(err);
            return callback(err, null);
        }
        console.log('Fetched events:', events);
        callback(null, events);
    });
};


// Create a new event
const createEvent = async (req, res) => {
    const { title, description, date, category } = req.body;

    console.log('Received data:', { title, description, date, category });

    try {
        // Use insert to add a new document to the collection
        const newEvent = await EventModel.insert({
            title,
            description,
            date,
            category,
        });

        console.log('Created event:', newEvent);

        res.redirect('/managerDashboard');
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).send('Internal Server Error');
    }
};


// Delete an event
const deleteEvent = async (req, res) => {
    const eventId = req.params.eventId;
    try {
        // Remove the event from the NeDB collection
        await EventModel.remove({ _id: eventId });

        res.redirect('/managerDashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

// Update an event
const updateEvent = async (req, res) => {
    const eventId = req.params.eventId;
    const { title, description, date, category } = req.body;

    try {
        // Update the event in the NeDB collection
        await EventModel.update({ _id: eventId }, { title, description, date, category });

        res.redirect('/managerDashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


// Function to render the update event form
const renderUpdateForm = async (req, res) => {
    try {
        const eventId = req.params.eventId;
        // Fetch the event details from the database using eventId
        const event = await EventModel.getById(eventId);

        // Render the managerDashboard.ejs file with the event details
        res.render('managerDashboard', { events: [event], updateEventId: eventId });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


// Fetch alumni list for a specific event
const getAlumniList = async (req, res) => {
    const eventId = req.params.eventId;

    try {
        // Fetch the event from the NeDB collection
        const event = await EventModel.findOne({ _id: eventId });

        if (!event) {
            return res.status(404).send('Event not found.');
        }

        // Render the alumni list page with event data
        res.render('alumniList', { event });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

// Update an alumni
const updateAlumni = async (req, res) => {
    const alumniId = req.params.alumniId;
    const { name, email, phoneNumber, graduationYear } = req.body;

    try {
        // Update the alumni in the NeDB collection
        await AlumniModel.update({ _id: alumniId }, { name, email, phoneNumber, graduationYear });

        res.redirect('/managerDashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

// Delete an alumni
const deleteAlumni = async (req, res) => {
    const alumniId = req.params.alumniId;
    try {
        // Remove the alumni from the NeDB collection
        await AlumniModel.remove({ _id: alumniId });

        res.redirect('/managerDashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

// Render the update alumni form
const renderUpdateAlumniForm = async (req, res) => {
    try {
        const alumniId = req.params.alumniId;
        // Fetch the alumni details from the database using alumniId
        const alumni = await AlumniModel.getById(alumniId);

        // Render the managerDashboard.ejs file with the alumni details
        res.render('managerDashboard', { userAccount: [alumni] });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};




module.exports = {
    displayAboutPage,
    signup,
    signupForm,
    loginMiddleware,
    login,
    loginForm,
    sendContactEmail,
    

    getAllEventsForAlumni,
    getEventsByCategory,
    registerEvent,
    getRegisteredEvents,
    unregisterEvent,


    getAllEvents,
    createEvent,
    deleteEvent,
    updateEvent,
    renderUpdateForm,
    getAlumniList,
    deleteAlumni,
    renderUpdateAlumniForm,
       
};
