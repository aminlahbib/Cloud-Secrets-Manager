package com.secrets.service;

import com.eatthepath.otp.TimeBasedOneTimePasswordGenerator;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import org.apache.commons.codec.binary.Base32;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.Key;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * Service for handling Two-Factor Authentication (TOTP) operations
 */
@Service
public class TwoFactorService {

    private static final Logger log = LoggerFactory.getLogger(TwoFactorService.class);
    private static final int TOTP_DIGITS = 6;
    private static final Duration TOTP_PERIOD = Duration.ofSeconds(30);
    private static final int RECOVERY_CODE_LENGTH = 8;
    private static final int RECOVERY_CODE_COUNT = 10;
    private static final int QR_CODE_SIZE = 300;

    private final TimeBasedOneTimePasswordGenerator totpGenerator;
    private final PasswordEncoder passwordEncoder;
    private final EncryptionService encryptionService;
    private final String totpIssuer;
    private final int timeSkew;
    private final Base32 base32;

    public TwoFactorService(
            EncryptionService encryptionService,
            @Value("${two-factor.totp.issuer:Cloud Secrets Manager}") String totpIssuer,
            @Value("${two-factor.totp.skew:1}") int timeSkew) {
        this.encryptionService = encryptionService;
        this.totpIssuer = totpIssuer;
        this.timeSkew = timeSkew;
        this.passwordEncoder = new BCryptPasswordEncoder();
        this.base32 = new Base32();

        try {
            this.totpGenerator = new TimeBasedOneTimePasswordGenerator(TOTP_PERIOD, TOTP_DIGITS);
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize TOTP generator", e);
        }
    }

    /**
     * Generate a new TOTP secret (Base32 encoded)
     */
    public String generateSecret() {
        SecureRandom random = new SecureRandom();
        byte[] secretBytes = new byte[20]; // 160 bits
        random.nextBytes(secretBytes);
        return base32.encodeToString(secretBytes);
    }

    /**
     * Generate otpauth URL for TOTP setup
     */
    public String generateOtpauthUrl(String email, String secret) {
        try {
            String encodedIssuer = URLEncoder.encode(totpIssuer, StandardCharsets.UTF_8);
            String encodedEmail = URLEncoder.encode(email, StandardCharsets.UTF_8);
            return String.format(
                "otpauth://totp/%s:%s?secret=%s&issuer=%s&digits=%d&period=%d",
                encodedIssuer, encodedEmail, secret, encodedIssuer, TOTP_DIGITS, TOTP_PERIOD.getSeconds()
            );
        } catch (Exception e) {
            log.error("Failed to generate otpauth URL", e);
            throw new RuntimeException("Failed to generate otpauth URL", e);
        }
    }

    /**
     * Generate QR code as Base64 data URL
     */
    public String generateQrCodeDataUrl(String otpauthUrl) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
            hints.put(EncodeHintType.CHARACTER_SET, StandardCharsets.UTF_8.name());

            BitMatrix bitMatrix = qrCodeWriter.encode(otpauthUrl, BarcodeFormat.QR_CODE, QR_CODE_SIZE, QR_CODE_SIZE, hints);

            BufferedImage image = new BufferedImage(QR_CODE_SIZE, QR_CODE_SIZE, BufferedImage.TYPE_INT_RGB);
            for (int x = 0; x < QR_CODE_SIZE; x++) {
                for (int y = 0; y < QR_CODE_SIZE; y++) {
                    image.setRGB(x, y, bitMatrix.get(x, y) ? 0xFF000000 : 0xFFFFFFFF);
                }
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "PNG", baos);
            byte[] imageBytes = baos.toByteArray();
            String base64 = Base64.getEncoder().encodeToString(imageBytes);
            return "data:image/png;base64," + base64;
        } catch (WriterException | IOException e) {
            log.error("Failed to generate QR code", e);
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }

    /**
     * Verify TOTP code against secret
     * Allows time skew of ±timeSkew steps
     */
    public boolean verifyTotpCode(String secret, String code) {
        try {
            byte[] secretBytes = base32.decode(secret);
            Key key = new javax.crypto.spec.SecretKeySpec(secretBytes, "HmacSHA1");

            // Try current time step
            if (verifyCodeAtTimeStep(key, code, Instant.now())) {
                return true;
            }

            // Try previous and next time steps (time skew)
            for (int i = 1; i <= timeSkew; i++) {
                if (verifyCodeAtTimeStep(key, code, Instant.now().minusSeconds(TOTP_PERIOD.getSeconds() * i))) {
                    return true;
                }
                if (verifyCodeAtTimeStep(key, code, Instant.now().plusSeconds(TOTP_PERIOD.getSeconds() * i))) {
                    return true;
                }
            }

            return false;
        } catch (Exception e) {
            log.error("Error verifying TOTP code", e);
            return false;
        }
    }

    private boolean verifyCodeAtTimeStep(Key key, String code, Instant instant) {
        try {
            String generatedCode = totpGenerator.generateOneTimePasswordString(key, instant);
            return generatedCode.equals(code);
        } catch (InvalidKeyException e) {
            log.error("Invalid key for TOTP verification", e);
            return false;
        }
    }

    /**
     * Encrypt TOTP secret for storage
     */
    public String encryptSecret(String plainSecret) {
        return encryptionService.encrypt(plainSecret);
    }

    /**
     * Decrypt TOTP secret for verification
     */
    public String decryptSecret(String encryptedSecret) {
        return encryptionService.decrypt(encryptedSecret);
    }

    /**
     * Generate recovery codes (plain text)
     */
    public List<String> generateRecoveryCodes() {
        SecureRandom random = new SecureRandom();
        List<String> codes = new ArrayList<>();
        for (int i = 0; i < RECOVERY_CODE_COUNT; i++) {
            String code = generateRecoveryCode(random);
            codes.add(code);
        }
        return codes;
    }

    private String generateRecoveryCode(SecureRandom random) {
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < RECOVERY_CODE_LENGTH; i++) {
            // Use uppercase letters and digits
            int charType = random.nextInt(2);
            if (charType == 0) {
                code.append((char) ('A' + random.nextInt(26)));
            } else {
                code.append((char) ('0' + random.nextInt(10)));
            }
        }
        // Format as XXXX-XXXX
        return code.insert(4, '-').toString();
    }

    /**
     * Hash recovery codes for storage
     */
    public List<String> hashRecoveryCodes(List<String> plainCodes) {
        return plainCodes.stream()
            .map(passwordEncoder::encode)
            .toList();
    }

    /**
     * Verify recovery code against hashed codes
     * Returns the index of the matching code, or -1 if not found
     */
    public int verifyRecoveryCode(String plainCode, List<String> hashedCodes) {
        if (hashedCodes == null || hashedCodes.isEmpty()) {
            return -1;
        }

        for (int i = 0; i < hashedCodes.size(); i++) {
            if (passwordEncoder.matches(plainCode, hashedCodes.get(i))) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Check if a code looks like a recovery code (format: XXXX-XXXX)
     */
    public boolean isRecoveryCodeFormat(String code) {
        return code != null && code.matches("^[A-Z0-9]{4}-[A-Z0-9]{4}$");
    }

    /**
     * Check if a code looks like a TOTP code (6 digits)
     */
    public boolean isTotpCodeFormat(String code) {
        return code != null && code.matches("^\\d{6}$");
    }
}

