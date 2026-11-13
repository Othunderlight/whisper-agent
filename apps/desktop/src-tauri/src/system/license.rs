use std::collections::HashSet;
use std::time::{SystemTime, UNIX_EPOCH};

use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use serde::{Deserialize, Serialize};

const LICENSE_PUBLIC_KEY_PEM: &str = include_str!("../../keys/license-public-key.pub");
const SUPPORTED_VERSION: u32 = 1;
const PRODUCT: &str = "ryoiki-tenkai";
const SUPPORTED_TIERS: &[&str] = &["normal", "pro"];
const SUPPORTED_PROVIDERS: &[&str] = &["groq"];

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct LicenseProviderPreset {
    pub provider: String,
    pub api_key: String,
    pub model: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct LicensePayload {
    pub v: u32,
    pub product: String,
    pub id: String,
    pub email: String,
    pub tier: String,
    pub iat: i64,
    pub expires: Option<i64>,
    pub provider: Option<LicenseProviderPreset>,
}

pub fn normalize_token(token: &str) -> String {
    token.chars().filter(|char| !char.is_whitespace()).collect()
}

pub fn verify_token(token: &str) -> Result<LicensePayload, String> {
    let key = embedded_decoding_key()?;
    verify_token_with_key(&normalize_token(token), &key)
}

fn embedded_decoding_key() -> Result<DecodingKey, String> {
    if !LICENSE_PUBLIC_KEY_PEM.contains("BEGIN PUBLIC KEY")
        || LICENSE_PUBLIC_KEY_PEM.contains("REPLACE_ME")
    {
        return Err(
            "This build has no license public key. Run scripts/license/issue-license.sh init, then rebuild the app."
                .to_string(),
        );
    }

    DecodingKey::from_ed_pem(LICENSE_PUBLIC_KEY_PEM.as_bytes())
        .map_err(|_| "The embedded license public key is invalid.".to_string())
}

fn verify_token_with_key(token: &str, key: &DecodingKey) -> Result<LicensePayload, String> {
    let token = token.trim();
    if token.is_empty() {
        return Err("License key is empty.".to_string());
    }

    let mut validation = Validation::new(Algorithm::EdDSA);
    validation.required_spec_claims = HashSet::new();
    validation.validate_exp = false;
    validation.validate_aud = false;

    let data = decode::<LicensePayload>(token, key, &validation)
        .map_err(|_| "This license key is invalid or was not issued for this app.".to_string())?;

    validate_payload(&data.claims)?;
    Ok(data.claims)
}

fn validate_payload(payload: &LicensePayload) -> Result<(), String> {
    if payload.v != SUPPORTED_VERSION {
        return Err("This license key uses an unsupported version.".to_string());
    }

    if payload.product != PRODUCT {
        return Err("This license key was not issued for this app.".to_string());
    }

    if payload.id.trim().is_empty() || payload.email.trim().is_empty() {
        return Err("This license key is missing required details.".to_string());
    }

    if !SUPPORTED_TIERS.contains(&payload.tier.as_str()) {
        return Err("This license key has an unsupported tier.".to_string());
    }

    match payload.tier.as_str() {
        "pro" => {
            let preset = payload
                .provider
                .as_ref()
                .ok_or_else(|| "Pro licenses require a provider preset.".to_string())?;

            if !SUPPORTED_PROVIDERS.contains(&preset.provider.as_str()) {
                return Err("This license key has an unsupported provider.".to_string());
            }

            if preset.api_key.trim().is_empty() {
                return Err("This license key is missing its provider API key.".to_string());
            }

            if preset.model.trim().is_empty() {
                return Err("This license key is missing its transcription model.".to_string());
            }
        }
        "normal" => {
            if payload.provider.is_some() {
                return Err("Normal licenses cannot include a provider preset.".to_string());
            }
        }
        _ => unreachable!("tier was validated above"),
    }

    if let Some(expires) = payload.expires {
        if expires <= now_unix() {
            return Err("This license key has expired.".to_string());
        }
    }

    Ok(())
}

fn now_unix() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs() as i64)
        .unwrap_or(0)
}

#[cfg(test)]
mod tests {
    use super::*;
    use base64::Engine;
    use jsonwebtoken::{encode, EncodingKey, Header};
    use ring::rand::SystemRandom;
    use ring::signature::{Ed25519KeyPair, KeyPair};

    fn test_keys() -> (EncodingKey, DecodingKey) {
        let rng = SystemRandom::new();
        let pkcs8 = Ed25519KeyPair::generate_pkcs8(&rng).expect("generate test key");
        let pair = Ed25519KeyPair::from_pkcs8(pkcs8.as_ref()).expect("read test key");
        let public_x =
            base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(pair.public_key().as_ref());

        (
            EncodingKey::from_ed_der(pkcs8.as_ref()),
            DecodingKey::from_ed_components(&public_x).expect("build decoding key"),
        )
    }

    fn payload() -> LicensePayload {
        LicensePayload {
            v: SUPPORTED_VERSION,
            product: PRODUCT.to_string(),
            id: "lic_test".to_string(),
            email: "user@example.com".to_string(),
            tier: "pro".to_string(),
            iat: now_unix(),
            expires: None,
            provider: Some(LicenseProviderPreset {
                provider: "groq".to_string(),
                api_key: "gsk_test".to_string(),
                model: "whisper-large-v3".to_string(),
            }),
        }
    }

    fn normal_payload() -> LicensePayload {
        LicensePayload {
            tier: "normal".to_string(),
            provider: None,
            ..payload()
        }
    }

    fn sign(payload: &LicensePayload, key: &EncodingKey) -> String {
        encode(&Header::new(Algorithm::EdDSA), payload, key).expect("sign test license")
    }

    #[test]
    fn accepts_valid_token() {
        let (encoding, decoding) = test_keys();
        let token = sign(&payload(), &encoding);

        let verified = verify_token_with_key(&token, &decoding).expect("valid token");
        assert_eq!(verified.email, "user@example.com");
        assert_eq!(verified.tier, "pro");
        assert_eq!(
            verified.provider.expect("provider preset").model,
            "whisper-large-v3"
        );
    }

    #[test]
    fn rejects_tampered_payload() {
        let (encoding, decoding) = test_keys();
        let token = sign(&payload(), &encoding);
        let parts: Vec<&str> = token.split('.').collect();

        let mut tampered = payload();
        tampered.email = "attacker@example.com".to_string();
        let tampered_payload = base64::engine::general_purpose::URL_SAFE_NO_PAD
            .encode(serde_json::to_vec(&tampered).expect("serialize tampered payload"));
        let forged = format!("{}.{}.{}", parts[0], tampered_payload, parts[2]);

        assert!(verify_token_with_key(&forged, &decoding).is_err());
    }

    #[test]
    fn rejects_expired_token() {
        let (encoding, decoding) = test_keys();
        let mut claims = payload();
        claims.expires = Some(now_unix() - 1);
        let token = sign(&claims, &encoding);

        assert!(verify_token_with_key(&token, &decoding).is_err());
    }

    #[test]
    fn rejects_wrong_product() {
        let (encoding, decoding) = test_keys();
        let mut claims = payload();
        claims.product = "other-app".to_string();
        let token = sign(&claims, &encoding);

        assert!(verify_token_with_key(&token, &decoding).is_err());
    }

    #[test]
    fn rejects_key_signed_by_another_private_key() {
        let (encoding, _) = test_keys();
        let (_, other_decoding) = test_keys();
        let token = sign(&payload(), &encoding);

        assert!(verify_token_with_key(&token, &other_decoding).is_err());
    }

    #[test]
    fn accepts_normal_tier() {
        let (encoding, decoding) = test_keys();
        let token = sign(&normal_payload(), &encoding);

        let verified = verify_token_with_key(&token, &decoding).expect("normal token");
        assert_eq!(verified.tier, "normal");
    }

    #[test]
    fn rejects_pro_without_provider() {
        let (encoding, decoding) = test_keys();
        let mut claims = payload();
        claims.provider = None;
        let token = sign(&claims, &encoding);

        assert!(verify_token_with_key(&token, &decoding).is_err());
    }

    #[test]
    fn rejects_unknown_provider() {
        let (encoding, decoding) = test_keys();
        let mut claims = payload();
        claims.provider.as_mut().expect("provider").provider = "openai".to_string();
        let token = sign(&claims, &encoding);

        assert!(verify_token_with_key(&token, &decoding).is_err());
    }

    #[test]
    fn rejects_normal_with_provider() {
        let (encoding, decoding) = test_keys();
        let mut claims = normal_payload();
        claims.provider = Some(LicenseProviderPreset {
            provider: "groq".to_string(),
            api_key: "gsk_test".to_string(),
            model: "whisper-large-v3".to_string(),
        });
        let token = sign(&claims, &encoding);

        assert!(verify_token_with_key(&token, &decoding).is_err());
    }

    #[test]
    fn rejects_unknown_tier() {
        let (encoding, decoding) = test_keys();
        let mut claims = payload();
        claims.tier = "gold".to_string();
        let token = sign(&claims, &encoding);

        assert!(verify_token_with_key(&token, &decoding).is_err());
    }

    #[test]
    #[ignore = "requires a license issued by scripts/license/issue-license.sh for the embedded public key"]
    fn accepts_generated_token() {
        let token = std::env::var("RYOIKI_TENKAI_TEST_LICENSE")
            .expect("set RYOIKI_TENKAI_TEST_LICENSE to a token issued by the script");

        let verified = verify_token(&token).expect("generated token should verify");
        assert_eq!(verified.tier, "pro");
    }
}
