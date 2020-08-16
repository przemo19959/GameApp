"use strict";
//stałe
const mainURL = "http://localhost:8080/springDBProject/mainPage/";
const ENTER_KEYCODE = 13;
const ESC_KEYCODE = 27;

const HTTP_OK_CODE = 200;
const HTTP_CREATED_CODE = 201;
const HTTP_NOT_FOUND = 404;

const GET = "GET";
const PUT = "PUT";
const POST = "POST";
const DELETE = "DELETE";

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

function getSelectedValueFromSelect(selectElement){
	if((selectElement instanceof HTMLSelectElement) === false)
		throw new Error("Passed argument is not <select/> element");
	return selectElement.value;
}

function getSelectedTextFromSelect(selectElement){
	if((selectElement instanceof HTMLSelectElement) === false)
		throw new Error("Passed argument is not <select/> element");
	return selectElement.options[selectElement.selectedIndex].innerText;
}

//R-Receive-findAll,findById
function findAll() {
	if (getSelectedValueFromSelect(tableCBox) !== "") { //if table selected
		// recordSB = { id: "*" };
		undoSave();
		showLoader(true);
		httpRequestTemplate(GET, getSelectedValueFromSelect(tableCBox), "",
			function (response) {
				showLoader(false);
				if (response._embedded[getSelectedTextFromSelect(tableCBox)].length > 0) {
					virtualTab = new VirtualTable(response, false);
					forRange(virtualTab.foreignColumns.length, i => {
						showLoader(true);
						httpRequestTemplate(GET, virtualTab.foreignColumns[i]
							, "", function (response) {
								showLoader(false);
								virtualTab.addForeignRecordsForColumn(response, i);
							}, function (error) {
								showLoader(false);
								printErrorFromServer(error);
							});
					});
				} else {
					alert("Table " + getSelectedTextFromSelect(tableCBox) + " is empty!");
				}
			}, function (error) {
				showLoader(false);
				printErrorFromServer(error);
			});
	}
}

let idInputStyle = "error";
function idFieldChanged() { idInputStyle = (id > 0) ? "correct" : "error"; }
function findById() {
	if (tableCBox != tables[0] && idInputStyle == "correct") {
		showLoader(true);
		httpRequestTemplate(GET, mainURL + tableCBox.value + "/" + id, "",
			function (response) {
				// console.log(response.data);
				showLoader(false);
				if (response.status != HTTP_NOT_FOUND) {
					virtualTab = new VirtualTable(response, true);
					forRange(virtualTab.foreignColumns.length, i => {
						showLoader(true);
						httpRequestTemplate(GET, mainURL + virtualTab.foreignColumns[i]
							, "", function (response) {
								showLoader(false);
								virtualTab.addForeignRecordsForColumn(response, i);
							}, function (error) {
								showLoader(false);
								printErrorFromServer(error);
							});
					});
				}
			}, function (error) {
				showLoader(false);
				printErrorFromServer(error);
			});
	} else if (tableCBox == tables[0]) {
		alert("Table was't chosen!");
	} else if (id < 1 || id == undefined) {
		alert("Id value must be greater than 0, but is " + id + "!");
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
		httpRequestTemplate(PUT,
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
	httpRequestTemplate(POST, mainURL + tableCBox.value, recordToSave
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
		httpRequestTemplate(DELETE, mainURL + tableCBox.value + "/" + id, "",
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

const httpRequestTemplate = function (methodType, requestURL, requestBody, successCallback, errorCallback) {
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

const printErrorFromServer = function (error) {
	alert(error.data.errorMessage + "\n\t" + error.data.solutions);
}
const printResponseFromServer = function (response) { alert(response.data.message); }