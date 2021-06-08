import GameInstance from "./GameInstance";

declare const self: Worker;
export default {} as typeof Worker & { new(): Worker };

(() => {
    const instance = new GameInstance();
    self.onmessage = async (ev) => {
        const { type, id, data } = ev.data;
        if (type === 'new-game') {
            const result = await instance.newGame(data);
            self.postMessage({ id, type: 'new-game-complete', data: result });
        }
    };
    instance.workersPoweredOn.then(() => {
        self.postMessage({
            type: 'inited',
            data: 'Im initialized'
        });
    });
})();