// From <https://www.omg.org/spec/DDS-XTypes/1.2/PDF>
// "7.4.3.4 Functions related to data types and objects"
// ENC_HEADER
// {0x00, 0x00} -- PLAIN_CDR, BIG_ENDIAN,
// {0x00, 0x01} -- PLAIN_CDR, LITTLE_ENDIAN
// {0x00, 0x02} -- PL_CDR, BIG_ENDIAN,
// {0x00, 0x03} -- PL_CDR, LITTLE_ENDIAN,
// {0x00, 0x10} -- PLAIN_CDR2, BIG_ENDIAN,
// {0x00, 0x11} -- PLAIN_CDR2, LITTLE_ENDIAN
// {0x00, 0x12} -- PL_CDR2, BIG_ENDIAN
// {0x00, 0x13} -- PL_CDR2, LITTLE_ENDIAN
// {0x00, 0x14} -- DELIMIT_CDR, BIG_ENDIAN
// {0x00, 0x15} -- DELIMIT_CDR, LITTLE_ENDIAN
//
// 7.6.2.1.2 RTPS encapsulation identifier
// XCDR VERSION 1
// {0x00, 0x00} -- CDR_BE, BIG_ENDIAN, FINAL
// {0x00, 0x01} -- CDR_LE, LITTLE_ENDIAN, FINAL
// {0x00, 0x00} -- CDR_BE, BIG_ENDIAN, APPENDABLE
// {0x00, 0x01} -- CDR_LE, LITTLE_ENDIAN, APPENDABLE
// {0x00, 0x02} -- PL_CDR_BE, BIG_ENDIAN, MUTABLE
// {0x00, 0x03} -- PL_CDR_LE, LITTLE_ENDIAN, MUTABLE
//
// XCDR VERSION 2
// {0x00, 0x06} -- CDR2_BE, BIG_ENDIAN, FINAL
// {0x00, 0x07} -- CDR2_LE, LITTLE_ENDIAN, FINAL
// {0x00, 0x08} -- D_CDR2_BE, BIG_ENDIAN, APPENDABLE
// {0x00, 0x09} -- D_CDR2_LE, LITTLE_ENDIAN, APPENDABLE
// {0x00, 0x0a} -- PL_CDR2_BE, BIG_ENDIAN, MUTABLE
// {0x00, 0x0b} -- PL_CDR2_LE, LITTLE_ENDIAN, MUTABLE

export enum EncapsulationKind {
  // Both RTPS and ENC_HEADER enum values
  /** Plain CDR, big-endian */
  CDR_BE = 0x00,
  /** Plain CDR, little-endian */
  CDR_LE = 0x01,
  /** Parameter List CDR, big-endian */
  PL_CDR_BE = 0x02,
  /** Parameter List CDR, little-endian */
  PL_CDR_LE = 0x03,

  // ENC_HEADER enum values
  /** Plain CDR2, big-endian */
  CDR2_BE = 0x10,
  /** Plain CDR2, little-endian */
  CDR2_LE = 0x11,
  /** Parameter List CDR2, big-endian */
  PL_CDR2_BE = 0x12,
  /** Parameter List CDR2, little-endian */
  PL_CDR2_LE = 0x13,
  /** Delimited CDR, big-endian */
  DELIMITED_CDR2_BE = 0x14,
  /** Delimited CDR, little-endian */
  DELIMITED_CDR2_LE = 0x15,

  // RTPS enum values
  /** Plain CDR2, big-endian */
  RTPS_CDR2_BE = 0x06,
  /** Plain CDR2, little-endian */
  RTPS_CDR2_LE = 0x07,
  /** Delimited CDR, big-endian */
  RTPS_DELIMITED_CDR2_BE = 0x08,
  /** Delimited CDR, little-endian */
  RTPS_DELIMITED_CDR2_LE = 0x09,
  /** Parameter List CDR2, big-endian */
  RTPS_PL_CDR2_BE = 0x0a,
  /** Parameter List CDR2, little-endian */
  RTPS_PL_CDR2_LE = 0x0b,
}
