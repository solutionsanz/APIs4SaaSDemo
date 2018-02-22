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
    app.get('/gifts', function (req, res) {

        var DB_COLLECTION_NAME = "gifts";

        var db = req.db;

        log("GET", "/gifts", "DB_COLLECTION_NAME [" + DB_COLLECTION_NAME + "]");
        var collection = db.get(DB_COLLECTION_NAME);

        var q = {};

        collection.find(q, {}, function (e, docs) {

            log("GET", "/gifts", "Found: [" + JSON.stringify({
                docs
            }) + "]");


            var result = {};

            if (docs == null || docs == undefined) {
                log("POST", "/gifts", "Gifts collection is empty.");

                result = {
                    "Gifts": []
                };
            } else {


                result = {
                    "Gifts": docs[0].Gifts
                };
            }

            // Returning result
            res.send(result);
        });

    });

    /* POST records */
    app.post('/gifts', function (req, res) {


        var token = req.get("token");

        console.log("Token received is [" + token + "]");

        if (token == null || token == undefined || token != "valid") {

            log("POST", "/gifts", "Invalid Token. Verify and try again.");
            res.status(400).end("Invalid Token. Verify and try again."); //Bad request...
            return;
        }



        var DB_COLLECTION_NAME = "gifts";

        // Set our internal DB variable
        var db = req.db;

        // Retrieve Records to be inserted from Body:
        var records = req.body;

        if (records == null || records == undefined) {
            log("POST", "/gifts", "No Records detected... Please verify and try again.");
            res.status(400).end("No Records detected... Please verify and try again."); //Bad request...
            return;
        }

        log("POST", "/gifts", "Array of records to be inserted is [" + JSON.stringify(records) + "]");

        // Set collection
        log("POST", "/gifts", "DB_COLLECTION_NAME [" + DB_COLLECTION_NAME + "]");
        var collection = db.get(DB_COLLECTION_NAME);

        // Insert row to MongoDB
        collection.insert(records, function (err, docs) {
            if (err) {
                log("POST", "/gifts", "Oops, something wrong just happened.");
                res.send({
                    Message: 'Oops, something wrong just happened. Please veify log files to determine cause.'
                });
            } else {

                // Let's keep only a single list of Gifts, so we are happy to remove any old gift list:
                log("POST", "/gifts", "New Id is [" + docs._id + "]");
                collection.remove({
                    "_id": {
                        $ne: docs._id
                    }
                });


                // It all worked! Let's return successful answer.
                log("POST", "/gifts", "Records were added successfully...");

                // In order to comply with the API documentation, 
                // let's validate if an Array was return, in which
                // case we simply return it.
                // Otherwise we will create an array of 1 element
                // in the response.
                var result = {};

                if (docs == null || docs == undefined || docs.Gifts == null || docs.Gifts == undefined) {
                    log("POST", "/gifts", "Oops, something wrong just happened, Gifts are empty or invalid.");
                    res.send({
                        Message: 'Oops, something wrong just happened, Gifts are empty or invalid. Please veify log files to determine cause.'
                    });
                }

                if (Array.isArray(docs.Gifts)) {

                    result = {
                        "Gifts": docs.Gifts
                    };

                } else {

                    result = {
                        "Gifts": [docs.Gifts]
                    };
                }

                // Returning result
                res.send(result);

            }
        });
    });

};