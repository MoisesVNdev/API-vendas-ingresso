import { Router } from "express";
import { createConnection } from "../database.js";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";

export const customersRoutes = Router();

customersRoutes.post("/register", async(req, res) => {
        const { name, email, password, address, phone } = req.body;
    
    const connection = await createConnection();
    try {
    const createdAt = new Date();
    const hashedPassword =  bcrypt.hashSync(password, 10);
    const [userResult] = await connection.execute<mysql.ResultSetHeader>("INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, ?)", [name, email, hashedPassword, createdAt]);
    const userId = userResult.insertId;

    const [customersResult] = await connection.execute<mysql.ResultSetHeader>("INSERT INTO customers (user_id, address, phone, created_at) VALUES (?, ?, ?, ?)", [userId, address, phone, createdAt]);

    res.status(201).json({ id: customersResult.insertId, name, userId, address, phone, createdAt });
    
    }finally {
        await connection.end();
    }

});