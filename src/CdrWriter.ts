import { EncapsulationKind } from "./encapsulationKind";
import { isBigEndian } from "./isBigEndian";

export type CdrWriterOpts = {
  buffer?: ArrayBuffer;
  size?: number;
  kind?: EncapsulationKind;
};

export class CdrWriter {
  static DEFAULT_CAPACITY = 16;
  static BUFFER_COPY_THRESHOLD = 10;

  private littleEndian: boolean;
  private hostLittleEndian: boolean;
  private buffer: ArrayBuffer;
  private array: Uint8Array;
  private view: DataView;
  private textEncoder = new TextEncoder();
  private offset: number;

  get data(): Uint8Array {
    return new Uint8Array(this.buffer, 0, this.offset);
  }

  get size(): number {
    return this.offset;
  }

  constructor(options: CdrWriterOpts = {}) {
    if (options.buffer != undefined) {
      this.buffer = options.buffer;
    } else if (options.size != undefined) {
      this.buffer = new ArrayBuffer(options.size);
    } else {
      this.buffer = new ArrayBuffer(CdrWriter.DEFAULT_CAPACITY);
    }

    const kind = options.kind ?? EncapsulationKind.CDR_LE;
    this.littleEndian = kind === EncapsulationKind.CDR_LE || kind === EncapsulationKind.PL_CDR_LE;
    this.hostLittleEndian = !isBigEndian();
    this.array = new Uint8Array(this.buffer);
    this.view = new DataView(this.buffer);

    // Write the Representation Id and Offset fields
    this.resizeIfNeeded(4);
    this.view.setUint8(0, 0); // Upper bits of EncapsulationKind, unused
    this.view.setUint8(1, kind);
    // The RTPS specification does not define any settings for the 2 byte
    // options field and further states that a receiver should not interpret it
    // when it reads the options field
    this.view.setUint16(2, 0, false);
    this.offset = 4;
  }

  int8(value: number): CdrWriter {
    this.resizeIfNeeded(1);
    this.view.setInt8(this.offset, value);
    this.offset += 1;
    return this;
  }

  uint8(value: number): CdrWriter {
    this.resizeIfNeeded(1);
    this.view.setUint8(this.offset, value);
    this.offset += 1;
    return this;
  }

  int16(value: number): CdrWriter {
    this.align(2);
    this.view.setInt16(this.offset, value, this.littleEndian);
    this.offset += 2;
    return this;
  }

  uint16(value: number): CdrWriter {
    this.align(2);
    this.view.setUint16(this.offset, value, this.littleEndian);
    this.offset += 2;
    return this;
  }

  int32(value: number): CdrWriter {
    this.align(4);
    this.view.setInt32(this.offset, value, this.littleEndian);
    this.offset += 4;
    return this;
  }

  uint32(value: number): CdrWriter {
    this.align(4);
    this.view.setUint32(this.offset, value, this.littleEndian);
    this.offset += 4;
    return this;
  }

  int64(value: bigint): CdrWriter {
    this.align(8);
    this.view.setBigInt64(this.offset, value, this.littleEndian);
    this.offset += 8;
    return this;
  }

  uint64(value: bigint): CdrWriter {
    this.align(8);
    this.view.setBigUint64(this.offset, value, this.littleEndian);
    this.offset += 8;
    return this;
  }

  uint16BE(value: number): CdrWriter {
    this.align(2);
    this.view.setUint16(this.offset, value, false);
    this.offset += 2;
    return this;
  }

  uint32BE(value: number): CdrWriter {
    this.align(4);
    this.view.setUint32(this.offset, value, false);
    this.offset += 4;
    return this;
  }

  uint64BE(value: bigint): CdrWriter {
    this.align(8);
    this.view.setBigUint64(this.offset, value, false);
    this.offset += 8;
    return this;
  }

  float32(value: number): CdrWriter {
    this.align(4);
    this.view.setFloat32(this.offset, value, this.littleEndian);
    this.offset += 4;
    return this;
  }

  float64(value: number): CdrWriter {
    this.align(8);
    this.view.setFloat64(this.offset, value, this.littleEndian);
    this.offset += 8;
    return this;
  }

  string(value: string): CdrWriter {
    const strlen = value.length;
    this.uint32(strlen + 1); // Add one for the null terminator
    this.resizeIfNeeded(strlen + 1);
    this.textEncoder.encodeInto(value, new Uint8Array(this.buffer, this.offset, strlen));
    this.view.setUint8(this.offset + strlen, 0);
    this.offset += strlen + 1;
    return this;
  }

  sequenceLength(value: number): CdrWriter {
    return this.uint32(value);
  }

  int8Array(
    value: Int8Array | number[],
    { writeLength = false }: { writeLength?: boolean } = {},
  ): CdrWriter {
    if (writeLength) {
      this.sequenceLength(value.length);
    }
    this.resizeIfNeeded(value.length);
    this.array.set(value, this.offset);
    this.offset += value.length;
    return this;
  }

  uint8Array(
    value: Uint8Array | number[],
    { writeLength = false }: { writeLength?: boolean } = {},
  ): CdrWriter {
    if (writeLength) {
      this.sequenceLength(value.length);
    }
    this.resizeIfNeeded(value.length);
    this.array.set(value, this.offset);
    this.offset += value.length;
    return this;
  }

  int16Array(
    value: Int16Array | number[],
    { writeLength = false }: { writeLength?: boolean } = {},
  ): CdrWriter {
    if (writeLength) {
      this.sequenceLength(value.length);
    }
    if (
      value instanceof Int16Array &&
      this.littleEndian === this.hostLittleEndian &&
      value.length >= CdrWriter.BUFFER_COPY_THRESHOLD
    ) {
      this.align(value.BYTES_PER_ELEMENT, value.byteLength);
      this.array.set(new Uint8Array(value.buffer, value.byteOffset, value.byteLength), this.offset);
      this.offset += value.byteLength;
    } else {
      for (const entry of value) {
        this.int16(entry);
      }
    }
    return this;
  }

  uint16Array(
    value: Uint16Array | number[],
    { writeLength = false }: { writeLength?: boolean } = {},
  ): CdrWriter {
    if (writeLength) {
      this.sequenceLength(value.length);
    }
    if (
      value instanceof Uint16Array &&
      this.littleEndian === this.hostLittleEndian &&
      value.length >= CdrWriter.BUFFER_COPY_THRESHOLD
    ) {
      this.align(value.BYTES_PER_ELEMENT, value.byteLength);
      this.array.set(new Uint8Array(value.buffer, value.byteOffset, value.byteLength), this.offset);
      this.offset += value.byteLength;
    } else {
      for (const entry of value) {
        this.uint16(entry);
      }
    }
    return this;
  }

  int32Array(
    value: Int32Array | number[],
    { writeLength = false }: { writeLength?: boolean } = {},
  ): CdrWriter {
    if (writeLength) {
      this.sequenceLength(value.length);
    }
    if (
      value instanceof Int32Array &&
      this.littleEndian === this.hostLittleEndian &&
      value.length >= CdrWriter.BUFFER_COPY_THRESHOLD
    ) {
      this.align(value.BYTES_PER_ELEMENT, value.byteLength);
      this.array.set(new Uint8Array(value.buffer, value.byteOffset, value.byteLength), this.offset);
      this.offset += value.byteLength;
    } else {
      for (const entry of value) {
        this.int32(entry);
      }
    }
    return this;
  }

  uint32Array(
    value: Uint32Array | number[],
    { writeLength = false }: { writeLength?: boolean } = {},
  ): CdrWriter {
    if (writeLength) {
      this.sequenceLength(value.length);
    }
    if (
      value instanceof Uint32Array &&
      this.littleEndian === this.hostLittleEndian &&
      value.length >= CdrWriter.BUFFER_COPY_THRESHOLD
    ) {
      this.align(value.BYTES_PER_ELEMENT, value.byteLength);
      this.array.set(new Uint8Array(value.buffer, value.byteOffset, value.byteLength), this.offset);
      this.offset += value.byteLength;
    } else {
      for (const entry of value) {
        this.uint32(entry);
      }
    }
    return this;
  }

  int64Array(
    value: BigInt64Array | bigint[] | number[],
    { writeLength = false }: { writeLength?: boolean } = {},
  ): CdrWriter {
    if (writeLength) {
      this.sequenceLength(value.length);
    }
    if (
      value instanceof BigInt64Array &&
      this.littleEndian === this.hostLittleEndian &&
      value.length >= CdrWriter.BUFFER_COPY_THRESHOLD
    ) {
      this.align(value.BYTES_PER_ELEMENT, value.byteLength);
      this.array.set(new Uint8Array(value.buffer, value.byteOffset, value.byteLength), this.offset);
      this.offset += value.byteLength;
    } else {
      for (const entry of value) {
        this.int64(BigInt(entry));
      }
    }
    return this;
  }

  uint64Array(
    value: BigUint64Array | bigint[] | number[],
    { writeLength = false }: { writeLength?: boolean } = {},
  ): CdrWriter {
    if (writeLength) {
      this.sequenceLength(value.length);
    }
    if (
      value instanceof BigUint64Array &&
      this.littleEndian === this.hostLittleEndian &&
      value.length >= CdrWriter.BUFFER_COPY_THRESHOLD
    ) {
      this.align(value.BYTES_PER_ELEMENT, value.byteLength);
      this.array.set(new Uint8Array(value.buffer, value.byteOffset, value.byteLength), this.offset);
      this.offset += value.byteLength;
    } else {
      for (const entry of value) {
        this.uint64(BigInt(entry));
      }
    }
    return this;
  }

  float32Array(
    value: Float32Array | number[],
    { writeLength = false }: { writeLength?: boolean } = {},
  ): CdrWriter {
    if (writeLength) {
      this.sequenceLength(value.length);
    }
    if (
      value instanceof Float32Array &&
      this.littleEndian === this.hostLittleEndian &&
      value.length >= CdrWriter.BUFFER_COPY_THRESHOLD
    ) {
      this.align(value.BYTES_PER_ELEMENT, value.byteLength);
      this.array.set(new Uint8Array(value.buffer, value.byteOffset, value.byteLength), this.offset);
      this.offset += value.byteLength;
    } else {
      for (const entry of value) {
        this.float32(entry);
      }
    }
    return this;
  }

  float64Array(
    value: Float64Array | number[],
    { writeLength = false }: { writeLength?: boolean } = {},
  ): CdrWriter {
    if (writeLength) {
      this.sequenceLength(value.length);
    }
    if (
      value instanceof Float64Array &&
      this.littleEndian === this.hostLittleEndian &&
      value.length >= CdrWriter.BUFFER_COPY_THRESHOLD
    ) {
      this.align(value.BYTES_PER_ELEMENT, value.byteLength);
      this.array.set(new Uint8Array(value.buffer, value.byteOffset, value.byteLength), this.offset);
      this.offset += value.byteLength;
    } else {
      for (const entry of value) {
        this.float64(entry);
      }
    }
    return this;
  }

  /**
   * Calculate the capacity needed to hold the given number of aligned bytes,
   * resize if needed, and write padding bytes for alignment
   * @param size Byte width to align to. If the current offset is 1 and `size`
   *   is 4, 3 bytes of padding will be written
   * @param bytesToWrite Optional, total amount of bytes that are intended to be
   *   written directly following the alignment. This can be used to avoid
   *   additional buffer resizes in the case of writing large blocks of aligned
   *   data such as arrays
   */
  align(size: number, bytesToWrite: number = size): void {
    // The four byte header is not considered for alignment
    const alignment = (this.offset - 4) % size;
    const padding = alignment > 0 ? size - alignment : 0;
    this.resizeIfNeeded(padding + bytesToWrite);
    // Write padding bytes
    this.array.fill(0, this.offset, this.offset + padding);
    this.offset += padding;
  }

  private resizeIfNeeded(additionalBytes: number): void {
    const capacity = this.offset + additionalBytes;
    if (this.buffer.byteLength < capacity) {
      const doubled = this.buffer.byteLength * 2;
      const newCapacity = doubled > capacity ? doubled : capacity;
      this.resize(newCapacity);
    }
  }

  private resize(capacity: number): void {
    if (this.buffer.byteLength >= capacity) {
      return;
    }

    const buffer = new ArrayBuffer(capacity);
    const array = new Uint8Array(buffer);
    array.set(this.array);
    this.buffer = buffer;
    this.array = array;
    this.view = new DataView(buffer);
  }
}
