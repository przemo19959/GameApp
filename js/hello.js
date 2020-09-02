"use strict";
//stałe
const mainURL = "http://localhost:8080/springDBProject/mainPage/";
const ENTER_KEYCODE = 13;
const ESC_KEYCODE = 27;

const HTTP_OK_CODE = 200;
const HTTP_CREATED_CODE = 201;
const HTTP_NOT_FOUND = 404;

function processContent(obj) {
	return toString(obj);
}

let virtualTab;

function toString(obj) {
	var keys = Object.keys(obj);
	if (keys.length > 0 && typeof obj != 'string') {
		var result = [];
		//i>0 pomiń kolumnę z id
		forRange(keys.length, i => { if (i > 0 && keys[i] != "$$hashKey") result.push(obj[keys[i]]); });
		return result.join(", ");
	}
	return obj;
}

function showLoader(show) {
	// let loader1=document.getElementById("loader1");
	let oldStyle = show ? "none" : "block";
	let newStyle = show ? "block" : "none";
	if (loader1.style.display === oldStyle) {
		loader1.style.display = newStyle;
		// document.getElementById("loader2").style.display=newStyle;
		loader2.style.display = newStyle;
	}
}

function getSelectedValueFromSelect(selectElement) {
	if ((selectElement instanceof HTMLSelectElement) === false)
		throw new Error("Passed argument is not <select/> element");
	return selectElement.value;
}

function getSelectedTextFromSelect(selectElement) {
	if ((selectElement instanceof HTMLSelectElement) === false)
		throw new Error("Passed argument is not <select/> element");
	return selectElement.options[selectElement.selectedIndex].innerText;
}

function clearNode(oldNode, nodeName) {
	let newNode = document.createElement(nodeName);
	newNode.setAttribute("id", oldNode.id);
	oldNode.parentNode.replaceChild(newNode, oldNode);
	return document.getElementById(oldNode.id);
}

let mainTableHeader = document.getElementById("mainTableHeader");
let mainTableBody = document.getElementById("mainTableBody");
//R-Receive-findAll
function findAll() {
	let currentValue = getSelectedValueFromSelect(tableCBox);
	let selectedTableName = getSelectedTextFromSelect(tableCBox);
	findTemplate(currentValue !== "",
		(response) => response._embedded[selectedTableName],
		currentValue,
		() => alert(`Table ${selectedTableName} is empty!`));
}

function findTemplate(currentValueTest, extractRecordsFromResponse, requestURL, noRecordsCallback = function () { }, incorrectCurrentValueCallback = function () { }) {
	if (currentValueTest) { //if selected value is correct
		showLoader(true);
		new HttpRequestTemplate()//
			.setSuccessCallback((response) => {
				showLoader(false);
				let records = extractRecordsFromResponse(response);
				console.log(records);
				if (records.length > 0) { //
					mainTableHeader = clearNode(mainTableHeader, "thead");
					mainTableBody = clearNode(mainTableBody, "tbody");
					for (let i = 0; i < records.length; i++) {
						let row = document.createElement("tr");
						Object.keys(records[i])
							.filter(propertyName => propertyName !== "_links" && propertyName !== "print")
							.forEach(propertyName => {
								//add column name cell
								if (i == 0) {
									let columnNameCell = document.createElement("td");
									columnNameCell.innerText = propertyName;
									mainTableHeader.appendChild(columnNameCell);
								}

								let cell = document.createElement("td");
								cell.innerText = (typeof (records[i][propertyName]) === "object") ? records[i][propertyName].print : records[i][propertyName];
								row.appendChild(cell);
							});
						mainTableBody.appendChild(row);
					}
				} else {
					noRecordsCallback();
				}
			}).execute(requestURL);
	} else {
		incorrectCurrentValueCallback();
	}
}

let idInputField = document.getElementById("idInputField");
function idFieldChanged() { idInputField.className = ((parseInt(idInputField.value) > 0) ? "correct" : "error"); }

//todo: dokończyć z pomocą findTemplate
function findById() {
	let currentValue = getSelectedValueFromSelect(tableCBox);
	if (currentValue !== "" && idInputField.className === "correct") {
		showLoader(true);
		new HttpRequestTemplate()//
			.setSuccessCallback((response) => {
				showLoader(false);

				mainTableHeader = clearNode(mainTableHeader, "thead");
				mainTableBody = clearNode(mainTableBody, "tbody");
				let records = [];
				records.push(response);
				for (let i = 0; i < records.length; i++) {
					let row = document.createElement("tr");
					Object.keys(records[i])
						.filter(propertyName => propertyName !== "_links" && propertyName !== "print")
						.forEach(propertyName => {
							let columnCell = document.createElement("td");
							columnCell.innerText = propertyName;
							mainTableHeader.appendChild(columnCell);

							let cell = document.createElement("td");
							cell.innerText = (typeof (records[i][propertyName]) === "object") ? records[i][propertyName].print : records[i][propertyName];
							row.appendChild(cell);
						});
					mainTableBody.appendChild(row);
				}
			})//
			.execute(`${currentValue}/${idInputField.value}`);
	} else if (currentValue === "") {
		alert("Table was't chosen!");
	} else if (idInputField.className === "error") {
		if (idInputField.value !== "") {
			alert(`Id value must be greater than 0, but is ${idInputField.value}!`);
		} else {
			alert("Id field is empty, enter id value!");
		}
	}
}


//U-Update-update
let updateInputValue = { value: "" };
function update() {
	const previousValue = virtualTab.getUpdatedCellValue();
	const newValue = getFormatedDateIfDateObject(updateInputValue.value);

	if (newValue.length > 0 || Object.keys(newValue).length > 0) {
		virtualTab.setUpdatedCellValue(newValue);
		const updatedRecord = virtualTab.getUpdatedRecord();
		showLoader(true);
		httpRequestTemplate("put",
			mainURL + tableCBox.value + "/" + updatedRecord["id"], updatedRecord
			, function (response) {
				// console.log(response);
				showLoader(false);
				updateInputValue.value = "";
				virtualTab.removeUpdatingUIElement();
				if (response.status == HTTP_OK_CODE) {
					printResponseFromServer(response);
				} else {
					virtualTab.setUpdatedCellValue(previousValue);
				}
			}, function (error) {
				// console.log(error);
				showLoader(false);
				updateInputValue.value = "";
				virtualTab.setUpdatedCellValue(previousValue);
				printErrorFromServer(error);
			});
	} else {
		alert("Updated field is empty or no item was chosen from combo box!");
	}
}

function undoUpdate() {
	virtualTab.removeUpdatingUIElement();
	updateInputValue.value = "";
}

//C-Create-save
//inicjowane wartościami dla kolumny id o wymuszonej zawartości *
let recordSB = { id: "*" };
let recordSBStyle = ["correct"];

function addRecordHandler() {
	if (virtualTab != undefined && virtualTab.isNewRecordAdded()) {
		alert("One record was already added! Fill values and save record to DB!");
		return;
	} else {

	}
	if (tableCBox != tables[0]) {
		forRange(virtualTab.columnCount, i => {
			if (i > 0) {	//pomijamy kolumnę id => wymuszono correct
				if (virtualTab.columns[i] == "dateOfRelease") {
					//początkowa inicjalizacja aktualną datą
					recordSB["dateOfRelease"] = new Date();
					recordSBStyle[i] = "correct";
				} else
					recordSBStyle[i] = "error";
			}
		});
		virtualTab.setNewRecordAdded(true);
	} else {
		alert("No table was chosen!");
	}
}

function inputChanged($index, column, isForeign) {
	recordSBStyle[$index] =
		(virtualTab.doesInputCorrect(column,
			getFormatedDateIfDateObject(recordSB[column])
			, isForeign)) ? "correct" : "error";
}

function save() {
	if (Object.keys(recordSB).length != virtualTab.columnCount) {
		alert("Not all fields where set!");
		return;
	}
	if (isErrorStyleInArray(recordSBStyle)) {
		alert("At least one field has invalid value!");
		return;
	}

	// console.log(recordSB);
	var recordToSave = getFormattedCopyOf(recordSB, virtualTab.columns);
	// console.log(recordToSave);

	showLoader(true);
	httpRequestTemplate("post", mainURL + tableCBox.value, recordToSave
		, function (response) {
			// console.log(response);
			showLoader(false);
			if (response.status == HTTP_CREATED_CODE) {
				printResponseFromServer(response);
				findAll();
			}
		}, function (error) {
			// console.log(error);
			showLoader(false);
			printErrorFromServer(error);
		});
}

function undoSave() {
	if (virtualTab != undefined) {
		virtualTab.setNewRecordAdded(false);
		recordSB = { id: "*" };
		recordSBStyle = ["correct"];
	}
}

//D-Delete-deleteById
function deleteById() {
	if (tableCBox != tables[0] && idInputStyle == "correct") {
		showLoader(true);
		httpRequestTemplate("delete", mainURL + tableCBox.value + "/" + id, "",
			function (response) {
				if (response.status == HTTP_OK_CODE) {
					showLoader(false);
					findAll();
					printResponseFromServer(response);
				}
			},
			function (error) {
				showLoader(false);
				printErrorFromServer(error);
			});
	} else if (tableCBox == tables[0]) {
		alert("Table was't chosen!");
	} else if (id < 1 || id == undefined) {
		alert("Id value must be greater than 0, but is " + id + "!");
	}
}

const httpRequestTemplate = function (methodType = "get", requestURL, requestBody = "",//
	successCallback = printResponseFromServer,//
	errorCallback = printErrorFromServer) {
	let xhr = new XMLHttpRequest();
	xhr.open(methodType, requestURL, true);
	xhr.onreadystatechange = function () {
		if (xhr.readyState === XMLHttpRequest.DONE) {
			var status = xhr.status;
			if (status === 0 || (status >= 200 && status < 400)) {
				successCallback(JSON.parse(xhr.responseText));
			} else {
				errorCallback(JSON.parse(xhr.responseText));
			}
		}
	};
	xhr.send(requestBody);
}

const isErrorStyleInArray = function (stylesArray) {
	var result = false;
	for (var i = 0; i < stylesArray.length; i++) {
		if (stylesArray[i] == "error")
			return true;
	}
	return result;
}

const getFormattedCopyOf = function (item, itemColumns) {
	var recordToSave = {};
	forRange(itemColumns.length, i => {
		recordToSave[itemColumns[i]] = getFormatedDateIfDateObject(item[itemColumns[i]]);
	});
	return recordToSave;
}

//zwróc datę w formacie yyyy-mm-dd z obiektu Date
const getFormatedDateIfDateObject = function (value) {
	if (value instanceof Date) {
		var monthNumber = value.getMonth() + 1;
		var dayNumber = value.getDate();
		return value.getFullYear() + "-" + ((monthNumber < 10) ? "0" + monthNumber : monthNumber) + "-" + ((dayNumber < 10) ? "0" + dayNumber : dayNumber);
	}
	return value;
}


const printErrorFromServer = function (error) { alert(error.exceptionName + ": " + error.message + "\n\n" + error.solutions.join("\n=>")); }
const printResponseFromServer = function (response) { console.log(response); }