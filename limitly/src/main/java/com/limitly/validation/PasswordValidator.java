package com.limitly.validation;

import java.util.regex.Pattern;

public final class PasswordValidator {

    private static final Pattern PASSWORD_PATTERN = Pattern.compile(
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_\\-+=\\[\\]{}|:;,.<>]).{8,128}$"
    );

    public static final String PASSWORD_MESSAGE =
            "Password must be 8-128 characters with uppercase, lowercase, number, and special character";

    private PasswordValidator() {}

    public static boolean isValid(String password) {
        return password != null && PASSWORD_PATTERN.matcher(password).matches();
    }
}
