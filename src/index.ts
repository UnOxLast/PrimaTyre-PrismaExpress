import express, { Request, Response, NextFunction } from 'express';
import tyreRouter from './routes/tyre.router';
import unitRouter from './routes/unit.router';
import userRouter from './routes/user.router';
import activityRouter from './routes/activity.router';
import dropdownRouter from './routes/dropdown.router';
import { apiKeyDbAuth } from "./middlewares/apikey.middleware"; // disarankan pindahkan ke folder `middlewares`
import inspectionRouter from './routes/inspection.router';
import actionTyreRouter from './routes/actionTyre.router';

const app = express();
const PORT = process.env.PORT || 8080;

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-api-key");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    // Tangani preflight request langsung
    if (req.method === "OPTIONS") {
        res.sendStatus(200);
        return
    }
    next();
});

// const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
//     if (req.path === "/ping") return next();
//     return apiKeyDbAuth(req, res, next);
// };
// app.use(apiKeyMiddleware);

app.use(express.json());

app.use('/tyre', tyreRouter);
app.use('/unit', unitRouter);
app.use('/user', userRouter);
app.use('/activity', activityRouter);
app.use('/inspection', inspectionRouter)
app.use('/action', actionTyreRouter);
app.use('/dropdown', dropdownRouter);

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Server is gud' });
});

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log('Server running on http://0.0.0.0:8080');
});
