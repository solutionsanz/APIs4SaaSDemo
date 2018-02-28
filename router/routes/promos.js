var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var config = require("../../config");
var http = require('http');
var https = require('https');
var fs = require('fs');


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

    /* GET Promos Records */
    app.get('/promos', function (req, res) {


        var solution = req.query.solution; //Promo Category to filter by.

        var DB_COLLECTION_NAME = "promos";

        var db = req.db;

        log("GET", "/promos", "DB_COLLECTION_NAME [" + DB_COLLECTION_NAME + "]");
        var collection = db.get(DB_COLLECTION_NAME);

        var q = {};

        // Verifying if contactId was populated, in which case we need to filter by.
        if (solution != null || solution != undefined) {

            log("GET", "/promos", "Querying by [" + solution + "]");
            q = {
                "Solution": solution
            };
        }

        collection.find(q, {}, function (e, docs) {

            log("GET", "/promos", "Found: [" + JSON.stringify({
                docs
            }) + "]");


            // In order to comply with the API documentation, 
            // let's validate if an Array was return, in which
            // case we simply return it.
            // Otherwise we will create an array of 1 element
            // in the response.
            var result = {};
            if (docs != null && docs != undefined && Array.isArray(docs)) {

                // result = {
                //     Promos: docs[0].Promos
                // };

                result = {
                    Promos: docs
                };


            } else {

                result = {
                    "Error": "Something went wrong, resultset is empty or undefined. Please verify logfile to diagnose root cause."
                };
            }


            // Returning result
            res.send(result);


        });

    });


    /* Notification Promos  Records */
    app.post('/notification/promos', function (req, res) {


        var solution = req.query.solution; //Promo Category to filter by.
        var notificationMethod = req.body.Method; //Promo Category to filter by.
        var email, mobile, address;

        if (notificationMethod != null && notificationMethod != undefined) {

            if (notificationMethod.Email != null && notificationMethod.Email != undefined) {

                email = notificationMethod.Email;
                log("POST", "/promos/notification", "Notification method set [email] set to [" + email + "]");
            }

            // @TODO: Mobile and Address not yet implemented...

        }


        var DB_COLLECTION_NAME = "promos";

        var db = req.db;

        log("POST", "/promos/notification", "DB_COLLECTION_NAME [" + DB_COLLECTION_NAME + "]");
        var collection = db.get(DB_COLLECTION_NAME);

        var q = {};

        // Verifying if contactId was populated, in which case we need to filter by.
        if (solution != null || solution != undefined) {

            log("POST", "/promos/notification", "Querying by [" + solution + "]");
            q = {
                "Solution": solution
            };
        }

        collection.find(q, {}, function (e, docs) {

            log("POST", "/promos/notification", "Found: [" + JSON.stringify({
                docs
            }) + "]");


            // In order to comply with the API documentation, 
            // let's validate if an Array was return, in which
            // case we simply return it.
            // Otherwise we will create an array of 1 element
            // in the response.
            var result = {};
            if (docs != null && docs != undefined && Array.isArray(docs)) {

                // result = {
                //     Promos: docs[0].Promos
                // };

                result = {
                    Promos: docs
                };


            } else {

                result = {
                    "Error": "Something went wrong, resultset is empty or undefined. Please verify logfile to diagnose root cause."
                };
            }

            if (email != null && email != undefined) {

                log("POST", "/promos/notification", "Preparing to send links by email");
                var template = "";

                switch (solution.toUpperCase()) {

                    case "INTEGRATION":
                        template = "../../templates/integration.json";
                        break;

                    case "CHATBOT":
                        template = "../../templates/chatbot.json";
                        break;


                    case "BLOCKCHAIN":
                        template = "../../templates/blockchain.json";
                        break;


                    case "CX":
                        template = "../../templates/cx.json";
                        break;


                    case "ERP":
                        template = "../../templates/erp.json";
                        break;


                    case "HCM":
                        template = "../../templates/hcm.json";
                        break;

                    default:
                        log("POST", "/promos/notification", "Invalid Content Promo Solution. Nothing to do.");
                        // Returning result
                        res.send({
                            "Error": "The Solution that you sent is not available, please choose from: integration, chatbot, blockchain, erp, cx and hcm. Thank you."
                        });
                }

                var emailBody = "";
                emailBody = require(template);

                //log("POST", "/promos/notification", "Body to be sent is [" + emailBody.body + "]");

                // Sending email:
                funct.sendEmail(email, "Oracle Public Cloud Link Reference", emailBody.body);

            } else {

                // Returning result
                res.send(result);
            }

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
        var records = req.body.Promos;

        if (records == null || records == undefined) {
            log("POST", "/promos", "No Records detected... Please verify and try again.");
            res.status(400).end("No Records detected... Please verify and try again."); //Bad request...
            return;
        }

        log("POST", "/promos", "Array of records to be inserted is [" + JSON.stringify(records) + "]");

        // Set collection
        log("POST", "/promos", "DB_COLLECTION_NAME [" + DB_COLLECTION_NAME + "]");
        var collection = db.get(DB_COLLECTION_NAME);

        // Let's insert each Promo:
        collection.insert(records, function (err, docs) {
            if (err) {
                log("POST", "/promos", "Oops, something wrong just happened.");
                res.send({
                    Message: 'Oops, something wrong just happened. Please veify log files to determine cause.'
                });
            }
        });

        // It all worked! Let's return successful answer.
        log("POST", "/promos", "Records were added successfully...");

        // In order to comply with the API documentation, 
        // let's validate if an Array was return, in which
        // case we simply return it.
        // Otherwise we will create an array of 1 element
        // in the response.
        var result = {
            "Promos": records
        };

        // Returning result
        res.send(result);

    });

};