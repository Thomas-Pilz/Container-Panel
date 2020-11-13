const { model } = require("../models/model");
const pug = require("pug");
const path = require('path');
const isEmpty = require("lodash.isempty");


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
            const containers = await model.getContainers(true, returnVal = true);
            const images = await model.getImages(returnVal = true);
            stateCount = model.getStateCount(containers);
            console.log(stateCount);

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

    sendUpdate: async (ws, req) => {
        events = [];

        /**
         * Create a new event and push it on the event queue to be sent to the client
         * @param {string} eventName unique event name
         * @param {Object} eventData data to be assigned to event
         */
        function pushEventQueue(eventName, eventData) {
            events.push(
                {
                    eventName: eventName,
                    eventData: eventData,
                });
        }

        /**
         * Send a queue of events to client
         * @param {[Event]} events
         * @todo implement propper error handling
         */
        function sendUpdateEvents(events) {
            try {
                ws.send(JSON.stringify(events));
            } catch (error) {
                // TODO: implement propper error handling
            }
        }

        const stats = model.getHostCurrentStats();
        const images = model.getImages();
        const containers = await model.getContainers(true);

        if (containers) {
            const stateCount = model.getStateCount(containers);
            pushEventQueue("updateContainer", {
                containerTableHtml: containerTableTempl({ containers: containers }),
                stateCount: stateCount,
            });
        }
        if (await images) {
            pushEventQueue("updateImages", {
                imageTableHtml: imageTableTempl({ images: images })
            });
        }
        if (!isEmpty(stateCount)) {
            pushEventQueue("regularUpdate", {
                hostStats: await stats,
                stateCount: stateCount,
            });
            stateCount = {};
        }
        else {
            pushEventQueue("regularUpdate", {
                hostStats: await stats,
            });
        }
        console.log(events[0]);
        sendUpdateEvents(events);
    },
}
module.exports.dashboardController = dashboardController;