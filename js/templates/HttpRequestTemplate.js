/** 
 * HTTP Request Template class
 * It uses builder pattern for setting parameters. Method execute is template method and must be called at the end of builder fluent calls.
 */
class HttpRequestTemplate {
    #NAME;

    /**
     * @param {string} requestURL 
     */
    constructor(requestURL) {
        //default template values
        this.#NAME = "HttpRequestTemplate: ";

        this.requestURL = requestURL;
        this.methodType = "get";
        this.async = true;
        this.requestBody = "";
        this.successCallback = (response) => console.log(response);
        this.setErrorCallback((error) => {
            showLoader(false);
            printErrorFromServer(error);
        });
    }

    /**
     * @param {string} methodType - default is GET 
     */
    setMethodType(methodType) { this.methodType = methodType; return this; }
    /**
     * @param {boolean} async -  is request asynchronous (by default it is i.e true)
     */
    setAsync(async) { this.async = async; return this; }
    /**
     * @param {string} requestBody - body in JSON format (by default empty body) 
     */
    setRequestBody(requestBody) { this.requestBody = requestBody; return this; }
    setSuccessCallback(successCallback) { this.successCallback = successCallback; return this; }
    setErrorCallback(errorCallback) { this.errorCallback = errorCallback; return this; }

    #parseJSON(input) {
        try {
            return JSON.parse(input);
        } catch (SyntaxError) {
            return this.#NAME + "Input parsing to JSON failed - wrong format!";
        }
    }

    /**
     * Creates actual XMLHttpRequest object, sets its properties and sends request to given URL  
     */
    execute() {
        let xhr = new XMLHttpRequest();
        xhr.open(this.methodType, this.requestURL, this.async);
        xhr.setRequestHeader("content-type", "application/json");
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                let status = xhr.status;
                if (status >= 200 && status < 400) {
                    this.successCallback(this.#parseJSON(xhr.responseText));
                } else {
                    this.errorCallback(this.#parseJSON(xhr.responseText));
                }
            }
        };
        xhr.send(this.requestBody);
    }
}