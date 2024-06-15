import json
from eth_abi import decode, encode

def encode_payload(tax_id: str, loan_amount: float, json_payload):
    json_bytes = json.dumps(json_payload, separators=(',', ':')).encode("utf-8")
    hex_str = encode(["string", "uint256", "bytes"], [tax_id, loan_amount, json_bytes]).hex()
    return f"0x{hex_str}"

def decode_payload(hex: str):
    binary = bytes.fromhex(hex[2:])
    (tax_id, loan_amount, json_bytes) = decode(["string", "uint256", "bytes"], binary)
    json_payload = json.loads(json_bytes.decode("utf-8"))
    return (tax_id, loan_amount, json_payload)