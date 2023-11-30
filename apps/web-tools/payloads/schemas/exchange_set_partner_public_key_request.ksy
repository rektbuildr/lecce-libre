meta:
  id: exchange_set_partner_public_key_request
  title: Exchange App / set partner public key request
  endian: be
seq:
  - id: instruction_class
    contents: [0xe0]
  - id: instruction
    contents: [0x04]
  - id: p1
    type: u1
    enum: rate_type
  - id: p2
    type: u1
    enum: subcommand
  - id: data_len
    type: u1
  - id: name_len
    type: u1
  - id: name
    type: str
    size: name_len
    encoding: ASCII
  - id: partner_public_key
    type: str
    size: 65
    encoding: ASCII
enums:
  subcommand:
    0x00: swap
    0x01: sell
    0x02: fund
  rate_type:
    0x00: fixed
    0x01: floating
