"use strict";
//stałe
const mainURL = "http://localhost:8080/springDBProject/mainPage/";
const ENTER_KEYCODE = 13;
const ESC_KEYCODE = 27;

const DATE_FORMAT_PATTERN = "([12]\\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01]))";
const ENDING_NUMBER_PATTERN = /\/\d+$/;

/**
 * @param {boolean} show - show loader 
 */
function showLoader(show) {
	let oldStyle = show ? "none" : "block";
	let newStyle = show ? "block" : "none";
	if (loader1.style.display === oldStyle) {
		loader1.style.display = newStyle;
		loader2.style.display = newStyle;
	}
}

/**
 * @param {HTMLSelectElement} selectElement - HTML select element
 */
function getSelectedValueFromSelect(selectElement) {
	if ((selectElement instanceof HTMLSelectElement) === false)
		throw new Error("Passed argument is not <select/> element");
	return selectElement.value;
}

/**
 * @param {HTMLSelectElement} selectElement - HTML select element
 */
function getSelectedTextFromSelect(selectElement) {
	if ((selectElement instanceof HTMLSelectElement) === false)
		throw new Error("Passed argument is not <select/> element");
	return selectElement.options[selectElement.selectedIndex].innerText;
}

/**
 * @param {HTMLSelectElement} selectElement - HTML select element
 * @param {string} innerText - text value to look for in passed selectElement (if not found no option is selected)
 */
function selectOptionInSelectWithText(selectElement, innerText) {
	if ((selectElement instanceof HTMLSelectElement) === false)
		throw new Error("Passed argument is not <select/> element");
	for (let i = 0; i < selectElement.options.length; i++) {
		if (selectElement.options[i].innerText === innerText) {
			selectElement.selectedIndex = i;
			break;
		}
	}
}

/**
 * @param {HTMLSelectElement} selectElement - HTML select element
 * @param {string} value - value attribute value to look for in passed selectElement (if not found no option is selected)
 */
function selectOptionInSelectWithValue(selectElement, value) {
	if ((selectElement instanceof HTMLSelectElement) === false)
		throw new Error("Passed argument is not <select/> element");
	for (let i = 0; i < selectElement.options.length; i++) {
		if (selectElement.options[i].value === value) {
			selectElement.selectedIndex = i;
			break;
		}
	}
}

/**
 * @param {HTMLElement} oldNode - HTML element to be replaced
 * @param {string} tagName - tag name of new element
 * @returns newly created HTML element
 */
function clearElement(oldNode, tagName) {
	let newNode = document.createElement(tagName);
	newNode.setAttribute("id", oldNode.id);
	oldNode.parentNode.replaceChild(newNode, oldNode);
	return document.getElementById(oldNode.id);
}

let mainTableHeader = document.getElementById("mainTableHeader");
let mainTableBody = document.getElementById("mainTableBody");
let mainTable = document.getElementById("mainTable");

function hideElementWithIdAndSetValue(elementId, value) {
	let tmp = document.getElementById(elementId);
	if (tmp !== null) {
		tmp.parentNode.innerText = value;
	}
}

mainTable.addEventListener("mouseleave", () => {
	hideElementWithIdAndSetValue("updateTable", originalValue,);
	hideElementWithIdAndSetValue("updateSelect", originalValue,);
	hideElementWithIdAndSetValue("saveSelect", originalValue,);
});

function onTableCellMouseLeave(cell) {
	cell.addEventListener("mouseleave", () => {
		hideElementWithIdAndSetValue("updateTable", originalValue,);
		hideElementWithIdAndSetValue("updateSelect", originalValue,);
		hideElementWithIdAndSetValue("saveSelect", originalValue,);

		let saveInput = document.getElementById("saveInput");
		if (saveInput !== null) {
			hideElementWithIdAndSetValue("saveTable", saveInput.value);
		}
	});
}

//R-Receive-findAll
function findAll() {
	undoSaveButton.style.display = "none"; //important, if user forgets to undo saving before changing table
	noRecordsWarning.style.display = "none"; //important, so that warning hides when user changes table
	let selectedTableHref = getSelectedValueFromSelect(tableCBox);
	let selectedTableName = getSelectedTextFromSelect(tableCBox);
	findTemplate(selectedTableHref !== "",
		(response) => {
			if (response.hasOwnProperty("_embedded"))
				return response._embedded[selectedTableName];
			return [];
		},
		selectedTableHref,
		() => {
			mainTableHeader = clearElement(mainTableHeader, "thead");
			mainTableBody = clearElement(mainTableBody, "tbody");
			log(`Table ${selectedTableName} is empty!`, "notify");
		});
}

const propertyNamesToIgnore = ["_links", "self", "all", "print"];
/**
 * @param {boolean} initialTest - initial Test performed before request to server is executed 
 * @param {string} requestURL - request to server
 */
function findTemplate(initialTest, extractRecordsFromResponse = (response) => [], requestURL, noRecordsCallback = () => { }, initialTestFailedCallback = () => { }) {
	if (initialTest) {
		showLoader(true);
		new HttpRequestTemplate(requestURL)//
			.setSuccessCallback((response) => {
				showLoader(false);
				let records = extractRecordsFromResponse(response);
				if (records.length > 0) { //
					mainTableHeader = clearElement(mainTableHeader, "thead");
					mainTableBody = clearElement(mainTableBody, "tbody");
					records.forEach((record, i) => {
						let row = document.createElement("tr");
						Object.keys(record)
							.filter(propertyName => propertyNamesToIgnore.indexOf(propertyName) === -1) //if doesn't contain pass property
							.forEach(propertyName => {
								if (i == 0)
									mainTableHeader.appendChild(createColumnNameCellInHTMLTable(propertyName));
								row.appendChild(createColumnDataCellInHTMLTable(record, propertyName, false));
							});
						mainTableBody.appendChild(row);
					});
				} else {
					noRecordsCallback();
				}
			}).execute();
	} else {
		initialTestFailedCallback();
	}
}

/**
 * @param {string} propertyName 
 * @param {HTMLTableCellElement} dataCell 
 */
function ifPropertyOtherThanId(propertyName, dataCell, onMouseEnter = () => { }) {
	if (propertyName !== "id") {
		dataCell.addEventListener("mouseenter", () => {
			hideElementWithIdAndSetValue("updateTable", originalValue); //must be before new originalValue is set
			hideElementWithIdAndSetValue("updateSelect", originalValue,);
			hideElementWithIdAndSetValue("saveSelect", originalValue,);
			originalValue = dataCell.innerText;
			onMouseEnter();
		});
		onTableCellMouseLeave(dataCell);
	}
	return dataCell;
}

let originalValue;
let noRecordsWarning = document.getElementById("noRecordsWarning");
/**
 * @param {object} record - current analyzed record
 * @param {string} propertyName - current analyzed property name of record
 * @param {boolean} save - is created cell in new empty row destined to be saved
 */
function createColumnDataCellInHTMLTable(record, propertyName, save) {
	let dataCell = document.createElement("td");
	if (record._links.hasOwnProperty(propertyName)) { //if foreign key property
		let requestURL = record._links[propertyName].href;
		if (requestURL.match(ENDING_NUMBER_PATTERN) !== null) {
			dataCell.innerText = record[propertyName].print;
			dataCell = ifPropertyOtherThanId(propertyName, dataCell, () => {
				let values = [];
				let selectBox = document.createElement("select");
				requestURL = requestURL.replace(ENDING_NUMBER_PATTERN, "");
				let pluralPropertyName = getPluralPropertyName(requestURL);
				new HttpRequestTemplate(requestURL)
					.setAsync(false)
					.setSuccessCallback((response) => {
						if (response._embedded !== undefined) {
							values = response._embedded[pluralPropertyName];

							if (dataCell.innerText.startsWith(DEFAULT_EXAMPLE_VALUE))//so that user can select first option in select element
								values.unshift({ print: dataCell.innerText });
							values.forEach(value => selectBox.appendChild(createOption(value.print, value)));

							dataCell.innerText = "";
							dataCell.appendChild(selectBox);
							selectOptionInSelectWithText(selectBox, originalValue);
						} else {
							dataCell.className = "warning";
							noRecordsWarning.style.display = "block";
						}
					}).execute();

				selectBox = createSelectBoxNode(selectBox, record, propertyName, dataCell, values, save);
			});
		}
	} else {
		dataCell.innerText = record[propertyName];
		dataCell = ifPropertyOtherThanId(propertyName, dataCell, () => {
			let miniTable = document.createElement("table");
			miniTable.id = save ? "saveTable" : "updateTable";
			let inputNode = createInputNode(dataCell, record, propertyName, save);
			dataCell.innerText = "";

			let row1 = document.createElement("tr");
			row1.appendChild(inputNode);
			if (save === false) {
				let updateButton = createUpdateButton(inputNode, originalValue, record, propertyName, dataCell);
				row1.appendChild(updateButton);
			}
			miniTable.appendChild(row1);
			dataCell.appendChild(miniTable);
		});
	}
	return dataCell;
}

/**
 * @param {HTMLSelectElement} selectBox 
 * @param {object} record 
 * @param {string} propertyName 
 * @param {HTMLTableCellElement} dataCell 
 * @param {boolean} save 
 */
function createSelectBoxNode(selectBox, record, propertyName, dataCell, values, save) {
	selectBox.id = save ? "saveSelect" : "updateSelect";
	selectBox.addEventListener("change", () => {
		record[propertyName] = values[selectBox.selectedIndex];
		if (save) {
			dataCell.innerText = getSelectedTextFromSelect(selectBox);
			saveButton.style.display = isEmptyRecordFilledWithValues() ? "block" : "none";
		} else {
			new HttpRequestTemplate(record._links.self.href)//
				.setMethodType("put")//
				.setRequestBody(JSON.stringify(record))//
				.setSuccessCallback((response) => {
					dataCell.innerText = getSelectedTextFromSelect(selectBox);
					log("Field updated!", "success");
				})//
				.execute();
		}
	});
	return selectBox;
}

function isEmptyRecordFilledWithValues() {
	for (let cell of mainTableBody.lastChild.previousSibling.childNodes) {
		if (cell.firstChild.childNodes.length === 0) {
			if (cell.innerText.startsWith(DEFAULT_EXAMPLE_VALUE) || cell.innerText.length === 0) {
				return false;
			}
		} else {
			let saveInputValue = cell.firstChild.firstChild.firstChild.value;
			if (saveInputValue.startsWith(DEFAULT_EXAMPLE_VALUE) || saveInputValue.length === 0) {
				return false;
			}
		}
	}
	return true;
}

function getPluralPropertyName(allRequestURL) {
	return allRequestURL.substring(allRequestURL.lastIndexOf("/") + 1);
}

/**
 * @param {HTMLInputElement} inputNode 
 * @param {string} originalValue - original text value in table cell 
 * @param {object} record - currently analyzed record 
 * @param {string} propertyName - currently analyzed record property name 
 * @param {HTMLTableCellElement} dataCell - cell to which update button will be added 
 */
function createUpdateButton(inputNode, originalValue, record, propertyName, dataCell) {
	let buttonNode = document.createElement("button");
	buttonNode.id = "updateButton";
	buttonNode.innerText = "Update";
	buttonNode.addEventListener("click", () => {
		if (inputNode.value !== originalValue) {
			record[propertyName] = inputNode.value;
			new HttpRequestTemplate(record._links.self.href).setMethodType("put").setRequestBody(JSON.stringify(record))//
				.setSuccessCallback((response) => {
					dataCell.innerText = inputNode.value;
					log("Field updated!", "success");
				})//
				.execute();
		} else {
			log("Value is the same, change value to update!", "warning");
		}
	});
	return buttonNode;
}

/**
 * @param {HTMLTableCellElement} dataCell 
 * @param {object} record - analyzed record 
 * @param {string} propertyName - analyzed record property name 
 * @param {boolean} save - is input node in empty row destined to be saved
 */
function createInputNode(dataCell, record, propertyName, save) {
	let inputNode = document.createElement("input");
	if (dataCell.innerText.match(DATE_FORMAT_PATTERN) !== null) {
		inputNode.setAttribute("type", "date");
	}
	inputNode.value = dataCell.innerText;
	if (save) {
		inputNode.id = "saveInput";
		inputNode.addEventListener("input", () => {
			record[propertyName] = inputNode.value;
			saveButton.style.display = isEmptyRecordFilledWithValues() ? "block" : "none";
		});
	}
	return inputNode;
}

/**
 * @param {string} propertyName 
 */
function createColumnNameCellInHTMLTable(propertyName) {
	let columnNameCell = document.createElement("td");
	columnNameCell.innerText = propertyName;
	return columnNameCell;
}

let idInputField = document.getElementById("idInputField");
function idFieldChanged() { idInputField.className = ((parseInt(idInputField.value) > 0) ? "correct" : "error"); }

function findById() {
	let selectedTableHref = getSelectedValueFromSelect(tableCBox);
	findTemplate(selectedTableHref !== "" && idInputField.className === "correct",//
		(response) => [response],//
		`${selectedTableHref}/${idInputField.value}`,//
		() => { },//
		() => {
			if (selectedTableHref === "") {
				log("Table is not chosen!", "warning");
			} else if (idInputField.className === "error") {
				if (idInputField.value !== "") {
					log(`Id value must be greater than 0, but is ${idInputField.value}!`, "warning");
				} else {
					log("Id field is empty, enter id value!", "warning");
				}
			}
		});
}

//TODO:dodać zmianę stylu w komórkach w których pola mają wartość * - default_example_value

let saveButton;
let undoSaveButton = document.getElementById("undoSaveButton");
function addEmptyRecord() {
	if (getSelectedValueFromSelect(tableCBox) === "") {
		log("Select table to add new record!", "warning");
	} else if (mainTableBody.childNodes.length > 1 && mainTableBody.lastChild.previousSibling.firstChild.innerText === "0") {
		log("There is already one empty row, first fill that row and save one!", "warning");
	} else {
		new HttpRequestTemplate(getSelectedValueFromSelect(tableCBox))
			.setSuccessCallback((response) => {
				new HttpRequestTemplate(response._links.example.href)
					.setSuccessCallback((response) => {
						let row1 = document.createElement("tr");
						Object.keys(response)
							.filter(propertyName => propertyNamesToIgnore.indexOf(propertyName) === -1) //if doesn't contain
							.forEach((propertyName, i, propertyNames) => {
								if (mainTableHeader.childNodes.length < propertyNames.length)
									mainTableHeader.appendChild(createColumnNameCellInHTMLTable(propertyName));
								row1.appendChild(createColumnDataCellInHTMLTable(response, propertyName, true));
							});
						mainTableBody.appendChild(row1);

						let row2 = document.createElement("tr");
						saveButton = document.createElement("button");
						saveButton.id = "saveButton";
						saveButton.innerText = "Save";
						saveButton.addEventListener("click", () => {
							undoSaveButton.style.display = "none";
							new HttpRequestTemplate(response._links.self.href.replace(/\/\d+$/, "")).setMethodType("post").setRequestBody(JSON.stringify(response))
								.setSuccessCallback((response) => {
									findAll(); //reload
									log("Successful save!", "success");
								})
								.execute();
						});
						row2.appendChild(saveButton);

						mainTableBody.appendChild(row2);
						undoSaveButton.style.display = "block";
					}).execute();
			}).execute();
	}
}

function undoSaving() {
	mainTableBody.removeChild(mainTableBody.lastChild);
	mainTableBody.removeChild(mainTableBody.lastChild);
	if (mainTableBody.childNodes.length === 0)
		mainTableHeader = clearElement(mainTableHeader, "thead");
	undoSaveButton.style.display = "none";
}

function deleteById() {
	let selectedTableHref = getSelectedValueFromSelect(tableCBox);
	if (selectedTableHref === "") {
		log("Table is not chosen!", "warning");
	} else if (idInputField.className !== "correct") {
		if (idInputField.value !== "") {
			log(`Id value must be greater than 0, but is ${idInputField.value}!`, "warning");
		} else {
			log("Id field is empty, enter id value!", "warning");
		}
	} else {
		new HttpRequestTemplate(`${selectedTableHref}/${idInputField.value}`)
			.setMethodType("delete")
			.setSuccessCallback((response) => {
				findAll(); /*reload*/
				log("Successful delete", "success");
			}).execute();
	}
}

//strategy pattern
let log = logWithAlertify;

function logWithAlertify(message, messageKind, timeout = 4) {
	switch (messageKind) {
		case "success": alertify.success(message, timeout); break;
		case "notify": alertify.notify(message, timeout); break;
		case "error": alertify.error(message, timeout); break;
		case "warning": alertify.error(message, timeout); break;
		default:
			new Error(`Message kind: ${messageKind} is unknown!`);
	}
}

function logWithAlert(message, messageKind, timeout) {
	alert(`${messageKind}: ${message}`)
}

function printErrorFromServer(error) { log(error.exceptionName + ": " + error.message + "\n\n" + error.solutions.join("\n=>"), "error"); }