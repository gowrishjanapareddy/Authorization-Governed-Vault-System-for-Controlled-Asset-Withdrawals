require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {}
      }
    ]
  },
  networks: {
    localhost: {
      url: "http://blockchain:8545"
    }
  }
};