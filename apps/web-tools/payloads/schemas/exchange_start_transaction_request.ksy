meta:
  id: exchange_start_transaction_request
  title: Exchange App / start transaction request
  endian: be
seq:
  - id: instruction_class
    contents: [0xe0]
  - id: instruction
    contents: [0x03]
  - id: p1
    type: u1
    enum: rate_type
  - id: p2
    type: u1
    enum: subcommand
  - id: data_len
    contents: [0x00]
enums:
  subcommand:
    0x00: swap
    0x01: sell
    0x02: fund
  rate_type:
    0x00: fixed
    0x01: floating
