export type LengthCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export const lengthCodeToObjectSizes = {
  0: 1,
  1: 2,
  2: 4,
  3: 8,
};
const maxSize = 0xffffffff;

export function getLengthCodeForObjectSize(objectSize: number): LengthCode {
  let defaultLengthCode: LengthCode | undefined;

  switch (objectSize) {
    case 1:
      defaultLengthCode = 0;
      break;
    case 2:
      defaultLengthCode = 1;
      break;
    case 4:
      defaultLengthCode = 2;
      break;
    case 8:
      defaultLengthCode = 3;
      break;
  }

  if (defaultLengthCode == undefined) {
    // Not currently supporting writing of lengthCodes > 4
    if (objectSize > maxSize) {
      throw Error(
        `Object size ${objectSize} for EMHEADER too large without specifying length code. Max size is ${maxSize}`,
      );
    }
    defaultLengthCode = 4;
  }
  return defaultLengthCode;
}
