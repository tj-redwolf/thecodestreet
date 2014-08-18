var c = require('cluster');
var express = require('express');
var server = express();
var fs = require('fs');
var cpus = require('os').cpus().length;
var server_port = process.env.OPENSHIFT_NODEJS_PORT || 5566;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';


function computeWordsScore(id,d){
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
	
		// report the end of function
		var result = keys[highest1]+ " (" + wordsCount[keys[highest1]] + " times ) " + keys[highest2]+ " (" + wordsCount[keys[highest2]] + " times ) " + keys[highest3]+ " (" + wordsCount[keys[highest3]] + " times ) ";
		
		return result;
}

if(c.isMaster){
	//setup the server 
	var result_handler;
	server.get("/cluster",function(req,res){
		
		var start = Date.now();

		//reset the counters for a new request
		var exit_count = 0, tasks_result = [];
		c.workers[1].send({"filename":"article1.txt"});
		c.workers[2].send({"filename":"article2.txt"});
		c.workers[3].send({"filename":"article3.txt"});
		result_handler = function(id, data){ 
			exit_count++;
			tasks_result[id] = data;
			if(exit_count == 3)
			{
				
				var end = Date.now();
				console.log(tasks_result);
				res.send({ 'time': end - start, 'article1': tasks_result[1], 'article2': tasks_result[2], 'article3': tasks_result[3] });
				
			}
		}
		
	});

	server.use('/',express.static(__dirname + '/public'))
	server.listen(server_port, server_ip_address, function () {
    	console.log("Listening on " + server_ip_address + ", server_port " + server_port)
	});

	//initiate the workers to handle the request
	for(var i = 0; i < 3 ; i++){
			var worker = c.fork();
			//receive message from worker process
			worker.on('message',function(msg){
				
				if(msg.id && msg.result)
					result_handler(msg.id,msg.result);
				
			});
	}
		c.on('online',function(worker){
			console.log('Worker is alive', worker.id, worker.process.pid);
		});
		
		c.on('exit',function(worker,code, signal){
			exit_count++;
			
			console.log("Worker died:", worker.process.pid, code , signal, worker.suicide);
			
			
		});

}
if(c.isWorker){
	
	var id = (c.worker.id % 4); 
	process.on('message',function(msg){
		
		if(msg.filename) {
			fs.readFile(msg.filename,'utf8',function(err,result){
	
				if(err) console.log(err);
				else {
					var result = computeWordsScore(c.worker.id,result);	
					process.send({'id': id,'result':result});
					
				}
			});		
		}
	});
	
}