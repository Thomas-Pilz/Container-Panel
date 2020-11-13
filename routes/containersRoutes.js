const express = require("express");
const expressWs = require("express-ws");
const { containerController } = require("../controller/containerController");

// get router
const router = express.Router();
expressWs(router);

// Routes for HTTP requests
router
    .get("/", containerController.showAllContainer)
    .get("/:id", containerController.showContainer)
    // .get("/:id", (req, res) => {
    //     res.send("lol");
    // })
    .post("/action", containerController.containerAction);

// Routes for WebSocket
router.ws("/:id", (ws, req) => {
    ws.on("message", msg => {
        containerController.subscribeRuntimeInfoFromContainer(ws, req);
    });

    ws.on("close", (code, reason) => {
        // containerController.unsubscribeRuntimeInfoFromContainer(ws, req);
        console.log(`Container-Detail: WebSocket connection closed. \nCode: ${code}\tReason: ${reason}`)
    });
});

module.exports = router;