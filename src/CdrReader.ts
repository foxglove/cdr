export class CdrReader {
  private array: Uint8Array;
  private view: DataView;
  private offset: number;
  private littleEndian: boolean;
  private textDecoder = new TextDecoder("utf8");

  get data(): Uint8Array {
    return this.array;
  }

  get decodedBytes(): number {
    return this.offset;
  }

  constructor(data: Uint8Array) {
    if (data.byteLength < 4) {
      throw new Error(
        `Invalid CDR data size ${data.byteLength}, must contain at least a 4-byte header`,
      );
    }
    this.array = data;
    this.view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    this.littleEndian = data[1] !== 0;
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
}
