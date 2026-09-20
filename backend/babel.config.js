// Sert uniquement à Jest, pour transformer les .ts requis par les tests
// (le build de prod passe toujours par tsc, voir package.json "build").
module.exports = {
  presets: [["@babel/preset-env", { targets: { node: "current" } }], "@babel/preset-typescript"],
};
