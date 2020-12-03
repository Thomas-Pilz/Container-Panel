const { model } = require("../models/model");
const pug = require("pug");
const path = require('path');
const isEmpty = require("lodash.isempty");
const utils = require("../utils/utils");
const formatter = require("../utils/formatter");


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
            let containers = await model.getContainers();
            let images = await model.getImages();

            // format output
            // containers
            containers = formatter.formatContainers(containers);

            // images
            images = formatter.formatImages(images);

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
        let containers = model.getContainers();
        let images = model.getImages();
        const hostStats = model.getHostStats();
        const stateCount = model.getStateCount(await containers);

        // containers
        containers = formatter.formatContainers(await containers);
        utils.sendEvent(ws,"updateContainers", {
            containerTableHtml: containerTableTempl({ containers: containers }),
            stateCount: stateCount,
        });

        // images
        images = formatter.formatImages(await images);
        utils.sendEvent(ws,"updateImages", {
            images: images,
            imageTableHtml: imageTableTempl({ images: images }),
        });

        // host stats
        utils.sendEvent(ws,"updateHostStats", await hostStats);

        // subscribe to events to keep client updated
        model.subscribeInfo("containers", (data) => {
            const stateCount = model.getStateCount(data)
            data = formatter.formatContainers(data);
            utils.sendEvent(ws,"updateContainers", {
                containerTableHtml: containerTableTempl({ containers: data }),
                stateCount: stateCount,
            });
        });

        model.subscribeInfo("images", (data) => {
            data = formatter.formatImages(data);
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