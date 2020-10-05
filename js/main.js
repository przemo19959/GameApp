"use strict";
const rootURL = "http://localhost:8080";
let DEFAULT_EXAMPLE_VALUE;

function loadRootPage() {
    new HttpRequestTemplate(rootURL)
        .setSuccessCallback((response) => {
            initTableCBox(response);
            DEFAULT_EXAMPLE_VALUE = response.defaultExampleValue;
            alertify.success("Connected!", 1);
        })
        .setErrorCallback((error) => alertify.error(error))
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