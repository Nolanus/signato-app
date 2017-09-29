const ipc = require('electron').ipcRenderer;
/*
 const informationBtn = document.getElementById('information-dialog');

 informationBtn.addEventListener('click', function (event) {
 ipc.send('open-information-dialog')
 });
 */
// Trigger loading the signatures on app start
setTimeout(() =>
	ipc.send('load-signatures'), 1000);

ipc.on('loaded-signatures', function (event, error, data) {
	console.log(arguments);
});
