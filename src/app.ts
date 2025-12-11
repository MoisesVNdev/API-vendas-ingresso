import express from 'express';
import * as mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// abre conexão com o banco de dados
function createConnection() {
    return mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'tickets',
        port: 3307
    });
}
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

// Rotas do POST

app.post("/auth/login", async(req, res) => {
    const { email, password } = req.body;
    const connection = await createConnection();
    try {
        const [rows] = await connection.execute<mysql.RowDataPacket[]>(
            'SELECT * FROM users WHERE email = ?', [email]
        );
        const user = rows.length ? rows[0] : null;
        if(user && bcrypt.compareSync(password, user.password)) {
            const token = jwt.sign({ id: user.id, email: user.email }, '123456', { expiresIn: '1h' });
            res.json({ token });
        } else {
            res.status(401).json({ message: "Credenciais inválidas" });
        }
        
    }finally{
            await connection.end();
        }
    res.send();
});

app.post("/partners/register", async(req, res) => {
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

app.post("/customers/register", async(req, res) => {
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

app.post("/partners/events", async (req, res) => {
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

app.post("/events", (req, res) => {
    const { name, description, date, location} = req.body;
});

//Rotas do GET

app.get("/events", async (req, res) => {
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

app.get("/events/:eventID", async(req, res) => {
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

app.get("/partners/events", async (req, res) => {
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

app.get("/partners/events/:eventId", async(req, res) => {
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

app.get("/partners", (req, res) => {
});

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