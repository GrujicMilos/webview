console.log('yeup loaded');

const vscode = acquireVsCodeApi(); // eslint-disable-line

const devIframe = document.getElementById('deviframe');

function sendMessageToHost(message) {
  vscode.postMessage(message);
}

function sendMessageToIframe(message) {
  devIframe.contentWindow.postMessage(message, '*');
}

if (devIframe) {
  console.log('proxy bind done');
  // Handle messages sent from the extension to the webview
  window.addEventListener('message', event => {
    const data = event.data; // The json data that the extension sent
    console.log(`received message on proxy: ${data.command}`);
    switch (data.command) {
      case 'pong':
        console.log('PONG');
        sendMessageToHost({ command: 'alert', text: 'PONG from inner' });
        break;
      case 'import':
        sendMessageToIframe(data);
        break;
      case 'exportDone':
      case 'ready':
        sendMessageToHost(data);
        break;
      case 'console':
        console.log(data.log);
        break;
    }
  });

}



