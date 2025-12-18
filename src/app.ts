import express from 'express';
import * as mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import { authRoutes } from './controller/auth-controller.js';
import { partnerRoutes } from './controller/partner-controller.js';
import { customersRoutes } from './controller/customer-controller.js';
import { eventRoutes } from './controller/event-controller.js';
import { createConnection } from './database.js';

// abre conexão com o banco de dados

// inicializa o express
const app = express();

// middleware para parsear JSON
app.use(express.json());

// rotas que não precisam de autenticação
const unprotectedRoutes = [
    {method: "POST", path: "/auth/login"},
    {method: "POST", path: "/partners/register"},
    {method: "POST", path: "/customers/register"},
    {method: "GET", path: "/events"},
];


// middleware de autenticação
app.use(async (req, res, next) => {
    const isUnprotectedRoute = unprotectedRoutes.some(
        (route) => route.method == req.method && req.path.startsWith(route.path)
    );

    if(isUnprotectedRoute) {
        return next();
    }


    const token = req.headers['authorization']?.split(" ")[1];
    if(!token) {
        res.status(401).json({ message: "Token não aprovado" });
        return;
    }
    try{
    const payload = jwt.verify(token, '123456') as { id: number; email: string; };
    const connection = await createConnection();
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
        'SELECT * FROM users WHERE id = ?', [payload.id]
    );
    const user = rows.length ? rows[0] : null;
    if(!user) {
        res.status(401).json({ message: "Usuário não encontrado" });
        return;
    }
    req.user = user as { id: number; email: string; };
    next();
    }catch(error){
        res.status(401).json({ message: "Falha na autenticação do token" });
    }
});

// rota de teste
app.get('/', (req, res) => {
    res.json({ message: "Hello World!" });
});


app.use("/auth", authRoutes);
app.use("/partners", partnerRoutes);
app.use("/customers", customersRoutes);
app.use("/events", eventRoutes); // Usando as rotas de eventos do partner-controller

// inicia o servidor
app.listen(3000, async () => {
    const connection = await createConnection();
    await connection.execute("SET FOREIGN_KEY_CHECKS = 0");
    await connection.execute("TRUNCATE TABLE users");
    await connection.execute("TRUNCATE TABLE customers");
    await connection.execute("TRUNCATE TABLE partners");
    await connection.execute("TRUNCATE TABLE events");
    await connection.execute("SET FOREIGN_KEY_CHECKS = 1");
    console.log('Running in http://localhost:3000')
})