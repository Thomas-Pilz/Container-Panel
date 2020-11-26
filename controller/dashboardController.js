const { model } = require("../models/model");
const pug = require("pug");
const path = require('path');
const isEmpty = require("lodash.isempty");
const utils = require("../utils/utils");


// compile templates once and so the only need to be rendered for each data update
const containerTableTempl = pug.compileFile(path.join(__dirname, "../views/dashboard/containerTable.pug"));
const imageTableTempl = pug.compileFile(path.join(__dirname, "../views/dashboard/imageTable.pug"));
let stateCount;
/**
 * Creates a DashboardController object used to determine actions to be carried out.
 *
 * @class DashboardController
 * @classdesc Controller for the Dashboard. 
 * This class implements the Singleton pattern, so an instance is obtained calling getInstance().
 * @author Thomas Pilz
 */
const dashboardController = {
    showDashboard: async (req, res) => {
        try {
            // get containers
            const containers = await model.getContainers();
            const images = await model.getImages();

            // render view
            res.render("dashboard/dashboard", {
                title: "Dashboard",
                containers: containers,
                images: images,
                nav: model.getNav(),
            });
        } catch (exception) {
            res.status(500).send(exception)
        }
    },

    sendLiveInfo: async (ws, req) => {
        // get and send current info
        const containers = model.getContainers();
        const images = model.getImages();
        const hostStats = model.getHostStats();

        utils.sendEvent(ws,"updateContainers", {
            containerTableHtml: containerTableTempl({ containers: await containers }),
            stateCount: model.getStateCount(await containers),
        });
        utils.sendEvent(ws,"updateImages", {
            imageTableHtml: imageTableTempl({ images: await images }),
        });
        utils.sendEvent(ws,"updateHostStats", await hostStats);

        // subscribe to events to keep client updated
        model.subscribeInfo("containers", (data) => {
            utils.sendEvent(ws,"updateContainers", {
                containerTableHtml: containerTableTempl({ containers: data }),
                stateCount: model.getStateCount(data),
            });
        });

        model.subscribeInfo("images", (data) => {
            utils.sendEvent(ws,"updateImages", {
                imageTableHtml: imageTableTempl({ images: data }),
            });
        });

        model.subscribeInfo("hostStats", (data) => {
            utils.sendEvent(ws, "updateHostStats", data);
        });
    },
}
module.exports.dashboardController = dashboardController;