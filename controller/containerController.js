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
            // render view
            res.render("dashboard/allContainers", {
                title: "All containers",
                nav: nav
            });
        } catch (exception) {
            res.status(500).send(exception)
        }
    },
    showContainer: async (req, res) => {
        // get container information
        container = await model.getContainerDetails(Containersreq.params.id); 
    },
}

module.exports.containerController = containerController;