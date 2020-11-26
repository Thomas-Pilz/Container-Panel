const Docker = require("dockerode");
const si = require("systeminformation");
const { DeepstreamClient } = require('@deepstream/client');
const isEqual = require("lodash.isequal");
const isEmpty = require("lodash.isempty");
const utils = require("../utils/utils.js");


// Initialize global vars
const client = new DeepstreamClient('localhost:6020');          // connect to Deepstream server
docker = new Docker({ socketPath: "/var/run/docker.sock" });    // connect to Docker unix socket
const containerListName = "containerList";  // name of list containing registered container in Deepstream.io

let imageData = {};
let containerData = {};
let hostStats = {};

const observers = new Map();

const model = {
    /**
     * Login into Deepstream.io server.
     */
    login2Deepstream: async () => {
        client.login((success, data) => {
            if (!success) {
                console.log("Deepstream: Login failed.");
            }
            console.log("Deepstream: Login successful.");
        });
    },

    getNav: () => {
        return [
            { href: "/dashboard", text: "Dashboard", iconClass: "fas fa-th fa-lg pr-3 text-white" },
            { href: "/containers", text: "Container", iconClass: "fab fa-docker fa-lg pr-3 text-white" },
            { href: "/images", text: "Images", iconClass: "far fa-clone fa-lg pr-3 text-white" },
            { href: "/ressources", text: "Ressources", iconClass: "fas fa-server fa-lg pr-3 text-white" },
        ];
    },

    /**
     * Add an observer category 
     * @param {String} catName category name 
     */
    addObserverCategory: (catName) => {
        observers.set(catName, []);
    },

    /**
     * Returns the latest container information available
     * @returns list of container data
     */
    getContainers: async () => {
        if (containerData === undefined) {
            containerData = await model.fetchContainers();
        }
        return containerData;
    },

    /**
     * Get data on containers on a host and cache it in RAM.
     * @param {boolean} allStates get containers in all possible states
     * @param {fields}  fields list of fields to be returned
     */
    fetchContainers: async (allStates = true, fields = ["State", "Id", "Names", "Image", "Command"]) => {
        const newContainerData = await docker.listContainers({ all: allStates });
        const filteredNewContainers = await utils.filterObjectList(newContainerData, fields);

        if (!isEqual(filteredNewContainers, containerData)) {
            containerData = filteredNewContainers;
            model.notifyAll("containers", filteredNewContainers);
        }
    },

    /**
     * Get details to the container image specified with @param id (Image-ID or name).
     * @param {String} id Image-ID or Image name
     */
    getImage: async (id, fields = ["Id", "Comment", "Os", "Architecture", "VirtualSize", "Size", "Author", "Created", "Config", "RootFS"]) => {
        const image = docker.getImage(id);
        imageData = await image.inspect();
        filteredImages = await utils.filterObject(imageData, fields);
        return filteredImages;
    },

    /**
     * Get details to the container image specified with @param id (Image-ID or name).
     * @param {String} id Image-ID or Image name
     */
    getImageHistory: async (id, fields = []) => {
        const image = docker.getImage(id);
        const history = image.history();

        filteredImgH = await utils.filterObjectList(filteredImgH, fields);

        return filteredImgH;
    },

    /**
     * Get latest image data.
     */
    getImages: async () => {
        if (imageData === undefined) {
            imageData = await model.fetchImages();
        }
        return imageData;
    },

    /**
     * Get all images stored on a host and cache it.
     */
    fetchImages: async () => {
        const newImageData = await docker.listImages();
        if (!isEqual(newImageData, imageData)) {
            imageData = newImageData;
            model.notifyAll("images", newImageData);
        }
    },

    /**
     * Get latest stats from host
     */
    getHostStats: async () => {
        if (hostStats === undefined){
            hostStats = await model.fetchHostStats();
        }
        return hostStats;
    },

    fetchHostStats: async () => {
        const desiredStats = {
            currentLoad: "currentload",
            mem: "used, free"
        };
        newHostStats = await si.get(desiredStats);
        if (!isEqual(newHostStats, hostStats)) {
            hostStats = newHostStats;
            model.notifyAll("hostStats", newHostStats);
        }
    },

    /**
     * Get live runtime information 
     * @param {String} id Container-ID (SHA-256)
     * @callback cb Executed every time the runtime information changes
     * @param {any} data Runtime information of container
     */
    subscribeRuntimeInfoFromContainer: async (id, cb) => {
        const containerList = await client.record.getList(containerListName).whenReady();
        if (!containerList.getEntries().find(recordName => recordName === `${containerListName}/${id}`)) {
            console.log(`No runtime information available for container ${id}`);
            return {
                err: `No runtime information available for container ${id}`
            };
        }
        curContainer = await client.record.getRecord(`${containerListName}/${id}`).subscribe(cb);
    },

    /**
     * Get amount of containers in the various states
     * @param {Container[]} containers list of containers with State attribute
     */
    getStateCount: (containers) => {
        let stateCount = { exited: 0 };
        containers.forEach(container => {
            if (stateCount[container.State]) {
                stateCount[container.State] += 1;
            }
            else {
                stateCount[container.State] = 1;
            }
        });
        return stateCount;
    },

    containerAction: async (containerId, action) => {
        const container = docker.getContainer(containerId);
        switch (action) {
            case "stop":
                await container.stop();
                console.log(`Stopped container ${containerId}.`);
                break;
            case "restart":
                await container.restart();
                console.log(`Restarted container ${containerId}.`);
                break;
            default:
                console.log(`Nothing done. Action ${action} is unknown.`);
        };
    },

    /**
     * Subscribe to an event. 
     * @param {String} kind either "images", "containers" or "host"
     * @param {any} callback Callback with changed data
     */
    subscribeInfo: async (kind, callback) => {
        if (!(typeof callback === "function")) {
            callback = () => { };  // redefine to empty method to prevent errors
        }
        if (!observers.has(kind)) {
            console.error(`Cannot subsribe to unknown kind ${kind}.`);
            return undefined;
        }
        observers.get(kind).push(callback);
    },

    notifyAll: (kind, data) => {
        if (!observers.has(kind)) {
            return console.error(`Cannot notify subscribers to unknown kind ${kind}.`);
        }
        observers.get(kind).forEach(it => it(data));
    },
};

model.addObserverCategory("containers");
model.addObserverCategory("images");
model.addObserverCategory("hostStats");

model.login2Deepstream();

module.exports.model = model;