meta:
  id: exchange_set_partner_public_key_response
  title: Exchange App / set partner public key response
  endian: be
seq:
  - id: status
    type: u2
    enum: status
enums:
  status:
    0x9000: success
    0x6985: denied_by_user
    0x6a86: wrong_parameters
    0x6a87: wrong_data_length
    0x6d00: unsupported_instruction
    0x6e00: unsupported_instruction_class
    0xb000: wrong_response_length
    0xb007: bad_state
    0xb008: signature_failed
    0xe000: execution_interrupted
    0x6a80: incorrect_command_data
    0x6a81: deserialization_failed
    0x6a82: wrong_transaction_id
    0x6a83: invalid_address
    0x6a84: user_refused
    0x6a85: internal_error
    0x9d1a: incorrect_signature
