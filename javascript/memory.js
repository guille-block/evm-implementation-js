const { BN } = require("bn.js");
const keccak256 = require("keccak256");

class Memory {
    constructor() {
      this.data = new Uint8Array(1024 * 1024);
      this.memorySize = 0
    }
    
    msize() {
      return this.memorySize
    }

    lMsize(offset, bytes) {
      let byte = bytes == 1 ? 0 : 32
      let modulo = parseInt(offset) % 32
      let num  = parseInt(offset) + byte + (modulo != 0 ? 32 - modulo : modulo)
      return num
    }

    store(offset, valArray) {
      for (let i = 0; i < valArray.length; i++) {
        let valArrayi = valArray[i]
        this.data[parseInt(offset) + i] = valArrayi
      }
      let size = this.memorySize >= (parseInt(offset) + 32) ? this.memorySize : this.lMsize(offset, valArray.length)
      this.memorySize = size
    }

    load(offset) {
      let value = []
      for(let i = 0; i<32;i++) {
        value.push(this.data[offset+i])
      }
      let size = this.memorySize >= (parseInt(offset) + 32) ? this.memorySize : this.lMsize(offset, 32)
      this.memorySize = size
      return value;
    }

    sha3(offset, sizeBy) {
      let value = []
      let bytes = sizeBy
      for(let i = 0; i<bytes;i++) {
        value.push(this.data[offset+i])
      }
      let size = this.memorySize >= (parseInt(offset) + 32) ? this.memorySize : this.lMsize(offset, 32)
      this.memorySize = size
      let hash = keccak256(value)
      return hash;
    }

    loadWithSize(offset, sizeBytes) {
      let value = []
      for(let i = 0; i<parseInt(sizeBytes);i++) {
        value.push(this.data[parseInt(offset)+i])
      }
      let size = this.memorySize >= (parseInt(offset) + 32) ? this.memorySize : this.lMsize(offset, 32)
      this.memorySize = size
      return value;
    }
  }

module.exports = {
  Memory
}

