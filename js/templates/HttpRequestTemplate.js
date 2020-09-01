class HttpRequestTemplate{
    constructor(){
        this.xhr=new XMLHttpRequest();    
    }

    //todo: dokończyć...
    execute(methodType,requestURL){
        this.xhr.open(methodType,requestURL,true);
        this.xhr.onreadystatechange=function(){

        };
    }


}