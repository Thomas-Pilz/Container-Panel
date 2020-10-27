const { DeepstreamClient } = require('@deepstream/client');
const client = new DeepstreamClient('localhost:6020');

client.login((success, clientData) => {
    if (success) {
        console.log(`Login successful.\nClient details:\n${clientData}`);
    }
    else {
        console.log("Login failed.");
        return;
    }

    // subscribe to record
    // client.record.getRecord("container-info").whenReady((rec) => {
    //     rec.subscribe("message", (msg) => {
    //         console.log(msg);
    //     });
    // });
});