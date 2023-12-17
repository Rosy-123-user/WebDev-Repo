// alumni.js (Alumni Model)

const datastore = require('nedb');
const path = require('path');

// Initialize the NeDB database for alumni
const alumniDB = new datastore({
    filename: path.join(__dirname, '..','data','userAccount.db'), // Update the path to your userAccount.db
    autoload: true,
});

// Define the Alumni schema
const Alumni = {
    // Find alumni by ID
    findById: (id, callback) => {
        alumniDB.findOne({ _id: id }, callback);
    },
    // Add an event to the list of registered events for an alumni
    registerForEvent: (alumniId, eventId, callback) => {
        alumniDB.update(
            { _id: alumniId },
            { $addToSet: { registeredEvents: eventId } },
            {},
            callback
        );
    },
    // Remove an event from the list of registered events for an alumni
    unregisterFromEvent: (alumniId, eventId, callback) => {
        alumniDB.update(
            { _id: alumniId },
            { $pull: { registeredEvents: eventId } },
            {},
            callback
        );
    },
    // Get the list of registered events for an alumni
    getRegisteredEvents: (alumniId, callback) => {
        alumniDB.findOne({ _id: alumniId }, (err, alumni) => {
            if (err) {
                return callback(err);
            }
            callback(null, alumni.registeredEvents || []);
        });
    },
};

module.exports = Alumni;
