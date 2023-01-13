const { BN } = require("bn.js");
const { Memory } = require("./memory");
const keccak256 = require("keccak256");

/**
 * EVM From Scratch
 * JavaScript template
 *
 * To work on EVM From Scratch in JavaScript:
 *
 * - Install Node.js: https://nodejs.org/en/download/
 * - Edit `javascript/evm.js` (this file!), see TODO below
 * - Run `node javascript/evm.js` to run the tests
 *
 * If you prefer TypeScript, there's a sample TypeScript template in the `typescript` directory.
 */
const MAX_VALUE = new BN("ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", 16)
const MIN_VALUE = new BN(0, 16)
const ONE = new BN(1, 16)

/////////////////////////////////////////// HELPERS /////////////////////////////////////////////////////////
const evmAdd = (stack, wrapper = true) => {
    let numbToAdd = stack[0].add(stack[1])

    if(numbToAdd.gt(MAX_VALUE) && wrapper) {
      numbToAdd = numbToAdd.maskn(256)
    } 

    return numbToAdd
}

const evmMod = (stack, addmod = null) => {
    if(addmod) {
      let numMod = addmod.lt(stack[2]) ? addmod: (stack[2].toString() === MIN_VALUE.toString() ? MIN_VALUE.toString() : addmod.mod(stack[2]) )
      return numMod
    } else {
      let numMod = stack[0].lt(stack[1]) ? stack[0] : (stack[1].toString() === MIN_VALUE.toString() ? MIN_VALUE.toString() : stack[0].mod(stack[1]) )
      return numMod
    }
}

const evmMul = (stack, wrapper = true) => {
  
  let numbToAdd = stack[0].mul(stack[1])

  if(numbToAdd.gt(MAX_VALUE) && wrapper) {
    numbToAdd = numbToAdd.maskn(256)
  } 

  return numbToAdd
}

const evmExp = (stack, wrapper = true) => {
  
  let numbToAdd = stack[0].pow(stack[1])

  if(numbToAdd.gt(MAX_VALUE) && wrapper) {
    numbToAdd = numbToAdd.maskn(256)
  } 

  return numbToAdd
}

const evmSignExt = (stack) => {
    const lenStack1Bytes = stack[1].byteLength()
    const twos = stack[1].fromTwos(lenStack1Bytes*8)
    const sign = twos.isNeg()
    let numbToAdd
    if(sign) {
      let Bytes32 = new BN(32, 16)
      let len = Bytes32.sub(stack[0].add(ONE))
      let xorVal = new BN(`${"f".repeat(len*2)}${'0'.repeat(stack[0].add(ONE)*2)}`, 16)
      numbToAdd = xorVal.xor(stack[1])
    } else {
      numbToAdd = stack[1]
    }
    return numbToAdd
}

const evmSdiv = (stack) => {
  const lenStack0Bytes = stack[0].byteLength()
  const lenStack1Bytes = stack[1].byteLength()
  const numerator = stack[0] == 0 ? 0 : stack[0].fromTwos(lenStack0Bytes*8)
  const denominator = stack[1] == 0 ? 0 : stack[1].fromTwos(lenStack1Bytes*8)
  let numbToAdd = stack[1] == 0 ? MIN_VALUE : numerator.div(denominator)
  let sdivTwo = numbToAdd.toTwos(256)
  return sdivTwo
}

const evmSmod = (stack) => {
  const lenStack0Bytes = stack[0].byteLength()
  const lenStack1Bytes = stack[1].byteLength()
  const numerator = stack[0] == 0 ? 0 : stack[0].fromTwos(lenStack0Bytes*8)
  const denominator = stack[1] == 0 ? 0 : stack[1].fromTwos(lenStack1Bytes*8)
  let numbToAdd = stack[1] == 0 ? MIN_VALUE : numerator.mod(denominator)
  let sTwo = numbToAdd.toTwos(256)
  return sTwo
}

const evmSlgt = (stack, operation) => {
  const lenStack0Bytes = stack[0].byteLength()
  const lenStack1Bytes = stack[1].byteLength()
  const numerator = stack[0] == 0 ? MIN_VALUE : stack[0].fromTwos(lenStack0Bytes*8)
  const denominator = stack[1] == 0 ? MIN_VALUE : stack[1].fromTwos(lenStack1Bytes*8)
  let numbToAdd

  if(operation == "lt") {
    numbToAdd = numerator.lt(denominator) ? ONE : MIN_VALUE
  } else if (operation == "gt") {
    numbToAdd = numerator.gt(denominator) ? ONE : MIN_VALUE
  }
  
  let sTwo = numbToAdd.toTwos(256)
  return sTwo
}
/////////////////////////////////////////// HELPERS /////////////////////////////////////////////////////////
let flagBlock = 0
function evm(code, tx, block, state) {
  let pc = 0;
  let stack = [];
  let logs = []
  let memory = new Memory()
  let succesType = true
  let returnData = []
  
  while (pc < code.length) {
    const opcode = code[pc];
    pc++;
    const hexOpcode = `0x${opcode.toString(16).padStart(2, '0')}`
    // TODO: implement the EVM here!
    if(hexOpcode == "0x00") {
      return { success: true, stack }
    } else if (opcode >= 96 && opcode <= 127) {
      let iterations = opcode - 96
      let numbToAdd = ''
      for(let i = 0; i <= iterations; i++) {
        numbToAdd =  numbToAdd.toString(16) + (code[pc].toString(16) == 0 ? "00" : code[pc].toString(16).padStart(2,"0"))
        pc++
      }
      numbToAdd = new BN(numbToAdd, 16)
      stack.unshift(numbToAdd)
    } else if (hexOpcode == '0x50') {
      stack.shift()
    } else if (opcode == '0x01') {
      
      let res = evmAdd(stack)
      stack.shift()
      stack.shift()
      stack.unshift(res)
    } else if (opcode == '0x02') {
      let numbToAdd = evmMul(stack)

      stack.shift()
      stack.shift()
      stack.unshift(numbToAdd)
    } else if (opcode == '0x03') {

      let numbToAdd = stack[0].sub(stack[1])
      if(numbToAdd.lte(MIN_VALUE)) {
        numbToAdd = MAX_VALUE.add(numbToAdd).add(ONE)
      } 

      stack.shift()
      stack.shift()
      stack.unshift(numbToAdd)
    } else if (opcode == '0x04') {
      let numbToAdd = stack[1].toString() === MIN_VALUE.toString() ? MIN_VALUE : stack[0].div(stack[1])

      stack.shift()
      stack.shift()
      stack.unshift(numbToAdd)
    } else if (opcode == '0x06') {
      let numbToAdd = evmMod(stack)
      
      stack.shift()
      stack.shift()
      stack.unshift(numbToAdd)
    } else if (opcode == '0x08') {
      let res = evmAdd(stack, false)
      let numbToAdd = evmMod(stack, res)
      stack.shift()
      stack.shift()
      stack.shift()
      stack.unshift(numbToAdd)
    } else if (opcode == '0x09') {
      let res = evmMul(stack, false)
      let numbToAdd = evmMod(stack, res)
      stack.shift()
      stack.shift()
      stack.shift()
      stack.unshift(numbToAdd)
    } else if (opcode == '0x0a') {
      let numbToAdd = evmExp(stack)
      stack.shift()
      stack.shift()
      stack.unshift(numbToAdd)
    } else if (opcode == '0x0b') {
      const numbToAdd = evmSignExt(stack)
      stack.shift()
      stack.shift()
      stack.unshift(numbToAdd)
    } else if (opcode == '0x05') {
      let numbToAdd = evmSdiv(stack)
      stack.shift()
      stack.shift()
      stack.unshift(numbToAdd)
    } else if (opcode == '0x07') {
      let numbToAdd = evmSmod(stack)
      stack.shift()
      stack.shift()
      stack.unshift(numbToAdd)
    } else if (opcode == '0x10') {
      let numbToAdd = stack[0].lt(stack[1]) ? ONE : MIN_VALUE
      stack.shift()
      stack.shift()
      stack.unshift(numbToAdd)
    } else if (opcode == '0x11') {
      let numbToAdd = stack[0].gt(stack[1]) ? ONE : MIN_VALUE
      stack.shift()
      stack.shift()
      stack.unshift(numbToAdd)
    } else if (opcode == '0x12') {
      let numbToAdd = evmSlgt(stack, "lt")
      stack.shift()
      stack.shift()
      stack.unshift(numbToAdd)
    } else if (opcode == '0x13') {
      let numbToAdd = evmSlgt(stack, "gt")
      stack.shift()
      stack.shift()
      stack.unshift(numbToAdd)
    } else if (opcode == '0x14') {
      let numbToAdd = stack[0].eq(stack[1]) ? ONE : MIN_VALUE
      stack.shift()
      stack.shift()
      stack.unshift(numbToAdd)
    } else if (opcode == '0x15') {
      let numbToAdd = stack[0].isZero() ? ONE : MIN_VALUE
      stack.shift()
      stack.shift()
      stack.unshift(numbToAdd)
    } else if (opcode == '0x16') {
      let numbToAdd = stack[0].and(stack[1]) 
      stack.shift()
      stack.shift()
      stack.unshift(numbToAdd)
    } else if (opcode == '0x17') {
      let numbToAdd = stack[0].or(stack[1]) 
      stack.shift()
      stack.shift()
      stack.unshift(numbToAdd)
    } else if (opcode == '0x18') {
      let numbToAdd = stack[0].xor(stack[1]) 
      stack.shift()
      stack.shift()
      stack.unshift(numbToAdd)
    } else if (opcode == '0x19') {
      let numbToAdd = stack[0].notn(256) 
      stack.shift()
      stack.shift()
      stack.unshift(numbToAdd)
    } else if (opcode == '0x1b') {
      let numbToAdd
      if(stack[1].gt(stack[0]) | stack[1].eq(stack[0])) {
        let shiftedVal = stack[1].shln(stack[0].toNumber()) 
         let valToMask = new BN('0'.repeat(stack[1].bitLength()/4).padStart(shiftedVal.bitLength()/4, "f"), 16)
         numbToAdd = valToMask.xor(shiftedVal)
         numbToAdd = numbToAdd.byteLength() > 32 ? MIN_VALUE : numbToAdd
      } else {
        numbToAdd = MIN_VALUE
      }
      stack.shift()
      stack.shift()
      stack.unshift(numbToAdd)
    } else if (opcode == '0x1c' | opcode == '0x1d') {
      if(opcode == '0x1d') {
        let numbToAdd
        if(stack[1].gt(stack[0]) | stack[1].eq(stack[0])) {
          const stack1Twos = stack[1] == 0 ? 0 : stack[1].fromTwos(stack[1].byteLength()*8)
          let shiftedVal = stack[1].shrn(stack[0].toNumber()) 
          let numi = stack1Twos.isNeg() 
            ? '0'.repeat(shiftedVal.bitLength()/4).padStart(stack[1].bitLength()/4, "f")
            : '0'.repeat(stack[1].bitLength()/4).padStart(shiftedVal.bitLength()/4, "f")
          let valToMask = new BN(numi, 16)
          numbToAdd = valToMask.xor(shiftedVal)
          numbToAdd = numbToAdd.byteLength() > 32 ? MIN_VALUE : numbToAdd
        } else {
          numbToAdd = MIN_VALUE
        }
        stack.shift()
        stack.shift()
        stack.unshift(numbToAdd)
      } else {
        let numbToAdd
        if(stack[1].gt(stack[0]) | stack[1].eq(stack[0])) {
          let shiftedVal = stack[1].shrn(stack[0].toNumber()) 
           let valToMask = new BN('0'.repeat(stack[1].bitLength()/4).padStart(shiftedVal.bitLength()/4, "f"), 16)
           numbToAdd = valToMask.xor(shiftedVal)
           numbToAdd = numbToAdd.byteLength() > 32 ? MIN_VALUE : numbToAdd
        } else {
          numbToAdd = MIN_VALUE
        }
        stack.shift()
        stack.shift()
        stack.unshift(numbToAdd)
      } 
      
    } else if (opcode == '0x1a') {
      let byteArrayRep = stack[1].toArray("lt", 32)
      const byteIndexed = byteArrayRep[stack[0].toNumber()]
      const byteNumber = new BN(byteIndexed,16)
      stack.shift()
      stack.shift()
      stack.unshift(byteNumber)
    } else if (opcode >= 128 && opcode <=143) {
      const dupType = opcode - 128
      dupStack = stack[dupType]
      stack.unshift(dupStack)
    } else if (opcode >= 144 && opcode <=159) {
      const swapType = (opcode - 144) + 1
      swapStack = stack[swapType]
      stack[swapType] = stack[0]
      stack.shift()
      stack.unshift(swapStack)
    } else if (opcode == "0xfe") {
      succesType = false
    } else if (opcode == "0x58") {
      stack.unshift(pc-1)
    } else if (opcode == "0x5a") {
      stack.unshift(MAX_VALUE)
    } else if (opcode == "0x56" || opcode == "0x57") {
      if(opcode == "0x57" && stack[1].eq(MIN_VALUE)) {
        stack.shift()
        stack.shift()
      } else {
        pc = stack[0]
        if(code[pc] != 91 || code[pc-1] == "0x60") {
          return { success: false, stack: [] }
        } 
        if(opcode == "0x57") {
          stack.shift()
          stack.shift()
        } else {
          stack.shift()
        }
      }
    } else if (opcode == "0x51") {
      let offset = stack[0]
      let word = memory.load(offset.toNumber())
      let wordNum = new BN(word,16)
      stack.shift()
      stack.unshift(wordNum)
    } else if (opcode == "0x52") {
      let offset = stack[0]
      let word = stack[1].toArray("be", 32)
      
      memory.store(offset, word)
      stack.shift()
      stack.shift()
    } else if (opcode == "0x53") {
      let offset = stack[0]
      let word = stack[1].toArray("be", 1)
      
      memory.store(offset, word)
      stack.shift()
      stack.shift()
    } else if (opcode == "0x59") {
      let size = memory.msize()
      stack.unshift(size)
    } else if (opcode == "0x20") {
      let hash = memory.sha3(parseInt(stack[0].toNumber()), parseInt(stack[1].toNumber()))
      let hashBytes = new BN(hash,16)
      stack.shift()
      stack.shift()
      stack.unshift(hashBytes)
    } else if (opcode == "0x20") {
      stack.unshift(hashBytes)
    } else if (opcode == "0x30") {
      let address = tx.to
      let word = new BN(address.split("0x")[1], 16, "be")
      stack.unshift(word)
    } else if (opcode == "0x33") {
      let sender = tx.from
      let word = new BN(sender.split("0x")[1], 16, "be")
      stack.unshift(word)
    } else if (opcode == "0x32") {
      let origin = tx.origin
      let word = new BN(origin.split("0x")[1], 16, "be")
      stack.unshift(word)
    } else if (opcode == "0x3a") {
      let gasPrice = tx.gasprice
      let word = new BN(parseInt(gasPrice), 16, "be")
      stack.unshift(word)
    } else if (opcode == "0x48") {
      let baseFee = block.basefee
      let word = new BN(parseInt(baseFee), 16, "be")
      stack.unshift(word)
    } else if (opcode == "0x41") {
      let beneficiary = block.coinbase
      let word = new BN(parseInt(beneficiary), 16, "be")
      stack.unshift(word)
    } else if (opcode == "0x42") {
      let timestamp = block.timestamp
      let word = new BN(timestamp.split("0x")[1], 16, "be")
      stack.unshift(word)
    } else if (opcode == "0x43") {
      let number = block.number
      let word = new BN(number.split("0x")[1], 16, "be")
      stack.unshift(word)
    } else if (opcode == "0x44") {
      let difficulty = block.difficulty
      let word = new BN(difficulty.split("0x")[1], 16, "be")
      stack.unshift(word)
    } else if (opcode == "0x45") {
      let gasLimit = block.gaslimit
      let word = new BN(gasLimit.split("0x")[1], 16, "be")
      stack.unshift(word)
    } else if (opcode == "0x46") {
      let chainId = block.chainid
      let word = new BN(chainId.split("0x")[1], 16, "be")
      stack.unshift(word)
    } else if (opcode == "0x40") {
    } else if (opcode == "0x31") {
      let balance
      try {
        balance = parseInt(state[`0x${stack[0].toBuffer().toString("hex")}`].balance)
      } catch {
        balance = 0
      }
      let balanceOfAddress = new BN(balance, 16)
      stack.shift()
      stack.unshift(balanceOfAddress)
    } else if (opcode == "0x34") {
      let value = tx.value
      let word = new BN(value.split("0x")[1], 16, "be")
      stack.unshift(word)
    } else if (opcode == "0x35") {
      let data = new Buffer.from(tx.data, "hex")
      let offset = parseInt(stack[0])
      stack.shift()
      let value = []
      for(let i = 0; i<32; i++) {
        value.push(data[offset+i])
      }
      let word = new BN(value, 16, "be")
      stack.unshift(word)
    } else if (opcode == "0x36") {
      let data
      try {
        data = new Buffer.from(tx.data, "hex")
      } catch {
        data = []
      }

      const dataLenght = new BN(data.length, 16)
      stack.unshift(dataLenght)
    } else if (opcode == "0x37") {
      let memOffset = stack[0]
      let offSet = stack[1]
      let size = stack[2]
      let data = new Buffer.from(tx.data, "hex")
      let value = []
      for(let i = 0; i<parseInt(size); i++) {
        let val = data[parseInt(offSet)+i]
        value.push(val)
      }
      
      stack.shift()
      stack.shift()
      stack.shift()
      memory.store(memOffset, value)
    } else if (opcode == "0x38") {
      let codeLength = new BN(code.length, 16)
      stack.unshift(codeLength)
    } else if (opcode == "0x39") {
      let memOffset = stack[0]
      let offSet = stack[1]
      let size = stack[2]
      let data = new Buffer.from(code)
      let value = []
      for(let i = 0; i<parseInt(size); i++) {
        let val = data[parseInt(offSet)+i]
        value.push(val)
      }
      
      stack.shift()
      stack.shift()
      stack.shift()
      memory.store(memOffset, value)
    } else if (opcode == "0x3b") {
      let address = stack[0]
      stack.shift()
      let bytecode
      try { 
        bytecode = new Buffer.from(state[`0x${address.toBuffer().toString("hex")}`].code.bin, "hex")
      } catch {
        bytecode = []
      }
      stack.unshift(bytecode.length)
    } else if (opcode == "0x3c") {
      let address = stack[0]
      let destOffset = stack[1]
      let offSet = stack[2]
      let size = stack[3]
      stack.shift()
      stack.shift()
      stack.shift()
      stack.shift()
      let bytecode
      try { 
        bytecode = new Buffer.from(state[`0x${address.toBuffer().toString("hex")}`].code.bin, "hex")
      } catch (e){
        bytecode = []
      }
      let bytecodeSize = []
      for(let i = 0; i<parseInt(size); i++) {
        bytecodeSize.push(bytecode[parseInt(offSet) + i])
      }
      memory.store(destOffset, bytecodeSize)
    } else if (opcode == "0x3f") {
      let address = stack[0]
      stack.shift()
      let bytecode
      let hash
      try { 
        bytecode = new Buffer.from(state[`0x${address.toBuffer().toString("hex")}`].code.bin, "hex")
        hash = bytecode.length > 0 ? keccak256(bytecode) : new Buffer.from("0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470", "hex")
      } catch {
        bytecode = []
        hash = MIN_VALUE
      }
      let hashNum = new BN(hash)
      stack.unshift(hashNum)
    } else if(opcode == "0x47") {
      let address = tx.to
      let balance = parseInt(state[address].balance)
      let balanceBn = new BN(balance)
      stack.unshift(balanceBn)
    } else if(opcode == "0x55") {
      if(flagBlock == 1) {
        succesType = false
        return { success: succesType, stack , logs, return: returnData };
      } else {
        let address
        try {
          address = tx.to
        } catch {
          address = "0x1e79b045dc29eae9fdc69673c9dcd7c53e5e159d"
        }

        let accountState
        if(!state) {
            state = {}
            state[address] = {storage: {}}
        } else {
          try {
            accountState = state[address]
            if(!state[address].storage) state[address].storage = {}
          } catch {
            state[address] = {storage: {}}
          }
        }

        let sloat = `0x${(stack[0].toBuffer().toString("hex")).padStart(64, "0")}`
        let word = `0x${(stack[1].toBuffer().toString("hex")).padStart(64, "0")}`
        stack.shift()
        stack.shift()
        state[address].storage[sloat] = word
      }
    } else if(opcode == "0x54") {
      let address
      try {
        address = tx.to
      } catch {
        address = "0x1e79b045dc29eae9fdc69673c9dcd7c53e5e159d"
      }
      let sloat = `0x${(stack[0].toBuffer().toString("hex")).padStart(64, "0")}`

      let word 
      try {
        word = (state[address].storage[sloat]).split("0x")[1]
      } catch {
        word = "0"
      }
      
      let bufferWord = new Buffer.from(word, "hex")
      let wordBN = new BN(bufferWord, 16)
      stack.shift()
      stack.unshift(wordBN)
    } else if (opcode == "0xa0") {
      let offSet = stack[0]
      let size = stack[1]
      let topics = []

      const data = memory.loadWithSize(offSet, size)
      const hexData = (new Buffer.from(data, 16)).toString("hex")
      
      logs.push({
        address: tx.to,
        data: hexData,
        topics
      })
    } else if (opcode == "0xa1") {
      let offSet = stack[0]
      let size = stack[1]
      let topics = [stack[2]]
      
      const data = memory.loadWithSize(offSet, size)
      const hexData = (new Buffer.from(data, 16)).toString("hex")
      
      logs.push({
        address: tx.to,
        data: hexData,
        topics
      })
    } else if (opcode == "0xa2") {
      let offSet = stack[0]
      let size = stack[1]
      let topics = [stack[2], stack[3]]

      const data = memory.loadWithSize(offSet, size)
      const hexData = (new Buffer.from(data, 16)).toString("hex")
      
      logs.push({
        address: tx.to,
        data: hexData,
        topics
      })
    } else if (opcode == "0xa3") {
      let offSet = stack[0]
      let size = stack[1]
      let topics = [stack[2], stack[3], stack[4]]

      const data = memory.loadWithSize(offSet, size)
      const hexData = (new Buffer.from(data, 16)).toString("hex")
      
      logs.push({
        address: tx.to,
        data: hexData,
        topics
      })
    } else if (opcode == "0xa4") {
      let offSet = stack[0]
      let size = stack[1]
      let topics = [stack[2], stack[3], stack[4], stack[5]]

      const data = memory.loadWithSize(offSet, size)
      const hexData = (new Buffer.from(data, 16)).toString("hex")
      
      logs.push({
        address: tx.to,
        data: hexData,
        topics
      })
    } else if (opcode == "0xf3") {
      let offSet = stack[0]
      let size = stack[1]
      const data = memory.loadWithSize(offSet, size)
      const hexData = (new Buffer.from(data, 16)).toString("hex")
      returnData.push(hexData)
    }
    else if (opcode == "0xfd") {
      let offSet = stack[0]
      let size = stack[1]
      const data = memory.loadWithSize(offSet, size)
      const hexData = (new Buffer.from(data, 16)).toString("hex")
      returnData.push(hexData)
      succesType = false
    } else if (opcode == "0xf1" || opcode == "0xf4" || opcode == "0xfa") {

      let gas
      let address
      let value
      let argOffSet
      let argsSize
      let retOffSet
      let retSize
      if(opcode == "0xfa") {
        gas = stack[0]
        address = stack[1]
        argOffSet = stack[2]
        argsSize = stack[3]
        retOffSet = stack[4]
        retSize = stack[5]
        stack.shift()
        stack.shift()
        stack.shift()
        stack.shift()
        stack.shift()
        stack.shift()
        flagBlock = 1
      } else {
        gas = stack[0]
        address = stack[1]
        value = stack[2]
        argOffSet = stack[3]
        argsSize = stack[4]
        retOffSet = stack[5]
        retSize = stack[6]
        stack.shift()
        stack.shift()
        stack.shift()
        stack.shift()
        stack.shift()
        stack.shift()
        stack.shift()
      }
      
      let accounState = state[`0x${address.toBuffer().toString("hex")}`]
      
      let from
      let callData = memory.loadWithSize(argOffSet, argsSize)
      try{
        if(opcode == "0xf4") {
          from = tx.from
        } else {
          from = tx.to
        }
      } catch{
        from = "0x0"
      }
      let to
      try{
        if(opcode == "0xf4") {
          to = tx.to
        } else {
          to = `0x${address.toBuffer().toString("hex")}`
        }
      } catch{
        to = "0x0"
      }
      
      const data = new Buffer.from(callData, 16)
      
      
      const result = evm(hexStringToUint8Array(accounState.code.bin), {from, to , data}, block, state);
      result.success ? stack.unshift(ONE) : stack.unshift(MIN_VALUE) 
      returnData = result.return[0] ? result.return[0] : "0x0"
      memory.store(parseInt(retOffSet), new Buffer.from(returnData, "hex"))
    } else if (opcode == "0x3d") {
      stack.unshift(returnData.length/2)
    } else if (opcode == "0x3e") {
      let destOffSet = stack[0]
      let offSet = stack[1]
      let size = stack[2]
      let hexArray = new Buffer.from(returnData, "hex")
      let value = []
      for(let i = 0; i<parseInt(size);i++) {
        value.push(hexArray[parseInt(offSet) + i])
      }
      memory.store(parseInt(destOffSet), new Buffer.from(value, "hex"))
      stack.shift()
      stack.shift()
      stack.shift()
    } else if (opcode == "0xf0") {
      let address = `0x${keccak256(tx.to).toString("hex").substring(24, 64)}`
      let balance = stack[0]
      let argOffSet = stack[1]
      let argSize = stack[2]
      const newCode = memory.loadWithSize(argOffSet, argSize)
      balance = `0x${balance.toBuffer().toString("hex")}`
      if(!state) state = {}
      const result = evm(newCode, {from: tx.to, to: address, data:[]}, block, state);
      stack.shift()
      stack.shift()
      stack.shift()
      if(result.success) {
        let addressBN = new BN(address.split("0x")[1], 16)
        stack.unshift(addressBN)
        state[address] = {balance, code: {bin:`${result.return}`}, storage: {}}
      } else {
        stack.unshift(MIN_VALUE)
      }
    } else if (opcode == "0xff") {
      const address = `0x${stack[0].toString("hex")}`
      const balanceOld = state[tx.to].balance
      let balanceTo
      try {
        balanceTo = state[address].balance
      } catch {
        state[address] = {balance: 0}
        balanceTo = 0
      }
      
      const newBalance = parseInt(balanceOld) + parseInt(balanceTo)
      const newBalnceBN = `0x${newBalance.toString(16).padStart(2, "0")}`
      state[address].balance = newBalnceBN
      state[tx.to] = {}
      stack.shift()
    }
  }
  
  return { success: succesType, stack , logs, return: returnData };
}


const hexStringToUint8Array = (hexString) =>
    new Uint8Array(hexString.match(/../g).map((byte) => parseInt(byte, 16)));

function tests() {
  const tests = require("../evm.json");

  
  const total = Object.keys(tests).length;
  let passed = 0;

  try {
    for (const t of tests) {
      console.log("Test #" + (passed + 1), t.name);
      try {
        // Note: as the test cases get more complex, you'll need to modify this
        // to pass down more arguments to the evm function
        const result = evm(hexStringToUint8Array(t.code.bin), t.tx, t.block, t.state);
        
        if (result.success !== t.expect.success) {
          throw new Error(
            `Expected success=${t.expect.success}, got success=${result.success}`
          );
        }

        if (t.expect.return && result.return[0] !== t.expect.return) {
          throw new Error(
            `Expected return=${t.expect.return}, got return=${result.return}`
          );
        }

        const expectedStackHex = t.expect.stack;
        const actualStackHex = result.stack.map((v) => "0x" + v.toString(16));

        if (expectedStackHex && expectedStackHex.join(",") !== actualStackHex.join(",")) {
          console.log("expected stack:", expectedStackHex);
          console.log("  actual stack:", actualStackHex);
          throw new Error("Stack mismatch");
        }

        const expectedLogs = t.expect.logs;
        
        if(expectedLogs) {
          const actualLogs = result.logs

          if (keccak256(actualLogs).toString("hex") !== keccak256(expectedLogs).toString("hex")) {
            throw new Error("Logs mismatch");
          }
        }
      } catch (e) {
        console.log(`\n\nCode of the failing test (${t.name}):\n`);
        console.log(t.code.asm.replaceAll(/^/gm, "  "));
        console.log(`\n\nHint: ${t.hint}\n`);
        console.log("\n");
        throw e;
      }
      passed++;
    }
  } finally {
    console.log(`Progress: ${passed}/${total}`);
  }
}

tests();
