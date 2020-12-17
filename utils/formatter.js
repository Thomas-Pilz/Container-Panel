/**
 * Format size given in bytes to a more readable format.
 * Suitable format will be determined automatically except @param endUnit is specified.
 * e.g. (1,450,000 Bytes => 1.45 GB)
 * @param {Int} size size in bytes
 * @param {Int} endUnit ID for the end unit (0: "K", 1: "KB", 2: "MB", 3: "GB", 4: "TB")
 * @returns {String} formatted size String
 */
function formatSize(size, endUnit = false){
    const factor = 1000;  // use 1000 instead of 1024 because GB not GiB are used to match docker cli behavior
    const sizes = {
        0: "K",
        1: "KB",
        2: "MB",
        3: "GB",
        4: "TB"
    }

    maxSize = Object.keys(sizes).length - 1;
    if (!typeof endUnit == "number" || endUnit >  maxSize || endUnit < 0){
        console.error(`Unsupported end unit: Integer min. value: 0; max. value = ${maxSize}`);
        throw new Error(`Unsupported end unit: Integer min. value: 0; max. value = ${maxSize}`);
    }
    let count = 0;
    let convSize = size;
    if(endUnit === false){
        console.log("normal conversion");
        while (convSize >= 1024 || count === maxSize) {
            count++;
            convSize = convSize / factor;
        }
    }
    else{
        console.log("unnormal conversion");
        while (!(count === endUnit)) {
            count++;
            convSize = convSize / factor;
        }
    }
    
    return convSize.toFixed(2) + " " + sizes[count]
}

/**
 * Format RAM and CPU usage data
 * @param {Object} hostStats Host statistics for RAM and CPU usage
 * @returns {Double} Double number with to two digits after the comma
 */
function formatHostStats(hostStats){
    hostStats.mem.free = hostStats.mem.free;
    hostStats.mem.used = hostStats.mem.used;
    hostStats.currentLoad.currentLoad = hostStats.currentLoad.currentload;
    return hostStats; 
}

/**
 * Get ressource usage of a list of processes and format the process information to be suitable for displaying it to the user
 * @param {Processes[]} processes List of processes
 * @returns {Object} formatted list of processes as well as total RAM/ CPU usage of the container
 */
function getAndFormatContainerProcessInfo(processes){
    let usedCPU = 0;
    let usedRAM = 0;
    processes.forEach(it => {
        usedCPU += it.pcpu
        usedRAM += it.pmem
        it.pcpu = it.pcpu;
        it.pmem = it.pmem;
    });
    return {
        processes: processes,
        usedCPU: usedCPU,
        usedRAM: usedRAM,
    };
}

/**
 * Format a docker SHA-256 string to a more readable format
 * @param {String} id SHA-256 ID of e.g. an Image-ID
 * @param {boolean} removePrefix remove "sha-256" prefix, default: true
 * @param {Int} length shorten the hash to given length
 * @returns {String} formatted hash String
 */
function formatId(id, removePrefix = true, length = undefined){
    let sha = removePrefix ? id.substring(7): id; 
    if (length){
        sha = sha.substring(0, length);
    }
    return sha;
}

/**
 * Format time in seconds to the german time representation format.
 * @param {Int} timeInSeconds time since "The Epoche" in seconds
 * @returns {String} formatted date String
 */
function formatDate(timeInSeconds){
    const date = new Date(timeInSeconds * 1000);
    return date.toLocaleString('de-DE');
}

/**
 * Convert a docker date string to a german time representation format.
 * @param {String} dateString docker API date string
 * @returns {String} formatted date String
 */
function formatDateString(dateString){
    let dateComponents = dateString.replace(/[T.]/g, " ").split(" ");
    let dateStr = dateComponents[0];
    let timeStr = dateComponents[1];
    let [ year, month, day ] = dateStr.split("-");
    const [ hours, minutes, secs ] = timeStr.split(":");
    const date = new Date();
    date.setFullYear(year, --month, day);
    date.setHours(hours, minutes, secs);
    return date.toLocaleString('de-DE');
}

/**
 * Format list of containers
 * @param {any[]} containers list of containers
 * @returns {any[]} formatted list of containers 
 */
function formatContainers(containers){
    containers.forEach(it => {
        if (it.Image.startsWith("sha")){
            it.Image = formatId(it.Image);
        }
    })
    return containers;
}

/**
 * Format list of images
 * @param {any[]} images list of images
 * @returns {any[]} formatted list of images 
 */
function formatImages(images){
    images.forEach(it => {
        it.Id = formatId(it.Id);
        it.Created = formatDate(it.Created);
        it.Size = formatSize(it.Size);
        if(it.RepoTags === null){
            it.RepoTags = ["<none>:<none>"];
        }
    });
    return images;
}

module.exports.formatSize = formatSize;
module.exports.formatDate = formatDate;
module.exports.formatId = formatId;
module.exports.formatDateString = formatDateString;
module.exports.formatImages = formatImages;
module.exports.formatContainers = formatContainers;
module.exports.getAndFormatContainerProcessInfo = getAndFormatContainerProcessInfo;
module.exports.formatHostStats = formatHostStats;