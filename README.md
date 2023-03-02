# @foxglove/cdr

> _Common Data Representation serialization and deserialization library_

[![npm version](https://img.shields.io/npm/v/@foxglove/cdr.svg?style=flat)](https://www.npmjs.com/package/@foxglove/cdr)

## Introduction

Common Data Representation (CDR) defines a serialization format for primitive types. When combined with an Interface Definition Language (IDL) it can be used to create complex types that can be serialized to disk, transmitted over the network, etc. while transparently handling endianness and alignment requirements. It's specified by https://www.omg.org/spec/DDSI-RTPS/2.3/PDF (chapter 10) and https://www.omg.org/cgi-bin/doc?formal/02-06-51.

CDR is found in OMG DDS (Data Distributed Service) implementations such as the Real-Time Publish Subscribe (RTPS) protocol. This is the wire protocol found in ROS2, and CDR is the default serialization format used in rosbag2.

## Usage

```Typescript
import { CdrReader, CdrSizeCalculator, CdrWriter } from "@foxglove/cdr";

const calc = new CdrSizeCalculator();
calc.int8();
calc.uint8();
calc.int16();
calc.uint16();
calc.int32();
calc.uint32();
calc.int64();
calc.uint64();
calc.float32();
calc.float64();
calc.string("abc".length);
calc.sequenceLength();
console.log(calc.size);

const writer = new CdrWriter();
writer.int8(-1);
writer.uint8(2);
writer.int16(-300);
writer.uint16(400);
writer.int32(-500_000);
writer.uint32(600_000);
writer.int64(-7_000_000_001n);
writer.uint64(8_000_000_003n);
writer.float32(-9.14);
writer.float64(1.7976931348623158e100);
writer.string("abc");
writer.sequenceLength(0);

const reader = new CdrReader(writer.data);
console.log(reader.int8());
console.log(reader.uint8());
console.log(reader.int16());
console.log(reader.uint16());
console.log(reader.int32());
console.log(reader.uint32());
console.log(reader.int64());
console.log(reader.uint64());
console.log(reader.float32());
console.log(reader.float64());
console.log(reader.string());
console.log(reader.sequenceLength());
```

## Alternatives

[jscdr](https://github.com/atolab/jscdr) - Does not support bigint, pre-allocated buffers, or buffer length calculations.

## License

@foxglove/cdr is licensed under the [MIT License](https://opensource.org/licenses/MIT).

## Releasing

1. Run `yarn version --[major|minor|patch]` to bump version
2. Run `git push && git push --tags` to push new tag
3. GitHub Actions will take care of the rest

## Stay in touch

Join our [Slack channel](https://foxglove.dev/join-slack) to ask questions, share feedback, and stay up to date on what our team is working on.
