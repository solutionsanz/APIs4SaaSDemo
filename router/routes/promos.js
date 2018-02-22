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
    app.get('/promos', function (req, res) {

        var DB_COLLECTION_NAME = "promos";

        var db = req.db;

        log("GET", "/promos", "DB_COLLECTION_NAME [" + DB_COLLECTION_NAME + "]");
        var collection = db.get(DB_COLLECTION_NAME);

        var q = {};

        collection.find(q, {}, function (e, docs) {

            log("GET", "/promos", "Found: [" + JSON.stringify({
                docs
            }) + "]");


            var result = {};
            if (docs == null || docs == undefined) {
                log("POST", "/promos", "Promos collection is empty.");

                result = {
                    "Promos": []
                };
            } else {

                result = {
                    "Promos": docs[0].Promos
                };
            }

            // Returning result
            res.send(result);
        });

    });

    /* POST records */
    app.post('/promos', function (req, res) {


        var token = req.get("token");

        console.log("Token received is [" + token + "]");

        if (token == null || token == undefined || token != "valid") {

            log("POST", "/gifts", "Invalid Token. Verify and try again.");
            res.status(400).end("Invalid Token. Verify and try again."); //Bad request...
            return;
        }


        var DB_COLLECTION_NAME = "promos";

        // Set our internal DB variable
        var db = req.db;

        // Retrieve Records to be inserted from Body:
        var records = req.body;

        if (records == null || records == undefined) {
            log("POST", "/promos", "No Records detected... Please verify and try again.");
            res.status(400).end("No Records detected... Please verify and try again."); //Bad request...
            return;
        }

        log("POST", "/promos", "Array of records to be inserted is [" + JSON.stringify(records) + "]");

        // Set collection
        log("POST", "/promos", "DB_COLLECTION_NAME [" + DB_COLLECTION_NAME + "]");
        var collection = db.get(DB_COLLECTION_NAME);

        // Insert row to MongoDB
        collection.insert(records, function (err, docs) {
            if (err) {
                log("POST", "/promos", "Oops, something wrong just happened.");
                res.send({
                    Message: 'Oops, something wrong just happened. Please veify log files to determine cause.'
                });
            } else {

                // Let's keep only a single list of Promos, so we are happy to remove any old gift list:
                log("POST", "/promos", "New Id is [" + docs._id + "]");
                collection.remove({
                    "_id": {
                        $ne: docs._id
                    }
                });

                // It all worked! Let's return successful answer.
                log("POST", "/promos", "Records were added successfully...");

                // In order to comply with the API documentation, 
                // let's validate if an Array was return, in which
                // case we simply return it.
                // Otherwise we will create an array of 1 element
                // in the response.
                var result = {};
                if (docs == null || docs == undefined || docs.Promos == null || docs.Promos == undefined) {
                    log("POST", "/Promos", "Oops, something wrong just happened, Promos are empty or invalid.");
                    res.send({
                        Message: 'Oops, something wrong just happened, Promos are empty or invalid. Please veify log files to determine cause.'
                    });
                }

                if (Array.isArray(docs.Promos)) {

                    result = {
                        "Promos": docs.Promos
                    };

                } else {

                    result = {
                        "Promos": [docs.Promos]
                    };
                }

                // Returning result
                res.send(result);

            }
        });
    });

};