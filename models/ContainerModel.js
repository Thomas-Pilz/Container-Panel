const Docker = require("dockerode");
const si = require("systeminformation");
const { all } = require("../routes/dashboardRoutes");

/**
 * Creates a ContainerModel object used to store or retrieve data.
 * 
 * @class ContainerModel
 * @classdesc Model for the Container Panel app.
 * This class implements the Singleton pattern, so an instance is obtained calling ContainerModel.getInstance().
 * @author Thomas Pilz
 */
class ContainerModel {

    constructor() {
        this.docker = new Docker({ socketPath: "/var/run/docker.sock" });
    }

    test() {
        console.log("test");
    }

    /**
     * Get running containers on a host. If @param all is true, all containers will be returned.
     * @param {boolean} all
     * @returns {Dockerode.ContainerInfo[]} list of (running) containers 
     */
    async getContainers(getAll) {
        return await this.docker.listContainers({ all: getAll });
    }

    /**
     * Get all images stored on a host
     * @returns {Dockerode.ImageInfo[]}
     */
    async getImages() {
        return await this.docker.listImages();
    }

    async getContainerDetails(id) {
        container = await this.docker.getContainer(id);
        stats = await container.stats({ stream: false });
        console.log(stats);
        //inspect = container.inspect()
        //container
    }

    async getHostCurrentStats() {
        const desiredStats= {
            currentLoad: "currentload",
            mem: "used, free"
        }

        return await si.get(desiredStats);
    }
}

// async function test(){
//     d = new Docker({ socketPath: "/var/run/docker.sock" });

//     container = await d.getContainer("ef9dc7acc4e0fbf538627de2d61d0783928765a3e041d94dc11a629c3309c5fd")
//     console.log(container);
//     // stats = await container.stats({stream: false})
//     inspect = await container.inspect();
//     console.log(inspect);
//     // console.log(stats);
// }

module.exports.model = new ContainerModel();