let projectPath="/springDBProject/list/";

let wordPattern="\\w\+";

let tableSelector;
let loadingCircle;
let mainTable;
let field;
let addRecordButton;

let tableInXML;

/* Początkowa metoda inicjalizacyjna, uruchamiana, gdy ciało <body> strony zostanie załadowane. W celu
*  inicjalizacji referencji do globalnych elementów HTML.
*/
function init(){
	tableSelector=document.getElementById("tableSelector");
	loadingCircle=document.getElementById("load");
	mainTable=document.getElementById("mainTable");
	field = document.getElementById("field1");
	addRecordButton=document.getElementById("addRecord");
	addRecordButton.addEventListener("click",addRecordFuntion); //dodanie obsługi zdarzenia kliknięcia
	console.log("Init finished!");
}

/* Funkcja dodająca formatkę do dodania nowego rekordu w tabeli. Tabela <table> posiada bezpośrednio wiersze <tr> (brak ciała <tbody>)
*
*/
function addRecordFuntion(){
	let lastRow=mainTable.lastChild;
	let headerRow=mainTable.firstChild;
	let newRow=document.createElement("tr"); //nowy wiersz
	let lastRowIndex=mainTable.getElementsByTagName("tr").length;
	for(i=0;i<headerRow.getElementsByTagName("td").length;i++){
		let newCell=createCellAndAppendToRow(newRow,{"class":"data"},"");
		if(i==0) //jeśli kolumna Lp.
			newCell.textContent=1+parseInt(lastRow.firstChild.textContent,10);
		if(i>1) //powyżej kolumn Lp. i id
			newCell.addEventListener("dblclick",function(){doubleClickCellFunction(newCell,lastRowIndex)});	
	}
	let newCell=document.createElement("td");

	let acceptButton=createInputAndAppendToCell(newCell,{"type":"button","value":"Accept"});
	acceptButton.addEventListener("click",update);

	let cancelButton=createInputAndAppendToCell(newCell,{"type":"button","value":"Cancel"});
	cancelButton.addEventListener("click",removeRow);
	
	newRow.appendChild(newCell);
	mainTable.appendChild(newRow);	
}

/*funkcja pomocnicza ustawiająca kilka atrybutów na podstawie tabeli
*/
function setAttributes(el, attrs) {
	for(var key in attrs) {
	  el.setAttribute(key, attrs[key]);
	}
}

/*Funkcja usuwająca ostatni wiersz, element <table> potem wiersze <td>.
* Początkowo pobierany jest ostatni wiersz tabeli, który następnie jest usuwany z elementu <table>.
*/ 
function removeRow(){
	let lastRow=mainTable.lastChild;
	mainTable.removeChild(lastRow);
}

/*Ta metoda jest wyzwalana, gdy wartość selektora <select> ulegnie zmianie. Początkowo pobierana jest
* wartość aktualnie wybranej opcji selektora (czyli aktualnie wybrana tabela). Następnie wysyłane jest
* zapytanie GET do serwera, który zwróci daną tabelę w formacie XML. Funkcja obsługi odpowiedzi to printTable.
*/
function changeTable(selector) {
	let selectedValue = selector.options[selector.selectedIndex].value;
	if(selectedValue!=""){
		showLoaderHideSelector();
		getRequest(projectPath + selectedValue,printTable,""); //wyślij zapytanie do serwera, a ten do DB zapytanie SELECT * FROM
	}
}

/*Ta metoda dodaje ciało tabeli, które otrzymała w postaci pliku XML od serwera w wyniku zapytania SQL SELECT * FROM.
* Początowo ciało tabeli jest usuwane, następnie pobierana jest odpowiedź serwera w postaci pliku XML. Dla każdego
* elementu <record> tworzony jest wiersz tabeli <tr>, a dla każdej kolumny <column> tworzona jest komórka <td>.
*/
function printTable(responseObj){
	mainTable.innerHTML="";
	tableInXML=responseObj.responseXML; //pobierz ciało odpowiedzi w postaci XML
	let record = tableInXML.getElementsByTagName("record");
	let columns;

	for (i = 0; i <record.length; i++) { //dla wszystkich znaczników <record> w XML
		columns=record[i].getElementsByTagName("column");
		let newRow=getIdAndSetRow(columns[1].textContent,i);
			
		for(j=0;j<columns.length;j++){ //dla wszystkich znaczników <column> w danym <record>
			if(i==0) //dla pierwszego wiersza z nagłówkami
				createCellAndAppendToRow(newRow,{"class":"header"},columns[j].textContent);
			else if(j==0 || j==1) //dla pierwszej kolumny z Lp. oraz kolumny id
				createCellAndAppendToRow(newRow,{"class":"data"},columns[j].textContent);
			else{
				let newCell=createCellAndAppendToRow(newRow,{"class":"data"},columns[j].textContent);
				let rowIndex=i;
				newCell.addEventListener("dblclick",function(){doubleClickCellFunction(newCell,rowIndex)});
			}
		}
		mainTable.appendChild(newRow);
	}
	addRecordButton.style.display="block";
	field.textContent="Wybrana tabela: "+tableSelector.options[tableSelector.selectedIndex].text;
	hideLoaderShowSelector();
}

/* Ta funkcja tworzy komórkę <td>, następnie ustawia atrybuty wg przekazanej tabeli styleAttr oraz ustawia
*  zawartość tekstową jako zmienną text. Na koniec taka komórka jest dodawana do wskazanego wiersza <td>.
*  Funkcja zwraca komórkę, aby można było dodatkowo dodać do niej obsługę zdarzenia.
*/
function createCellAndAppendToRow(row,styleAttr,text){
	let newCell=document.createElement("td");
	setAttributes(newCell,styleAttr); //ustaw atrybuty
	newCell.textContent=text;
	row.appendChild(newCell);
	return newCell;
}

// Ta funkcja tworzy nowy wiersz <td>, a jeśli ten wiersz nie jest wierszem nagłówka (z nazwami kolumn)
//  to dodatkowo ustawia jego atrybut "id" na wartość jaką ma rekord w rzeczywistej bazie danych.
function getIdAndSetRow(columnWithId,i){
	// let idOfRecord=columnWithId; //pobierz id rekordu
	let newRow=document.createElement("tr");
	if(i!=0)
		newRow.setAttribute("id",columnWithId);
	return newRow;
}

//funkcja wysyłająca dane data w zapytaniu POST pod wskazany adres
function getRequest(url, cFunction, data) {
	let xhttp = new XMLHttpRequest();
	xhttp.onload = function() {
	  if (this.status == 200)
		  cFunction(this);
	};
	xhttp.open("GET", url, true);
	xhttp.send(data);
}

//funkcja wysyłająca dane data w zapytaniu POST pod wskazany adres
function postRequest(url, cFunction,data) { 
	let xhttp = new XMLHttpRequest();
	xhttp.onload = function() {
		if (this.status == 200)
			cFunction(this);
	};
	xhttp.open("POST", url, true);
	xhttp.send(data);
}

/*Ta metoda jest wyzwalana, gdy komórka danych w tablicy zostanie naciśnięta dwu-krotnie. Dodaje ona pole tekstowe (input type-text)
* w miejsce klikniętej komórki. Dodatkowo do tego wiersza dodawana jest nowa komórka z przyciskami akceptującymi oraz anulującymi
* operację aktualizacji rekordu.
*/
function doubleClickCellFunction(cell,rowIndex){
	let textField=document.createElement("input");
	setAttributes(textField,{"type":"text","class":"none"});
	textField.addEventListener("input",function(){validateWord(textField,wordPattern);});

	cell.textContent="";
	cell.appendChild(textField);
	cell.setAttribute("class","hoverOff"); //wyłącz podświetlanie komórki

	let row=cell.parentNode;
	if(!isButtonInLastCell(row)){ //dodaj przycisk, jeśli taki nie istnieje dla danego wiersza
		let newCell=document.createElement("td");

		let acceptButton=createInputAndAppendToCell(newCell,{"type":"button","value":"Accept"});
		acceptButton.addEventListener("click",update);

		let cancelButton=createInputAndAppendToCell(newCell,{"type":"button","value":"Cancel"});
		cancelButton.addEventListener("click",function(){cancelUpdate(newCell,rowIndex)});

		row.appendChild(newCell);
	}
}

/* Ta funkcja tworzy element <input>, ustawia jego atrybuty według przekazanej tabeli, następnie dodaje element
*  do komórki <td>. Na koniec zwraca przycisk, aby można dodatkowo zdefiniować obsługę zdarzenia dla tego elementu.
*/
function createInputAndAppendToCell(cell,styleAttr){
	let button=document.createElement("input");
	setAttributes(button,styleAttr);
	cell.appendChild(button);
	return button;
}

//TODO: tutaj trzeba poprawić, aby nie czytało z wcześniej zapisanego pliku XML, a żeby
//serwer zwrócił, ten konkretny rekord i go tak uzupełnił.
/* Ta metoda jest wywoływana, gdy wciśnięty zostanie przycisk anulujący edycję rekordu.
*  ma za zadanie wszystkie zamienione pola tekstowe (input-text) przywrócić do domyślnych wartości
*/
function cancelUpdate(cell,rowIndex){
	let record=tableInXML.getElementsByTagName("record");
	let columns=record[rowIndex].getElementsByTagName("column");
	for(i=0;i<columns.length;i++){ //dla wszystkich kolumn z danego wiersza
		let cell=mainTable.getElementsByTagName("tr")[rowIndex].getElementsByTagName("td")[i];
		if(cell.getElementsByTagName("input").length>0){
			cell.setAttribute("class","data");
			cell.addEventListener("dblclick",function(){doubleClickCellFunction(cell,rowIndex)});
			cell.innerHTML=columns[i].textContent;
		}
	}
	mainTable.getElementsByTagName("tr")[rowIndex].removeChild(cell);
}

/* Ta metoda sprawdza, czy wskazany wierz posiada w ostatniej komórce przycisk. Początkowo pobierane 
*  wszystkie elementy <input> z ostatniej komórki <td> tego elementu. Jeśli istnieje choć jeden taki
*  element, i jego atrybut type=button, to zwracane jest true. W innym przypadku false.
*/
function isButtonInLastCell(row) {
	let lastCellElements=row.lastChild.getElementsByTagName("input");
	for(i=0;i<lastCellElements.length;i++){
		if(lastCellElements[i].getAttribute("type")=="button")
			return true;
	}
	return false;
}

/* Metoda przeprowadzająca aktualizację rekordu. Pole tekstowe znajduje się w węźle <td>, który znajduje się
*  w weźle <tr>. Ta metoda przegląda po kolei wszystkie komórki <td> danego wiersza i pobiera jego wartość
*  tekstową. Jeśli któreś pole jest puste lub niespełniony jest wzorzec, wtedy wyrzucany jest komunikat. W innym
*  przypadku, kolejne wartości są dodawane do zmiennej zapytania, która zostanie wysłana w żądaniu POST do serwera.
*/
function update() {
	let row=this.parentNode.parentNode; //pobierz wiersz tabeli
	let cells=row.getElementsByTagName("td"); //pobierz wszystkie komórki wiersza
	let queryString="";
	let value="";
	for (let i = 0; i < cells.length-1; i++) { //pomiń pierwszą(Lp.) i ostanią komórkę(input type=button)
		value=getInputValueIfExists(cells[i]);
		if(value==""){
			if(i==1) //jeśli pole id jest puste, to wstaw do zapytania wartość 0.
				queryString+="0&";
			else{
				console.log("Empty fields or not matching pattern!");
				return; //jeśli któreś pole jest puste
			}
		}else
			queryString+=value+"&"; //dodaj wartość z pól wiersza do zapytania
	}
	queryString=queryString.substring(0,queryString.length-1); //usuń ostatni znak &

	console.log("Zapytanie: "+queryString);
	let selectedValue = tableSelector.options[tableSelector.selectedIndex].value;
	if(selectedValue!=""){
		showLoaderHideSelector();
		postRequest(projectPath + selectedValue,updateCallbackFunction,queryString); //wyślij zapytanie POST do aktualizacji
		console.log("POST Sended!");
	}
}

/* Funkcja ukrywająca selektor tabel a pokazująca pasek ładowania
*/
function showLoaderHideSelector(){
	loadingCircle.style.display="block";
	tableSelector.style.display="none";
}

/* Funkcja ukrywająca pasek ładowania a pokazująca selektor tabel
*/
function hideLoaderShowSelector(){
	loadingCircle.style.display="none";
	tableSelector.style.display="block";
}

/* Funkcja obsługi po otrzymaniu odpowiedzi od serwera po żądaniu POST aktualizacji. Jeśli poprawnie zaktualizowano rekord po stronie
*  serwera, zostanie zwrócona odpowiednia wiadomość. W przeciwnym wypadku zostanie wyświetlona odpowiednia wiadomość. Jeśli serwer
*  zwrócił poprawną wiadomość, to pobierany jest zaktualizowany wiersz i wszystkie jego komórki są uzupełniane tekstami z pól tekstowych
*  input-text. Na koniec w wierszu usuwana jest komórka z przyciskami Accept i Cancel.
*/
function updateCallbackFunction(response){
	let responseString=response.responseText;
	hideLoaderShowSelector();
	console.log("Response: "+responseString);
	if(responseString.match("Successful update on record id:\\d\+,No:\\d\+")!=null){ //poprawna odpowiedź
		let updatedRow=mainTable.getElementsByTagName("tr")[responseString.substring(responseString.lastIndexOf(":")+1)];
		let idOfRecord=responseString.substring(responseString.indexOf(":")+1,responseString.indexOf(",No:"));
		let cells=updatedRow.getElementsByTagName("td"); //wszystkie komórki tego wiersza
		for(i=0;i<cells.length-1;i++){ //bez ostatniej komórki z przyciskiem
			if(i==1 && cells[i].textContent=="")
				cells[i].textContent=idOfRecord;
			if(cells[i].getElementsByTagName("input").length>0){
				cells[i].innerHTML=cells[i].firstChild.value; //jeśli w komórce jest pole tekstowe pobierz wartość
				cells[i].setAttribute("class","data");
			}
		}
		updatedRow.removeChild(cells[cells.length-1]); //usuń ostatnią komórkę z przyciskiem

		console.log("Update Success!");
	}else if(responseString.match("Error while updating:.*")!=null){
		console.log(responseString);
	}else{
		console.log("Wrong response!"+ responseString);
	}
}

/* Ta metoda pobiera wartość tekstową komórki, zarówno gdy jest to czysty tekst, jak i wartość value
*  w polu tekstowym (input type=text). Zakłada się, że komórka zawiera jeden element tekstowy lub zwykłe pole tekstu.
*/
function getInputValueIfExists(cell){
	let inputs=cell.getElementsByTagName("input");
	for(i=0;i<inputs.length;i++){
		if(inputs[i].getAttribute("class")=="error") //jeśli pole nie spełnia wzorca
			return "";
		if(inputs[i].getAttribute("type")=="text")
			return inputs[i].value; //jeśli komórka zawiera edytowalne pole tekstowe
	}
	return cell.textContent; //jeśli brak pola tesktowego to zwróć czysty tekst
}

/* Ta metoda sprawdza, czy dane pole tekstowe (input z type=text) spełnia wskazany wzorzec i w zależności
*  od tego czy pole jest puste czy spełnia wzorzec lub nie, zmienia atrybut className elementu, który odpowiada stylowi.
*/
function validateWord(textField,pattern){
	let content=textField.value; //pobierz wartość pola tekstowego
	let result=content.match(pattern);
	textField.className=(content!="")?((result==null)?"error":"valid"):"none";
}
