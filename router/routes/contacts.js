var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var config = require("../../config");
var http = require('http');
var https = require('https');

//CRI change:
var bodyParser = require('body-parser');

// Configure application routes
module.exports = function (app) {

    // CRI change to allow JSON parsing from requests:    
    app.use(bodyParser.json()); // Support for json encoded bodies 
    app.use(bodyParser.urlencoded({
        extended: true
    })); // Support for encoded bodies

    function log(apiMethod, apiUri, msg) {
        console.log("[" + apiMethod + "], [" + apiUri + "], [" + msg + "], [UTC:" +
            new Date().toISOString().replace(/\..+/, '') + "]");
    }

    /**
     * Adding MongoDB APIs:
     * 
     */

    /* GET Records */
    app.get('/contacts', function (req, res) {

        var DB_COLLECTION_NAME = "contacts";

        var db = req.db;

        var contactId = req.query.id; //Contact Id to filter by.
        var contactName = req.query.name; //Contact Id to filter by.
        var contactEmail = req.query.email; //Contact Id to filter by.

        log("GET", "/contacts", "DB_COLLECTION_NAME [" + DB_COLLECTION_NAME + "]");
        var collection = db.get(DB_COLLECTION_NAME);

        var q = {};

        // Verifying if contactId was populated, in which case we need to filter by.
        if (contactId != null || contactId != undefined) {

            q._id = contactId;
        }
        // Verifying if contactName was populated, in which case we need to filter by.
        if (contactName != null || contactName != undefined) {

            q.Name = contactName;
        }
        // Verifying if contactEmail was populated, in which case we need to filter by.
        if (contactEmail != null || contactEmail != undefined) {

            q.Email = contactEmail;
        }

        collection.find(q, {}, function (e, docs) {

            log("GET", "/contacts", "Found: [" + JSON.stringify({
                docs
            }) + "]");


            // In order to comply with the API documentation, 
            // let's validate if an Array was return, in which
            // case we simply return it.
            // Otherwise we will create an array of 1 element
            // in the response.
            var result = {};
            if (docs != null && docs != undefined && Array.isArray(docs)) {

                result = {
                    "Contacts": docs
                };

            } else {

                result = {
                    "Contacts": [docs]
                };
            }

            // Returning result
            res.send(result);
        });

    });

    /* POST records */
    app.post('/contacts', function (req, res) {

        var DB_COLLECTION_NAME = "contacts";

        // Set our internal DB variable
        var db = req.db;

        // Retrieve Records to be inserted from Body:
        var records = req.body.Contacts;

        if (records == null || records == undefined) {
            log("POST", "/contacts", "No Records detected... Please verify and try again.");
            res.status(400).end("No Records detected... Please verify and try again."); //Bad request...
            return;
        }

        log("POST", "/contacts", "Array of records to be inserted is [" + JSON.stringify(records) + "] - Although Duplicates based on MEail will be avoided");

        // Set collection
        log("POST", "/contacts", "DB_COLLECTION_NAME [" + DB_COLLECTION_NAME + "]");
        var collection = db.get(DB_COLLECTION_NAME);

        // Let's update existing contacts and add the new ones:
        log("POST", "/contacts", "Number of records to assess for uniqueness [" + records.length + "]");

        var addedContacts = [];

        for (var i = 0; i < records.length; ++i) {

            var currEmail = records[i].Email;
            log("POST", "/contacts", "Analysing Email [" + currEmail + "] for uniqueness");


            // Let's update existing contacts and add the new ones, upsert equals true to add if new::
            collection.update({
                "Email": currEmail
            }, records[i], {
                upsert: true
            }, function (err, docs) {
                if (err) {
                    log("POST", "/contacts", "Oops, something wrong just happened.");
                    res.send({
                        Message: 'Oops, something wrong just happened. Please veify log files to determine cause.'
                    });
                }
            });
        }

        // It all worked! Let's return successful answer.
        log("POST", "/contacts", "Records were added successfully...");

        // In order to comply with the API documentation, 
        // let's validate if an Array was return, in which
        // case we simply return it.
        // Otherwise we will create an array of 1 element
        // in the response.
        var result = {
            "Contacts": records
        };

        // Returning result
        res.send(result);

    });

};