import { CdrReader } from "./CdrReader";
import { CdrWriter } from "./CdrWriter";
import { EncapsulationKind } from "./encapsulationKind";

const tf2_msg__TFMessage =
  "0001000001000000cce0d158f08cf9060a000000626173655f6c696e6b000000060000007261646172000000ae47e17a14ae0e4000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f03f";

function writeExampleMessage(writer: CdrWriter) {
  // geometry_msgs/TransformStamped[] transforms
  writer.sequenceLength(1);
  // std_msgs/Header header
  // time stamp
  writer.uint32(1490149580); // uint32 sec
  writer.uint32(117017840); // uint32 nsec
  writer.string("base_link"); // string frame_id
  writer.string("radar"); // string child_frame_id
  // geometry_msgs/Transform transform
  // geometry_msgs/Vector3 translation
  writer.float64(3.835); // float64 x
  writer.float64(0); // float64 y
  writer.float64(0); // float64 z
  // geometry_msgs/Quaternion rotation
  writer.float64(0); // float64 x
  writer.float64(0); // float64 y
  writer.float64(0); // float64 z
  writer.float64(1); // float64 w
}

function toHex(data: Uint8Array): string {
  return Buffer.from(data).toString("hex");
}

function decimalToHex(value: number): string {
  return value.toString(16).padStart(2, "0");
}

describe("CdrWriter", () => {
  it("serializes an example message with internal preallocation", () => {
    // Example tf2_msgs/TFMessage
    for (const writer of [
      new CdrWriter({ size: 100 }),
      new CdrWriter({ size: 100, kind: EncapsulationKind.CDR2_LE }),
    ]) {
      // Set the EncapsulationKind in the test data to match the writer
      const tf2Msg = `00${decimalToHex(writer.kind)}${tf2_msg__TFMessage.substring(4)}`;
      writeExampleMessage(writer);
      expect(writer.size).toEqual(100);
      expect(toHex(writer.data)).toEqual(tf2Msg);
    }
  });

  it("serializes an example message with external preallocation", () => {
    // Example tf2_msgs/TFMessage
    for (const writer of [
      new CdrWriter({ buffer: new ArrayBuffer(100) }),
      new CdrWriter({ buffer: new ArrayBuffer(100), kind: EncapsulationKind.CDR2_LE }),
    ]) {
      // Set the EncapsulationKind in the test data to match the writer
      const tf2Msg = `00${decimalToHex(writer.kind)}${tf2_msg__TFMessage.substring(4)}`;
      writeExampleMessage(writer);
      expect(writer.size).toEqual(100);
      expect(toHex(writer.data)).toEqual(tf2Msg);
    }
  });

  it("serializes an example message with no preallocation", () => {
    // Example tf2_msgs/TFMessage
    const writer = new CdrWriter();
    writeExampleMessage(writer);
    expect(writer.size).toEqual(100);
    expect(toHex(writer.data)).toEqual(tf2_msg__TFMessage);
  });

  it("round trips all data types", () => {
    for (const writer of [new CdrWriter(), new CdrWriter({ kind: EncapsulationKind.CDR2_LE })]) {
      writer.int8(-1);
      writer.uint8(2);
      writer.int16(-300);
      writer.uint16(400);
      writer.int32(-500_000);
      writer.uint32(600_000);
      writer.int64(-7_000_000_001n);
      writer.uint64(8_000_000_003n);
      writer.uint16BE(0x1234);
      writer.uint32BE(0x12345678);
      writer.uint64BE(0x123456789abcdef0n);
      writer.float32(-9.14);
      writer.float64(1.7976931348623158e100);
      writer.string("abc");
      writer.sequenceLength(42);
      const data = writer.data;
      expect(data.byteLength).toEqual(writer.kind === EncapsulationKind.CDR2_LE ? 76 : 80);

      const reader = new CdrReader(data);
      expect(reader.int8()).toEqual(-1);
      expect(reader.uint8()).toEqual(2);
      expect(reader.int16()).toEqual(-300);
      expect(reader.uint16()).toEqual(400);
      expect(reader.int32()).toEqual(-500_000);
      expect(reader.uint32()).toEqual(600_000);
      expect(reader.int64()).toEqual(-7_000_000_001n);
      expect(reader.uint64()).toEqual(8_000_000_003n);
      expect(reader.uint16BE()).toEqual(0x1234);
      expect(reader.uint32BE()).toEqual(0x12345678);
      expect(reader.uint64BE()).toEqual(0x123456789abcdef0n);
      expect(reader.float32()).toBeCloseTo(-9.14);
      expect(reader.float64()).toBeCloseTo(1.7976931348623158e100);
      expect(reader.string()).toEqual("abc");
      expect(reader.sequenceLength()).toEqual(42);
    }
  });

  it("round trips all array types", () => {
    for (const writer of [new CdrWriter(), new CdrWriter({ kind: EncapsulationKind.CDR2_LE })]) {
      writer.int8Array([-128, 127, 3], true);
      writer.uint8Array([0, 255, 3], true);
      writer.int16Array([-32768, 32767, -3], true);
      writer.uint16Array([0, 65535, 3], true);
      writer.int32Array([-2147483648, 2147483647, 3], true);
      writer.uint32Array([0, 4294967295, 3], true);
      writer.int64Array([-9223372036854775808n, 9223372036854775807n, 3n], true);
      writer.uint64Array([0n, 18446744073709551615n, 3n], true);

      const reader = new CdrReader(writer.data);
      expect(Array.from(reader.int8Array().values())).toEqual([-128, 127, 3]);
      expect(Array.from(reader.uint8Array().values())).toEqual([0, 255, 3]);
    }
  });

  it("writes parameter lists", () => {
    const writer = new CdrWriter({ kind: EncapsulationKind.PL_CDR_LE });
    writer.uint8(0x42);
    expect(toHex(writer.data)).toEqual("0003000042");
  });

  it("writes all EncapsulationKind values", () => {
    for (const key of enumKeys(EncapsulationKind)) {
      const kind = EncapsulationKind[key];
      const writer = new CdrWriter({ kind });
      writer.uint8(0x42);
      expect(toHex(writer.data)).toEqual(`00${decimalToHex(kind)}000042`);
    }
  });

  it("aligns cdr1", () => {
    const writer = new CdrWriter();
    writer.align(0);
    expect(toHex(writer.data)).toEqual("00010000");
    writer.align(8);
    expect(toHex(writer.data)).toEqual("00010000");
    writer.uint8(1); // one byte
    writer.align(8); // seven bytes of padding
    writer.uint32(2); // four bytes
    writer.align(4); // no-op, already aligned
    expect(toHex(writer.data)).toEqual("00010000010000000000000002000000");
  });

  it("aligns cdr2", () => {
    const writer = new CdrWriter({ kind: EncapsulationKind.CDR2_LE });
    writer.align(0);
    expect(toHex(writer.data)).toEqual("000b0000");
    writer.align(4);
    expect(toHex(writer.data)).toEqual("000b0000");
    writer.uint8(1); // one byte
    writer.align(4); // three bytes of padding
    writer.uint32(2); // four bytes
    writer.align(4); // no-op, already aligned
    expect(toHex(writer.data)).toEqual("000b00000100000002000000");
  });
});

function enumKeys<O extends object, K extends keyof O = keyof O>(obj: O): K[] {
  return Object.keys(obj).filter((k) => Number.isNaN(+k)) as K[];
}
