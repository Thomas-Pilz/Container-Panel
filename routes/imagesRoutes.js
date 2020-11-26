const express = require("express");
const expressWs = require("express-ws");
const { containerController: imagesController } = require("../controller/imagesController");

// get router
const router = express.Router();
expressWs(router);

// Routes for HTTP requests
router
    .get("/", imagesController.showAllImages)
    .get("/:id", imagesController.showImage)

// Routes for WebSocket
router.ws("/:id", (ws, req) => {
    const updateInterval = 1000;
    const handle = imagesController.subscribeImageInfo(ws, req, updateInterval);

    ws.on("close", (code, reason) => {
        imagesController.unsubscribeImageInfo(handle);
        console.log(`Images: WebSocket connection closed. \nCode: ${code}\tReason: ${reason}`);
    });
});

module.exports = router;