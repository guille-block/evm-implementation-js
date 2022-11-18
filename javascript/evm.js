const { BN } = require("bn.js");

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
    console.log(twos, stack[1], lenStack1Bytes)
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
function evm(code) {
  let pc = 0;
  let stack = [];
  let succesType = true
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
        numbToAdd =  numbToAdd.toString(16) + (code[pc].toString(16) == 0 ? "00" : code[pc].toString(16))
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
    }
  }
  
  return { success: succesType, stack };
}

function tests() {
  const tests = require("../evm.json");

  const hexStringToUint8Array = (hexString) =>
    new Uint8Array(hexString.match(/../g).map((byte) => parseInt(byte, 16)));

  const total = Object.keys(tests).length;
  let passed = 0;

  try {
    for (const t of tests) {
      console.log("Test #" + (passed + 1), t.name);
      try {
        // Note: as the test cases get more complex, you'll need to modify this
        // to pass down more arguments to the evm function
        const result = evm(hexStringToUint8Array(t.code.bin));

        if (result.success !== t.expect.success) {
          throw new Error(
            `Expected success=${t.expect.success}, got success=${result.success}`
          );
        }

        const expectedStackHex = t.expect.stack;
        const actualStackHex = result.stack.map((v) => "0x" + v.toString(16));

        if (expectedStackHex.join(",") !== actualStackHex.join(",")) {
          console.log("expected stack:", expectedStackHex);
          console.log("  actual stack:", actualStackHex);
          throw new Error("Stack mismatch");
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
