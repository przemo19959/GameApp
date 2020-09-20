"use strict";
//stałe
const mainURL = "http://localhost:8080/springDBProject/mainPage/";
const ENTER_KEYCODE = 13;
const ESC_KEYCODE = 27;

const HTTP_OK_CODE = 200;
const HTTP_CREATED_CODE = 201;
const HTTP_NOT_FOUND = 404;

const dateFormatPattern = "([12]\\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01]))";

let virtualTab;

function showLoader(show) {
	let oldStyle = show ? "none" : "block";
	let newStyle = show ? "block" : "none";
	if (loader1.style.display === oldStyle) {
		loader1.style.display = newStyle;
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

function selectTextInSelectWithText(selectElement, innerText) {
	if ((selectElement instanceof HTMLSelectElement) === false)
		throw new Error("Passed argument is not <select/> element");
	for (let i = 0; i < selectElement.options.length; i++) {
		if (selectElement.options[i].innerText === innerText) {
			selectElement.selectedIndex = i;
			break;
		}
	}
}

function selectTextInSelectWithValue(selectElement, value) {
	if ((selectElement instanceof HTMLSelectElement) === false)
		throw new Error("Passed argument is not <select/> element");
	for (let i = 0; i < selectElement.options.length; i++) {
		if (selectElement.options[i].value === value) {
			selectElement.selectedIndex = i;
			break;
		}
	}
}

function clearNode(oldNode, nodeName) {
	let newNode = document.createElement(nodeName);
	newNode.setAttribute("id", oldNode.id);
	oldNode.parentNode.replaceChild(newNode, oldNode);
	return document.getElementById(oldNode.id);
}

let mainTableHeader = document.getElementById("mainTableHeader");
let mainTableBody = document.getElementById("mainTableBody");
let mainTable = document.getElementById("mainTable");

mainTable.addEventListener("mouseleave", () => {
	hideUpdateBoxAndSetOriginalValue(originalValue, "updateTable");
	hideUpdateBoxAndSetOriginalValue(originalValue, "updateSelect");
});

function onTableCellLeave(cell) {
	cell.addEventListener("mouseleave", () => {
		hideUpdateBoxAndSetOriginalValue(originalValue, "updateTable");
		hideUpdateBoxAndSetOriginalValue(originalValue, "updateSelect");
	});
}

function hideUpdateBoxAndSetOriginalValue(originalValue, idOfUpdatingElement) {
	let tmp = document.getElementById(idOfUpdatingElement);
	if (tmp !== null) {
		tmp.parentNode.innerText = originalValue;
	}
}

//R-Receive-findAll
function findAll() {
	let currentValue = getSelectedValueFromSelect(tableCBox);
	let selectedTableName = getSelectedTextFromSelect(tableCBox);
	findTemplate(currentValue !== "",
		(response) => {
			if (response.hasOwnProperty("_embedded"))
				return response._embedded[selectedTableName];
			return [];
		},
		currentValue,
		() => {
			alert(`Table ${selectedTableName} is empty!`);
		});
}

const propertyNamesToIgnore = ["_links", "self", "all", "print"];
function findTemplate(initialTest, extractRecordsFromResponse, requestURL, noRecordsCallback = () => { }, incorrectCurrentValueCallback = () => { }) {
	if (initialTest) { //if selected value is correct
		showLoader(true);
		new HttpRequestTemplate(requestURL)//
			.setSuccessCallback((response) => {
				showLoader(false);
				let records = extractRecordsFromResponse(response);
				if (records.length > 0) { //
					mainTableHeader = clearNode(mainTableHeader, "thead");
					mainTableBody = clearNode(mainTableBody, "tbody");
					records.forEach((record, i) => {
						let row = document.createElement("tr");
						Object.keys(record)
							.filter(propertyName => propertyNamesToIgnore.indexOf(propertyName) === -1) //if doesn't contain
							.forEach(propertyName => {
								if (i == 0)
									mainTableHeader.appendChild(createColumnNameCellInHTMLTable(propertyName));
								row.appendChild(createColumnDataCellInHTMLTable(record, propertyName));
							});
						mainTableBody.appendChild(row);
					});
				} else {
					noRecordsCallback();
				}
			}).execute();
	} else {
		incorrectCurrentValueCallback();
	}
}

function ifPropertyOtherThanId(propertyName, dataCell, onMouseEnter) {
	if (propertyName !== "id") {
		dataCell.addEventListener("mouseenter", () => {
			hideUpdateBoxAndSetOriginalValue(originalValue, "updateTable"); //must be before new originalValue is set
			hideUpdateBoxAndSetOriginalValue(originalValue, "updateSelect");
			originalValue = dataCell.innerText;
			onMouseEnter();
		});
		onTableCellLeave(dataCell);
	}
	return dataCell;
}

let originalValue;
function createColumnDataCellInHTMLTable(record, propertyName) {
	let dataCell = document.createElement("td");
	if (record._links.hasOwnProperty(propertyName)) { //if foreign key property
		let requestURL = record._links[propertyName].href;
		if (requestURL.match(/\/\d+$/) !== null) {
			dataCell.innerText = record[propertyName].print;
			dataCell = ifPropertyOtherThanId(propertyName, dataCell, () => {
				let values = [];
				let selectBox = document.createElement("select");
				//TODO: dokończyć, gdy wszystkie pola z wiersza z fill me znikną, powinna pojawić się możliwość zapisu rekordu (w tym momencie istnieje aktualizacja, co nie działa poprawnie)
				requestURL = requestURL.replace(/\/\d+$/, "");
				let pluralPropertyName = getPluralPropertyName(requestURL);
				new HttpRequestTemplate(requestURL)
					.setAsync(false)
					.setSuccessCallback((response) => {
						values = response._embedded[pluralPropertyName];
						values.forEach(value => selectBox.appendChild(createOption(value.print, value)));

						dataCell.innerText = "";
						dataCell.appendChild(selectBox);
						selectTextInSelectWithText(selectBox, originalValue);
					}).execute();
				selectBox = createUpdateSelectBox(selectBox, record, propertyName, dataCell, values); //must be here, otherwise values array is empty
			});
		}
		//  else {
		// 	new HttpRequestTemplate(requestURL)//
		// 		.setAsync(false)
		// 		.setSuccessCallback((response) => {
		// 			dataCell.innerText = response.print;
		// 			dataCell = ifPropertyOtherThanId(propertyName, dataCell, () => {
		// 				let values = [];
		// 				let selectBox = document.createElement("select");

		// 				new HttpRequestTemplate(requestURL)
		// 					.setAsync(false)
		// 					.setSuccessCallback((response) => {
		// 						let pluralPropertyName = getPluralPropertyName(response._links.all.href);
		// 						new HttpRequestTemplate(response._links.all.href)
		// 							.setAsync(false)
		// 							.setSuccessCallback((response) => {
		// 								values = response._embedded[pluralPropertyName];
		// 								values.forEach(value => selectBox.appendChild(createOption(value.print, value)));

		// 								dataCell.innerText = "";
		// 								dataCell.appendChild(selectBox);
		// 								selectTextInSelectWithText(selectBox, originalValue);
		// 							}).execute();
		// 					}).execute();
		// 				selectBox = createUpdateSelectBox(selectBox, record, propertyName, dataCell, values); //must be here, otherwise values array is empty
		// 			});
		// 		}).execute();
		// }
	} else {
		dataCell.innerText = record[propertyName];
		dataCell = ifPropertyOtherThanId(propertyName, dataCell, () => {
			let miniTable = document.createElement("table");
			miniTable.id = "updateTable";
			let updateInput = createUpdateInput(dataCell);
			let row1 = document.createElement("tr");
			let updateButton = createUpdateButton(updateInput, originalValue, record, propertyName, dataCell);

			dataCell.innerText = "";

			row1.appendChild(updateInput);
			row1.appendChild(updateButton);
			miniTable.appendChild(row1);
			dataCell.appendChild(miniTable);
		});
	}
	return dataCell;
}

function createUpdateSelectBox(selectBox, record, propertyName, dataCell, values) {
	selectBox.id = "updateSelect";
	selectBox.addEventListener("change", () => {
		record[propertyName] = values[selectBox.selectedIndex];
		console.log(record);
		new HttpRequestTemplate(record._links.self.href)//
			.setMethodType("put")//
			.setRequestBody(JSON.stringify(record))//
			.setSuccessCallback((response) => {
				dataCell.innerText = getSelectedTextFromSelect(selectBox);
				//TODO: add notification
			})//
			.execute();
	});
	return selectBox;
}

function getPluralPropertyName(allRequestURL) {
	return allRequestURL.substring(allRequestURL.lastIndexOf("/") + 1);
}

function createUpdateButton(updateInput, originalValue, record, propertyName, dataCell) {
	let updateButton = document.createElement("button");
	updateButton.id = "updateButton";
	updateButton.innerText = "Update";
	updateButton.addEventListener("click", () => {
		if (updateInput.value !== originalValue) {
			record[propertyName] = updateInput.value;

			new HttpRequestTemplate(record._links.self.href)//
				.setMethodType("put")//
				.setRequestBody(JSON.stringify(record))//
				.setSuccessCallback((response) => {
					dataCell.innerText = updateInput.value;
					//TODO:add asynchro notification
				})//
				.execute();
		} else {
			alert("Value is the same, change value to update!");
		}
	});
	return updateButton;
}

function createUpdateInput(dataCell) {
	let updateInput = document.createElement("input");
	if (dataCell.innerText.match(dateFormatPattern) !== null) {
		updateInput.setAttribute("type", "date");
	}
	updateInput.value = dataCell.innerText;
	return updateInput;
}

function createColumnNameCellInHTMLTable(propertyName) {
	let columnNameCell = document.createElement("td");
	columnNameCell.innerText = propertyName;
	return columnNameCell;
}

let idInputField = document.getElementById("idInputField");
function idFieldChanged() { idInputField.className = ((parseInt(idInputField.value) > 0) ? "correct" : "error"); }

function findById() {
	let currentValue = getSelectedValueFromSelect(tableCBox);
	findTemplate(currentValue !== "" && idInputField.className === "correct",//
		(response) => [response],//
		`${currentValue}/${idInputField.value}`,//
		() => { },//
		() => {
			if (currentValue === "") {
				alert("Table was't chosen!");
			} else if (idInputField.className === "error") {
				if (idInputField.value !== "") {
					alert(`Id value must be greater than 0, but is ${idInputField.value}!`);
				} else {
					alert("Id field is empty, enter id value!");
				}
			}
		});
}

function addEmptyRecord() {
	if (getSelectedValueFromSelect(tableCBox) === "") {
		alert("Select table to add new record!");
	} else if (mainTableBody.childNodes.length > 0 && mainTableBody.lastChild.firstChild.innerText === "*") {
		alert("There is already one empty row, first fill that row and save one!");
	} else {
		new HttpRequestTemplate(getSelectedValueFromSelect(tableCBox))
			.setSuccessCallback((response) => {
				new HttpRequestTemplate(response._links.example.href)
					.setSuccessCallback((response) => {
						let row = document.createElement("tr");
						Object.keys(response)
							.filter(propertyName => propertyNamesToIgnore.indexOf(propertyName) === -1) //if doesn't contain
							.forEach((propertyName, i, propertyNames) => {
								if (mainTableHeader.childNodes.length < propertyNames.length)
									mainTableHeader.appendChild(createColumnNameCellInHTMLTable(propertyName));
								row.appendChild(createColumnDataCellInHTMLTable(response, propertyName));
							});
						mainTableBody.appendChild(row);
					}).execute();
			}).execute();
	}
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


function printErrorFromServer(error) { alert(error.exceptionName + ": " + error.message + "\n\n" + error.solutions.join("\n=>")); }
function printResponseFromServer(response) { console.log(response); }