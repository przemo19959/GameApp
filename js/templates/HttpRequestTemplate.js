class HttpRequestTemplate {
    constructor(requestURL) {
        //default template values
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

    setMethodType(methodType) { this.methodType = methodType; return this; }
    setAsync(async) { this.async = async; return this; }
    setRequestBody(requestBody) { this.requestBody = requestBody; return this; }
    setSuccessCallback(successCallback) { this.successCallback = successCallback; return this; }
    setErrorCallback(errorCallback) { this.errorCallback = errorCallback; return this; }

    execute() {
        let xhr = new XMLHttpRequest();
        xhr.open(this.methodType, this.requestURL, this.async);
        xhr.setRequestHeader("content-type", "application/json");
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                let status = xhr.status;
                if (status === 0 || (status >= 200 && status < 400)) {
                    this.successCallback(JSON.parse(xhr.responseText));
                } else {
                    this.errorCallback(JSON.parse(xhr.responseText));
                }
            }
        };
        xhr.send(this.requestBody);
    }
}