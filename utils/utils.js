
/**
 * Filter an object to only contains keys specified in @param desiredKeys.
 * @param {Object} original 
 * @param {String[]} desiredKeys 
 */
async function filterObject(original, desiredKeys) {
    return new Promise((resolve, reject) => {
        const filtered = Object.keys(original)
            .filter(key => desiredKeys.includes(key) )
            .reduce((obj, key) => {
                obj[key] = original[key];
                return obj;
            }, {});
        resolve(filtered);
    });
}


/**
 * Filter keys @param desiredKeys of objects within a list @param originalList.
 * @param {Object[]} originalList 
 * @param {String[]} desiredKeys 
 */
async function filterObjectList(originalList, desiredKeys) {
    if (desiredKeys.length === 0) {
        return originalList;
    }
    let filteredList = [];
    originalList.forEach(obj => {
        filteredList.push(filterObject(obj, desiredKeys));
    });
    
    return Promise.all(filteredList);;
}

/**
 * Sends an event to the client connected to Websocket Client @param ws.
 * @param {WebSocket} ws websocket used to send the event
 * @param {String} eventName name of the emitted event
 * @param {any} eventData data to be transmitted with the event
 * @todo implement propper error handling
 */
async function sendEvent(ws, eventName, eventData) {
    const updateEvent = {
        eventName: eventName,
        eventData: eventData,
    };
    try {
        ws.send(JSON.stringify(updateEvent));
    } catch (error) {
        // TODO: implement propper error handling
    }
}

module.exports.filterObject = filterObject;
module.exports.filterObjectList = filterObjectList;
module.exports.sendEvent = sendEvent;