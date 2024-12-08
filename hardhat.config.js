require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const SEPOLIA_URL = process.env.SEPOLIA_URL;

module.exports = {
  solidity: "0.8.24",
  networks:{
    sepolia:{
      url: SEPOLIA_URL, //https://sepolia.infura.io/v3/9bec5d2c6267479fab0d8074cdd45974
      accounts:[PRIVATE_KEY],
    },
  },
};


// sepolia contract addr: 0x48865604dA943a71CDAC288440243365Ce2dbe37