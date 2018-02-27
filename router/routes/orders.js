var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var config = require("../../config");
var http = require('http');
var https = require('https');

var funct = require('./functions');


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
    app.get('/orders', function (req, res) {

        var DB_COLLECTION_NAME = "orders";

        var db = req.db;

        var orderId = req.query.id; //Contact Id to filter by.        

        log("GET", "/orders", "DB_COLLECTION_NAME [" + DB_COLLECTION_NAME + "]");
        var collection = db.get(DB_COLLECTION_NAME);

        var q = {};

        // Verifying if orderId was populated, in which case we need to filter by.
        if (orderId != null || orderId != undefined) {

            q = {
                "_id": orderId
            };
        }

        collection.find(q, {}, function (e, docs) {

            log("GET", "/orders", "Found: [" + JSON.stringify({
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
                    "Orders": docs
                };

            } else {

                result = {
                    "Orders": [docs]
                };
            }

            // Returning result
            res.send(result);
        });

    });

    /* POST records */
    app.post('/orders', function (req, res) {

        var DB_COLLECTION_NAME = "orders";

        // Set our internal DB variable
        var db = req.db;

        // Retrieve Records to be inserted from Body:
        var records = req.body.Orders;

        if (records == null || records == undefined) {
            log("POST", "/orders", "No Records detected... Please verify and try again.");
            res.status(400).end("No Records detected... Please verify and try again."); //Bad request...
            return;
        }

        // Set collection
        log("POST", "/orders", "DB_COLLECTION_NAME [" + DB_COLLECTION_NAME + "]");
        var collection = db.get(DB_COLLECTION_NAME);

        // Adding Date and Time in ISO format: "yyyy-MM-ddTHH:mm:ss"
        records[0].DateTime = new Date().toISOString().replace(/\..+/, '');

        // Adding Open status (options include open and closed)
        records[0].Status = "open";

        // Adding new TrackingId
        records[0].TrackingId = funct.getNewID();

        log("POST", "/orders", "Array of records to be inserted is [" + JSON.stringify(records) + "]");

        // Insert row to MongoDB
        collection.insert(records, function (err, docs) {
            if (err) {
                log("POST", "/orders", "Oops, something wrong just happened.");
                res.send({
                    Message: 'Oops, something wrong just happened. Please veify log files to determine cause.'
                });
            } else {

                // It all worked! Let's return successful answer.
                log("POST", "/orders", "Records were added successfully...");

                // In order to comply with the API documentation, 
                // let's validate if an Array was return, in which
                // case we simply return it.
                // Otherwise we will create an array of 1 element
                // in the response.
                var result = {};
                if (docs != null && docs != undefined && Array.isArray(docs)) {

                    result = {
                        "Orders": docs
                    };

                } else {

                    result = {
                        "Orders": [docs]
                    };
                }

                // Returning result
                res.send(result);

            }
        });
    });

    /* PUT Order status */
    app.put('/orders/:id/status', function (req, res) {

        var token = req.get("token");

        console.log("Token received is [" + token + "]");

        if (token == null || token == undefined || token != "valid") {

            log("PUT", "/orders/:id/status", "Invalid Token. Verify and try again.");
            res.status(400).end("Invalid Token. Verify and try again."); //Bad request...
            return;
        }

        // Retrieve Order Id and Status from Path and Body respectively:     
        var orderId = req.params.id;
        var orderStatus = req.body.Order.Status;


        console.log("order Id [" + orderId + "], order status is [" + orderStatus + "]");

        if (orderId == null || orderId == undefined || orderStatus == null ||
            orderStatus == undefined) {

            log("PUT", "/orders/:id/status", "Invalid or empty order Id or status. Verify and try again.");
            res.status(400).end("Invalid or empty order Id or status. Verify and try again."); //Bad request...
            return;
        }

        var DB_COLLECTION_NAME = "orders";

        // Set our internal DB variable
        var db = req.db;

        // Set collection
        log("PUT", "/orders/:id/status", "DB_COLLECTION_NAME [" + DB_COLLECTION_NAME + "]");
        var collection = db.get(DB_COLLECTION_NAME);

        // Adding ClosingDate and Time in ISO format: "yyyy-MM-ddTHH:mm:ss"
        var closingDateTime = new Date().toISOString().replace(/\..+/, '');


        log("PUT", "/orders/:id/status", "Updating Order [" + orderId + "], with status [" + orderStatus + "] at [" + closingDateTime + "]");

        // Insert row to MongoDB
        collection.update({
            "_id": orderId
        }, {
            $set: {
                "Status": orderStatus,
                "ClosingDate": closingDateTime
            }
        }, function (err, docs) {
            if (err) {
                log("PUT", "/orders/:id/status", "Oops, something wrong just happened.");
                res.send({
                    Message: 'Oops, something wrong just happened. Please veify log files to determine cause.'
                });
            } else {

                // It all worked! Let's return successful answer.
                log("PUT", "/orders/:id/status", "Order status was updates successfully...");

                // Returning result
                res.send({
                    "_id": orderId
                });

            }
        });
    });

};