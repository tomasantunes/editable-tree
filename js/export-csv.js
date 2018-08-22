function convertArrayOfObjectsToCSV(args) {  
	var result, ctr, keys, columnDelimiter, lineDelimiter, data;
	data = args.data;
	if (data == null || !data.length) {
		return null;
	}

	columnDelimiter = args.columnDelimiter || ',';
	lineDelimiter = args.lineDelimiter || '\n';

	result = '';
	data.forEach(function(item) {
		console.log(item);
		ctr = 0;
		keys = Object.keys(item);
		keys.forEach(function(key) {
			result += key;
			ctr++;
			if (ctr > 0) result += columnDelimiter;
			item[key].forEach(function(task) {
				result += task.text;
				ctr++;
				if (ctr > 0) result += columnDelimiter;
				
			});
		});
		result += lineDelimiter;
	});

	return result;
}
	
function downloadCSV(args) {  
	var data, filename, link;
	var csv = convertArrayOfObjectsToCSV({
		data: args.data
	});
	console.log(csv);
	if (csv == null) return;

	filename = args.filename || 'export.csv';

	if (!csv.match(/^data:text\/csv/i)) {
		csv = 'data:text/csv;charset=utf-8,' + csv;
	}
	data = encodeURI(csv);

	console.log(data);
	link = document.createElement('a');
	link.setAttribute('href', data);
	link.setAttribute('download', filename);
	link.click();
}