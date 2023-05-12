// From <https://www.omg.org/spec/DDS-XTypes/1.2/PDF>
// "7.4.3.4 Functions related to data types and objects"
//
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
// Verified with RTI Connext that 0x11 refers to decimal 11 (0x0B).

export enum EncapsulationKind {
  /** Plain CDR, big-endian */
  CDR_BE = 0,
  /** Plain CDR, little-endian */
  CDR_LE = 1,
  /** Parameter List CDR, big-endian */
  PL_CDR_BE = 2,
  /** Parameter List CDR, little-endian */
  PL_CDR_LE = 3,
  /** Plain CDR2, big-endian */
  CDR2_BE = 10,
  /** Plain CDR2, little-endian */
  CDR2_LE = 11,
  /** Parameter List CDR2, big-endian */
  PL_CDR2_BE = 12,
  /** Parameter List CDR2, little-endian */
  PL_CDR2_LE = 13,
  /** Delimited CDR, big-endian */
  DELIMITED_CDR2_BE = 14,
  /** Delimited CDR, little-endian */
  DELIMITED_CDR2_LE = 15,
}
