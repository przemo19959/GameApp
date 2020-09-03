class HttpRequestTemplate {
    constructor() {
        //default template values
        this.methodType = "get";
        this.requestBody = "";
        this.successCallback = printErrorFromServer;
        this.setErrorCallback(function (error) {
            showLoader(false);
            printErrorFromServer(error);
        });
    }

    setMethodType(methodType) { this.methodType = methodType; return this; }
    setRequestBody(requestBody) { this.requestBody = requestBody; return this; }
    setSuccessCallback(successCallback) { this.successCallback = successCallback; return this; }
    setErrorCallback(errorCallback) { this.errorCallback = errorCallback; return this; }

    execute(requestURL) {
        let xhr = new XMLHttpRequest();
        xhr.open(this.methodType, requestURL, true);
        xhr.setRequestHeader("content-type","application/json");
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