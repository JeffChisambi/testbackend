import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

// Global Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'NASFAM GTMS API is running'
  });
});

export default app;
