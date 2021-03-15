const Docker = require("dockerode");
const si = require("systeminformation");
const { DeepstreamClient } = require('@deepstream/client');
const isEqual = require("lodash.isequal");
const isEmpty = require("lodash.isempty");
const clonedeep = require("lodash.clonedeep");
const utils = require("../utils/utils.js");


// Initialize global vars
const deepstreamOptions = {
    // Reconnect after 10, 20 and 30 seconds
    reconnectIntervalIncrement: 10000,
    // Try reconnecting every thirty seconds
    maxReconnectInterval: 30000,
    // We never want to stop trying to reconnect
    maxReconnectAttempts: Infinity,
    // Send heartbeats only once a minute
    heartbeatInterval: 60000
};
const client = new DeepstreamClient('deepstream:6020', deepstreamOptions);          // connect to Deepstream server
docker = new Docker({ socketPath: "/var/run/docker.sock" });    // connect to Docker unix socket
const containerListName = "containerList";  // name of list containing registered container in Deepstream.io

let imageData = {};
let containerData = {};
let hostStats = {};
let imageHistory = {};

const observers = new Map();
const liveContainers = new Set();

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
            // { href: "/containers", text: "Container", iconClass: "fab fa-docker fa-lg pr-3 text-white" },
            // { href: "/images", text: "Images", iconClass: "far fa-clone fa-lg pr-3 text-white" },
            // { href: "/ressources", text: "Ressources", iconClass: "fas fa-server fa-lg pr-3 text-white" },
        ];
    },

    checkContainerLiveDataAvailable(id){
        return liveContainers.has(`${containerListName}/${id}`) ? true : false;
    },

    /**
     * Sets liveContainers. Container-ID will be in Set if live data is available.
     */
    setLiveDataAvailable: async () => {
        // get list; connection should be open at that point but could fail anytime (theoretically)
        try {
            const containerList = await client.record.getList(containerListName).whenReady();
            // subscribe to list updates and trigger first one now
            containerList.subscribe(setLiveContainersAvailable, true);
        } catch (error) {
            // any error
            liveContainers.clear()
        }

        function setLiveContainersAvailable(listEntries) {
            console.log(listEntries);
            liveContainers.clear();
            listEntries.forEach(it => liveContainers.add(it));
        }
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
        if (isEmpty(containerData)) {
            await model.fetchContainers();
        }
        return await clonedeep(containerData);
    },

    /**
     * Get data on containers on a host and cache it in RAM.
     * @param {boolean} allStates get containers in all possible states
     * @param {String[]}  fields list of fields to be returned
     */
    fetchContainers: async (allStates = true, fields = ["State", "Id", "Names", "Image", "Command"]) => {
        const newContainerData = await docker.listContainers({ all: allStates }).catch(err => console.error("Failed to retrieve container list.\nError:\n" + err));
        const filteredNewContainers = await utils.filterObjectList(newContainerData, fields);
        if (!isEqual(filteredNewContainers, containerData)) {
            containerData = filteredNewContainers;
            model.notifyAll("containers", clonedeep(filteredNewContainers));    // return copy! do not allow others to modify global vars
        }
    },

    /**
     * Get details to the container image specified with @param id (Image-ID or name).
     * @param {String} id Image-ID or Image name
     * @param {String[]}  fields list of fields to be returned
     */
    getImage: async (id, fields = ["Id", "Comment", "Os", "Architecture", "VirtualSize", "Size", "Author", "Created", "Config"]) => {
        const image = docker.getImage(id);
        newImageData = await image.inspect().catch(err => console.error("Failed to retrieve image information.\nError:\n" + err));
        // RootFS is required to get info about layers
        fields.push("RootFS");
        filteredImages = await utils.filterObject(newImageData, fields);

        return await clonedeep(filteredImages);
    },

    /**
     * Get details to the container image specified with @param id (Image-ID or name).
     * @param {String} id Image-ID or Image name
     * @returns {ImageHistory[]} list of image history objects
     */
    getImageHistory: async (id) => {
        if (isEmpty(imageHistory)) {
            await model.fetchImageHistory(id);
        }
        return await clonedeep(imageHistory);
    },

    /**
     * Fetch latest image history data from Docker API.
     * @param {String} id Image-ID or image name
     * @param {String[]} fields list of fields to be returned
     */
    fetchImageHistory: async (id, fields = ["Id", "Created", "CreatedBy", "Tags", "Size", "Comment"]) => {

        const image = docker.getImage(id);
        const newImageHistory = await image.history().catch(err => console.error("Failed to retrieve image history information.\nError:\n" + err));
        const filteredImageHistory = await utils.filterObjectList(newImageHistory, fields);
        if (!isEqual(filteredImageHistory, imageHistory)) {
            imageHistory = filteredImageHistory;
            // model.notifyAll("", clonedeep())
        };
    },

    /**
     * Get latest image data.
     */
    getImages: async () => {
        if (isEmpty(imageData)) {
            await model.fetchImages();
        }
        return clonedeep(imageData);
    },

    /**
     * Fetch all images stored on a host and cache them.
     * @param {String[]} fields list of fields to be compared and cached (must be fields provided by the Docker API!)
     */
    fetchImages: async (fields = ["Id", "RepoTags", "Created", "Size"]) => {
        const newImageData = await docker.listImages().catch(err => console.error("Failed to retrieve image list.\nError:\n" + err));
        const newfilteredImageData = await utils.filterObjectList(newImageData, fields);
        if (!isEqual(newfilteredImageData, imageData)) {
            imageData = newfilteredImageData;
            model.notifyAll("images", clonedeep(newfilteredImageData));
        }
    },

    /**
     * Get latest stats from host
     */
    getHostStats: async () => {
        if (isEmpty(hostStats)) {
            hostStats = await model.fetchHostStats().catch(err => console.error("Failed to retrieve host stats."));
        }
        return await clonedeep(hostStats);
    },

    fetchHostStats: async () => {
        const desiredStats = {
            currentLoad: "currentload",
            mem: "used, free"
        };
        newHostStats = await si.get(desiredStats);
        if (!isEqual(newHostStats, hostStats)) {
            hostStats = newHostStats;
            model.notifyAll("hostStats", clonedeep(newHostStats));
        }
    },

    /**
     * Get live runtime information 
     * @param {String} id Container-ID (SHA-256)
     * @callback cb Executed every time the runtime information changes
     * @param {any} data Runtime information of container
     */
    subscribeRuntimeInfoFromContainer: async (id, cb) => {
        if (!model.checkContainerLiveDataAvailable(id)) {
            console.error(`No runtime information available for container ${id}.`);
            return {
                err: `No runtime information available for container ${id}.`
            };
        }
        console.log(`Subscribing to container runtime information of container ${id}`);
        curContainer = await client.record.getRecord(`${id}`).subscribe(cb, true);
    },

    unsubscribeRuntimeInfoFromContainer: async (id) => {
        const containerList = await client.record.getList(containerListName).whenReady();
        if (!containerList.getEntries().find(recordName => recordName === `${containerListName}/${id}`)) {
            console.error(`Container subscription could not be ended because container ${id} does not exist.`);
            return;
        }
        curContainer = client.record.getRecord(`${id}`).unsubscribe();
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
                await container.stop().catch(err => console.error(`Failed to stop container ${containerId}\nError:\n${err}`));
                console.log(`Stopped container ${containerId}.`);
                break;
            case "restart":
                await container.restart().catch(err => console.error(`Failed to restart container ${containerId}\nError:\n${err}`));
                console.log(`Restarted container ${containerId}.`);
                break;
            default:
                console.error(`Nothing done. Action ${action} is unknown.`);
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
client.on("connectionStateChanged", state => {
    if (state === "OPEN") {
        model.setLiveDataAvailable();
    }
    else{
        // no live data is available
        liveContainers.clear();
    }
})

module.exports.model = model;