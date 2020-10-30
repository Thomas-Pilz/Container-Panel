const express = require('express');
const { DashboardController } = require('../controller/DashboardController');

// get router
const router = express.Router();

// define GET routes
router
    .get("/", DashboardController.start);
    // .get("/", ContainersController.start)
    // .get("/", ImagesController.start)
    // .get("/", RessourcesController.start)

// define POST routes

module.exports = router;  
