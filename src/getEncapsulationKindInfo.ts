import { EncapsulationKind } from "./EncapsulationKind";

// From <https://www.omg.org/spec/DDS-XTypes/1.2/PDF>
// 7.4.2 Extended CDR Representation
/**
 * Excerpt:
 * PLAIN_CDR2 shall be used for all primitive, strings, and enumerated types. It is also
 * used for any type with extensibility kind FINAL. The encoding is similar to
 * PLAIN_CDR except that INT64, UINT64, FLOAT64, and FLOAT128 are serialized into
 * the CDR buffer at offsets that are aligned to 4 rather than 8 as was the case in
 * PLAIN_CDR.
 *
 * DELIMITED_CDR shall be used for types with extensibility kind APPENDABLE. It
 * serializes a UINT32 delimiter header (DHEADER) before serializing the object using
 * PLAIN_CDR2. The delimiter encodes the endianness and the length of the serialized
 * object that follows.
 *
 * PL_CDR2 shall be used for aggregated types with extensibility kind MUTABLE.
 * Similar to DELIMITED_CDR it also serializes a DHEADER before serializing the
 * object. In addition it serializes a member header (EMHEADER) ahead each serialized
 * member. The member header encodes the member ID, the must-understand flag, and
 * length of the serialized member that follows.
 */

/**
 * Extracts information about the serialization behavior of an EncapsulationKind. Such as whether it's CDR2, little-endian, uses a delimiter header or uses a member header.
 * @param kind - EncapsulationKind to extract information from
 * @returns {Object} - Object containing boolean values that describe the serialization behavior of the EncapsulationKind
 */
export const getEncapsulationKindInfo = (
  kind: EncapsulationKind,
): {
  isCDR2: boolean;
  littleEndian: boolean;
  usesDelimiterHeader: boolean;
  usesMemberHeader: boolean;
} => {
  const isCDR2 = kind > EncapsulationKind.PL_CDR_LE;

  const littleEndian =
    kind === EncapsulationKind.CDR_LE ||
    kind === EncapsulationKind.PL_CDR_LE ||
    kind === EncapsulationKind.CDR2_LE ||
    kind === EncapsulationKind.PL_CDR2_LE ||
    kind === EncapsulationKind.DELIMITED_CDR2_LE ||
    kind === EncapsulationKind.RTPS_CDR2_LE ||
    kind === EncapsulationKind.RTPS_PL_CDR2_LE ||
    kind === EncapsulationKind.RTPS_DELIMITED_CDR2_LE;

  const isDelimitedCDR2 =
    kind === EncapsulationKind.DELIMITED_CDR2_BE ||
    kind === EncapsulationKind.DELIMITED_CDR2_LE ||
    kind === EncapsulationKind.RTPS_DELIMITED_CDR2_BE ||
    kind === EncapsulationKind.RTPS_DELIMITED_CDR2_LE;

  const isPLCDR2 =
    kind === EncapsulationKind.PL_CDR2_BE ||
    kind === EncapsulationKind.PL_CDR2_LE ||
    kind === EncapsulationKind.RTPS_PL_CDR2_BE ||
    kind === EncapsulationKind.RTPS_PL_CDR2_LE;

  const isPLCDR1 = kind === EncapsulationKind.PL_CDR_BE || kind === EncapsulationKind.PL_CDR_LE;

  const usesDelimiterHeader = isDelimitedCDR2 || isPLCDR2;
  const usesMemberHeader = isPLCDR2 || isPLCDR1;

  return {
    isCDR2,
    littleEndian,
    usesDelimiterHeader,
    usesMemberHeader,
  };
};
