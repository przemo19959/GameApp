/**
 * This class represents virtual table.
 */
class VirtualTable {
	constructor(response, findById) {
		this.foreignColumns = [];
		this.foreignRecordsForEachForeignColumn = [];

		console.log(response);

		if (Array.isArray(response.data)
			&& response.data.length > 0 && typeof response.data[0] == 'string') {
			this.records = [];
			this.columns = [];
			// console.log(response.data);
			forRange(response.data.length, i => {
				if (response.data[i].startsWith("fk_")) {
					this.columns[i] = response.data[i].slice(3);
					this.foreignColumns.push(this.columns[i][0].toUpperCase() + this.columns[i].slice(1));
				} else {
					this.columns[i] = response.data[i];
				}
			});
		} else {
			if (findById) {
				this.records = [];
				this.records[0] = response.data;
			} else {
				this.records = response.data; //otrzymane rekordy
			}
			this.columns = Object.keys(this.records[0]); //nazwy kolumn }rekordów

			forRange(this.columns.length, i => {
				var keys = Object.keys(this.records[0][this.columns[i]]);
				if (keys.length > 0 && typeof this.records[0][this.columns[i]] != 'string') {
					this.foreignColumns.push(this.columns[i][0].toUpperCase() + this.columns[i].slice(1));
				}
			});
		}
		this.rowCount = this.records.length;
		this.columnCount = this.columns.length;

		//aktualnie aktualizowany rekord
		this.currentRowIndex = -1;
		this.currentColumnIndex = -1;

		this.table = makeTwoDimArray(this.rowCount, this.columnCount, false);

		this.newRecordAdded = false;
	}

	setNewRecordAdded(value) { this.newRecordAdded = value; }
	isNewRecordAdded() { return this.newRecordAdded; }

	//na siĹ‚Ä™ wpisane pod konkretnÄ… bazÄ™ danych
	getInputType(column) {
		switch (column) {
			case "id": return "number";
			case "dateOfRelease": return "date";
			default: return "text"; //domyĹ›lnie tekst
		}
	}

	doesInputCorrect(column, value, isForeign) {
		const datePattern = /\d{4}-\d{2}-\d{2}/;
		switch (column) {
			case "id": return true; //bowiem na siĹ‚Ä™ tam jest znak *
			case "dateOfRelease": {
				if (value == undefined)
					return false;
				return value.match(datePattern) != null;
			}
			default: return (isForeign) ? Object.keys(value).length > 0 : value.length > 0;
		}
	}

	getDefaultValuesBasedOnColumnType(column) {
		switch (column) {
			case "id": return "_setNumber_";
			case "dateOfRelease": return "_setDate_";
			default: return "_setText_"; //domyĹ›lnie tekst
		}
	}

	// addNotSetRecord() {
	// 	if (this.newRecordAdded)
	// 		alert("One Record was already added! Fill values and save record to DB!");
	// 	this.newRecordAdded = true;
	// }

	recordsEquals(recordA, recordB) {
		for (var i = 0; i < this.columnCount; i++) {
			if (recordA[this.columns[i]] != recordB[this.columns[i]])
				return false;
		}
		return true;
	}

	getForeignColumnRecords(column) {
		var records = this.foreignRecordsForEachForeignColumn[this.getIndexOfForeignColumnIfExists(column)];
		return records;
	}

	//na sztywno wpisana nazwa kolumny z kluczem id (a moĹĽe byÄ‡ inna)
	isIdColumn(column) { return column == "id"; }

	getIndexOfForeignColumnIfExists(column) {
		var result = -1;
		if (column != undefined) {
			var firstUpperCaseLetterColumn = column.charAt(0).toUpperCase() + column.slice(1);
			forRange(this.foreignColumns.length, i => {
				if (firstUpperCaseLetterColumn == this.foreignColumns[i]) {
					result = i;
				}
			});
		}
		return result;
	}

	isNotIdAndForeignColumn(column) {
		return (this.isIdColumn(column) == false && this.getIndexOfForeignColumnIfExists(column) == -1);
	}

	isNotIdAndNormalColumn(column) {
		return (this.isIdColumn(column) == false && this.getIndexOfForeignColumnIfExists(column) != -1);
	}

	addForeignRecordsForColumn(response, arrayIndex) {
		if (Array.isArray(response.data) && response.data.length > 0 && typeof response.data[0] == 'string') {

		} else {
			this.foreignRecordsForEachForeignColumn[arrayIndex] = (response.data);
		}
	}

	getUpdatedRecord() {
		return (this.currentRowIndex != -1) ? this.records[this.currentRowIndex] : "noRecordIsUpdated";
	}

	getUpdatedColumnName() {
		return (this.currentColumnIndex != -1) ? this.columns[this.currentColumnIndex] : "noColumnIsUpdated";
	}

	setUpdatedCellValue(value) { this.getUpdatedRecord()[this.getUpdatedColumnName()] = value; }
	getUpdatedCellValue() { return this.getUpdatedRecord()[this.getUpdatedColumnName()]; }

	removeUpdatingUIElement() {
		if (this.currentRowIndex != -1 && this.currentColumnIndex != -1)
			this.table[this.currentRowIndex][this.currentColumnIndex] = false;
	}

	setTableValue(record, column, value) {
		if (this.isOneAlreadyUpdated()) {
			if (record != this.getUpdatedRecord() || column != this.getUpdatedColumnName())
				alert("One is already updated! Update one first, then next one.");
			return;
		}

		//na sztywno wpisana nazwa kolumny id
		if(column=="id"){
			alert("Primary key can't be updated. PK are assigned automatically by persitance provider!");
			return;
		}

		forRange(this.rowCount, i => { if (this.recordsEquals(this.records[i], record)) this.currentRowIndex = i; });
		forRange(this.columnCount, i => { if (this.columns[i] == column) this.currentColumnIndex = i; });
		if (this.currentColumnIndex != -1 && this.currentRowIndex != -1);
		this.table[this.currentRowIndex][this.currentColumnIndex] = value;
	}

	getTableValue(record, column) {
		var rowIndex = -1;
		for (var i = 0; i < this.rowCount; i++) {
			// if (this.recordsEquals(this.records[i], record)) {
			if (this.records[i] == record) {
				rowIndex = i;
				break;
			}
		}

		var columnIndex = -1;
		for (var i = 0; i < this.columnCount; i++) {
			if (this.columns[i] == column) {
				columnIndex = i;
				break;
			}
		}
		if (rowIndex == -1 || columnIndex == -1)
			return false;
		return this.table[rowIndex][columnIndex];
	}

	isEditedNormalColumn(record, column) {
		return (this.getTableValue(record, column) && this.getIndexOfForeignColumnIfExists(column) == -1);
	}

	idEditedForeignColumn(record, column) {
		return (this.getTableValue(record, column) && this.getIndexOfForeignColumnIfExists(column) != -1);
	}

	isOneAlreadyUpdated() {
		for (var i = 0; i < this.rowCount; i++) {
			for (var j = 0; j < this.columnCount; j++) {
				if (this.table[i][j])
					return true;
			}
		}
		return false;
	}

	printTable() {
		console.log(this.table);
	}
}

const forRange = function (to, body) {
	for (var i = 0; i < to; i++) {
		body(i);
	}
}

const makeTwoDimArray = function (rowCount, columnCount, initialValue) {
	var result = [];
	forRange(rowCount, i => { result[i] = []; });
	forRange(rowCount, i => { forRange(columnCount, j => { result[i][j] = initialValue; }); });
	return result;
}