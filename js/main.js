"use strict";
const rootURL = "http://localhost:8080";

function loadRootPage() {
    new HttpRequestTemplate(rootURL)
        .setSuccessCallback((response) => initTableCBox(response))
        .setErrorCallback((error) => console.log(error))
        .execute();
}

function initTableCBox(data) {
    let tableCbox = document.getElementById("tableCBox");
    tableCbox.appendChild(createOption("-- choose table --", ""));
    Object.keys(data._links)
        .forEach((value) => tableCbox.appendChild(createOption(value, data._links[value].href)));
}

function createOption(innerText, value) {
    let defaultOption = document.createElement("option");
    defaultOption.innerText = innerText;
    defaultOption.value = value;
    return defaultOption
}

loadRootPage();