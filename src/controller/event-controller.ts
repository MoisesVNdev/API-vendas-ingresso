import { Router } from "express";
import { createConnection } from "../database.js";
import * as mysql from 'mysql2/promise';


export const eventRoutes = Router();

eventRoutes.post("/", (req, res) => {
    const { name, description, date, location} = req.body;
});

//Rotas do GET

eventRoutes.get("/events", async (req, res) => {
    const connection = await createConnection();
    try{
    const [eventRows] = await connection.execute<mysql.RowDataPacket[]>(
        'SELECT * FROM events'
    );
    res.json(eventRows);
    }finally {
        await connection.end();
    }
});

eventRoutes.get("/:eventID", async(req, res) => {
    const { eventID } = req.params;
    const connection = await createConnection();
    try{
    const [eventRows] = await connection.execute<mysql.RowDataPacket[]>(
        'SELECT * FROM events WHERE id = ?', [eventID]
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