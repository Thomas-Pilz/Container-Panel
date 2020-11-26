const { model } = require("../models/model");

const containerController = {
    showAllContainer: async (req, res) => {
        try {
            res.render("containers/allContainers", {
                title: "All containers",
                nav: model.getNav(),
                }
            );
        } catch (exception) {
            res.status(500).send(exception)
        }
    },
    showContainer: async (req, res) => {
        try {
            res.render("containerDetails/containerDetails", {
                title: `Container Details - ${req.params.id}`,
                nav: model.getNav(),
                }
            );
        } catch (exception) {
            res.status(500).send(exception)
        }
    },

    /**
     * @todo Implement suitable error handling
     */
    subscribeRuntimeInfoFromContainer: async (ws, req) => {
        model.subscribeRuntimeInfoFromContainer(req.params.id, (runtimeInfo) => {
            try {
                ws.send(JSON.stringify(runtimeInfo));
            } catch (error) {
                // Websocket might be closed before callback --> sending over terminated connection --> error
                // TODO implement suitable error handling
            }
        });
    },

    /**
     * Uns
     */
    unsubscribeRuntimeInfoFromContainer: async (ws, req) => {
        model.unsubscribeRuntimeInfoFromContainer(req.params.id);
    },

    containerAction: async (req, res) => {
        await model.containerAction(req.body.id, req.body.action);
        res.end();
    },
}

module.exports.containerController = containerController;