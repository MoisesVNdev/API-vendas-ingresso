import { Router } from "express";
import { createConnection } from "../database.js";
import bcrypt from "bcrypt";
import * as mysql from 'mysql2/promise';
export const partnerRoutes = Router();

partnerRoutes.post("/register", async(req, res) => {
    const { name, email, password, company_name } = req.body;
    
    const connection = await createConnection();
    try {
    const createdAt = new Date();
    const hashedPassword =  bcrypt.hashSync(password, 10);
    const [userResult] = await connection.execute<mysql.ResultSetHeader>("INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, ?)", [name, email, hashedPassword, createdAt]);
    const userId = userResult.insertId;

    const [partnerResult] = await connection.execute<mysql.ResultSetHeader>("INSERT INTO partners (user_id, company_name, created_at) VALUES (?, ?, ?)", [userId, company_name, createdAt]);

    res.status(201).json({ id: partnerResult.insertId, name, userId, company_name, createdAt });
    
    }finally {
        await connection.end();
    }
});

partnerRoutes.post("/events", async (req, res) => {
    const { name, description, date, location} = req.body;
    const userId = req.user!.id;
    const connection = await createConnection();
    try{
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
        'SELECT * FROM partners WHERE user_id = ?', [userId]
    );
    const partner = rows.length ? rows[0] : null;

    if(!partner) {
        res.status(403).json({ message: "Acesso não autorizado" });
        return;
    }
    
    const eventDate = new Date(date);
    const createdAt = new Date();

    const [partnerResult] = await connection.execute<mysql.ResultSetHeader>("INSERT INTO events (name, description, date, location, created_at, partners_id) VALUES (?, ?, ?, ?, ?, ?)", [name, description, eventDate, location, createdAt, partner.id]);
    res.status(201).json({ id: partnerResult.insertId, name, description, eventDate, location, createdAt, partners_id: partner.id, });
    }finally {
        await connection.end();
    }
});

partnerRoutes.get("/events", async (req, res) => {
    const userId = req.user!.id;
    const connection = await createConnection();
    try{
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
        'SELECT * FROM partners WHERE user_id = ?', [userId]
    );
    const partner = rows.length ? rows[0] : null;

    if(!partner) {
        res.status(403).json({ message: "Acesso não autorizado" });
        return;
    }

    const [eventRows] = await connection.execute<mysql.RowDataPacket[]>(
        'SELECT * FROM events WHERE partners_id = ?', [partner.id]
    );
    
    res.json(eventRows);
    }finally {
        await connection.end();
    }
}); 

partnerRoutes.get("/events/:eventId", async(req, res) => {
    const { eventId } = req.params;
    const userId = req.user!.id;
    const connection = await createConnection();
    try{
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
        'SELECT * FROM partners WHERE user_id = ?', [userId]
    );
    const partner = rows.length ? rows[0] : null;

    if(!partner) {
        res.status(403).json({ message: "Acesso não autorizado" });
        return;
    }

    const [eventRows] = await connection.execute<mysql.RowDataPacket[]>(
        'SELECT * FROM events WHERE partners_id = ? and id = ?', [partner.id, eventId]
    );
    
    const event = eventRows.length ? eventRows[0] : null;
    
    if(!event) {
        res.status(404).json({ message: "Evento não encontrado" });
        return;
    }
    res.json(event);
    }finally {
        await connection.end();
    }
});

partnerRoutes.get("/partners", (req, res) => {
});