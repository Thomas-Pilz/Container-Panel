const express = require("express");
const expressWs = require('express-ws')
const path = require("path");
const bodyParser = require("body-parser");
const dashboardRoutes = require("./routes/dashboardRoutes");
const containersRoutes = require("./routes/containersRoutes");

// Initialize express app
const app = express();
expressWs(app)
const port = process.env.port || 3000;

// configure handlebars as the view engine of the app
app.set("view engine", "pug");
app.set("views", "./views");

// define middleware
app.use(bodyParser.json());

// serve static files from public dir
app.use(express.static(path.join(__dirname, "public")));
app.use("/containers", express.static(path.join(__dirname, "public")));

// define routers
app.use("/dashboard/", dashboardRoutes);
app.use("/containers/", containersRoutes);

// default route will (at this stage) redirect the user to the dashboard without authentication
app.get("/", (req, res) => {
    //res.redirect("/containers/6f5460e289bf283779ec993a0d7dd6f3764d838f87c46b85c15ef0491037ff44");
    res.redirect("/dashboard");
});

// start server
app.listen(port, () => {
    console.log(`Express app listening at http://0.0.0.0:${port}`);
});