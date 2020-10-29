const { model } = require("../models/ContainerModel");
/**
 * Creates a DashboardController object used to determine actions to be carried out.
 *
 * @class DashboardController
 * @classdesc Controller for the Dashboard. 
 * This class implements the Singleton pattern, so an instance is obtained calling getInstance().
 * @author Thomas Pilz
 */

class DashboardController {
    async start(req, res) {
        try {
            // get containers
            const containers = await model.getContainers(true);
            const images = await model.getImages();
            
            // format output
            images.forEach((image) => {
                // get rid of "SHA256:" prefix
                image.Id = image.Id.substring(7);
                // format milliseconds to be an actual date
                image.Created = new Date( 1600843079000).toLocaleString('de-DE');//                                     1584120305684);
                // convert to MB with 2 decimal places
                image.Size = conv2readableSizeFormat(image.Size);
            });


            // render view
            res.render("dashboard/dashboard", {
                title: "Dashboard",
                containers: containers,
                numRunCon: containers.length,
                images: images
            });
        } catch (exception) {
            res.status(500).send(exception)
        }
    };
}

function conv2readableSizeFormat(size){
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

    while(convSize >= 1024 || count === 4){
        count++;
        convSize = convSize / factor;
    }
    return convSize.toFixed(2) + " " + sizes[count];
};
module.exports.DashboardController = new DashboardController();