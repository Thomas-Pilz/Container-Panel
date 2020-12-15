/**
 * Format size given in bytes to a more readable format.
 * Suitable format will be determined automatically.
 * e.g. (1,450,000 Bytes => 1.45 GB)
 * @param {Int} size size in bytes
 * @returns {String} formatted size String
 */
function formatSize(size){
    const factor = 1000;  // use 1000 instead of 1024 because GB not GiB are used to match docker cli behavior
    const sizes = {
        0: "K",
        1: "KB",
        2: "MB",
        3: "GB",
        4: "TB"
    }
    let count = 0;
    let convSize = size;
    while (convSize >= 1024 || count === 4) {
        count++;
        convSize = convSize / factor;
    }
    return convSize.toFixed(2) + " " + sizes[count]
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