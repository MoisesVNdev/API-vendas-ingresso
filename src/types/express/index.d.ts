import * as express from 'express';
// Adiciona a propriedade 'user' ao objeto Request do Express
declare global {
    namespace Express {
        interface Request {
            user?: {id : number; email: string};
        }}
}