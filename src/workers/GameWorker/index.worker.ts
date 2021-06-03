declare const self: Worker;
export default {} as typeof Worker & { new(): Worker };

(() => {
    self.onmessage = (ev) => {
        console.log('message from main thread: ', ev.data);
    };
    self.postMessage({
        type: 'inited',
        data: 'Im initialized'
    })
})();