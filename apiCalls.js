const API_ENDPOINT = "https://ra-api.up.railway.app"; // Update this dynamically if needed

// Global boolean flag
let newImageFlag = false;
let firstBoot = true

// Function to check if a new image is available (using promises)
function checkNewImage() {
    fetch(`${API_ENDPOINT}/new-image`)
        .then(response => response.json())
        .then(data => {
            newImageFlag = data.newImageAvailable;
        })
        .catch(error => console.error("Error fetching image data:", error));
}

function sendTrueBool() {
    fetch(`${API_ENDPOINT}/image-got`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ imageReceived: true })
    })
        .catch(error => console.error("Error sending data:", error));
}

// Function to fetch data from the server (using promises)
function fetchData() {
    fetch(`${API_ENDPOINT}/get`)
        .then(response => response.json())
        .then(data => {
            if (window.updateMap) {
                window.updateMap(data.coordinates, data.label1Text, data.label2Text, data.zoomLevel);
                // Only update image if newImageFlag is true
                if (newImageFlag || firstBoot) {
                    window.updateImage(`${API_ENDPOINT}${data.imageUrl}`);
                    sendTrueBool();
                    firstBoot = false;
                }
            } else {
                console.error("window.updateMap is not defined");
            }
        })
        .catch(error => console.error("Error fetching data:", error));
}

// Poll the server every 5 seconds by checking new image flag and fetching data
setInterval(function () {
    fetchData();
}, 5000);
