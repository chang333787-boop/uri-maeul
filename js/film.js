export function createFilm() { return { play: () => Promise.resolve('skip'), stop() {}, get on() { return false; }, sfx: {} }; }
