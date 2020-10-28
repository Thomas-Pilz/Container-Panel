const express = require("express");
const path = require("path");
const pug = require("pug");
const dashboardRoutes = require("./routes/dashboardRoutes");

// Initialize express app
const app = express();
const port = process.env.port || 3000;

// configure handlebars as the view engine of the app
app.set("view engine", "pug");
app.set("views", "./views");

// define routers
app.use("/dashboard/", dashboardRoutes);

// serve static files from public dir
app.use(express.static(path.join(__dirname, "public")));

// default route will (at this stage) redirect the user to the dashboard without authentication
app.get("/", (req, res) => {
    res.redirect("/dashboard");
});

// start server
app.listen(port, () => {
    console.log(`Express app listening at http://localhost:${port}`);
});