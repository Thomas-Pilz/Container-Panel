const express = require('express');
const { DashboardController } = require('../controller/DashboardController');
const { ContainerController } = require('../controller/ContainerController');

// get router
const router = express.Router();

// define GET routes
router
    .get("/", DashboardController.showDashboard)
    .get("/containers", ContainerController.showAllContainer)
    .get("/containers/:id", ContainerController.showContainer);
    // .get("/", ImagesController.start)
    // .get("/", RessourcesController.start)

// define POST routes

module.exports = router;  
