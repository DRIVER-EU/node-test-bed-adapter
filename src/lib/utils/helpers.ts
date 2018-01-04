export const clone = <T>(model: T) => { return JSON.parse(JSON.stringify(model)) as T; };
