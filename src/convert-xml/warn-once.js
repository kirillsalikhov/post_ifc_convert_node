const keys = new Set();

function warnOnce(key, ...rest) {
    if (keys.has(key)) return;
    keys.add(key);
    console.warn(...rest);
}

module.exports = { warnOnce };
