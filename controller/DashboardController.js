const { json } = require("express");
const { model } = require("../models/ContainerModel");

// Needed to manipulate nav-sidebar dynamically 
const nav = [
    { href: "/dashboard", text: "Dashboard", iconClass: "fas fa-th fa-lg pr-3 text-white" },
    { href: "/containers", text: "Container", iconClass: "fab fa-docker fa-lg pr-3 text-white" },
    { href: "/images", text: "Images", iconClass: "far fa-clone fa-lg pr-3 text-white" },
    { href: "/ressources", text: "Ressources", iconClass: "fas fa-server fa-lg pr-3 text-white" },
]

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
            const containers = await model.getContainers(true);
            const images = await model.getImages();

            // format output
            images.forEach((image) => {
                // get rid of "SHA256:" prefix
                image.Id = image.Id.substring(7);
                // format milliseconds to be an actual date
                image.Created = new Date(1600843079000).toLocaleString('de-DE');//                                     1584120305684);
                // convert to MB with 2 decimal places
                image.Size = dashboardController.conv2readableSizeFormat(image.Size);
            });

            // render view
            res.render("dashboard/dashboard", {
                title: "Dashboard",
                containers: containers,
                numRunContainers: 2,
                images: images,
                nav: nav
            });
        } catch (exception) {
            res.status(500).send(exception)
        }
    },

    sendUpdate: async (ws, req) => {
        stats = model.getHostCurrentStats();
        containers = await model.getContainers(true);

        let stateCount = {};
        containers.forEach(container => {
            if (stateCount[container.State]) {
                stateCount[container.State] += 1;
            }
            else {
                stateCount[container.State] = 1;
            }
        });

        try {
            ws.send(JSON.stringify({
                containers: containers,
                stateCount: stateCount,
                hostStats: await stats,
            }));
        } catch (error) {
            // WebSocket could be closed while timeout (this method is called after a timeout) or processing of this method --> excpetion will occur
        }

    },

    conv2readableSizeFormat: (size) => {
        const factor = 1000;  // use 1000 instead of 1024 because the docker CLI works the same way! and in facht GB => 1000 GiBi => 1024
        const sizes = {
            0: "K",
            1: "KB",
            2: "MB",
            3: "GB",
            4: "TB"
        }
        let count = 0;
        let convSize = size;

        while (convSize >= 1024 || count === 4) {
            count++;
            convSize = convSize / factor;
        }
        return convSize.toFixed(2) + " " + sizes[count];
    },
}
module.exports = dashboardController;