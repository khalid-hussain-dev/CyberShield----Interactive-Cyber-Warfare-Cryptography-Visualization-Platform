import base64
import binascii


def encode_base64(raw_bytes):
    return base64.b64encode(raw_bytes).decode('ascii')


def decode_base64(value, field_name):
    if not isinstance(value, str):
        raise ValueError(f'{field_name} must be a base64 string.')

    try:
        return base64.b64decode(value.encode('ascii'), validate=True)
    except (binascii.Error, UnicodeEncodeError) as error:
        raise ValueError(f'{field_name} must be valid base64.') from error

