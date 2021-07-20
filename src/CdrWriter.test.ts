import { CdrReader } from "./CdrReader";
import { CdrWriter } from "./CdrWriter";

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

describe("CdrWriter", () => {
  it("serializes an example message with size calculation", () => {
    // Example tf2_msgs/TFMessage
    const writer = new CdrWriter({ size: 100 });
    writeExampleMessage(writer);
    expect(writer.size).toEqual(100);
    expect(Buffer.from(writer.data).toString("hex")).toEqual(tf2_msg__TFMessage);
  });

  it("serializes an example message with preallocation", () => {
    // Example tf2_msgs/TFMessage
    const writer = new CdrWriter({ buffer: new ArrayBuffer(100) });
    writeExampleMessage(writer);
    expect(writer.size).toEqual(100);
    expect(Buffer.from(writer.data).toString("hex")).toEqual(tf2_msg__TFMessage);
  });

  it("serializes an example message with size calculation", () => {
    // Example tf2_msgs/TFMessage
    const writer = new CdrWriter();
    writeExampleMessage(writer);
    expect(writer.size).toEqual(100);
    expect(Buffer.from(writer.data).toString("hex")).toEqual(tf2_msg__TFMessage);
  });

  it("round trips all data types", () => {
    const writer = new CdrWriter();
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
    expect(data.byteLength).toEqual(80);

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
  });

  it("round trips all array types", () => {
    const writer = new CdrWriter();
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
  });
});
