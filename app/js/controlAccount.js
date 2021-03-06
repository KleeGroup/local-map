/**
 * control the acces to configuration and administrators pages
 */
var	server= "http://localhost:3000/";
//var	server= "http://local-map/";

//Peronnal account

var myData=[d3.select("#personal-firstname")[0][0].textContent, d3.select("#personal-lastname")[0][0].textContent,"",""];

function fillMyData(myData,callback){
    d3.json(server + "currentOfficeName/" + myData[0] + "/" + myData[1], function(err, res){
        if (res.length>0){
            if (res[0].site=="La Boursidière"){
                myData[2] = res[0].name;
                myData[3]= res[0].site;}
            else if (res[0].site !==undefined ||res[0].site !=="" ||res[0].site !=="aucun"){
                myData[2] = "externe";
                myData[3]= res[0].site;}
            else{
                myData[2] = "aucun";
                myData[3]= "aucun";}
        }        
        else{
            myData[2] = "aucun";
            myData[3]= "aucun";
        };   
    callback();
    })
}

fillMyData(myData,displayMyData);

function displayMyData(){
    console.log(myData)
        //to show information about my account on each page);
        if (myData[3]==""||myData[3]==null||myData[3]==undefined ||myData[3]=="aucun" ){
            d3.select("#personal-site").html(" Site non défini");
            d3.select("#personal-desk").html("Bureau non défini");
        }else{
            if (myData[2]=="externe"){
                d3.select("#personal-desk").html(myData[3]);
            }else if (myData[2]=="aucun"){
                d3.select("#personal-desk").html("Aucun bureau défini");
            }else{
            d3.select("#personal-desk").html(myData[2]);
            }
        }
};

