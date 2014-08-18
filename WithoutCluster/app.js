var express = require('express');
var fs = require('fs');

var cluster = require('cluster');
var tasks = [];
var count = 0;
var app = express();
var server_port = process.env.OPENSHIFT_NODEJS_PORT || 5555;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

function computeWordsScore(id,d,start_t,res){
	var data = d;
		var wordsCount = {};
		var wordsList = data.match(/[a-zA-Z]+/gi);
		var totalwords = wordsList.length; 
		console.log('Total words:',totalwords);
		for(var i = 0; i < wordsList.length ; i++){
			var temp = wordsList[i];
			if(wordsCount[temp]) wordsCount[temp]++;
			else wordsCount[temp] = 1; 			
		}
		wordsCount['null'] = -1;
		var keys = Object.keys(wordsCount);

		var highest1 = keys.indexOf('null'), highest2 = keys.indexOf('null'), highest3 = keys.indexOf('null');
		for(var i = 0; i< keys.length ; i++ ){
			
		    if (!(keys[i] === 'the' || keys[i] === 'a' || keys[i] === 'of' || keys[i] === 'to' || keys[i] === 'in' || keys[i] === 'that' || keys[i] === 'and' || keys[i] === 'for' || keys[i] === 'is' || keys[i] === 'are' || keys[i] === 'you' || keys[i] === 'your' || keys[i] === 'have' || keys[i] === 'it')) {

				if(wordsCount[keys[i]] > wordsCount[keys[highest1]]) highest1 = i;
				else if(wordsCount[keys[i]] > wordsCount[keys[highest2]]) highest2 = i;
				else if(wordsCount[keys[i]] > wordsCount[keys[highest3]]) highest3 = i;
						
			}

			
		}
		//var end = Date.now();
		// report the end of function
		var result = keys[highest1]+ " (" + wordsCount[keys[highest1]] + " times ) " + keys[highest2]+ " (" + wordsCount[keys[highest2]] + " times ) " + keys[highest3]+ " (" + wordsCount[keys[highest3]] + " times ) ";
		reportCompletion(id,result,start_t,res);
		
		return;
}

function reportCompletion(id,result,start,res){
	
	tasks[id] = result;
	count++;
    //console.log('Task', id, " Completed, duration:",duration);
	if(count === 3){
		var end = Date.now();
	    console.log("Test Complete in:", end - start);
	    console.log(tasks);
	    res.send({ 'time': (end - start), 'article1': tasks[0], 'article2': tasks[1], 'article3': tasks[2] });
	    
	}

}

app.use('/',express.static(__dirname + '/public'))

app.get('/single',function(req,res){
	
	var start = Date.now();
	//reset the variables
	tasks = [];
	count = 0;
	var id_count = 0;
	for(var i = 0 ; i < 3 ; i++) {
		fs.readFile('article' + (i + 1) + '.txt','utf8',function(err,result){
	
			if(err) console.log(err);
			else {
				computeWordsScore(id_count,result,start,res);		
				id_count++;
			}
		});
	}	
});
app.listen(server_port, server_ip_address, function () {
    	console.log("Listening on " + server_ip_address + ", server_port " + server_port)
});
