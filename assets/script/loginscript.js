// API
function apiRequest(endpoint, type, async, send) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(type, "https://api.vyzon.app/" + endpoint, async);
        xhr.setRequestHeader("Username", localStorage.getItem("username"));
        xhr.setRequestHeader("Password", localStorage.getItem("password"));
        xhr.onload = function () {
            try {
                resolve(JSON.parse(xhr.response));
            } catch {
                resolve(xhr.response);
            }
        }
        xhr.onerror = function () {
            reject(new Error(`Client error.`));
        }
        xhr.send(send);
    })
}