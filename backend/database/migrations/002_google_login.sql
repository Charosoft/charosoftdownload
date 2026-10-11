-- Étape 5b : connexion avec Google
-- Rejouable sans risque.

-- Un compte Google n'a pas de mot de passe.
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Lie un utilisateur à son compte externe (Google aujourd'hui, Apple etc. plus tard).
CREATE TABLE IF NOT EXISTS auth_identities (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(30) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_auth_identities_user
    ON auth_identities (user_id);
