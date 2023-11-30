meta:
  id: exchange_get_version_request
  title: Exchange App / get version request
  endian: be
seq:
  - id: instruction_class
    contents: [0xe0]
  - id: instruction
    contents: [0x02]
  - id: p1
    contents: [0x00]
  - id: p2
    contents: [0x00]
  - id: data_len
    contents: [0x00]
