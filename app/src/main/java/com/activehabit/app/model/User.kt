package com.activehabit.app.model

data class User(
    val id: Int = 0,
    val name: String = "",
    val email: String = "",
    val password: String = "",
    val age: Int = 0,
    val weight: Float = 0f,
    val height: Float = 0f,
    val fitnessLevel: String = "beginner" // beginner, intermediate, advanced
)