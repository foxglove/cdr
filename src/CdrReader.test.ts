import { EncapsulationKind } from ".";
import { CdrReader } from "./CdrReader";
import { CdrWriter } from "./CdrWriter";

type ArrayGetter =
  | "int8Array"
  | "uint8Array"
  | "int16Array"
  | "uint16Array"
  | "int32Array"
  | "uint32Array"
  | "float32Array"
  | "float64Array";
type Setter = "int8" | "uint8" | "int16" | "uint16" | "int32" | "uint32" | "float32" | "float64";

// Example tf2_msgs/TFMessage
const tf2_msg__TFMessage =
  "0001000001000000cce0d158f08cf9060a000000626173655f6c696e6b000000060000007261646172000000ae47e17a14ae0e4000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f03f";

describe("CdrReader", () => {
  it("parses an example tf2_msgs/TFMessage message", () => {
    const data = Uint8Array.from(Buffer.from(tf2_msg__TFMessage, "hex"));
    const reader = new CdrReader(data);
    expect(reader.decodedBytes).toBe(4);

    // geometry_msgs/TransformStamped[] transforms
    expect(reader.sequenceLength()).toEqual(1);
    // std_msgs/Header header
    // time stamp
    expect(reader.uint32()).toEqual(1490149580); // uint32 sec
    expect(reader.uint32()).toEqual(117017840); // uint32 nsec
    expect(reader.string()).toEqual("base_link"); // string frame_id
    expect(reader.string()).toEqual("radar"); // string child_frame_id
    // geometry_msgs/Transform transform
    // geometry_msgs/Vector3 translation
    expect(reader.float64()).toBeCloseTo(3.835); // float64 x
    expect(reader.float64()).toBeCloseTo(0); // float64 y
    expect(reader.float64()).toBeCloseTo(0); // float64 z
    // geometry_msgs/Quaternion rotation
    expect(reader.float64()).toBeCloseTo(0); // float64 x
    expect(reader.float64()).toBeCloseTo(0); // float64 y
    expect(reader.float64()).toBeCloseTo(0); // float64 z
    expect(reader.float64()).toBeCloseTo(1); // float64 w

    expect(reader.offset).toBe(data.length);
    expect(reader.kind).toBe(EncapsulationKind.CDR_LE);
    expect(reader.decodedBytes).toBe(data.length);
    expect(reader.byteLength).toBe(data.length);
  });

  it("parses an example rcl_interfaces/ParameterEvent", () => {
    const data = Uint8Array.from(
      Buffer.from(
        "00010000a9b71561a570ea01110000002f5f726f7332636c695f33373833363300000000010000000d0000007573655f73696d5f74696d650001000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000",
        "hex",
      ),
    );
    const reader = new CdrReader(data);

    // builtin_interfaces/Time stamp
    expect(reader.uint32()).toEqual(1628813225); // uint32 sec
    expect(reader.uint32()).toEqual(32141477); // uint32 nsec
    // string node
    expect(reader.string()).toEqual("/_ros2cli_378363");

    // Parameter[] new_parameters
    expect(reader.sequenceLength()).toEqual(1);
    expect(reader.string()).toEqual("use_sim_time"); // string name
    // ParameterValue value
    expect(reader.uint8()).toEqual(1); // uint8 type
    expect(reader.int8()).toEqual(0); // bool bool_value
    expect(reader.int64()).toEqual(0n); // int64 integer_value
    expect(reader.float64()).toEqual(0); // float64 double_value
    expect(reader.string()).toEqual(""); // string string_value

    expect(reader.int8Array()).toEqual(new Int8Array()); // byte[] byte_array_value
    expect(reader.uint8Array()).toEqual(new Uint8Array()); // bool[] bool_array_value
    expect(reader.int64Array()).toEqual(new BigInt64Array()); // int64[] integer_array_value
    expect(reader.float64Array()).toEqual(new Float64Array()); // float64[] double_array_value
    expect(reader.stringArray()).toEqual([]); // string[] string_array_value

    // Parameter[] changed_parameters
    expect(reader.sequenceLength()).toEqual(0);

    // Parameter[] deleted_parameters
    expect(reader.sequenceLength()).toEqual(0);

    expect(reader.offset).toBe(data.length);
  });

  it("reads big endian values", () => {
    const data = Uint8Array.from(Buffer.from("000100001234000056789abcdef0000000000000", "hex"));
    const reader = new CdrReader(data);
    expect(reader.uint16BE()).toEqual(0x1234);
    expect(reader.uint32BE()).toEqual(0x56789abc);
    expect(reader.uint64BE()).toEqual(0xdef0000000000000n);
  });

  it("seeks to absolute and relative positions", () => {
    const data = Uint8Array.from(Buffer.from(tf2_msg__TFMessage, "hex"));
    const reader = new CdrReader(data);

    reader.seekTo(4 + 4 + 4 + 4 + 4 + 10 + 4 + 6);
    expect(reader.float64()).toBeCloseTo(3.835);

    // This works due to aligned reads
    reader.seekTo(4 + 4 + 4 + 4 + 4 + 10 + 4 + 3);
    expect(reader.float64()).toBeCloseTo(3.835);

    reader.seek(-8);
    expect(reader.float64()).toBeCloseTo(3.835);
    expect(reader.float64()).toBeCloseTo(0);
  });

  it.each([
    ["int8Array", "int8", [-128, 127, 3]],
    ["uint8Array", "uint8", [0, 255, 3]],
    ["int16Array", "int16", [-32768, 32767, -3]],
    ["uint16Array", "uint16", [0, 65535, 3]],
    ["int32Array", "int32", [-2147483648, 2147483647, 3]],
    ["uint32Array", "uint32", [0, 4294967295, 3]],
  ])("reads int %s", (getter: string, setter: string, expected: number[]) => {
    const writer = new CdrWriter();
    writeArray(writer, setter as Setter, expected);

    const reader = new CdrReader(writer.data);
    const array = reader[getter as ArrayGetter](reader.sequenceLength());
    expect(Array.from(array.values())).toEqual(expected);
  });

  it.each([
    ["float32Array", "float32", [-3.835, 0, Math.PI], 6],
    ["float64Array", "float64", [-3.835, 0, Math.PI], 15],
    ["float64Array", "float64", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, -0.123456789121212121212], 15],
  ])("reads float %s", (getter: string, setter: string, expected: number[], numDigits: number) => {
    const writer = new CdrWriter();
    writeArray(writer, setter as Setter, expected);

    const reader = new CdrReader(writer.data);
    const array = reader[getter as ArrayGetter](reader.sequenceLength());
    expectToBeCloseToArray(Array.from(array.values()), expected, numDigits);
  });

  it.each([
    ["int64Array", "int64", [-9223372036854775808n, 9223372036854775807n, 3n]],
    ["uint64Array", "uint64", [0n, 18446744073709551615n, 3n]],
    ["uint64Array", "uint64", [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n, 11n, 12n]],
  ])("reads %s", (getter: string, setter: string, expected: bigint[]) => {
    const writer = new CdrWriter();
    writeBigArray(writer, setter as "int64" | "uint64", expected);

    const reader = new CdrReader(writer.data);
    const array = reader[getter as "int64Array" | "uint64Array"](reader.sequenceLength());
    expect(Array.from(array.values())).toEqual(expected);
  });

  it("reads multiple arrays", () => {
    const writer = new CdrWriter();
    writer.float32Array([5.5, 6.5], true);
    writer.float32Array([7.5, 8.5], true);

    const reader = new CdrReader(writer.data);
    expect(reader).toBeDefined();
    expectToBeCloseToArray(Array.from(reader.float32Array().values()), [5.5, 6.5], 6);
    expectToBeCloseToArray(Array.from(reader.float32Array().values()), [7.5, 8.5], 6);
    expect(reader.offset).toBe(writer.data.length);
  });

  it("reads stringArray", () => {
    const writer = new CdrWriter();
    writer.sequenceLength(3);
    writer.string("abc");
    writer.string("");
    writer.string("test string");

    const reader = new CdrReader(writer.data);
    expect(reader.stringArray(reader.sequenceLength())).toEqual(["abc", "", "test string"]);
    expect(reader.offset).toBe(writer.data.length);
  });

  it.each([
    "int8Array",
    "uint8Array",
    "int16Array",
    "uint16Array",
    "int32Array",
    "uint32Array",
    "int64Array",
    "uint64Array",
    "float32Array",
    "float64Array",
  ] as const)("handles alignment correctly for empty %s", (key) => {
    const writer = new CdrWriter();
    writer[key]([], true);
    expect(writer.data.length).toBe(8);

    const reader = new CdrReader(writer.data);
    expect(reader[key]().length).toEqual(0);
    expect(reader.offset).toEqual(writer.data.length);
  });
});

function writeArray(writer: CdrWriter, setter: Setter, array: number[]): void {
  writer.sequenceLength(array.length);
  for (const value of array) {
    writer[setter](value);
  }
}

function writeBigArray(writer: CdrWriter, setter: "int64" | "uint64", array: bigint[]): void {
  writer.sequenceLength(array.length);
  for (const value of array) {
    writer[setter](value);
  }
}

function expectToBeCloseToArray(actual: number[], expected: number[], numDigits: number): void {
  expect(actual.length).toBe(expected.length);
  actual.forEach((x, i) => expect(x).toBeCloseTo(expected[i]!, numDigits));
}
