if (localStorage.getItem("username") == null) {
    window.location = "/login.html";
}

window.addEventListener('load', function () {
    var tasksPromise = apiRequest("tasks/get", "GET", false);
    tasksPromise.then(function(tasks) {
        document.querySelector(".loader").remove();
        if (tasks != undefined) {
            Object.keys(tasks).forEach(element => {
                createTaskElem(tasks[element]["name"], tasks[element]["description"], element);
            })
        } else {
            document.querySelector(".notasks").style.display = "block";
        }
    })
})

function addNewTask() {
    apiRequest("tasks/add", "POST", true, JSON.stringify({
        "name": document.getElementById("tasknamefield").value,
        // "date": document.getElementById("taskdatefield").value,
        "desc": document.getElementById("taskdescfield").value
    }))
    createTaskElem(document.getElementById("tasknamefield").value, document.getElementById("taskdescfield").value);
    event.target.parentElement.close();
    document.getElementById("addTaskForm").reset();
}

function createTaskElem(name, description, taskid) {
    document.querySelector(".notasks").style.display = "none";
    var elem = document.createElement("div");
    var box = document.createElement("md-radio");
    var label = document.createElement("label");
    var desc = document.createElement("span");

    elem.id = taskid;
    label.textContent = name;
    desc.textContent = description;
    elem.classList.add("task");
    desc.classList.add("descript");

    elem.appendChild(label);
    label.prepend(box);
    elem.appendChild(desc);

    box.onclick = function () { completeTask(box.parentElement.parentElement.id); }

    document.querySelector(".tasks").appendChild(elem);

    if (description == "") {
        desc.remove();
    }
}

function completeTask(id) {
    console.log(id);
    apiRequest("tasks/complete", "DELETE", true, id);
    event.target.parentElement.parentElement.remove();
    if (!document.querySelector(".task")) {
        document.querySelector(".notasks").textContent = "You've completed all your tasks.";
        document.querySelector(".notasks").style.display = "block";
    }
}

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


const anchorEl = document.body.querySelector('#acc-anchor');
const menuEl = document.body.querySelector('#acc-menu');
anchorEl.addEventListener('click', () => { menuEl.open = !menuEl.open; });

function logOut() {
    localStorage.clear();
    location.reload();
}