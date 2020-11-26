const express = require("express");
const expressWs = require("express-ws");
const { dashboardController } = require("../controller/dashboardController");

// get router
const router = express.Router();
expressWs(router);

// Routes for HTTP requests
router
    .get("/", dashboardController.showDashboard);


// routes for websockets
router.ws('/', (ws, req) => {
    dashboardController.sendLiveInfo(ws, req);
});  

module.exports = router;