const datastore = require('nedb');
const path = require('path');
const fs = require('fs');

const databaseFile = path.join(__dirname, '..', 'data', 'events.db');

let db;

if (fs.existsSync(databaseFile)) {
    // Database file exists; use it
    db = new datastore({
        filename: databaseFile,
        autoload: true
    });
} else {
    // Database file doesn't exist; create a new Datastore instance
    db = new datastore({
        filename: databaseFile,
        autoload: true
    });
    db.on('error', (err) => {
        console.error('Error initializing NeDB:', err);
    });
}

// Inside getAllEvents function 
function getAllEvents(callback) {
    db.find({}, (err, events) => {
        if (err) {
            return callback(err, null);
        }
        return callback(null, events);
    });
}


// Function to add a new event to the database
function addEvent(event, callback) {
    db.insert(event, (err, newEvent) => {
        if (err) {
            return callback(err, null);
        }
        return callback(null, newEvent);
    });
}

// Function to remove an event from the database
function removeEvent(eventId, callback) {
    db.remove({ _id: eventId }, {}, (err, numRemoved) => {
        if (err) {
            return callback(err);
        }
        callback(null);
    });
}

// Function to get registered events for a specific alumni
function getRegisteredEvents(alumniId, callback) {
    db.find({ registeredUsers: alumniId }, (err, events) => {
        if (err) {
            return callback(err, null);
        }
        return callback(null, events);
    });
}

// Function to add a user to the list of registered users for an event
function registerForEvent(alumniId, eventId, callback) {
    db.update({ _id: eventId }, { $addToSet: { registeredUsers: alumniId } }, {}, (err, numUpdated) => {
        if (err) {
            return callback(err);
        }
        callback(null);
    });
}

// Function to remove a user from the list of registered users for an event
function unregisterFromEvent(alumniId, eventId, callback) {
    db.update({ _id: eventId }, { $pull: { registeredUsers: alumniId } }, {}, (err, numUpdated) => {
        if (err) {
            return callback(err);
        }
        callback(null);
    });
}

// Function to get an event by its ID
function getById(eventId, callback) {
    db.findOne({ _id: eventId }, (err, event) => {
        if (err) {
            return callback(err, null);
        }
        return callback(null, event);
    });
}

// Update an event
function updateEvent(eventId, updatedEventData, callback) {
    db.update({ _id: eventId }, { $set: updatedEventData }, {}, (err, numUpdated) => {
        if (err) {
            return callback(err);
        }
        callback(null, numUpdated);
    });
}

module.exports = {
    getAllEvents,
    addEvent,
    removeEvent,
    getRegisteredEvents,
    registerForEvent,
    unregisterFromEvent,
    updateEvent,
    getById,
};
