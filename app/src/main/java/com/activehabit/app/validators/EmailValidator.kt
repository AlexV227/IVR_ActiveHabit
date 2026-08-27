package com.activehabit.app.validators


import android.util.Patterns

fun getEmailValidationError(email: String): String? {
    return when {
        email.isBlank() ->
            "Введите email"

        !Patterns.EMAIL_ADDRESS.matcher(email).matches() ->
            "Введите корректный email"

        else -> null
    }
}