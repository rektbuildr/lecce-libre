import "payloads/BitcoinTransaction";
import BitcoinTransaction from './payloads/BitcoinTransaction';
// @ts-ignore
import KaitaiStream from 'kaitai-struct';

console.log("testing...")

const tx = Buffer.from("0100000001186f9f998a5aa6f048e51dd8419a14d8a0f1a8a2836dd73 4d2804fe65fa35779000000008b483045022100884d142d86652a3f47 ba4746ec719bbfbd040a570b1deccbb6498c75c4ae24cb02204b9f039 ff08df09cbe9f6addac960298cad530a863ea8f53982c09db8f6e3813 01410484ecc0d46f1918b30928fa0e4ed99f16a0fb4fde0735e7ade84 16ab9fe423cc5412336376789d172787ec3457eee41c04f4938de5cc1 7b4a10fa336a8d752adfffffffff0260e31600000000001976a914ab68025513c3dbd2f7b92a94e0581f5d50f654e788acd0ef800000000000\n" +
  "1976a9147f9b1a7fb68d60c536c2fd8aeaa53a8f3cc025a888ac00000000")

var data = new BitcoinTransaction(new KaitaiStream(tx));

console.log(JSON.stringify(data))
