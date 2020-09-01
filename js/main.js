"use strict";
const rootURL = "http://localhost:8080";

function loadRootPage() {
    let xhr = new XMLHttpRequest();
    xhr.open("get", rootURL, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            var status = xhr.status;
            if (status === 0 || (status >= 200 && status < 400)) {
                initTableCBox(JSON.parse(xhr.responseText));
            } else {
                console.log("Error");
            }
        }
    };
    xhr.send();
}

loadRootPage();

function initTableCBox(data){
    let tableCbox=document.getElementById("tableCBox");
    let option=document.createElement("option");
    option.innerText="-- choose table --";
    option.value="";
    tableCbox.appendChild(option);

    let linkNames=Object.keys(data._links).filter(e=>e !== "profile");
    for(let i=0;i<linkNames.length;i++){
        option=document.createElement("option");
        option.value=data._links[linkNames[i]].href;
        option.innerText=linkNames[i];
        tableCbox.appendChild(option);
    }
}