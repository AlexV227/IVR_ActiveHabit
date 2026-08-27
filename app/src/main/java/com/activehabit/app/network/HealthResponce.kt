package com.activehabit.app.network
data class HealthResponse(
    val status: String,
    val server: String,
    val database: String,
    val databaseTime: String
)