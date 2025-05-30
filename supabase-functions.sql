-- Function to generate authentication nonce
CREATE OR REPLACE FUNCTION generate_auth_nonce(p_wallet_address TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_nonce TEXT;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Generate a random nonce
    v_nonce := encode(gen_random_bytes(32), 'hex');
    v_expires_at := NOW() + INTERVAL '10 minutes';
    
    -- Clean up expired nonces for this wallet
    DELETE FROM auth_nonces 
    WHERE wallet_address = p_wallet_address 
    AND (expires_at < NOW() OR used = TRUE);
    
    -- Insert new nonce
    INSERT INTO auth_nonces (wallet_address, nonce, expires_at)
    VALUES (p_wallet_address, v_nonce, v_expires_at);
    
    RETURN v_nonce;
END;
$$;

-- Function to verify wallet signature
CREATE OR REPLACE FUNCTION verify_wallet_signature(
    p_wallet_address TEXT,
    p_signature TEXT,
    p_nonce TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_nonce_record RECORD;
    v_user_record RECORD;
    v_message TEXT;
    v_result JSON;
BEGIN
    -- Check if nonce exists and is valid
    SELECT * INTO v_nonce_record
    FROM auth_nonces
    WHERE wallet_address = p_wallet_address
    AND nonce = p_nonce
    AND expires_at > NOW()
    AND used = FALSE;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Invalid or expired nonce'
        );
    END IF;
    
    -- Mark nonce as used
    UPDATE auth_nonces
    SET used = TRUE
    WHERE id = v_nonce_record.id;
    
    -- Note: In a production environment, you would verify the signature here
    -- using a cryptographic library. For this example, we'll assume the signature is valid
    -- if the nonce check passes.
    
    -- Check if user exists, create if not
    SELECT * INTO v_user_record
    FROM user_data
    WHERE wallet_address = p_wallet_address;
    
    IF NOT FOUND THEN
        -- Create new user
        INSERT INTO user_data (wallet_address, last_login)
        VALUES (p_wallet_address, NOW())
        RETURNING * INTO v_user_record;
    ELSE
        -- Update last login
        UPDATE user_data
        SET last_login = NOW()
        WHERE wallet_address = p_wallet_address
        RETURNING * INTO v_user_record;
    END IF;
    
    -- Generate a simple token (in production, use proper JWT)
    v_result := json_build_object(
        'success', TRUE,
        'token', encode(gen_random_bytes(32), 'hex'),
        'user', row_to_json(v_user_record)
    );
    
    RETURN v_result;
END;
$$;

-- Function to clean up expired nonces (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_nonces()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM auth_nonces
    WHERE expires_at < NOW() OR used = TRUE;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$;
