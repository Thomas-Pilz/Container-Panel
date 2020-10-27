const app = require("express");

class DashboardController {
    static start(req, res) {
        try {
            res.render("dashboard", { layout: "base" });
        } catch (exception) {
            res.status(500).send(exception)
        }
    }
}

module.exports = DashboardController;