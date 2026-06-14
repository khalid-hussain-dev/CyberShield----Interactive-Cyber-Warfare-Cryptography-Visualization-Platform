from werkzeug.security import check_password_hash, generate_password_hash


def hash_password(password):
    validate_password(password)
    return generate_password_hash(password, method='pbkdf2:sha256', salt_length=16)


def password_matches(password_hash, password):
    if not isinstance(password, str):
        return False

    return check_password_hash(password_hash, password)


def validate_password(password):
    if not isinstance(password, str) or len(password) < 8:
        raise ValueError('Password must be at least 8 characters long.')

