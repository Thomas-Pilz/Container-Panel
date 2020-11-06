const Docker = require("dockerode");
const si = require("systeminformation");


docker = new Docker({ socketPath: "/var/run/docker.sock" });
const model = {
    /**
     * Get running containers on a host. If @param all is true, all containers will be returned.
     * @param {boolean} all
     * @returns {Dockerode.ContainerInfo[]} list of (running) containers 
     */
    getContainers: async (getAll) => {
        return await docker.listContainers({ all: getAll });
    },

    /**
     * Get all images stored on a host
     * @returns {Dockerode.ImageInfo[]}
     */
    getImages: async () => {
        return await docker.listImages();
    },

    getContainerDetails: async (id) => {
        container = await docker.getContainer(id);
        stats = await container.stats({ stream: false });
        console.log(stats);
        //inspect = container.inspect()
        //container
    },

    /**
     * Get current stats from host
     */
    getHostCurrentStats: async () => {
        const desiredStats= {
            currentLoad: "currentload",
            mem: "used, free"
        }

        return await si.get(desiredStats);
    },
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

module.exports.model = model;