import express from "express";
import http from "http";

const app = express();

const httpServer = http.createServer(app);








httpServer.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});