
var express = require('express');
const DashboardController = require('../controller/DashboardController');

// get router
var router = express.Router();

// define GET routes
router
    .get("/", DashboardController.start);

// define POST routes

module.exports = router;  
