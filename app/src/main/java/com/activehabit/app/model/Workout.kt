package com.activehabit.app.model

data class Workout(
    val id: Int = 0,
    val name: String = "",
    val type: String = "",
    val durationMinutes: Int = 0,
    val caloriesBurned: Int = 0,
    val isCompleted: Boolean = false,
    val date: String = ""
)