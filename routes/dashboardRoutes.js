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
    const intervalTime = 1000;
    dashboardController.sendUpdate(ws, req)
    ws.on('message', msg => {
        setTimeout(() => {
            dashboardController.sendUpdate(ws, req)
        }, intervalTime);
    });
    ws.on("close",(code, reason) => { 
        console.log(`Dashboard: WebSocket connection closed. \nCode: ${code}\tReason: ${reason}`)
    });
});  

module.exports = router;