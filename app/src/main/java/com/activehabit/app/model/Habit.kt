package com.activehabit.app.model

data class Habit(
    val id: Int = 0,
    val name: String = "",
    val description: String = "",
    val frequency: String = "daily",
    val isDone: Boolean = false,
    val streak: Int = 0
)