if (!Array.prototype.toReversed) {
  Object.defineProperty(Array.prototype, "toReversed", {
    value: function toReversed() {
      return this.slice().reverse();
    },
    enumerable: false,
  });
}

const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
