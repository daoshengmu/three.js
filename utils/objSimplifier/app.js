// Auther: Daosheng Mu
// Date: 03/26/2016
// Obj format: http://www.cs.cmu.edu/~mbz/personal/graphics/obj.html

var fs = require('fs'),
	readline = require('readline'),
	stream = require('stream');

var readstream = fs.createReadStream('pointcloud/output.obj');
var writeStream = fs.createWriteStream('pointcloud/result.obj');
var vtxList = [];
var normalList = [];
var texList = [];
var faceList = [];
// var vtxDict = {}; // orig idx: after idx
//var vtxListMap = [];
var faceOutput = [];

var posCount = 1;
var normalCount = 1;
var texCoordCount = 1;

var faceCount = 10 * 3;	// Set by user argument., Index no. is three times to face no,
const tokenV = 'v';
const tokenSpace = ' ';
const tokenN = 'n';
const tokenT = 't';
const tokenF = 'f';
const tokenSlash = '/';

var vertexMapper = function() {
	this.dict = {};	// Dictionary of original idx to the simplifier ones.	
	this.list = [];	// Index list stores the original order.
}

var posMapper = new vertexMapper();
var normalMapper = new vertexMapper();
var texCoordMapper = new vertexMapper();

var reader = readline.createInterface({
	input: readstream,
	output: process.stdout,
	terminal: false
});

function processObjFile() 
{
	console.log('---Begin processing obj file.---');

	// Get process.argv
	if (process.argv.length > 2) {
		faceCount = process.argv[2] * 3;
	}

	console.log("Face count is " + faceCount);

	// Adjust the size of the geometry
	var face;
	for (var i = 0; i < faceCount; ++i) {
		face = faceList[i];

		// Process vertex position
		if (!posMapper.dict[face.v]) {
			posMapper.dict[face.v] = posCount;
			++posCount;
			posMapper.list.push(face.v);
		}

		// if (!posMapper.dict[face.vn]) {
		// 	posMapper.dict[face.vn] = posCount;
		// 	++posCount;
		// 	posMapper.list.push(face.vn);
		// }

		// if (!posMapper.dict[face.c]) {
		// 	posMapper.dict[face.c] = posCount;
		// 	++posCount;
		// 	posMapper.list.push(face.c);
		// }

		// Process vertex normal
		if (!normalMapper.dict[face.vn]) {
			normalMapper.dict[face.vn] = normalCount;
			++normalCount;
			normalMapper.list.push(face.vn);
		}

		// Process texture coordinate
		if (!texCoordMapper.dict[face.vt]) {
			texCoordMapper.dict[face.vt] = texCoordCount;
			++texCoordCount;
			texCoordMapper.list.push(face.vt);
		}

	}

	// Start to save obj file
	var result = '';
	var result = "# OBJ dataFile simple version. File name: output.obj\n";
		result += "mtllib output.mtl\n";
	var v = '';
	var vn = '';
	var vt = '';

	// Save vertex
	for (var i = 0; i < posMapper.list.length; ++i) {
		var vtxId = posMapper.list[i];

		v += tokenV + tokenSpace + vtxList[vtxId] +'\n';
 	}

 	// Save normal
 	for (var i = 0; i < normalMapper.list.length; ++i) {
		var vtxId = normalMapper.list[i];

		vn += tokenV + tokenN + tokenSpace + normalList[vtxId] +'\n';
 	}

 	// Save texture coordinate
 	for (var i = 0; i < texCoordMapper.list.length; ++i) {
		var vtxId = texCoordMapper.list[i];

		vt += tokenV + tokenT + tokenSpace + texList[vtxId] +'\n';
 	}

 	// 	vn += tokenV + tokenN + tokenSpace + normalList[vtxId] + '\n';
		// vt += tokenV + tokenT + tokenSpace + texList[vtxId] + '\n';

 	// Process face
 	var f = '';
 	for (var i = 0; i < faceCount; i++) {

 		if ((i % 3) == 0) {
			if (i > 0) {
				f += '\n';
			}

			f += tokenF;
 		} else {
 			f += tokenSpace;
 		}

 		f += tokenSpace + posMapper.dict[faceList[i].v] + '/' 
 			+ normalMapper.dict[faceList[i].vn] + '/' + texCoordMapper.dict[faceList[i].vt];
 	}

	// Organize the format
	result += v;
	result += vn;
	result += vt;
	result += f;

	console.log('---Finish processing obj file.---');
	return result;
}

readstream.on('end', () => {
	console.log('Read end');

	// Simplifier the obj data
	var result = processObjFile();
	//Then write to outstream
	writeStream.write(result);
	console.log('---Finish output.---');
});

reader.on('line', function(line) {
   
	if (line[0] === tokenV) {

		if (line[1] === tokenSpace) {	// Get vertex pos
			vtxList.push(line.split(tokenV + tokenSpace)[1]);
		}
		else if (line[1] === tokenN) {	// Get vertex normal
			normalList.push(line.split(tokenV + tokenN)[1]);	
		}
		else if (line[1] === tokenT) {	// Get texture coordinate
			texList.push(line.split(tokenV + tokenT)[1]);
		}
	} else if (line[0] === tokenF) {
		var faces = line.split(tokenSpace);
		var lens = faces.length;
		
		for (var i = 1; i < lens ; ++i) { // face[0] is 'f'
			var faceIdx = faces[i].split(tokenSlash);
			// faceList.push({	
			// 		a: faceIdx[0],
			// 		b: faceIdx[1],
			// 		c: faceIdx[2]
			// 	});

			faceList.push({	
				v: faceIdx[0],
				vn: faceIdx[1],
				vt: faceIdx[2]
			});
		}
	}
});

