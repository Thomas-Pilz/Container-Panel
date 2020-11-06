const { model } = require("../models/model");

// Needed to manipulate nav-sidebar dynamically 
const nav = [
    { href: "/dashboard", text: "Dashboard", iconClass: "fas fa-th fa-lg pr-3 text-white" },
    { href: "/containers", text: "Container", iconClass: "fab fa-docker fa-lg pr-3 text-white" },
    { href: "/images", text: "Images", iconClass: "far fa-clone fa-lg pr-3 text-white" },
    { href: "/ressources", text: "Ressources", iconClass: "fas fa-server fa-lg pr-3 text-white" },
]

const containerController = {
    showAllContainer: async (req, res) => {
        try {
            res.render("dashboard/allContainers", {
                title: "All containers",
                nav: nav,
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
                containerId: req.params.id,
                nav: nav,
                }
            );
        } catch (exception) {
            res.status(500).send(exception)
        }
    },

    subscribeRuntimeInfoFromContainer: async (ws, req) => {
        model.subscribeRuntimeInfoFromContainer((runtimeInfo) => {
            ws.send(JSON.stringify(runtimeInfo));
        });
    }
}

module.exports.containerController = containerController;