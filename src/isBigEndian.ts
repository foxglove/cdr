const endianTestArray = new Uint8Array(4);
const endianTestView = new Uint32Array(endianTestArray.buffer);
endianTestView[0] = 1;

/**
 * Test if the current running system is Big Endian architecture or Little Endian.
 * @returns true on Big Endian architecture systems
 */
export function isBigEndian(): boolean {
  return endianTestArray[3] === 1;
}
