import { EncapsulationKind } from "./encapsulationKind";
import { isBigEndian } from "./isBigEndian";

interface Indexable {
  [index: number]: unknown;
}

interface TypedArrayConstructor<T> {
  new (length?: number): T;
  new (buffer: ArrayBufferLike, byteOffset?: number, length?: number): T;
  BYTES_PER_ELEMENT: number;
}

type ArrayValueGetter =
  | "getInt8"
  | "getUint8"
  | "getInt16"
  | "getUint16"
  | "getInt32"
  | "getUint32"
  | "getBigInt64"
  | "getBigUint64"
  | "getFloat32"
  | "getFloat64";

export class CdrReader {
  private array: Uint8Array;
  private view: DataView;
  private offset: number;
  private littleEndian: boolean;
  private hostLittleEndian: boolean;
  private textDecoder = new TextDecoder("utf8");

  get kind(): EncapsulationKind {
    return this.array[1] as EncapsulationKind;
  }

  get data(): Uint8Array {
    return this.array;
  }

  get decodedBytes(): number {
    return this.offset;
  }

  constructor(data: Uint8Array) {
    this.hostLittleEndian = !isBigEndian();

    if (data.byteLength < 4) {
      throw new Error(
        `Invalid CDR data size ${data.byteLength}, must contain at least a 4-byte header`,
      );
    }
    this.array = data;
    this.view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const kind = this.kind;
    this.littleEndian = kind === EncapsulationKind.CDR_LE || kind === EncapsulationKind.PL_CDR_LE;
    this.offset = 4;
  }

  int8(): number {
    const value = this.view.getInt8(this.offset);
    this.offset += 1;
    return value;
  }

  uint8(): number {
    const value = this.view.getUint8(this.offset);
    this.offset += 1;
    return value;
  }

  int16(): number {
    this.align(2);
    const value = this.view.getInt16(this.offset, this.littleEndian);
    this.offset += 2;
    return value;
  }

  uint16(): number {
    this.align(2);
    const value = this.view.getUint16(this.offset, this.littleEndian);
    this.offset += 2;
    return value;
  }

  int32(): number {
    this.align(4);
    const value = this.view.getInt32(this.offset, this.littleEndian);
    this.offset += 4;
    return value;
  }

  uint32(): number {
    this.align(4);
    const value = this.view.getUint32(this.offset, this.littleEndian);
    this.offset += 4;
    return value;
  }

  int64(): bigint {
    this.align(8);
    const value = this.view.getBigInt64(this.offset, this.littleEndian);
    this.offset += 8;
    return value;
  }

  uint64(): bigint {
    this.align(8);
    const value = this.view.getBigUint64(this.offset, this.littleEndian);
    this.offset += 8;
    return value;
  }

  uint16BE(): number {
    this.align(2);
    const value = this.view.getUint16(this.offset, false);
    this.offset += 2;
    return value;
  }

  uint32BE(): number {
    this.align(4);
    const value = this.view.getUint32(this.offset, false);
    this.offset += 4;
    return value;
  }

  uint64BE(): bigint {
    this.align(8);
    const value = this.view.getBigUint64(this.offset, false);
    this.offset += 8;
    return value;
  }

  float32(): number {
    this.align(4);
    const value = this.view.getFloat32(this.offset, this.littleEndian);
    this.offset += 4;
    return value;
  }

  float64(): number {
    this.align(8);
    const value = this.view.getFloat64(this.offset, this.littleEndian);
    this.offset += 8;
    return value;
  }

  string(): string {
    const length = this.uint32();
    if (length <= 1) {
      this.offset += length;
      return "";
    }
    const data = new Uint8Array(this.array.buffer, this.array.byteOffset + this.offset, length - 1);
    const value = this.textDecoder.decode(data);
    this.offset += length;
    return value;
  }

  sequenceLength(): number {
    return this.uint32();
  }

  int8Array(count: number = this.sequenceLength()): Int8Array {
    const array = new Int8Array(this.data.buffer, this.data.byteOffset + this.offset, count);
    this.offset += count;
    return array;
  }

  uint8Array(count: number = this.sequenceLength()): Uint8Array {
    const array = new Uint8Array(this.data.buffer, this.data.byteOffset + this.offset, count);
    this.offset += count;
    return array;
  }

  int16Array(count: number = this.sequenceLength()): Int16Array {
    return this.typedArray(Int16Array, "getInt16", count);
  }

  uint16Array(count: number = this.sequenceLength()): Uint16Array {
    return this.typedArray(Uint16Array, "getUint16", count);
  }

  int32Array(count: number = this.sequenceLength()): Int32Array {
    return this.typedArray(Int32Array, "getInt32", count);
  }

  uint32Array(count: number = this.sequenceLength()): Uint32Array {
    return this.typedArray(Uint32Array, "getUint32", count);
  }

  int64Array(count: number = this.sequenceLength()): BigInt64Array {
    return this.typedArray(BigInt64Array, "getBigInt64", count);
  }

  uint64Array(count: number = this.sequenceLength()): BigUint64Array {
    return this.typedArray(BigUint64Array, "getBigUint64", count);
  }

  float32Array(count: number = this.sequenceLength()): Float32Array {
    return this.typedArray(Float32Array, "getFloat32", count);
  }

  float64Array(count: number = this.sequenceLength()): Float64Array {
    return this.typedArray(Float64Array, "getFloat64", count);
  }

  stringArray(count: number = this.sequenceLength()): string[] {
    const output: string[] = [];
    for (let i = 0; i < count; i++) {
      output.push(this.string());
    }
    return output;
  }

  /**
   * Seek the current read pointer a number of bytes relative to the current position. Note that
   * seeking before the four-byte header is invalid
   * @param relativeOffset A positive or negative number of bytes to seek
   */
  seek(relativeOffset: number): void {
    const newOffset = this.offset + relativeOffset;
    if (newOffset < 4 || newOffset >= this.data.byteLength) {
      throw new Error(`seek(${relativeOffset}) failed, ${newOffset} is outside the data range`);
    }
    this.offset = newOffset;
  }

  /**
   * Seek to an absolute byte position in the data. Note that seeking before the four-byte header is
   * invalid
   * @param offset An absolute byte offset in the range of [4-byteLength)
   */
  seekTo(offset: number): void {
    if (offset < 4 || offset >= this.data.byteLength) {
      throw new Error(`seekTo(${offset}) failed, value is outside the data range`);
    }
    this.offset = offset;
  }

  private align(size: number): void {
    const alignment = (this.offset - 4) % size;
    if (alignment > 0) {
      this.offset += size - alignment;
    }
  }

  // Reads a given count of numeric values into a typed array.
  private typedArray<T extends Indexable>(
    TypedArrayConstructor: TypedArrayConstructor<T>,
    getter: ArrayValueGetter,
    count: number,
  ) {
    this.align(TypedArrayConstructor.BYTES_PER_ELEMENT);
    const totalOffset = this.data.byteOffset + this.offset;
    if (this.littleEndian !== this.hostLittleEndian) {
      // Slowest path
      return this.typedArraySlow(TypedArrayConstructor, getter, count);
    } else if (totalOffset % TypedArrayConstructor.BYTES_PER_ELEMENT === 0) {
      // Fastest path
      const array = new TypedArrayConstructor(this.data.buffer, totalOffset, count);
      this.offset += TypedArrayConstructor.BYTES_PER_ELEMENT * count;
      return array;
    } else {
      // Slower path
      return this.typedArrayUnaligned(TypedArrayConstructor, getter, count);
    }
  }

  private typedArrayUnaligned<T extends Indexable>(
    TypedArrayConstructor: TypedArrayConstructor<T>,
    getter: ArrayValueGetter,
    count: number,
  ) {
    // Benchmarks indicate for count < ~10 doing each individually is faster than copy
    if (count < 10) {
      return this.typedArraySlow(TypedArrayConstructor, getter, count);
    }

    // If the length is > 10, then doing a copy of the data to align it is faster
    // using _set_ is slightly faster than slice on the array buffer according to today's benchmarks
    const byteLength = TypedArrayConstructor.BYTES_PER_ELEMENT * count;
    const copy = new Uint8Array(byteLength);
    copy.set(new Uint8Array(this.view.buffer, this.view.byteOffset + this.offset, byteLength));
    this.offset += byteLength;
    return new TypedArrayConstructor(copy.buffer, copy.byteOffset, count);
  }

  private typedArraySlow<T extends Indexable>(
    TypedArrayConstructor: TypedArrayConstructor<T>,
    getter: ArrayValueGetter,
    count: number,
  ) {
    const array = new TypedArrayConstructor(count);
    let offset = this.offset;
    for (let i = 0; i < count; i++) {
      array[i] = this.view[getter](offset, this.littleEndian);
      offset += TypedArrayConstructor.BYTES_PER_ELEMENT;
    }
    this.offset = offset;
    return array;
  }
}
