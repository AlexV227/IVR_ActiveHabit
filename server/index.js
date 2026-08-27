const express = require("express");
const bcrypt=require("bcryptjs");
const pool = require("./db");
const jwt = require("jsonwebtoken");



const app = express();
const PORT = 3000;
app.use(express.json());
function authenticateToken(request, response, next) {
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader){
        return response.status(401).json({
         message: "Токен авторизации отсутствует"
        });
    }
    const [scheme, token] = authorizationHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
        return response.status(401).json({
            message: "Неверный формат токена"
        });
    }
    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
            {              algorithms: ["HS256"],
                issuer: "activehabit-api"
            }
        );
        const userId = Number(decoded.userId);
         if (!Number.isSafeInteger(userId) || userId <= 0) {
             return response.status(401).json({
             message: "Токен содержит неверный идентификатор пользователя"
             });
         }//
         request.user = {
             userId: userId
         };
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return response.status(401).json({
                message: "Срок действия токена истёк"
            });
        }
        return response.status(401).json({
            message: "Недействительный токен"
        });
    }
}
app.get("/api/health", async (request, response) => {
    try {
        const result = await pool.query(
            "SELECT NOW() AS database_time"
        );
        response.json({
            status: "ok",
            server: "running",
            database: "connected",
            databaseTime: result.rows[0].database_time
        });
    } catch (error) {
        console.error("Database connection error:", error);
        response.status(500).json({
            status: "error",
            server: "running",
            database: "disconnected"
        });
    }
});
app.post("/api/auth/register", async (request, response) => {
    const { name, email, password } = request.body;

    if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string"
    ) {
        return response.status(400).json({
            message: "Имя, email и пароль обязательны"
        });
    }
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedName.length < 2 || normalizedName.length > 100) {
        return response.status(400).json({
            message: "Имя должно содержать от 2 до 100 символов"
        });
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail)) {
        return response.status(400).json({
            message: "Некорректный email"
        });
    }
    const passwordPattern = /^[\x21-\x7E]{6,15}$/;
    if (!passwordPattern.test(password)) {
        return response.status(400).json({
            message: "Пароль должен содержать от 6 до 15 символов: латинские буквы, цифры и специальные символы без пробелов"
        });
    }
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, name, email, created_at`,
            [normalizedName, normalizedEmail, passwordHash]
        );
        return response.status(201).json({
            message: "Пользователь успешно зарегистрирован",
            user: result.rows[0]
        });
    } catch (error) {
        if (error.code === "23505") {
            return response.status(409).json({
                message: "Пользователь с таким email уже существует"
            });
        }
        console.error("Registration error:", error);
        return response.status(500).json({
            message: "Внутренняя ошибка сервера"
        });
    }
});
app.post("/api/auth/login", async (request, response) => {
    const { email, password } = request.body;
    if (
        typeof email !== "string" ||
        typeof password !== "string"
    ) {
        return response.status(400).json({
            message: "Email и пароль обязательны"
        });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail.length === 0 || password.length === 0) {
        return response.status(400).json({
            message: "Email и пароль не могут быть пустыми"
        });
    }
    try {
        const result = await pool.query(
            `SELECT id, name, email, password_hash, created_at
             FROM users
             WHERE email = $1`,
            [normalizedEmail]
        );
        if (result.rows.length === 0) {
            return response.status(401).json({
                message: "Неверный email или пароль"
            });
        }
        const user = result.rows[0];
        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );
        if (!passwordMatches) {
            return response.status(401).json({
                message: "Неверный email или пароль"
            });
        }
        const token= jwt.sign(
            {
                userId: Number(user.id)
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
                issuer: "activehabit-api"
            }
        );
        return response.status(200).json({
            message: "Вход выполнен успешно",
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        return response.status(500).json({
        message: "Ошибка сервера"
        });
    }
});
app.get("/api/profile", authenticateToken, async (request, response) => {
    try {
        const result = await pool.query(
            `SELECT id, name, email, created_at
             FROM users
             WHERE id = $1`,
            [request.user.userId]
        );

        if (result.rows.length === 0) {
            return response.status(404).json({
                message: "Пользователь не найден"
            });
        }

        const user = result.rows[0];

        return response.status(200).json({
            user: {
                id:user.id,
                name:user.name,
                email:user.email,
                createdAt:user.created_at
            }
        });
    } catch (error){
        console.error("Profile error:", error);
        return response.status(500).json({
            message: "Внутренняя ошибка сервера"
        });
    }
});
app.listen(PORT, () => {
    console.log(`ActiveHabit server started on port ${PORT}`);
});