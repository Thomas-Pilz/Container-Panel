const express = require('express');
const expressWs = require('express-ws')
const dashboardController = require('../controller/DashboardController');
const { ContainerController } = require('../controller/ContainerController');

// get router
const router = express.Router();
expressWs(router);

// Routes for HTTP requests
router
    .get("/", dashboardController.showDashboard)
    .get("/containers", ContainerController.showAllContainer)
    .get("/containers/:id", ContainerController.showContainer);
// .get("/", ImagesController.start)
// .get("/", RessourcesController.start)


// routes for websockets
router.ws('/', (ws, req) => {
    const intervalTime = 1000;
    dashboardController.sendUpdate(ws, req)
    ws.on('message', msg => {
        setTimeout(() => {
            dashboardController.sendUpdate(ws, req)
        }, intervalTime);
    });

    ws.on("close",(code, reason) => { 
        console.log("connection closed.") 
    });
});

module.exports = router;  
